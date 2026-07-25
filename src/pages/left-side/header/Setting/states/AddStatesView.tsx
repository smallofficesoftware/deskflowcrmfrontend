import React, { useEffect, useState } from "react";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createStates, fetchCountriesApi, ICountriesView, IStatesView, updateStates } from "./StatesController";

interface IPropsAddStates {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IStatesView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshStates: () => void;
    setOutsideCountryIdInput: (data: number | null) => void;
}

const AddStatesView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshStates,
    setOutsideCountryIdInput
}: IPropsAddStates) => {

    const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);
    const [countryIdInput, setCountryIdInput] = useState<number | null>(null);
    const [countryError, setCountryError] = useState("");
    const [stateInput, setStateInput] = useState("");
    const [stateError, setStateError] = useState("");

    const canView = useCheckUserPermission(PAGE_ID.STATES, PERMISSION_TYPE.VIEW);
    const canAdd = useCheckUserPermission(PAGE_ID.STATES, PERMISSION_TYPE.ADD);
    const canAddCountry = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.DELETE);

    const countryOptions = countriesList.map((country) => ({
        value: String(country.id),
        label: country.country_name,
    }));

    const handleCountryChange = (selectedOption: SingleValue<IOption>) => {
        const newCountryId = selectedOption ? Number(selectedOption.value) : null;
        setCountryIdInput(newCountryId);
        setOutsideCountryIdInput(newCountryId);
        setCountryError(selectedOption ? "" : "Country is required");
    };

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setStateInput(value);
        setStateError(value ? "" : "State name is required");
    };

    const clearForm = () => {
        setStateInput("");
        setStateError("");
        setCountryError("");
        // Do not reset countryIdInput to keep the selected country
    };

    const handleSubmit = async () => {
        if (stateInput.trim() === "") {
            setStateError("State name is required");
            return;
        }
        if (!countryIdInput) {
            setCountryError("Country is required");
            return;
        }

        if (productToEdit && productToEdit.id !== undefined) {
            await updateStates(
                { state_name: stateInput, country_id: countryIdInput },
                setLoading,
                productToEdit.id,
                clearForm
            );
        } else {
            if (!canAdd) {
                toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                return;
            }
            await createStates(
                { state_name: stateInput, country_id: countryIdInput },
                setLoading,
                clearForm
            );
        }
        handleRefreshStates();
        onHide();
    };

    useEffect(() => {
        if (canView) {
            fetchCountriesApi(setCountriesList, setLoading);
        }
    }, [canView]);

    useEffect(() => {
        if (productToEdit) {
            setStateError("");
            setCountryError("");
            setStateInput(productToEdit.state_name);
            setCountryIdInput(productToEdit.country_id);
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
                                    <h6 style={{ margin: "10px 0 0 0" }}>
                                        State Name <span className="text-danger">*</span>
                                    </h6>
                                </label>
                                <div className="row search-bar">
                                    <div
                                        className="add-source-of-type-section"
                                    // style={{ width: "90%" }}
                                    >
                                        <input
                                            type="text"
                                            title="Add State Name"
                                            placeholder="Add State Name"
                                            maxLength={SMALL_TEXT_LENGTH}
                                            value={stateInput}
                                            onChange={handleChange}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSubmit();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {stateError && (
                                    <span className="text-danger">{stateError}</span>
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

export default AddStatesView;