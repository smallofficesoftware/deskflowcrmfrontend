import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createCountries, ICountriesView, updateCountries } from "./CountriesController";

interface IPropsAddCountry {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ICountriesView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshCountries: () => void;
}

const AddCountryView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshCountries,
}: IPropsAddCountry) => {

    const [countryInput, setCountryInput] = useState("");
    const [countryCodeInput, setCountryCodeInput] = useState("");
    const [countryIsoInput, setIsoCodeInput] = useState("");
    const [countryError, setCountryError] = useState("");
    const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);

    const canAdd = useCheckUserPermission(PAGE_ID.COUNTRIE, PERMISSION_TYPE.ADD);

    const handleChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setCountryInput(value);
        setCountryError(value ? "" : "Country Name is required");
    };

    const handleCountryCodeChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setCountryCodeInput(value);
    };

    const handleCountryISOChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setIsoCodeInput(value);
    };

    const clearForm = () => {
        setCountryInput("");
        setCountryCodeInput("");
        setIsoCodeInput("");
    };

    const handleSubmit = async () => {
        if (countryInput.trim() === "") {
            setCountryError("Country Name is required");
            return;
        }

        if (countryInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                const currentCountry = countriesList.find((item) => item.id === productToEdit.id);
                if (
                    currentCountry &&
                    currentCountry.country_name === countryInput &&
                    (currentCountry.country_code || "") === countryCodeInput &&
                    (currentCountry.country_iso || "") === countryIsoInput
                ) {
                    toast.info("No changes made to the country data");
                    clearForm();
                    return;
                }
                await updateCountries(
                    {
                        country_name: countryInput,
                        country_code: countryCodeInput,
                        country_iso: countryIsoInput,
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
                await createCountries(
                    { country_name: countryInput, country_code: countryCodeInput, country_iso: countryIsoInput },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshCountries();
            onHide();
        }
    };

    useEffect(() => {
        if (productToEdit) {
            setCountryInput(productToEdit.country_name);
            setCountryCodeInput(productToEdit.country_code || "");
            setIsoCodeInput(productToEdit.country_iso || "");
            setCountryError("");
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
                            <label className="form-check-label" htmlFor="flexCheckDefault">
                                <h6>
                                    Enter Country Name<span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12">
                                <div
                                    className="row"
                                    style={{ width: "100%", gap: "10px" }}
                                >
                                    <div
                                        className="add-source-of-type-section"
                                        style={{ width: "45%", marginRight: "10px" }}
                                    >
                                        <input
                                            type="text"
                                            title="Country Name"
                                            placeholder="Country Name"
                                            maxLength={SMALL_TEXT_LENGTH}
                                            value={countryInput}
                                            onChange={(e) => handleChange(e)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSubmit();
                                                }
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                borderRadius: "4px",
                                                border: "1px solid #ddd",
                                                fontSize: "14px",
                                            }}
                                        />
                                    </div>
                                    <div
                                        className="d-flex align-items-center"
                                        style={{ width: "45%", gap: "10px" }}
                                    >
                                        <div style={{ width: "40%" }}>
                                            <input
                                                type="text"
                                                value={countryCodeInput}
                                                maxLength={SMALL_TEXT_LENGTH}
                                                placeholder="Code"
                                                onChange={(e) => handleCountryCodeChange(e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleSubmit();
                                                    }
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "8px",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ddd",
                                                    fontSize: "14px",
                                                }}
                                            />
                                        </div>
                                        <div style={{ width: "40%" }}>
                                            <input
                                                type="text"
                                                value={countryIsoInput}
                                                maxLength={SMALL_TEXT_LENGTH}
                                                placeholder="ISO Code"
                                                onChange={(e) => handleCountryISOChange(e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleSubmit();
                                                    }
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "8px",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ddd",
                                                    fontSize: "14px",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                {countryError && (
                                    <span className="text-danger">{countryError}</span>
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

export default AddCountryView;