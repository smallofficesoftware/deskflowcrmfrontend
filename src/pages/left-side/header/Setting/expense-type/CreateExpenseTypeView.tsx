import React, { useEffect, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createExpenseType, IExpenseTypeView, updateExpenseType } from "./ExpenseTypeController";

interface IPropsCreateExpenseType {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IExpenseTypeView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshExpenseType: () => void;
}


const CreateExpenseTypeView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshExpenseType,
}: IPropsCreateExpenseType) => {

    const [expenseTypeInput, setExpenseTypeInput] = useState("");
    const [expenseTypeHexColorInput, setExpenseTypeHexColorInput] =
        useState<string | undefined>("#999999");
    const [expenseTypeError, setExpenseTypeError] = useState("");
    const [expenseSubType, setExpenseSubType] = useState<number>(1);
    const isUserChangingSubTypeRef = useRef(false);

    const [amountPerKm, setAmountPerKm] = useState<string>("");
    const [isImageRequired, setIsImageRequired] = useState<number>(2);

    const [minTime, setMinTime] = useState<any>(null);
    const [maxTime, setMaxTime] = useState<any>(null);
    const [minAmount, setMinAmount] = useState<string>("");
    const [maxAmount, setMaxAmount] = useState<string>("");
    const [fixedAmount, setFixedAmount] = useState<string>("");

    const [minTimeError, setMinTimeError] = useState<string>("");
    const [maxTimeError, setMaxTimeError] = useState<string>("");
    const [minAmountError, setMinAmountError] = useState<string>("");
    const [fixAmountError, setFixAmountError] = useState<string>("");
    const [maxAmountError, setMaxAmountError] = useState<string>("");
    const [kiloAmountError, setKiloAmountError] = useState<string>("");

    const EXPENSE_SUB_TYPES = [
        { id: 1, name: "General" },
        { id: 2, name: "Kilometer" },
    ];
    const COMPULSORY_IMAGE = [
        { id: 1, name: "Yes" },
        { id: 2, name: "No" },
    ];

    const canAdd = useCheckUserPermission(
        PAGE_ID.EXPENSE_TYPE,
        PERMISSION_TYPE.ADD,
    );

    useEffect(() => {
        // Reset only if USER changed subtype
        if (!isUserChangingSubTypeRef.current) return;

        if (expenseSubType === 1) {
            // General → clear KM fields
            setAmountPerKm("");
            setKiloAmountError("");
        }

        if (expenseSubType === 2) {
            // Kilometer → clear General fields
            setMinTime(null);
            setMaxTime(null);
            setMinAmount("");
            setMaxAmount("");
            setFixedAmount("");
            setMinTimeError("");
            setMaxTimeError("");
            setMinAmountError("");
            setMaxAmountError("");
            setFixAmountError("");
        }

        // Reset the flag
        isUserChangingSubTypeRef.current = false;
    }, [expenseSubType]);

    useEffect(() => {
        if (productToEdit) {
            setExpenseTypeInput(productToEdit.expense_name);
            setExpenseTypeHexColorInput(productToEdit.color || "#999999");
            setExpenseSubType(productToEdit.expense_subtype);
            setIsImageRequired(productToEdit.compulsory_image);
            setIsImageRequired(productToEdit.compulsory_image);
            setMinAmount(productToEdit.min_amount?.toString() ?? "");
            setMaxAmount(productToEdit.max_amount?.toString() ?? "");
            setFixedAmount(productToEdit.fix_amount?.toString() ?? "");
            setAmountPerKm(productToEdit.amount_per_km?.toString() ?? "");
            if (productToEdit.min_time) {
                const [h, m] = productToEdit.min_time.split(":");
                setMinTime(
                    new DateObject().set({
                        hour: Number(h),
                        minute: Number(m),
                    }),
                );
            } else {
                setMinTime(null);
            }
            if (productToEdit.max_time) {
                const [h, m] = productToEdit.max_time.split(":");
                setMaxTime(
                    new DateObject().set({
                        hour: Number(h),
                        minute: Number(m),
                    }),
                );
            } else {
                setMaxTime(null);
            }
        }
    }, []);

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setExpenseTypeInput(value);
        setExpenseTypeError(value ? "" : "Expense Type name is required");
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setExpenseTypeHexColorInput(event.target.value);
    };

    const validateMaxTime = (min: any, max: any) => {
        setMaxTimeError("");

        if (!max || !min) return;

        const minMinutes = min.hour * 60 + min.minute;
        const maxMinutes = max.hour * 60 + max.minute;

        if (maxMinutes <= minMinutes) {
            setMaxTimeError("Max time must be greater than Min time");
        }
    };

    const validateMinAmount = (value: string) => {
        setMinAmountError("");

        if (!value) return; // allow empty for optional field

        const num = Number(value);
        if (isNaN(num)) {
            setMinAmountError("Must be a number");
            return;
        }
        if (num < 0) {
            setMinAmountError("Cannot be negative");
        }
    };

    const validateMaxAmount = (minVal: string, maxVal: string) => {
        setMaxAmountError("");

        if (!maxVal) return;

        const minNum = minVal ? Number(minVal) : null;
        const maxNum = Number(maxVal);

        if (isNaN(maxNum)) {
            setMaxAmountError("Must be a number");
            return;
        }

        if (maxNum < 0) {
            setMaxAmountError("Cannot be negative");
            return;
        }

        if (minNum !== null && maxNum < minNum) {
            setMaxAmountError("Max amount cannot be less than Min amount");
        }
    };

    const validateFixedAmount = (value: string) => {
        setFixAmountError("");

        if (!value) return; // allow empty for optional field

        const num = Number(value);
        if (isNaN(num)) {
            setFixAmountError("Must be a number");
            return;
        }
        if (num < 0) {
            setFixAmountError("Cannot be negative");
        }
    };

    const validateKilometerAmount = (value: string) => {
        setKiloAmountError("");

        if (!value) return; // allow empty for optional field

        const num = Number(value);
        if (isNaN(num)) {
            setKiloAmountError("Must be a number");
            return;
        }
        if (num < 0) {
            setKiloAmountError("Cannot be negative");
        }
    };

    const hasFormErrors =
        Boolean(expenseTypeError) ||
        Boolean(maxTimeError) ||
        Boolean(minAmountError) ||
        Boolean(maxAmountError) ||
        Boolean(fixAmountError) ||
        Boolean(kiloAmountError);

    const clearForm = () => {
        setExpenseTypeInput("");
        setExpenseTypeHexColorInput("#999999");
        setExpenseSubType(1);
        setIsImageRequired(2);
        setMinTime(null);
        setMaxTime(null);
        setMinAmount("");
        setMaxAmount("");
        setFixedAmount("");
        setAmountPerKm("");
        setExpenseTypeError("");
        setMinTimeError("");
        setMaxTimeError("");
        setMinAmountError("");
        setMaxAmountError("");
        setFixAmountError("");
        setKiloAmountError("");
    };

    const handelSubmit = async () => {
        if (hasFormErrors) {
            toast.error("Please fix validation errors before submitting");
            return;
        }
        // Required pair validation for time
        if (minTime && !maxTime) {
            setMaxTimeError("Maximum time is required");
            toast.error("Maximum time is required");
            return;
        }

        // Required pair validation for amount
        if (minAmount !== "" && maxAmount === "") {
            setMaxAmountError("Maximum amount is required");
            toast.error("Maximum amount is required");
            return;
        }
        if (!minTime && maxTime) {
            setMinTimeError("Minimum time is required");
            toast.error("Minimum time is required");
            return;
        }

        if (minAmount === "" && maxAmount !== "") {
            setMinAmountError("Minimum amount is required");
            toast.error("Minimum amount is required");
            return;
        }

        if (expenseTypeInput.trim() === "") {
            setExpenseTypeError("Expense Type name is required");
            return;
        }

        setExpenseTypeError("");

        const minTimeFormatted = minTime
            ? `${String(minTime.hour).padStart(2, "0")}:${String(minTime.minute).padStart(2, "0")}:00`
            : undefined;
        const maxTimeFormatted = maxTime
            ? `${String(maxTime.hour).padStart(2, "0")}:${String(maxTime.minute).padStart(2, "0")}:00`
            : undefined;
        const minAmountNum = minAmount !== "" ? Number(minAmount) : undefined;
        const maxAmountNum = maxAmount !== "" ? Number(maxAmount) : undefined;
        const fixedAmountNum = fixedAmount !== "" ? Number(fixedAmount) : undefined;
        const amountPerKmNum = amountPerKm !== "" ? Number(amountPerKm) : undefined;

        if (expenseTypeInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateExpenseType(
                    {
                        expense_name: expenseTypeInput,
                        color: expenseTypeHexColorInput,
                        expense_subtype: expenseSubType,
                        compulsory_image: isImageRequired,
                        min_time: minTimeFormatted,
                        max_time: maxTimeFormatted,
                        min_amount: minAmountNum,
                        max_amount: maxAmountNum,
                        fix_amount: fixedAmountNum,
                        amount_per_km: amountPerKmNum,
                    },
                    productToEdit.id,
                    setLoading,
                    clearForm,
                );
            } else {
                if (!canAdd) {
                    toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                    return;
                }
                await createExpenseType(
                    {
                        expense_name: expenseTypeInput,
                        color: expenseTypeHexColorInput,
                        expense_subtype: expenseSubType,
                        compulsory_image: isImageRequired,
                        min_time: minTimeFormatted,
                        max_time: maxTimeFormatted,
                        min_amount: minAmountNum,
                        max_amount: maxAmountNum,
                        fix_amount: fixedAmountNum,
                        amount_per_km: amountPerKmNum,
                    },
                    setLoading,
                    clearForm,
                );
            }
            handleRefreshExpenseType();
            onHide();
        }
    };

    useEscapeKey(onHide);

    return (
        <React.Fragment>
            {show && (
                <div className="modal1 ">
                    <div className="modal-content1" style={{ width: "40%" }}>
                        <span className="close" onClick={onHide}>
                            &times;
                        </span>
                        <h6 className="modal-title1 form_header_text">{headerName}</h6>

                        <div className="head mx-2" style={{ display: "block", margin: "0 20px" }}>
                            <label
                                className="form-check-label mx-2"
                                htmlFor="flexCheckDefault"
                            >
                                <h6>
                                    Enter Expense Type Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                {/* <div className="col-10"> */}
                                <div className="search-bar">
                                    <div className="add-source-of-type-section">
                                        <input
                                            type="text"
                                            title="Expense Type"
                                            placeholder="Add Expense Type"
                                            maxLength={SMALL_TEXT_LENGTH}
                                            value={expenseTypeInput}
                                            onChange={(e) => handelChange(e)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handelSubmit();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* </div> */}
                                <div className="col-1 d-flex justify-content-end align-items-center">
                                    <input
                                        type="color"
                                        value={expenseTypeHexColorInput}
                                        className="mx-1 h-50 w-40"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        onKeyDown={(e) => {
                                            if (expenseTypeInput.trim() === "") {
                                                setExpenseTypeError(
                                                    "Expense Type name is required",
                                                );
                                                return;
                                            }
                                            if (e.key === "Enter") {
                                                handelSubmit();
                                            }
                                        }}
                                        style={{ width: "25px", height: "25px" }}
                                    />
                                </div>
                            </div>
                            <div className="col-12 mx-2">
                                {expenseTypeError && (
                                    <span className="text-danger">{expenseTypeError}</span>
                                )}
                            </div>
                            <div className="col-12 mt-2">
                                <label className="form-check-label">Expense Sub Type</label>
                                <select
                                    className="form-select"
                                    value={expenseSubType}
                                    onChange={(e) => {
                                        isUserChangingSubTypeRef.current = true;
                                        setExpenseSubType(Number(e.target.value));
                                    }}
                                >
                                    {EXPENSE_SUB_TYPES.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {expenseSubType === 1 && (
                                <div className="row mt-3">
                                    <div className="col-6 mb-2">
                                        <label className="form-check-label">Minimum Time</label>
                                        <DatePicker
                                            value={minTime}
                                            onChange={(value) => {
                                                setMinTime(value);
                                                setMinTimeError("");

                                                if (maxTime) validateMaxTime(value, maxTime);

                                                // clear required error if both exist
                                                if (value && maxTime) {
                                                    setMaxTimeError("");
                                                }
                                            }}
                                            disableDayPicker
                                            format="HH:mm"
                                            placeholder="Min Time"
                                            plugins={[<TimePicker hideSeconds />]}
                                            inputClass="form-control"
                                            containerClassName="w-100"
                                        />
                                        {minTimeError && (
                                            <small className="text-danger d-block">
                                                {minTimeError}
                                            </small>
                                        )}
                                    </div>

                                    <div className="col-6 mb-2">
                                        <label className="form-check-label">Maximum Time</label>
                                        <DatePicker
                                            value={maxTime}
                                            disabled={!minTime}
                                            onChange={(value) => {
                                                setMaxTime(value);

                                                if (value) {
                                                    setMaxTimeError("");
                                                }

                                                validateMaxTime(minTime, value);
                                            }}
                                            disableDayPicker
                                            format="HH:mm"
                                            placeholder="Max Time"
                                            plugins={[<TimePicker hideSeconds />]}
                                            inputClass="form-control"
                                            containerClassName="w-100"
                                        />
                                        {maxTimeError && (
                                            <small className="text-danger d-block">
                                                {maxTimeError}
                                            </small>
                                        )}
                                    </div>

                                    <div className="col-6 mb-2">
                                        <label className="form-check-label">Minimum Amount</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Min Amount"
                                            value={minAmount}
                                            onChange={(e) => {
                                                const val = e.target.value;

                                                setMinAmount(val);
                                                setMinAmountError("");

                                                validateMinAmount(val);
                                                validateMaxAmount(val, maxAmount);

                                                if (val && maxAmount) {
                                                    setMaxAmountError("");
                                                }
                                            }}
                                        />
                                        {minAmountError && (
                                            <small className="text-danger d-block">
                                                {minAmountError}
                                            </small>
                                        )}
                                    </div>

                                    <div className="col-6 mb-2">
                                        <label className="form-check-label">Maximum Amount</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Max Amount"
                                            value={maxAmount}
                                            disabled={!minAmount}
                                            onChange={(e) => {
                                                const val = e.target.value;

                                                setMaxAmount(val);

                                                if (val) {
                                                    setMaxAmountError("");
                                                }

                                                validateMaxAmount(minAmount, val);
                                            }}
                                        />
                                        {maxAmountError && (
                                            <small className="text-danger d-block">
                                                {maxAmountError}
                                            </small>
                                        )}
                                    </div>

                                    <div className="col-12 mb-2">
                                        <label className="form-check-label">Fixed Amount</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Fixed Amount"
                                            value={fixedAmount}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFixedAmount(val);
                                                validateFixedAmount(val);
                                            }}
                                        />
                                        {fixAmountError && (
                                            <small className="text-danger d-block">
                                                {fixAmountError}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            )}
                            {expenseSubType === 2 && (
                                <div className="row mt-3">
                                    <div className="col-12 mb-2">
                                        <label className="form-check-label">Amount Per KM</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Amount Per KM"
                                            value={amountPerKm}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAmountPerKm(val);
                                                validateKilometerAmount(val);
                                            }}
                                        />
                                        {kiloAmountError && (
                                            <small className="text-danger d-block">
                                                {kiloAmountError}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="col-12 mt-2">
                                <label className="form-check-label">Compulsory Image</label>
                                <select
                                    className="form-select"
                                    value={isImageRequired}
                                    onChange={(e) =>
                                        setIsImageRequired(Number(e.target.value))
                                    }
                                >
                                    {COMPULSORY_IMAGE.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
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

export default CreateExpenseTypeView;