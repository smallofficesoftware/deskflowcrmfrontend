import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createCities, fetchCitiesApi, fetchCountriesApi, fetchStatesApi, ICitiesView, ICountriesView, IStatesView, updateCities } from "./CitiesController";

interface IPropsAddCity {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ICitiesView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshCities: () => void;
    handleOutsideCountryChange: (data: SingleValue<IOption>) => void;
    handleOutsideStateChange: (data: SingleValue<IOption>) => void;
}

const AddCityView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshCities,
    handleOutsideCountryChange,
    handleOutsideStateChange
}: IPropsAddCity) => {

    const [countryIdInput, setCountryIdInput] = useState<number | null>(null);
    const [countryError, setCountryError] = useState("");
    const [stateIdInput, setStateIdInput] = useState<number | null>(null);
    const [stateError, setStateError] = useState("");
    const [cityInput, setCityInput] = useState("");
    const [cityError, setCityError] = useState("");
    const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);
    const [statesList, setStatesList] = useState<IStatesView[]>([]);
    const [citiesList, setCitiesList] = useState<ICitiesView[]>([]);

    const canView = useCheckUserPermission(PAGE_ID.CITIES, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.CITIES, PERMISSION_TYPE.ADD);

    const countryOptions = countriesList.map((country) => ({
        value: String(country.id),
        label: country.country_name,
    }));

    const stateOptions = statesList
        .filter((state) =>
            countryIdInput ? state.country_id === countryIdInput : true
        )
        .map((state) => ({
            value: String(state.id),
            label: state.state_name,
        }));

    const handleCountryChange = (selectedOption: SingleValue<IOption>) => {
        const newCountryId = selectedOption ? Number(selectedOption.value) : null;
        setCountryIdInput(newCountryId);
        setCountryError(selectedOption ? "" : "Country is required");
        setStateIdInput(null);
        setStateError("");
        handleOutsideCountryChange(selectedOption);
        setCitiesList([]);
        if (newCountryId && canView) {
            fetchStatesApi(setStatesList, setLoading, newCountryId);
            fetchCitiesApi(setCitiesList, setLoading, newCountryId, null);
        } else {
            setStatesList([]);
            setCitiesList([]);
        }
    };

    const handleStateChange = (selectedOption: SingleValue<IOption>) => {
        const newStateId = selectedOption ? Number(selectedOption.value) : null;
        setStateIdInput(newStateId);
        handleOutsideStateChange(selectedOption);
        setStateError(selectedOption ? "" : "State is required");
        if (newStateId && countryIdInput && canView) {
            fetchCitiesApi(setCitiesList, setLoading, countryIdInput, newStateId);
        } else {
            setCitiesList([]);
        }
    };

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setCityInput(value);
        setCityError(value ? "" : "City name is required");
    };

    const clearForm = () => {
        setCityInput("");
        setCityError("");
        setCountryError("");
        setStateError("");
    };

    const handleSubmit = async () => {
        if (cityInput.trim() === "") {
            setCityError("City name is required");
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

        if (productToEdit && productToEdit.id !== undefined) {
            await updateCities(
                {
                    city_name: cityInput,
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
            await createCities(
                {
                    city_name: cityInput,
                    state_id: stateIdInput,
                    country_id: countryIdInput,
                },
                setLoading,
                clearForm
            );
        }
        handleRefreshCities();
        onHide();
    };

    useEffect(() => {
        fetchCountriesApi(setCountriesList, setLoading);
    }, [setCountriesList, setLoading]);

    useEffect(() => {
        if (productToEdit) {
            setCityError("");
            setCountryError("");
            setStateError("");
            setCityInput(productToEdit.city_name);
            setCountryIdInput(productToEdit.country_id);
            setStateIdInput(productToEdit.state_id);
            if (productToEdit.country_id && canView) {
                fetchStatesApi(setStatesList, setLoading, productToEdit.country_id);
            }
        }
    }, []);

    return (
        <React.Fragment>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "35%" }}>
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
                                        countryOptions.find(
                                            (option) => option.value === String(countryIdInput)
                                        ) || null
                                    }
                                    onChange={handleCountryChange}
                                    className="w-100"
                                />
                                {countryError && (
                                    <span className="text-danger">{countryError}</span>
                                )}
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>
                                        State <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                {/* {canAddstate && countryIdInput &&
                                    <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => setIsOpenAddStateModal(true)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                                    </span>
                                } */}

                                <CustomSearchDropdown
                                    options={stateOptions}
                                    value={
                                        stateOptions.find(
                                            (option) => option.value === String(stateIdInput)
                                        ) || null
                                    }
                                    onChange={handleStateChange}
                                    className="w-100"
                                    isDisabled={!countryIdInput}
                                />
                                {stateError && (
                                    <span className="text-danger">{stateError}</span>
                                )}
                            </div>
                            <div className="col-12 mt-1">
                                <label className="form-check-label">
                                    <h6>
                                        City Name <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <div
                                    className="search-bar"
                                    style={{ display: "flex", alignItems: "center" }}
                                >
                                    <div
                                        className="add-source-of-type-section"
                                    // style={{ width: "90%" }}
                                    >
                                        <input
                                            type="text"
                                            title="Add City Name"
                                            placeholder="Add City Name"
                                            maxLength={SMALL_TEXT_LENGTH}
                                            value={cityInput}
                                            onChange={handleChange}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSubmit();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {cityError && (
                                    <span className="text-danger">{cityError}</span>
                                )}
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

export default AddCityView;