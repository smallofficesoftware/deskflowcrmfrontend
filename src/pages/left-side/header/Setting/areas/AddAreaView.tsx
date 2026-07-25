import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createAreas, fetchAreasApi, fetchCitiesApi, fetchCountriesApi, fetchStatesApi, IAreasView, ICitiesView, ICountriesView, IStatesView, updateAreas } from "./AreasController";

interface IPropsAddArea {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IAreasView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshAreas: () => void;
    handleOutsideCountryChange: (data: SingleValue<IOption>) => void;
    handleOutsideStateChange: (data: SingleValue<IOption>) => void;
    handleOutsideCityChange: (data: SingleValue<IOption>) => void;
}

const AddAreaView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshAreas,
    handleOutsideCountryChange,
    handleOutsideStateChange,
    handleOutsideCityChange
}: IPropsAddArea) => {

    const [areasList, setAreasList] = useState<IAreasView[]>([]);
    const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);
    const [statesList, setStatesList] = useState<IStatesView[]>([]);
    const [citiesList, setCitiesList] = useState<ICitiesView[]>([]);
    const [areaInput, setAreaInput] = useState("");
    const [countryIdInput, setCountryIdInput] = useState<number | null>(null);
    const [stateIdInput, setStateIdInput] = useState<number | null>(null);
    const [cityIdInput, setCityIdInput] = useState<number | null>(null);
    const [areaError, setAreaError] = useState("");
    const [countryError, setCountryError] = useState("");
    const [stateError, setStateError] = useState("");
    const [cityError, setCityError] = useState("");

    const canView = useCheckUserPermission(PAGE_ID.AREAS, PERMISSION_TYPE.VIEW);
    const canEdit = useCheckUserPermission(PAGE_ID.AREAS, PERMISSION_TYPE.EDIT);
    const canAdd = useCheckUserPermission(PAGE_ID.AREAS, PERMISSION_TYPE.ADD);

    const countryOptions = countriesList.map((country) => ({
        value: String(country.id),
        label: country.country_name,
    }));

    const stateOptions = statesList
        .filter((state) => (countryIdInput ? state.country_id === countryIdInput : true))
        .map((state) => ({
            value: String(state.id),
            label: state.state_name,
        }));

    const cityOptions = citiesList
        .filter((city) => (stateIdInput ? city.state_id === stateIdInput : true))
        .map((city) => ({
            value: String(city.id),
            label: city.city_name,
        }));

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setAreaInput(value);
        setAreaError(value ? "" : "Area name is required");
    };

    const handleCountryChange = (selectedOption: SingleValue<IOption>) => {
        const newCountryId = selectedOption ? Number(selectedOption.value) : null;
        setCountryIdInput(newCountryId);
        handleOutsideCountryChange(selectedOption);
        setCountryError(selectedOption ? "" : "Country is required");
        setStateIdInput(null);
        setCityIdInput(null);
        setStateError("");
        setCityError("");
        setAreasList([]);
        if (newCountryId && canView) {
            fetchStatesApi(setStatesList, setLoading, newCountryId);
            fetchCitiesApi(setCitiesList, setLoading, newCountryId, null);
            fetchAreasApi(setAreasList, setLoading, newCountryId, null, null);
        } else {
            setStatesList([]);
            setCitiesList([]);
            setAreasList([]);
        }
    };

    const handleStateChange = (selectedOption: SingleValue<IOption>) => {
        const newStateId = selectedOption ? Number(selectedOption.value) : null;
        setStateIdInput(newStateId);
        handleOutsideStateChange(selectedOption);
        setStateError(selectedOption ? "" : "State is required");
        setCityIdInput(null);
        setCityError("");
        setAreasList([]);
        if (newStateId && countryIdInput && canView) {
            fetchCitiesApi(setCitiesList, setLoading, countryIdInput, newStateId);
            fetchAreasApi(setAreasList, setLoading, countryIdInput, newStateId, null);
        } else {
            setCitiesList([]);
            setAreasList([]);
        }
    };

    const handleCityChange = (selectedOption: SingleValue<IOption>) => {
        const newCityId = selectedOption ? Number(selectedOption.value) : null;
        setCityIdInput(newCityId);
        handleOutsideCityChange(selectedOption);
        setCityError(selectedOption ? "" : "City is required");
        if (newCityId && countryIdInput && stateIdInput && canView) {
            fetchAreasApi(setAreasList, setLoading, countryIdInput, stateIdInput, newCityId);
        } else {
            setAreasList([]);
        }
    };

    const clearForm = () => {
        setAreaInput("");
        setAreaError("");
        setCountryError("");
        setStateError("");
        setCityError("");
    };

    const handleSubmit = async () => {
        if (areaInput.trim() === "") {
            setAreaError("Area name is required");
            return;
        }
        if (!countryIdInput) {
            setCountryError("Country is required");
            return;
        }
        if (!stateIdInput) {
            setStateError("State is required");
            return;
        }
        if (!cityIdInput) {
            setCityError("City is required");
            return;
        }

        if (productToEdit && productToEdit.id !== undefined) {
            if (!canEdit) {
                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                return;
            }
            await updateAreas(
                {
                    area_name: areaInput,
                    city_id: cityIdInput,
                    state_id: stateIdInput,
                    country_id: countryIdInput,
                },
                setLoading,
                productToEdit.id,
                clearForm
            );
        } else {
            if (!canAdd) {
                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                return;
            }
            await createAreas(
                {
                    area_name: areaInput,
                    city_id: cityIdInput,
                    state_id: stateIdInput,
                    country_id: countryIdInput,
                },
                setLoading,
                clearForm
            );
        }
        handleRefreshAreas();
        onHide();
    };

    useEffect(() => {
        fetchCountriesApi(setCountriesList, setLoading);
    }, [setCountriesList, setLoading])

    useEffect(() => {
        if (productToEdit) {
            setAreaError("");
            setCountryError("");
            setStateError("");
            setCityError("");
            setAreaInput(productToEdit.area_name);
            setCountryIdInput(productToEdit.country_id);
            setStateIdInput(productToEdit.state_id);
            setCityIdInput(productToEdit.city_id);
            if (productToEdit.country_id && canView) {
                fetchStatesApi(setStatesList, setLoading, productToEdit.country_id);
                fetchCitiesApi(setCitiesList, setLoading, productToEdit.country_id, productToEdit.state_id);
            }
        }
    }, []);

    return (
        <React.Fragment>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "30%" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>
                        <h2 className="modal-title1 form_header_text">{headerName}</h2>

                        <div className="head" style={{ display: "block", marginLeft: "20px" }}>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>
                                        Country <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                {/* {canAddCountry &&
                                    <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => setIsOpenAddCountryModal(true)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                                    </span>
                                } */}


                                <CustomSearchDropdown
                                    options={countryOptions}
                                    value={
                                        countryOptions.find((option) => option.value === String(countryIdInput)) || null
                                    }
                                    onChange={handleCountryChange}
                                    className="w-100"
                                />
                                {countryError && <span className="text-danger">{countryError}</span>}
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>
                                        State <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                {/* {
                                    countryIdInput && canAddstate && <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => setIsOpenAddStateModal(true)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                                    </span>
                                } */}
                                <CustomSearchDropdown
                                    options={stateOptions}
                                    value={
                                        stateOptions.find((option) => option.value === String(stateIdInput)) || null
                                    }
                                    onChange={handleStateChange}
                                    className="w-100"
                                    isDisabled={!countryIdInput}
                                />
                                {stateError && <span className="text-danger">{stateError}</span>}
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>
                                        City <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                {/* {stateIdInput && canAddCity && <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => setIsOpenAddCityModal(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                                </span>} */}
                                <CustomSearchDropdown
                                    options={cityOptions}
                                    value={
                                        cityOptions.find((option) => option.value === String(cityIdInput)) || null
                                    }
                                    onChange={handleCityChange}
                                    className="w-100"
                                    isDisabled={!stateIdInput}
                                />
                                {cityError && <span className="text-danger">{cityError}</span>}
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>
                                        Area Name <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <div className="search-bar">
                                    <div className="add-source-of-type-section">
                                        <input
                                            type="text"
                                            title="Add Area Name"
                                            placeholder="Add Area Name"
                                            maxLength={SMALL_TEXT_LENGTH}
                                            value={areaInput}
                                            onChange={handleChange}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSubmit();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {areaError && <span className="text-danger">{areaError}</span>}
                            </div>
                        </div>

                        <div className="col-12 col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                            <button
                                className="modal-button1"
                                onClick={onHide}
                                type="button"
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                                onClick={handleSubmit}
                                style={{
                                    backgroundColor: "#f58634",
                                }}
                            >
                                {productToEdit ? "Save" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default AddAreaView;