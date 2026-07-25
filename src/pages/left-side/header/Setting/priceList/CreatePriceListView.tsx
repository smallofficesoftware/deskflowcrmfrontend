import React, { useEffect, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { BIG_TEXT_LENGTH, DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { IOption } from "../../../../../helpers/AppInterface";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createPriceList, fetchCityApiForPriceList, fetchCountryApiForPriceList, fetchStateApiForPriceList, IPriceListView, updatePriceList } from "./PriceListController";

interface IPropsCreatePriceList {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IPriceListView | undefined;
    setLoading: TReactSetState<boolean>;
    handelRefreshProduct: () => void;
}

const CreatePriceListView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handelRefreshProduct,
}: IPropsCreatePriceList) => {

    const [countriesList, setCountriesList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [cityList, setCityList] = useState([]);

    const [selectedCountryId, setSelectedCountryId] = useState<any>(false);
    const [selectedStateId, setSelectedStateId] = useState<any>(false);
    const [selectedCityId, setSelectedCityId] = useState<any>(false);

    const [countryError, setCountryError] = useState("");
    const [cityError, setCityError] = useState("");
    const [stateError, setStateError] = useState("");

    const [priceListInput, setPriceListInputInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [effectiveDateInput, setEffectiveDateInput] = useState<DateObject | null>(null);
    const [priceNameError, setPriceNameError] = useState("");
    const [effectiveDataInputError, setEffectiveDataInputError] = useState("");

    const canAdd = useCheckUserPermission(PAGE_ID.PRICE_LIST, PERMISSION_TYPE.ADD);

    useEscapeKey(onHide);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchCountryApiForPriceList(setCountriesList);
            } catch (error) {
                console.error("Error fetching country options:", error);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedCountryId) {
            fetchStateApiForPriceList(setStateList, selectedCountryId.value);
        } else {
            setStateList([]);
            setSelectedStateId(false);
            setCityList([]);
            setSelectedCityId(false);
        }
    }, [selectedCountryId]);

    useEffect(() => {
        if (selectedStateId) {
            fetchCityApiForPriceList(setCityList, selectedStateId.value);
        } else {
            setCityList([]);
            setSelectedCityId(false);
        }
    }, [selectedStateId]);

    const countryOptions = countriesList.map((category: any) => ({
        value: category.id,
        label: category.country_name,
    }));
    const stateOptions = stateList.map((category: any) => ({
        value: category.id,
        label: category.state_name,
    }));
    const cityOptions = cityList.map((category: any) => ({
        value: category.id,
        label: category.city_name,
    }));

    useEffect(() => {
        if (productToEdit) {
            setPriceListInputInput(productToEdit.price_list_name);
            setEffectiveDateInput(new DateObject(productToEdit.effective_from));
            setSelectedCountryId({ value: productToEdit.country_id, label: productToEdit.country_name });
            setSelectedStateId({ value: productToEdit.state_id, label: productToEdit.state_name });
            setSelectedCityId({ value: productToEdit.city_id, label: productToEdit.city_name });
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, []);

    const handleCountryChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedCountryId(selectedOption);
        setCountryError(selectedOption ? "" : "Country is required");
        if (!selectedOption) {
            setSelectedStateId(false);
            setStateList([]);
            setSelectedCityId(false);
            setCityList([]);
        }
    };

    const handleStateChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedStateId(selectedOption);
        setSelectedCityId(false);
        setCityList([]);
    };

    const handleCityChange = (selectedOption: SingleValue<IOption>) => {
        setSelectedCityId(selectedOption);
    };

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setPriceListInputInput(value);
        setPriceNameError(value ? "" : "Price Name is required");
    };

    const handelChangeEffectiveDate = (date: DateObject | null) => {
        const value = date instanceof DateObject
            ? date.format("YYYY-MM-DD")
            : "";
        setEffectiveDateInput(date);
        setEffectiveDataInputError(value ? "" : "Date is required");
    };

    const clearForm = () => {
        setPriceListInputInput("");
        setSelectedCountryId(false);
        setSelectedStateId(false);
        setSelectedCityId(false);
        setEffectiveDateInput(null);
    };

    const handelSubmit = async () => {
        let hasError = false;

        if (!priceListInput) {
            setPriceNameError("Price Name is required");
            hasError = true;
        }
        if (!selectedCountryId) {
            setCountryError("Country is required");
            hasError = true;
        }
        if (!effectiveDateInput) {
            setEffectiveDataInputError("Date is required");
            hasError = true;
        }

        if (!hasError) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updatePriceList(
                    {
                        price_list_name: priceListInput,
                        country_id: selectedCountryId?.value,
                        effective_from: effectiveDateInput instanceof DateObject
                            ? effectiveDateInput.format("YYYY-MM-DD")
                            : "",
                        state_id: selectedStateId?.value,
                        city_id: selectedCityId?.value,
                    },
                    productToEdit.id,
                    setLoading,
                    clearForm
                );
            } else {
                if (!canAdd) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                }
                await createPriceList(
                    {
                        price_list_name: priceListInput,
                        country_id: selectedCountryId?.value,
                        effective_from: effectiveDateInput instanceof DateObject
                            ? effectiveDateInput.format("YYYY-MM-DD")
                            : "",
                        state_id: selectedStateId?.value,
                        city_id: selectedCityId?.value,
                    },
                    setLoading,
                    clearForm
                );
            }
            handelRefreshProduct();
            onHide();
        }
    };

    return (
        <React.Fragment>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "40%" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>
                        <h2 className="modal-title1 form_header_text">{headerName}</h2>

                        <div className="head" style={{ display: "block", marginLeft: "20px" }}>
                            <div className="col-12 d-flex justify-content-between w-100">
                                <div className="col-5">
                                    <label className="form-check-label" htmlFor="flexCheckDefault">
                                        <h6>
                                            Select Country<span className="text-danger">*</span>
                                        </h6>
                                    </label>
                                    <div className="add-source-of-type-section">
                                        <CustomSearchDropdown
                                            options={countryOptions}
                                            value={selectedCountryId}
                                            onChange={handleCountryChange}
                                            className="w-100"
                                        />
                                    </div>
                                    {countryError && <span className="text-danger">{countryError}</span>}
                                </div>
                                <div className="col-5">
                                    <label className="form-check-label" htmlFor="flexCheckDefault">
                                        <h6>
                                            Select State
                                        </h6>
                                    </label>
                                    <div className="add-source-of-type-section">
                                        <CustomSearchDropdown
                                            options={stateOptions}
                                            value={selectedStateId}
                                            onChange={handleStateChange}
                                            className="w-100"
                                        />
                                    </div>
                                    {stateError && <span className="text-danger">{stateError}</span>}
                                </div>
                            </div>
                            <div className="col-12 d-flex justify-content-between w-100 mt-2">
                                <div className="col-5">
                                    <label className="form-check-label" htmlFor="flexCheckDefault">
                                        <h6>
                                            Select City
                                        </h6>
                                    </label>
                                    <div className="add-source-of-type-section">
                                        <CustomSearchDropdown
                                            options={cityOptions}
                                            value={selectedCityId}
                                            onChange={handleCityChange}
                                            className="w-100"
                                        />
                                    </div>
                                    {cityError && <span className="text-danger">{cityError}</span>}
                                </div>
                                <div className="col-5">
                                    <label
                                        className="form-check-label"
                                        htmlFor="flexCheckDefault"
                                    >
                                        <h6>
                                            Price List Name <span className="text-danger">*</span>
                                        </h6>
                                    </label>
                                    <div className="search-bar ">
                                        <div className="add-source-of-type-section ">
                                            <input
                                                type="text"
                                                title="Price List Name"
                                                placeholder="Price List Name"
                                                maxLength={BIG_TEXT_LENGTH}
                                                value={priceListInput}
                                                onChange={(e) => handelChange(e)}
                                                ref={inputRef}
                                            />
                                        </div>
                                    </div>
                                    {priceNameError && <span className="text-danger">{priceNameError}</span>}
                                </div>
                            </div>
                            <div className="col-12 d-flex justify-content-between w-100 mt-2">
                                <div className="col-11">
                                    <label className="form-check-label" htmlFor="flexCheckDefault">
                                        <h6>
                                            Effective Date <span className="text-danger">*</span>
                                        </h6>
                                    </label>
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section d-flex">
                                            <DatePicker
                                                value={effectiveDateInput}
                                                onChange={handelChangeEffectiveDate}
                                                format="DD-MM-YYYY"
                                                calendarPosition="bottom-left"
                                                style={{ width: "45%", zIndex: "9999999 !important" }}
                                                placeholder="DD-MM-YYYY"
                                                className="form-control font-size-15 rounded-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-6">
                                    {effectiveDataInputError && <span className="text-danger">{effectiveDataInputError}</span>}
                                </div>
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
                                onClick={handelSubmit}
                                style={{
                                    backgroundColor: "#f58634",
                                }}
                            >
                                {productToEdit ? "Save" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default CreatePriceListView;