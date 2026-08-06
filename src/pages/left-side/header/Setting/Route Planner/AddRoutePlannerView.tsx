import { useEffect, useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { TReactSetState } from "../../../../../helpers/AppType";
import { fetchAllCompanyApi } from "../../../LeftSideController";
import { fetchAreasApi, fetchCitiesApi, fetchCountriesApi, fetchStatesApi, IAreasView, ICitiesView, ICountriesView, IStatesView } from "../areas/AreasController";
import { createRoute, IRouteView, updateRoute } from "./RoutePlannerController";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";

interface IPropsAddRoutePlanner {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: Partial<IRouteView> | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshRoutes: () => void;
}

const AddRoutePlannerView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshRoutes
}: IPropsAddRoutePlanner) => {
    const [optionLoading, setOptionLoading] = useState<boolean>(false);

    const [employeeId, setEmployeeId] = useState<number>(0);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [countryId, setCountryId] = useState<number>(0);
    const [stateId, setStateId] = useState<number>(0);
    const [cityId, setCityId] = useState<number>(0);
    const [areaId, setAreaId] = useState<number>(0);
    const [remark, setRemark] = useState<string>("");

    const [employeeError, setEmployeeError] = useState("");
    const [startDateError, setStartDateError] = useState("");
    const [endDateError, setEndDateError] = useState("");
    const [countryError, setCountryError] = useState("");
    const [stateError, setStateError] = useState("");
    const [cityError, setCityError] = useState("");
    const [remarkError, setRemarkError] = useState("");

    const [teamList, setTeamList] = useState<any[]>([]);
    const [countriesList, setCountriesList] = useState<ICountriesView[]>([]);
    const [statesList, setStatesList] = useState<IStatesView[]>([]);
    const [citiesList, setCitiesList] = useState<ICitiesView[]>([]);
    const [areasList, setAreasList] = useState<IAreasView[]>([]);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            await fetchAllCompanyApi(setTeamList);
        }

        fetchTeamMembers();
    }, []);

    useEffect(() => {
        fetchCountriesApi(setCountriesList, setOptionLoading);
    }, [setCountriesList])

    const employeeOptions = teamList.map((emp: any) => ({
        value: emp.id,
        label: emp.username,
    }));

    const countryOptions = countriesList.map((country) => ({
        value: country.id,
        label: country.country_name,
    }));

    const stateOptions = statesList
        .filter((state) => (countryId ? state.country_id === countryId : true))
        .map((state) => ({
            value: state.id,
            label: state.state_name,
        }));

    const cityOptions = citiesList
        .filter((city) => (stateId ? city.state_id === stateId : true))
        .map((city) => ({
            value: city.id,
            label: city.city_name,
        }));

    const areaOptions = areasList
        .filter((area) => (cityId ? area.city_id === cityId : true))
        .map((area) => ({
            value: area.id,
            label: area.area_name,
        }));

    const handleCountryChange = (countryId: number) => {
        setCountryId(countryId);
        setCountryError(countryId ? "" : "Country is required");
        setStateId(0);
        setCityId(0);
        setAreaId(0);
        setStateError("");
        setCityError("");
        if (countryId) {
            fetchStatesApi(setStatesList, setOptionLoading, countryId);
        } else {
            setStatesList([]);
            setCitiesList([]);
            setAreasList([]);
        }
    };

    const handleStateChange = (stateId: number) => {
        setStateId(stateId);
        setStateError(stateId ? "" : "State is required");
        setCityId(0);
        setAreaId(0);
        setCityError("");
        if (stateId && countryId) {
            fetchCitiesApi(setCitiesList, setOptionLoading, countryId, stateId);
        } else {
            setCitiesList([]);
            setAreasList([]);
        }
    };

    const handleCityChange = (cityId: number) => {
        setCityId(cityId);
        setCityError(cityId ? "" : "City is required");
        if (cityId && countryId && stateId) {
            fetchAreasApi(setAreasList, setOptionLoading, countryId, stateId, cityId);
        } else {
            setAreasList([]);
        }
    };

    const clearForm = () => {
        setEmployeeId(0);
        setStartDate("");
        setEndDate("");
        setCountryId(0);
        setStateId(0);
        setCityId(0);
        setAreaId(0);
        setRemark("");
    };

    const handleSubmit = async () => {
        let isValid = true;

        if (!employeeId) {
            setEmployeeError("Please select a Team Member");
            isValid = false;
        } else {
            setEmployeeError("");
        }

        if (!startDate) {
            setStartDateError("Please select Start Date");
            isValid = false;
        } else {
            setStartDateError("");
        }

        if (!endDate) {
            setEndDateError("Please enter End Date");
            isValid = false;
        } else {
            setEndDateError("");
        }

        if (!countryId) {
            setCountryError("Country is required");
            isValid = false;
        } else {
            setCountryError("");
        }

        if (!stateId) {
            setStateError("State is required");
            isValid = false;
        } else {
            setStateError("");
        }

        if (!cityId) {
            setCityError("City is required");
            isValid = false;
        } else {
            setCityError("");
        }

        if (!remark) {
            setRemarkError("Please enter a Remark");
            isValid = false;
        } else {
            setRemarkError("");
        }

        if (!isValid) return;

        if (productToEdit && productToEdit.id !== undefined) {
            await updateRoute(
                {
                    employee_id: employeeId,
                    start_date: startDate,
                    end_date: endDate,
                    country_id: countryId,
                    state_id: stateId,
                    city_id: cityId,
                    area_id: areaId,
                    remark: remark
                },
                productToEdit.id,
                setLoading,
                clearForm
            );
        } else {
            // if (!canAdd) {
            //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
            //     return;
            // }
            await createRoute(
                {
                    employee_id: employeeId,
                    start_date: startDate,
                    end_date: endDate,
                    country_id: countryId,
                    state_id: stateId,
                    city_id: cityId,
                    area_id: areaId,
                    remark: remark
                },
                setLoading,
                clearForm
            );
        }
        handleRefreshRoutes();
        onHide();
    };

    useEscapeKey(onHide);

    useEffect(() => {
        if (productToEdit) {
            setEmployeeId(productToEdit.employee_id ?? 0);
            setStartDate(productToEdit.start_date ?? "");
            setEndDate(productToEdit.end_date ?? "");
            setCountryId(productToEdit.country_id ?? 0);
            setStateId(productToEdit.state_id ?? 0);
            setCityId(productToEdit.city_id ?? 0);
            setAreaId(productToEdit.area_id ?? 0);
            setRemark(productToEdit.remark ?? "");
            if (productToEdit.country_id) {
                fetchStatesApi(setStatesList, setOptionLoading, countryId);
                fetchCitiesApi(setCitiesList, setOptionLoading, countryId, stateId);
                fetchAreasApi(setAreasList, setOptionLoading, countryId, stateId, cityId);
            }
        }
    }, []);

    return (
        <>
            {show && (
                <div className="modal1">
                    <div className="modal-content1" style={{ width: "35%" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>

                        <h2 className="modal-title1 form_header_text">
                            {headerName}
                        </h2>

                        <div
                            className="head"
                            style={{ display: "block", marginLeft: "20px" }}
                        >
                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Team Member <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <CustomSearchDropdown
                                    options={employeeOptions}
                                    value={
                                        employeeOptions.find(
                                            (option) => Number(option.value) === employeeId
                                        ) || null
                                    }
                                    onChange={(selectedOption) => {
                                        const val = selectedOption ? Number(selectedOption.value) : 0;
                                        setEmployeeId(val);
                                        setEmployeeError(val ? "" : "Please select a Team Member");
                                    }}
                                    placeholder="Select"
                                />

                                {employeeError && (
                                    <span className="text-danger">{employeeError}</span>
                                )}
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                                <div className="mb-3" style={{ width: "49%" }}>
                                    <label className="form-check-label">
                                        <h6>
                                            Start Date <span className="text-danger">*</span>
                                        </h6>
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setStartDateError("");
                                        }}
                                    />

                                    {startDateError && (
                                        <span className="text-danger">{startDateError}</span>
                                    )}
                                </div>

                                <div className="mb-3" style={{ width: "49%" }}>
                                    <label className="form-check-label">
                                        <h6>
                                            End Date <span className="text-danger">*</span>
                                        </h6>
                                    </label>

                                    <input
                                        type="date"
                                        className="form-control"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setEndDateError("");
                                        }}
                                    />

                                    {endDateError && (
                                        <span className="text-danger">{endDateError}</span>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                                <div className="mb-3" style={{ width: "49%" }}>
                                    <label className="form-check-label">
                                        <h6>
                                            Country <span className="text-danger">*</span>
                                        </h6>
                                    </label>

                                    <CustomSearchDropdown
                                        options={countryOptions}
                                        value={
                                            countryOptions.find(
                                                (option) => Number(option.value) === countryId
                                            ) || null
                                        }
                                        onChange={(selectedOption) => {
                                            const val = selectedOption ? Number(selectedOption.value) : 0;
                                            handleCountryChange(val);
                                        }}
                                        placeholder="Select"
                                    />

                                    {countryError && (
                                        <span className="text-danger">{countryError}</span>
                                    )}
                                </div>

                                <div className="mb-3" style={{ width: "49%" }}>
                                    <label className="form-check-label">
                                        <h6>
                                            State <span className="text-danger">*</span>
                                        </h6>
                                    </label>

                                    <CustomSearchDropdown
                                        options={stateOptions}
                                        value={
                                            stateOptions.find(
                                                (option) => Number(option.value) === stateId
                                            ) || null
                                        }
                                        onChange={(selectedOption) => {
                                            const val = selectedOption ? Number(selectedOption.value) : 0;
                                            handleStateChange(val);
                                        }}
                                        placeholder="Select"
                                    />

                                    {stateError && (
                                        <span className="text-danger">{stateError}</span>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center">
                                <div className="mb-3" style={{ width: "49%" }}>
                                    <label className="form-check-label">
                                        <h6>
                                            City <span className="text-danger">*</span>
                                        </h6>
                                    </label>

                                    <CustomSearchDropdown
                                        options={cityOptions}
                                        value={
                                            cityOptions.find(
                                                (option) => Number(option.value) === cityId
                                            ) || null
                                        }
                                        onChange={(selectedOption) => {
                                            const val = selectedOption ? Number(selectedOption.value) : 0;
                                            handleCityChange(val);
                                        }}
                                        placeholder="Select"
                                    />

                                    {cityError && (
                                        <span className="text-danger">{cityError}</span>
                                    )}
                                </div>

                                <div className="mb-3" style={{ width: "49%" }}>
                                    <label className="form-check-label">
                                        <h6>
                                            Area
                                        </h6>
                                    </label>

                                    <CustomSearchDropdown
                                        options={areaOptions}
                                        value={
                                            areaOptions.find(
                                                (option) => Number(option.value) === areaId
                                            ) || null
                                        }
                                        onChange={(selectedOption) => {
                                            const val = selectedOption ? Number(selectedOption.value) : 0;
                                            setAreaId(val);
                                        }}
                                        placeholder="Select"
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Remark <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <div className="search-bar">
                                    <div className="add-source-of-type-section">
                                        <textarea
                                            placeholder="Enter a Remark"
                                            rows={3}
                                            className="form-control font-size-15 rounded-1"
                                            value={remark}
                                            onChange={(e) => {
                                                setRemark(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>

                                {remarkError && (
                                    <span className="text-danger">{remarkError}</span>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                            <button
                                className="modal-button1"
                                onClick={onHide}
                                type="button"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                                onClick={handleSubmit}
                                style={{
                                    backgroundColor: "#f58634",
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddRoutePlannerView;