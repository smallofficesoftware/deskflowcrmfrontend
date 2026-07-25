import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../common/SharedFunction";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../helpers/AppEnum";
import { TReactSetState } from "../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../hooks/useCheckUserPermission";
import {
  ADJUSTMENT_TYPES,
  createCompensationAdjustment,
  fetchAdjustmentTypes,
  fetchEmployeeList,
  ICompensationAdjustmentView,
  IEmployeeView,
  isHoursType,
  updateCompensationAdjustment,
} from "./CompensationAdjustmentsController";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { SingleValue } from "react-select";
import { IOption } from "../../../../../helpers/AppInterface";

interface IPropsCreateCompensationAdjustment {
  show: boolean;
  onHide: () => void;
  headerName: string;
  productToEdit: ICompensationAdjustmentView | undefined;
  setLoading: TReactSetState<boolean>;
  handleRefreshList: () => void;
}

const CreateCompensationAdjustmentsView = ({
  show,
  onHide,
  headerName,
  productToEdit,
  setLoading,
  handleRefreshList,
}: IPropsCreateCompensationAdjustment) => {
  const [employeeId, setEmployeeId] = useState<number>(0);
  const [typeId, setTypeId] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<number>(0);
  const [hoursValue, setHoursValue] = useState<string>("");
  const [amountValue, setAmountValue] = useState<string>("");
  const [applyDate, setApplyDate] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [employeeList, setEmployeeList] = useState<IEmployeeView[]>([]);
  const [typeList, setTypeList] = useState<IEmployeeView[]>([]);
  const [selectedTeamMamber, setSelectedTeamMamber] =
    useState<SingleValue<IOption> | null>(null);

  const [selectedType, setSelectedType] = useState<SingleValue<IOption> | null>(
    null,
  );

  // Errors
  const [employeeError, setEmployeeError] = useState<string>("");
  const [typeError, setTypeError] = useState<string>("");
  const [valueError, setValueError] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");

  const isHours = isHoursType(adjustmentType);

  // Fetch employee list once on mount only — no dependency on employeeListt to avoid infinite loop
  useEffect(() => {
    fetchEmployeeList(setEmployeeList, setLoading);
    fetchAdjustmentTypes(setTypeList, setLoading);
  }, []);

  // Pre-fill edit values once employeeListt is loaded (so the label lookup succeeds)
  useEffect(() => {
    if (!productToEdit || employeeList.length === 0 || typeList.length === 0)
      return;

    setAdjustmentType(productToEdit.adjustment_type);
    setHoursValue(
      productToEdit.hours != null ? String(productToEdit.hours) : "",
    );
    setAmountValue(
      productToEdit.amount != null ? String(productToEdit.amount) : "",
    );
    setApplyDate(productToEdit.apply_date || "");
    setRemark(productToEdit.remark || "");

    const loginId = Number(productToEdit.employee_id);
    const type_id = Number(productToEdit.type_id);
    setEmployeeId(loginId);
    setTypeId(type_id);
    const selected = employeeList.find(
      (member) => Number(member.value) === loginId,
    );
    const selectedType = typeList.find(
      (member) => Number(member.value) === type_id,
    );
    setSelectedTeamMamber(
      selected
        ? { value: selected.value, label: selected.label }
        : {
            value: productToEdit.employee_id,
            label: String(productToEdit.employee_id),
          },
    );
    setSelectedType(
      selectedType
        ? { value: selectedType.value, label: selectedType.label }
        : {
            value: productToEdit.type_id,
            label: String(productToEdit.type_id),
          },
    );
  }, [employeeList, typeList]);

  const canAdd = useCheckUserPermission(
    PAGE_ID.PAYMENT_TYPE,
    PERMISSION_TYPE.ADD,
  );

  // When adjustment type changes, clear value errors
  const handleAdjustmentTypeChange = (val: number) => {
    setAdjustmentType(val);
    setValueError("");
    setHoursValue("");
    setAmountValue("");
  };

  const clearForm = () => {
    setEmployeeId(0);
    setTypeId(0);
    setAdjustmentType(0);
    setHoursValue("");
    setAmountValue("");
    setApplyDate("");
    setRemark("");
    setEmployeeError("");
    setTypeError("");
    setValueError("");
    setDateError("");
  };

  const validate = (): boolean => {
    let isValid = true;

    if (!employeeId || employeeId === 0) {
      setEmployeeError("Employee is required");
      isValid = false;
    } else {
      setEmployeeError("");
    }

    if (!typeId || typeId === 0) {
      setTypeError("Type is required");
      isValid = false;
    } else {
      setTypeError("");
    }

    if (isHours) {
      if (!hoursValue || hoursValue.trim() === "" || Number(hoursValue) <= 0) {
        setValueError("Hours value must be greater than 0");
        isValid = false;
      } else {
        setValueError("");
      }
    } else {
      if (
        !amountValue ||
        amountValue.trim() === "" ||
        Number(amountValue) <= 0
      ) {
        setValueError("Amount value must be greater than 0");
        isValid = false;
      } else {
        setValueError("");
      }
    }

    if (!applyDate || applyDate.trim() === "") {
      setDateError("Apply date is required");
      isValid = false;
    } else {
      setDateError("");
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      employee_id: employeeId,
      type_id: typeId,
      adjustment_type: adjustmentType,
      hours_value: isHours ? Number(hoursValue) : null,
      amount_value: !isHours ? Number(amountValue) : null,
      apply_date: applyDate,
      remark: remark.trim(),
    };

    if (productToEdit && productToEdit.id !== undefined) {
      await updateCompensationAdjustment(
        payload,
        productToEdit.id,
        setLoading,
        clearForm,
      );
    } else {
      if (!canAdd) {
        toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
        return;
      }
      await createCompensationAdjustment(payload, setLoading, clearForm);
    }
    handleRefreshList();
    onHide();
  };

  const handleTeamMamberChange = (
    selectedOption: SingleValue<IOption> | null,
  ) => {
    setSelectedTeamMamber(selectedOption);
  };

  const handleTypeChange = (selectedOption: SingleValue<IOption> | null) => {
    setSelectedType(selectedOption);
  };

  useEscapeKey(onHide);

  const selectedAdjType = ADJUSTMENT_TYPES.find((a) => a.id === adjustmentType);

  return (
    <React.Fragment>
      {show && (
        <div className="modal1">
          <div className="modal-content1" style={{ width: "40%" }}>
            <span className="close" onClick={onHide}>
              &times;
            </span>
            <h2 className="modal-title1 form_header_text">{headerName}</h2>

            <div
              className="head"
              style={{
                display: "block",
                marginLeft: "20px",
                marginRight: "20px",
              }}
            >
              {/* Employee Dropdown */}
              <div className="col-12 mt-2">
                <label className="form-check-label">
                  <h6>
                    Employee
                    <span className="text-danger">*</span>
                  </h6>
                </label>
                <CustomSearchDropdown
                  options={employeeList}
                  value={selectedTeamMamber}
                  onChange={(selectedOption) => {
                    handleTeamMamberChange(selectedOption);
                    setEmployeeError(
                      selectedOption?.value ? "" : "Employee is required",
                    );
                    setEmployeeId(Number(selectedOption?.value));
                  }}
                />
                {employeeError && (
                  <div className="text-danger" style={{ fontSize: "0.82rem" }}>
                    {employeeError}
                  </div>
                )}
              </div>

              <div className="col-12 mt-2">
                <label className="form-check-label">
                  <h6>
                    Type
                    <span className="text-danger">*</span>
                  </h6>
                </label>
                <CustomSearchDropdown
                  options={typeList}
                  value={selectedType}
                  onChange={(selectedOption) => {
                    handleTypeChange(selectedOption);
                    setTypeError(
                      selectedOption?.value ? "" : "Type is required",
                    );
                    setTypeId(Number(selectedOption?.value));
                  }}
                />
                {typeError && (
                  <div className="text-danger" style={{ fontSize: "0.82rem" }}>
                    {typeError}
                  </div>
                )}
              </div>

              {/* Adjustment Type */}
              <div className="col-12 mt-3">
                <label className="form-check-label">
                  <h6>
                    Adjustment Type
                    <span className="text-danger">*</span>
                  </h6>
                </label>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {ADJUSTMENT_TYPES.map((type) => (
                    <div
                      key={type.id}
                      className={`px-3 py-1 rounded-pill border d-flex align-items-center gap-1`}
                      role="button"
                      style={{
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: 500,
                        transition: "all 0.15s",
                        backgroundColor:
                          adjustmentType === type.id
                            ? type.isCredit
                              ? "#d4edda"
                              : "#f8d7da"
                            : "transparent",
                        borderColor:
                          adjustmentType === type.id
                            ? type.isCredit
                              ? "#28a745"
                              : "#dc3545"
                            : "#ced4da",
                        color:
                          adjustmentType === type.id
                            ? type.isCredit
                              ? "#155724"
                              : "#721c24"
                            : "inherit",
                      }}
                      onClick={() => handleAdjustmentTypeChange(type.id)}
                    >
                      {type.isCredit ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
                        </svg>
                      )}
                      {type.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours or Amount Input */}
              <div className="col-12 mt-3">
                {isHours ? (
                  <>
                    <label className="form-check-label">
                      <h6>
                        Hours
                        <span className="text-danger">*</span>
                      </h6>
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className={`form-control${valueError ? " is-invalid" : ""}`}
                        placeholder="Enter hours (e.g. 2.5)"
                        value={hoursValue}
                        min={0}
                        step={0.5}
                        onChange={(e) => {
                          setHoursValue(e.target.value);
                          setValueError(
                            e.target.value && Number(e.target.value) > 0
                              ? ""
                              : "Hours value must be greater than 0",
                          );
                        }}
                      />
                      <span className="input-group-text">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 1C5.92 1 1 5.92 1 12s4.92 11 11 11 11-4.92 11-11S18.08 1 12 1zm.5 11.56l-4.5 2.68-.5-.87 4-2.38V6h1v6.56z" />
                        </svg>
                        hrs
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="form-check-label">
                      <h6>
                        Amount
                        <span className="text-danger">*</span>
                      </h6>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        className={`form-control${valueError ? " is-invalid" : ""}`}
                        placeholder="Enter amount (e.g. 500)"
                        value={amountValue}
                        min={0}
                        step={1}
                        onChange={(e) => {
                          setAmountValue(e.target.value);
                          setValueError(
                            e.target.value && Number(e.target.value) > 0
                              ? ""
                              : "Amount value must be greater than 0",
                          );
                        }}
                      />
                    </div>
                  </>
                )}
                {valueError && (
                  <div className="text-danger" style={{ fontSize: "0.82rem" }}>
                    {valueError}
                  </div>
                )}
              </div>

              {/* Apply Date */}
              <div className="col-12 mt-3">
                <label className="form-check-label">
                  <h6>
                    Apply Date
                    <span className="text-danger">*</span>
                  </h6>
                </label>
                <input
                  type="date"
                  className={`form-control${dateError ? " is-invalid" : ""}`}
                  value={applyDate}
                  onChange={(e) => {
                    setApplyDate(e.target.value);
                    setDateError(
                      e.target.value ? "" : "Apply date is required",
                    );
                  }}
                />
                {dateError && (
                  <div className="text-danger" style={{ fontSize: "0.82rem" }}>
                    {dateError}
                  </div>
                )}
              </div>

              {/* Remark */}
              <div className="col-12 mt-3">
                <label className="form-check-label">
                  <h6>Remark</h6>
                </label>
                <textarea
                  className="form-control"
                  placeholder="Enter remark (optional)"
                  rows={3}
                  maxLength={500}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  style={{ resize: "vertical" }}
                />
                <div
                  className="text-end"
                  style={{ fontSize: "0.75rem", color: "#888" }}
                >
                  {remark.length}/500
                </div>
              </div>
            </div>

            {/* Summary badge */}
            {employeeId > 0 &&
              (isHours ? hoursValue : amountValue) &&
              applyDate && (
                <div className="mx-3 mt-3">
                  <div
                    className={`alert py-2 mb-0 d-flex align-items-center gap-2 ${
                      selectedAdjType?.isCredit
                        ? "alert-success"
                        : "alert-danger"
                    }`}
                    style={{ fontSize: "0.82rem" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                    <span>
                      <strong>{selectedAdjType?.name}</strong> of{" "}
                      <strong>
                        {isHours ? `${hoursValue} hrs` : `₹${amountValue}`}
                      </strong>{" "}
                      on{" "}
                      <strong>
                        {new Date(applyDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

            <div className="col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
              <button className="modal-button1" onClick={onHide} type="button">
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
                {productToEdit ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CreateCompensationAdjustmentsView;
