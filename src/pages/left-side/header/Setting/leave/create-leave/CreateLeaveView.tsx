import { ErrorMessage, Field, Form, Formik, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import FormikCustomSearchDropdown from "../../../../../../components/FormikCustomSearchDropdown";
import { TEXTAREA_TEXT_LENGTH } from "../../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../../helpers/AppEnum";
import { TReactSetState } from "../../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../../hooks/useCheckUserPermission";
import { fetchLeaveTypeApi } from "../../leave-type/LeaveTypeController";
import { ILeaveView } from "../LeaveController";
import {
  createLeave,
  createLeaveInitialValues,
  createLeaveValidationSchema,
  ILeaveCreate,
  updateLeave,
  updateLeaveStatus,
} from "./CreateLeaveController";

interface IPropsCreateLeave {
  show: boolean;
  onHide: () => void;
  leaveToEdit: ILeaveView | undefined;
  headerName: string;
  setRefreshLeave: TReactSetState<boolean>;
  status?: string;
  createEditFlag?: string;
  setRefreshReport?: (value: boolean | number) => void;
  team_id?: number;
  isViewOnly?: boolean;
}

interface SyncLeaveTypeProps {
  leaveTypesList: any[];
  setSelectedLeaveType: React.Dispatch<React.SetStateAction<any>>;
}

const SyncLeaveType = ({
  leaveTypesList: leaveTypesList,
  setSelectedLeaveType: setSelectedLeaveType,
}: SyncLeaveTypeProps) => {
  const { values } = useFormikContext<any>();

  useEffect(() => {
    if (values?.leave_type_id && leaveTypesList.length > 0) {
      const leaveType = leaveTypesList.find(
        (e) => e.id === Number(values.leave_type_id),
      );

      setSelectedLeaveType(leaveType || null);
    }
  }, [values?.leave_type_id, leaveTypesList]);

  return null;
};

const CalculateHourlyDuration = () => {
  const { values, setFieldValue } = useFormikContext<any>();

  useEffect(() => {
    if (values.leave_duration?.toString() === "4") {
      if (values.start_time && values.end_time) {
        const [startH, startM] = values.start_time.split(":").map(Number);
        const [endH, endM] = values.end_time.split(":").map(Number);

        let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
        if (diffMinutes < 0) {
          diffMinutes = 0;
        }

        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;

        setFieldValue("leave_hours", hours.toString());
        setFieldValue("leave_minutes", minutes.toString());
      } else {
        setFieldValue("leave_hours", "");
        setFieldValue("leave_minutes", "");
      }
    }
  }, [values.start_time, values.end_time, values.leave_duration]);

  return null;
};

const CreateLeaveView = ({
  show,
  onHide,
  leaveToEdit: leaveToEdit,
  headerName,
  setRefreshLeave: setRefreshLeave,
  status,
  createEditFlag,
  setRefreshReport,
  team_id,
  isViewOnly = false,
}: IPropsCreateLeave) => {
  const [leaveTypesList, setLeaveTypeList] = useState<any[]>([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false);
  const [isOpenAddLeaveTypeModal, setIsOpenAddLeaveTypeModal] =
    useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<any>(null);
  const canAddLeaveType = useCheckUserPermission(
    PAGE_ID.LEAVE_TYPE,
    PERMISSION_TYPE.ADD,
  );
  const LEAVE_DURATION_OPTIONS = [
    { id: 1, name: "First half" },
    { id: 2, name: "Second half" },
    { id: 3, name: "Full Day" },
    { id: 4, name: "Hourly leave" },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "Enter" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  useEffect(() => {
    if (leaveToEdit?.attachment) {
      setPreviewImage(leaveToEdit.attachment);
    } else {
      setPreviewImage(null);
    }
  }, [leaveToEdit, show]);

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setPreviewImage(URL.createObjectURL(file));      // temporary local preview
  //     // Formik will get the File object via setFieldValue inside Field
  //   }
  // };

  const handleSubmit = async (
    values: ILeaveCreate,
    {
      setFieldError,
    }: { setFieldError: (field: string, message: string) => void },
  ) => {
    let finalValues = { ...values };
    if (
      values.leave_duration?.toString() === "4" &&
      (values as any).start_time &&
      (values as any).end_time
    ) {
      finalValues.remark = `${(values as any).start_time} to ${(values as any).end_time} - ${values.remark}`;
    }

    const formData = new FormData();
    Object.keys(finalValues).forEach((key) => {
      const value = (finalValues as any)[key];
      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    if (status === "reject" && !finalValues.status_remark?.trim()) {
      setFieldError("status_remark", "Status Remark is required");
      return;
    }
    if (leaveToEdit?.id) {
      finalValues.leaveId = leaveToEdit.id;
      if (status) {
        switch (status) {
          case "pass":
            await updateLeaveStatus(
              finalValues,
              setRefreshLeave,
              leaveToEdit?.id,
              onHide,
              2,
            );
            setRefreshReport && setRefreshReport(true);

            break;
          case "reject":
            await updateLeaveStatus(
              finalValues,
              setRefreshLeave,
              leaveToEdit?.id,
              onHide,
              3,
            );
            setRefreshReport && setRefreshReport(true);

            break;
          default:
            break;
        }
      } else {
        await updateLeave(
          formData,
          finalValues,
          setRefreshLeave,
          leaveToEdit?.id,
          onHide,
          team_id,
        );
        setRefreshReport && setRefreshReport(true);
      }
    } else {
      createLeave(finalValues, setRefreshLeave, onHide, team_id);
      setRefreshReport && setRefreshReport(true);
    }
  };

  const handelClose = () => {
    onHide();
    setRefreshReport && setRefreshReport(true);
  };

  useEffect(() => {
    // fetchExpenseTypeApiForExpense(setExpenseTypeList);
    fetchLeaveTypeApi(setLeaveTypeList, setLoadingLeaveTypes);
  }, [show]);

  // Debug: Log initial values
  useEffect(() => {
    const initialValues = createLeaveInitialValues(leaveToEdit);
  }, [leaveToEdit, show]);

  const leaveTypesOptions = leaveTypesList.map((item) => ({
    value: item.id,
    label: item.leave_type,
  }));
  const numericOnChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    setFieldValue: (f: string, v: any) => void,
  ) => {
    let val = e.target.value.replace(/[^0-9.]/g, "");

    // allow only one decimal
    if ((val.match(/\./g) || []).length > 1) {
      val = val.slice(0, -1);
    }

    // prevent negative
    if (Number(val) < 0) {
      val = "0";
    }

    setFieldValue(field, val);
  };
  return (
    <React.Fragment>
      {show && (
        <div className="modal1 ">
          <div className="modal-content1">
            <span className="close" onClick={handelClose}>
              ×
            </span>
            <h2 className="modal-title1 form_header_text">{headerName}</h2>

            <Formik
              enableReinitialize
              initialValues={createLeaveInitialValues(leaveToEdit)}
              validationSchema={createLeaveValidationSchema(
                leaveTypesList,
                status,
              )}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, setFieldValue, values }) => {
                return (
                  <>
                    <SyncLeaveType
                      leaveTypesList={leaveTypesList}
                      setSelectedLeaveType={setSelectedLeaveType}
                    />
                    <CalculateHourlyDuration />
                    <Form>
                      <div className="mt-3 justify-content-center">
                        <div className="mb-3 py-4">
                          <div className="row  mx-0 px-2 gy-3  d-flex">
                            {createEditFlag === "createEdit" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <label
                                    htmlFor="expense_type_id"
                                    className="mb-1 form_label"
                                  >
                                    Leave Types
                                    <span className="text-danger">*</span>
                                  </label>
                                  {/* {
                                  <span className="ms-2" style={{ cursor: "pointer" }} onClick={() => setIsOpenAddExpenseTypeModal(true)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" /></svg>
                                  </span>
                                } */}
                                  {isViewOnly ? (
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={
                                        selectedLeaveType?.leave_type || "—"
                                      }
                                      disabled
                                    />
                                  ) : (
                                    <FormikCustomSearchDropdown
                                      name="leave_type_id"
                                      options={leaveTypesOptions}
                                      onChange={(
                                        selectedOption,
                                        setFieldValue,
                                      ) => {
                                        const leaveType = leaveTypesList.find(
                                          (e) =>
                                            e.id ===
                                            Number(selectedOption?.value),
                                        );

                                        setSelectedLeaveType(leaveType);
                                      }}
                                      className={`${
                                        errors.leave_type_id &&
                                        touched.leave_type_id
                                          ? "is-invalid input-box-error"
                                          : ""
                                      }`}
                                      disabled={isViewOnly}
                                    />
                                  )}
                                  <ErrorMessage
                                    name="leave_type_id"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {createEditFlag === "createEdit" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Leave Duration{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  {isViewOnly ? (
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={
                                        LEAVE_DURATION_OPTIONS.find(
                                          (opt) =>
                                            opt.id ===
                                            Number(values.leave_duration),
                                        )?.name || "—"
                                      }
                                      disabled
                                    />
                                  ) : (
                                    <Field
                                      as="select"
                                      name="leave_duration"
                                      disabled={isViewOnly}
                                      className={`form-select ${
                                        errors.leave_duration &&
                                        touched.leave_duration
                                          ? "is-invalid input-box-error"
                                          : ""
                                      }`}
                                    >
                                      {LEAVE_DURATION_OPTIONS.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </Field>
                                  )}

                                  <ErrorMessage
                                    name="leave_duration"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {values.leave_duration == "4" &&
                              createEditFlag == "createEdit" && (
                                <>
                                  {/* Start Time Field */}
                                  <div className="col-12 col-md-6">
                                    <div className="form-group">
                                      <label className="pb-2 form_label">
                                        Start Time{" "}
                                        <span className="text-danger">*</span>
                                      </label>
                                      {isViewOnly ? (
                                        <input
                                          type="text"
                                          className="form-control font-size-15 rounded-1"
                                          value={values.start_time || "—"}
                                          disabled
                                        />
                                      ) : (
                                        <Field
                                          type="time"
                                          name="start_time"
                                          className={`form-control font-size-15 rounded-1 ${errors.start_time && touched.start_time ? "is-invalid" : ""}`}
                                        />
                                      )}
                                      <ErrorMessage
                                        name="start_time"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>

                                  {/* End Time Field */}
                                  <div className="col-12 col-md-6">
                                    <div className="form-group">
                                      <label className="pb-2 form_label">
                                        End Time{" "}
                                        <span className="text-danger">*</span>
                                      </label>
                                      {isViewOnly ? (
                                        <input
                                          type="text"
                                          className="form-control font-size-15 rounded-1"
                                          value={values.end_time || "—"}
                                          disabled
                                        />
                                      ) : (
                                        <Field
                                          type="time"
                                          name="end_time"
                                          className={`form-control font-size-15 rounded-1 ${errors.end_time && touched.end_time ? "is-invalid" : ""}`}
                                        />
                                      )}
                                      <ErrorMessage
                                        name="end_time"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>

                                  {/* Hours Field */}
                                  <div className="col-12 col-md-6">
                                    <div className="form-group">
                                      <label className="pb-2 form_label">
                                        Hours
                                      </label>
                                      <Field
                                        type="text"
                                        name="leave_hours"
                                        placeholder="Calculated automatically"
                                        className={`form-control font-size-15 rounded-1 ${errors.leave_hours && touched.leave_hours ? "is-invalid" : ""}`}
                                        disabled={true}
                                      />
                                      <ErrorMessage
                                        name="leave_hours"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>

                                  {/* Minutes Field */}
                                  <div className="col-12 col-md-6">
                                    <div className="form-group">
                                      <label className="pb-2 form_label">
                                        Minutes
                                      </label>
                                      <Field
                                        type="text"
                                        name="leave_minutes"
                                        placeholder="Calculated automatically"
                                        className={`form-control font-size-15 rounded-1 ${errors.leave_minutes && touched.leave_minutes ? "is-invalid" : ""}`}
                                        disabled={true}
                                      />
                                      <ErrorMessage
                                        name="leave_minutes"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                </>
                              )}
                            {createEditFlag === "createEdit" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <label
                                    htmlFor="remark"
                                    className="pb-2 form_label"
                                  >
                                    Remark
                                    <span className="text-danger">*</span>
                                  </label>
                                  {isViewOnly ? (
                                    <textarea
                                      className="form-control"
                                      value={values.remark || "—"}
                                      disabled
                                      rows={3}
                                    />
                                  ) : (
                                    <Field
                                      as="textarea"
                                      name="remark"
                                      maxLength={TEXTAREA_TEXT_LENGTH}
                                      disabled={isViewOnly}
                                      className={`form-control font-size-15 rounded-1   ${
                                        errors.remark &&
                                        touched.remark &&
                                        "is-invalid input-box-error"
                                      }`}
                                    />
                                  )}

                                  <ErrorMessage
                                    name="remark"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {createEditFlag === "createEdit" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Leave Date
                                    <span className="text-danger">*</span>
                                  </label>
                                  <Field
                                    type="date"
                                    name="leave_date"
                                    className={`form-control ${
                                      errors.leave_date && touched.leave_date
                                        ? "is-invalid input-box-error"
                                        : ""
                                    }`}
                                    disabled={isViewOnly}
                                    min={new Date().toISOString().split("T")[0]}
                                  />
                                  <ErrorMessage
                                    name="leave_date"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {createEditFlag === "createEdit" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <label className="pb-2 form_label">
                                    Reporting Date
                                    <span className="text-danger">*</span>
                                  </label>
                                  <Field
                                    type="date"
                                    name="reporting_date"
                                    className={`form-control ${
                                      errors.leave_date && touched.leave_date
                                        ? "is-invalid input-box-error"
                                        : ""
                                    }`}
                                    disabled={isViewOnly}
                                    validateOnChange={true}
                                    min={new Date().toISOString().split("T")[0]}
                                  />
                                  <ErrorMessage
                                    name="reporting_date"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}

                            {createEditFlag === "createEdit" && !isViewOnly && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <Field name="attachment">
                                    {({
                                      field,
                                      form,
                                    }: {
                                      field: { value: any };
                                      form: any;
                                    }) => (
                                      <>
                                        <label
                                          htmlFor="attachment"
                                          className="mb-1 form_label"
                                        >
                                          Attachment
                                          {selectedLeaveType?.compulsory_image ===
                                            1 && (
                                            <span className="text-danger">
                                              *
                                            </span>
                                          )}
                                        </label>
                                        <input
                                          type="file"
                                          id="attachment"
                                          accept="image/*"
                                          onChange={(event) => {
                                            const file =
                                              event.currentTarget.files?.[0];
                                            if (file) {
                                              form.setFieldValue(
                                                "attachment",
                                                file,
                                              );
                                              setPreviewImage(
                                                URL.createObjectURL(file),
                                              );
                                            }
                                          }}
                                        />
                                        <Field type="hidden" name="end_time" />
                                      </>
                                    )}
                                  </Field>

                                  <ErrorMessage
                                    name="attachment"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {previewImage && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <label
                                    htmlFor="visit_type_id"
                                    className="mb-1 form_label"
                                  >
                                    Leave Image
                                  </label>
                                  <br />
                                  <img
                                    src={previewImage}
                                    alt="Visit Preview"
                                    style={{
                                      width: "50%",
                                      maxWidth: "500px",
                                      borderRadius: "10px",
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {(status === "pass" || status === "reject") && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <label
                                    htmlFor="status_remark"
                                    className="pb-2 form_label"
                                  >
                                    Status Remark
                                    {status === "reject" && (
                                      <span className="text-danger">*</span>
                                    )}
                                  </label>
                                  <Field
                                    as="textarea"
                                    name="status_remark"
                                    className={`form-control font-size-15 rounded-1   ${
                                      errors.status_remark &&
                                      touched.status_remark &&
                                      "is-invalid input-box-error"
                                    }`}
                                  />
                                  <ErrorMessage
                                    name="status_remark"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="col-12 col-12 pt-4 d-flex justify-content-end modal-buttons">
                            <button
                              className="modal-button1"
                              onClick={handelClose}
                            >
                              Close
                            </button>
                            {!isViewOnly && (
                              <button
                                type="submit"
                                className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                                style={{
                                  backgroundColor: "#f58634",
                                }}
                              >
                                Save Leave
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Form>
                  </>
                );
              }}
            </Formik>
            {/* {
              isOpenAddExpenseTypeModal && <AddCategoryModal
                show={isOpenAddExpenseTypeModal}
                onHide={() => { setIsOpenAddExpenseTypeModal(false); fetchExpenseTypeApiForExpense(setExpenseTypeList) }}
                title="Add Expense Type"
                placeholder="Enter Expense Type"
                btn1="Cancel"
                btn2="Add"
                displayClearButton={true}
                payloadKey="addExpenseType"
              />
            } */}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CreateLeaveView;
