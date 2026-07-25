import { useState } from "react";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { TReactSetState } from "../../../../../helpers/AppType";
import { createLockControl, ILockControlView } from "./LockControlController";


interface IPropsAddLockControl {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ILockControlView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshLockControl: () => void;
}

const AddLockControlView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshLockControl
}: IPropsAddLockControl) => {
    const [date, setDate] = useState("");
    const [remark, setRemark] = useState("");

    const [dateError, setDateError] = useState("");
    const [remarkError, setRemarkError] = useState("");
    const [yearError, setYearError] = useState("");
    const [monthError, setMonthError] = useState("");

    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear().toString());
    const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());

    const clearForm = () => {
        setYear("");
        setMonth("");
    };

    const handleSubmit = async () => {
        let valid = true;

        if (!year) { setYearError("Please Select Year"); valid = false; }
        if (!month) { setMonthError("Please Select Month"); valid = false; }
        if (!valid) return;
        if (year && month) {
            
                // if (!canAdd) {
                //     toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                //     return;
                // }
                await createLockControl(
                    {
                        month: month,
                        year: year
                    },
                    setLoading,
                    clearForm
                )
            handleRefreshLockControl();
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

                        <div className="head" style={{ display: "block", marginLeft: "20px" }}>

                            {/* Year Field */}
                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>Year <span className="text-danger">*</span></h6>
                                </label>
                                <select
                                    className={`form-control ${yearError ? "is-invalid" : ""}`}
                                    value={year}
                                    onChange={(e) => { setYear(e.target.value); setYearError(""); }}
                                >
                                    <option value="">Select Year</option>
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                {yearError && <span className="text-danger">{yearError}</span>}
                            </div>

                            {/* Month Field */}
                            <div className="mb-3">
                                <label className="form-check-label">
                                    <h6>Month <span className="text-danger">*</span></h6>
                                </label>
                                <select
                                    className={`form-control ${monthError ? "is-invalid" : ""}`}
                                    value={month}
                                    onChange={(e) => { setMonth(e.target.value); setMonthError(""); }}
                                >
                                    <option value="">Select Month</option>
                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                        <option key={i + 1} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                {monthError && <span className="text-danger">{monthError}</span>}
                            </div>

                        </div>

                        {/* Footer Buttons */}
                        <div className="col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                            <button className="modal-button1" onClick={onHide} type="button">
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                                onClick={handleSubmit}
                                style={{ backgroundColor: "#f58634" }}
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

export default AddLockControlView;