import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION, SMALL_TEXT_LENGTH } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TOnChangeInput, TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import { createLeaveType, ILeaveTypeView, updateLeaveType } from "./LeaveTypeController";

interface IPropsCreateLeaveType {
    show: boolean;
    onHide: () => void;
    headerName: string;
    productToEdit: ILeaveTypeView | undefined;
    setLoading: TReactSetState<boolean>;
    handleRefreshLeaveType: () => void;
}

const CreateLeaveTypeView = ({
    show,
    onHide,
    headerName,
    productToEdit,
    setLoading,
    handleRefreshLeaveType,
}: IPropsCreateLeaveType) => {

    const [leaveTypeInput, setLeaveTypeInput] = useState("");
    const [leaveTypeHexColorInput, setLeaveTypeHexColorInput] = useState<string | undefined>("#999999");
    const [leaveTypeError, setLeaveTypeError] = useState("");
    const [paidBy, setPaidBy] = useState<number>(1);

    const canAdd = useCheckUserPermission(PAGE_ID.LEAVE_TYPE, PERMISSION_TYPE.ADD);

    const PAID_BY_OPTIONS = [
        { id: 1, name: "Company Pay" },
        { id: 2, name: "Employee Pay" },
    ];

    useEffect(() => {
        if (productToEdit) {
            setLeaveTypeInput(productToEdit.leave_type);
            setLeaveTypeHexColorInput(productToEdit.color);
            setPaidBy(productToEdit.paid_by);
        }
    }, []);

    const handelChange = (event: TOnChangeInput) => {
        const value = event.target.value;
        setLeaveTypeInput(value);
        setLeaveTypeError(value ? "" : "Leave Type name is required");
    };

    const handelChangeHexColor = (event: TOnChangeInput) => {
        setLeaveTypeHexColorInput(event.target.value);
    };

    const handlePaidByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = Number(event.target.value);
        setPaidBy(value);
    };

    const clearForm = () => {
        setLeaveTypeInput("");
        setLeaveTypeHexColorInput("#999999");
        setPaidBy(1);
    };

    const handelSubmit = async () => {
        if (leaveTypeInput.trim() === "") {
            setLeaveTypeError("Leave Type name is required");
            return;
        }

        setLeaveTypeError("");
        if (leaveTypeInput) {
            if (productToEdit && productToEdit.id !== undefined) {
                await updateLeaveType(
                    {
                        leave_type: leaveTypeInput,
                        color: leaveTypeHexColorInput,
                        paid_by: paidBy
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
                await createLeaveType(
                    {
                        leave_type: leaveTypeInput,
                        color: leaveTypeHexColorInput,
                        paid_by: paidBy
                    },
                    setLoading,
                    clearForm
                );
            }
            handleRefreshLeaveType();
            onHide();
        }
    };

    useEscapeKey(onHide);

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
                            <label className="form-check-label mx-2" htmlFor="flexCheckDefault">
                                <h6>
                                    Enter Leave Type Name
                                    <span className="text-danger">*</span>
                                </h6>
                            </label>
                            <div className="col-12 d-flex">
                                <div className="col-11 d-flex justify-content-end align-items-center">
                                    <div className="search-bar">
                                        <div className="add-source-of-type-section">
                                            <input
                                                type="text"
                                                title="Leave Type"
                                                placeholder="Add Leave Type"
                                                maxLength={SMALL_TEXT_LENGTH}
                                                value={leaveTypeInput}
                                                onChange={(e) => handelChange(e)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handelSubmit();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-1 d-flex justify-content-end align-items-center">
                                    <input
                                        type="color"
                                        value={leaveTypeHexColorInput}
                                        className="mx-1 w-40 h-50"
                                        onChange={(e) => handelChangeHexColor(e)}
                                        onKeyDown={(e) => {
                                            if (leaveTypeInput.trim() === "") {
                                                setLeaveTypeError("Leave Type name is required");
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
                                {leaveTypeError && (
                                    <span className="text-danger">{leaveTypeError}</span>
                                )}
                            </div>
                            <div className="col-12 mt-2 mx-1">
                                <label className="form-check-label" htmlFor="flexCheckDefault">
                                    <h6>
                                        Paid By
                                    </h6>
                                </label>

                                <select
                                    className="form-select"
                                    value={paidBy}
                                    onChange={handlePaidByChange}
                                >
                                    {PAID_BY_OPTIONS.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
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

export default CreateLeaveTypeView;