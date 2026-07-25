import { useEffect, useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { TReactSetState } from "../../../../../helpers/AppType";
import { createHoliday, IHolidayView, updateHoliday } from "./HolidayMasterController";

interface IPropsAddHoliday {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: IHolidayView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshHoliday: () => void;
}

const AddHolidayView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshHoliday
}: IPropsAddHoliday) => {
    const [date, setDate] = useState("");
    const [remark, setRemark] = useState("");

    const [dateError, setDateError] = useState("");
    const [remarkError, setRemarkError] = useState("");

    useEffect(() => {
        if (productToEdit) {
            setDate(productToEdit.holiday_date);
            setRemark(productToEdit.holiday_remark);
        }
    }, []);

    const clearForm = () => {
        setDate("");
        setRemark("");
    };

    const handleSubmit = async () => {
        let isValid = true;

        if (!date) {
            setDateError("Please Enter Date");
            isValid = false;
        } else {
            setDateError("");
        }

        if (!remark.trim()) {
            setRemarkError("Please Enter Remark");
            isValid = false;
        } else {
            setRemarkError("");
        }

        if (!isValid) return;

        if (date && remark) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateHoliday(
                    {
                        holiday_date: date,
                        holiday_remark: remark
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
                await createHoliday(
                    {
                        holiday_date: date,
                        holiday_remark: remark
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshHoliday();
            onHide();
        }
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
                            {/* Date Field */}
                            <div className="mb-3">
                                <label className="form-check-label">
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

                            {/* Remark Field */}
                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>
                                        Remark <span className="text-danger">*</span>
                                    </h6>
                                </label>

                                <textarea
                                    className="form-control"
                                    rows={4}
                                    placeholder="Enter Remark"
                                    value={remark}
                                    onChange={(e) => {
                                        setRemark(e.target.value);
                                        setRemarkError("");
                                    }}
                                />

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

export default AddHolidayView;