import { useEffect, useMemo, useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import MultiSelect from "../../../../../components/MultiSelect";
import { TReactSetState } from "../../../../../helpers/AppType";
import { fetchAllCompanyApi } from "../../../LeftSideController";
import { addAdjustment, holidayOptions, IAdjustmentView, updateAdjustment } from "./DayAdjustmentController";

interface IPropsAddDayAdjustmentView {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IAdjustmentView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshAdjustment: () => void;
}

const AddDayAdjustmentView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshAdjustment,
}: IPropsAddDayAdjustmentView) => {

    const [employeeList, setEmployeeList] = useState<any>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [adjustmentDate, setAdjustmentDate] = useState("");
    const [employees, setEmployees] = useState<number[]>([]);
    const [holidayType, setHolidayType] = useState(0);

    const [descriptionError, setDescriptionError] = useState("");
    const [dateError, setDateError] = useState("");
    const [adjustmentDateError, setAdjustmentDateError] = useState("");
    const [employeeError, setEmployeeError] = useState("");
    const [holidayTypeError, setHolidayTypeError] = useState("");

    const [updateEmployees, setUpdateEmployees] = useState<number>(0);

    useEffect(() => {
        if (productToEdit) {
            setDescription(productToEdit.description);
            setDate(productToEdit.date);
            setAdjustmentDate(productToEdit.adjustment_date);
            setUpdateEmployees(productToEdit.employee_id);
            setHolidayType(holidayOptions.find((opt) => opt.value === productToEdit.type_of_holiday)?.value || 0);
        }
    }, []);

    useEffect(() => {
        fetchAllCompanyApi(setEmployeeList);
    }, []);

    useEffect(() => {
        if (selectedUsers.length > 0) {
            console.log("vvvvv", selectedUsers)
            setEmployees(() => {
                return selectedUsers.map((emp) => emp.value)
            })
        }
    }, [selectedUsers]);

    const employeeOptions = useMemo(
        () =>
            employeeList.map((emp: any) => ({
                value: emp.id,
                label: emp.username,
            })),
        [employeeList],
    );

    const clearForm = () => {
        setDescription("");
        setDate("");
        setAdjustmentDate("");
        setSelectedUsers([]);
        setHolidayType(0);
    };

    const handleSubmit = async () => {
        let isValid = true;

        if (!description.trim()) {
            setDescriptionError("Please Enter Description");
            isValid = false;
        } else {
            setDescriptionError("");
        }

        if (!date) {
            setDateError("Please Select Date");
            isValid = false;
        } else {
            setDateError("");
        }

        if (!adjustmentDate) {
            setAdjustmentDateError("Please Select Adjustment Date");
            isValid = false;
        } else {
            setAdjustmentDateError("");
        }

        if (selectedUsers.length <= 0 && !updateEmployees) {
            setEmployeeError("Please Select Employee");
            isValid = false;
        } else {
            setEmployeeError("");
        }

        if (!holidayType) {
            setHolidayTypeError("Please Select Type Of Holiday");
            isValid = false;
        } else {
            setHolidayTypeError("");
        }

        if (!isValid) return;

        if (productToEdit && productToEdit.id !== undefined) {
            await updateAdjustment(
                {
                    description: description,
                    date: date,
                    adjustment_date: adjustmentDate,
                    employee_ids: updateEmployees,
                    type_of_holiday: holidayType,
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
            await addAdjustment(
                {
                    description: description,
                    date: date,
                    adjustment_date: adjustmentDate,
                    employee_ids: employees,
                    type_of_holiday: holidayType,
                },
                setLoading,
                clearForm
            );
        }
        handleRefreshAdjustment();
        onHide();
    };

    useEscapeKey(onHide);

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

                            {/* Date */}
                            <div className="mb-3">
                                <label>
                                    <h6>
                                        Date <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value);
                                        setDateError("");
                                    }}
                                />

                                {dateError && (
                                    <span className="text-danger">{dateError}</span>
                                )}
                            </div>

                            {/* Adjustment Date */}
                            <div className="mb-3">
                                <label>
                                    <h6>
                                        Adjustment Date <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    value={adjustmentDate}
                                    onChange={(e) => {
                                        setAdjustmentDate(e.target.value);
                                        setAdjustmentDateError("");
                                    }}
                                />

                                {adjustmentDateError && (
                                    <span className="text-danger">{adjustmentDateError}</span>
                                )}
                            </div>

                            {/* Employee */}
                            <div className="mb-3">
                                <label>
                                    <h6>
                                        Employee(s) <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                {productToEdit ? (
                                    <select
                                        className="form-select"
                                        value={updateEmployees}
                                        onChange={(e) => {
                                            setUpdateEmployees(Number(e.target.value));
                                            setEmployeeError("");
                                        }}
                                    >
                                        {employeeList.map((type: any) => (
                                            <option key={type.id} value={type.id}>
                                                {type.username}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <MultiSelect
                                        options={employeeOptions}
                                        value={selectedUsers}
                                        onChange={(selected: any) => {
                                            setSelectedUsers(selected);
                                            setEmployeeError("");
                                        }}
                                        isSelectAll={true}
                                        menuPlacement="bottom"
                                        menuStyle={{
                                            left: "90%",
                                            right: "auto",
                                            transform: "none",
                                            height: "42px",
                                        }}
                                    />
                                )}

                                {employeeError && (
                                    <span className="text-danger">{employeeError}</span>
                                )}
                            </div>

                            {/* Type Of Holiday */}
                            <div className="mb-3">
                                <label>
                                    <h6>
                                        Type Of Holiday <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <select
                                    className="form-select"
                                    value={holidayType}
                                    onChange={(e) => {
                                        setHolidayType(Number(e.target.value));
                                        setHolidayTypeError("");
                                    }}
                                >
                                    <option value={0} key={0}>Select Type Of Holiday</option>
                                    {holidayOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                {holidayTypeError && (
                                    <span className="text-danger">{holidayTypeError}</span>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-3">
                                <label>
                                    <h6>
                                        Description <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Enter Description"
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        setDescriptionError("");
                                    }}
                                />

                                {descriptionError && (
                                    <span className="text-danger">{descriptionError}</span>
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

export default AddDayAdjustmentView;