import { ErrorMessage, Field, Form, Formik, useFormikContext } from "formik";
import React, { useEffect, useState, useRef } from "react";
import FormikCustomSearchDropdown from "../../../../../../components/FormikCustomSearchDropdown";
import {
  MINI_TEXT_LENGTH,
  TEXTAREA_TEXT_LENGTH,
} from "../../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../../../hooks/useCheckUserPermission";
import { fetchExpenseTypeApi } from "../../expense-type/ExpenseTypeController";
import { IExpenseView } from "../ExpenseController";
import {
  createExpense,
  createProductInitialValues,
  createProductValidationSchema,
  IExpenseCreate,
  updateExpense,
  updateExpenseStatus,
} from "./CreateExpenseController";

interface IPropsCreateExpense {
  show: boolean;
  onHide: () => void;
  expenseToEdit: IExpenseView | undefined;
  headerName: string;
  handelRefreshExpense: () => void;
  status?: string;
  pass_amount?: string;
  createEditFlag?: string;
  setRefreshReport?: (value: boolean | number) => void;
  team_id?: number;
  isViewOnly?: boolean;
}

interface SyncExpenseTypeProps {
  expenseTypesList: any[];
  setSelectedExpenseType: React.Dispatch<React.SetStateAction<any>>;
}

const SyncExpenseType = ({
  expenseTypesList,
  setSelectedExpenseType,
}: SyncExpenseTypeProps) => {
  const { values } = useFormikContext<any>();

  useEffect(() => {
    if (values?.expense_type_id && expenseTypesList.length > 0) {
      const expenseType = expenseTypesList.find(
        (e) => e.id === Number(values.expense_type_id),
      );

      setSelectedExpenseType(expenseType || null);
    }
  }, [values?.expense_type_id, expenseTypesList]);

  return null;
};

const CreateExpenseView = ({
  show,
  onHide,
  expenseToEdit,
  headerName,
  handelRefreshExpense,
  status,
  pass_amount,
  createEditFlag,
  setRefreshReport,
  team_id,
  isViewOnly = false,
}: IPropsCreateExpense) => {
  const [expenseTypesList, setExpenseTypeList] = useState<any[]>([]);
  const [loadingExpenseTypes, setLoadingExpenseTypes] = useState(false);
  const [isOpenAddExpenseTypeModal, setIsOpenAddExpenseTypeModal] =
    useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedExpenseType, setSelectedExpenseType] = useState<any>(null);
  const canAddexpenseType = useCheckUserPermission(
    PAGE_ID.EXPENSE_TYPE,
    PERMISSION_TYPE.ADD,
  );
  const isSubmittingRef = useRef(false);

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
    if (expenseToEdit?.image) {
      setPreviewImage(expenseToEdit.image);
    } else {
      setPreviewImage(null);
    }
  }, [expenseToEdit, show]);

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setPreviewImage(URL.createObjectURL(file));      // temporary local preview
  //     // Formik will get the File object via setFieldValue inside Field
  //   }
  // };

  const handleSubmit = async (
    values: IExpenseCreate,
    {
      setFieldError,
      setSubmitting,
    }: {
      setFieldError: (field: string, message: string) => void;
      setSubmitting: (isSubmitting: boolean) => void;
    },
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        const value = (values as any)[key];
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      if (status === "reject" && !values.status_remark?.trim()) {
        setFieldError("status_remark", "Status Remark is required");
        return;
      }
      if (expenseToEdit?.id) {
        values.expenseId = expenseToEdit.id;
        if (status) {
          switch (status) {
            case "pass":
              await updateExpenseStatus(
                values,
                handelRefreshExpense,
                expenseToEdit?.id,
                onHide,
                2,
                team_id,
              );
              setRefreshReport && setRefreshReport(true);

              break;
            case "reject":
              await updateExpenseStatus(
                values,
                handelRefreshExpense,
                expenseToEdit?.id,
                onHide,
                3,
                team_id,
              );
              setRefreshReport && setRefreshReport(true);

              break;
            default:
              break;
          }
        } else {
          await updateExpense(
            formData,
            values,
            handelRefreshExpense,
            expenseToEdit?.id,
            onHide,
            team_id,
          );
          setRefreshReport && setRefreshReport(true);
        }
      } else {
        await createExpense(values, handelRefreshExpense, onHide, team_id);
        setRefreshReport && setRefreshReport(true);
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handelClose = () => {
    onHide();
    setRefreshReport && setRefreshReport(true);
  };

  useEffect(() => {
    // fetchExpenseTypeApiForExpense(setExpenseTypeList);
    fetchExpenseTypeApi(setExpenseTypeList, setLoadingExpenseTypes);
  }, [show]);

  // Debug: Log initial values
  useEffect(() => {
    const initialValues = createProductInitialValues(
      expenseToEdit,
      pass_amount,
    );
  }, [expenseToEdit, pass_amount, show]);

  const productTypesOptions = expenseTypesList.map((item) => ({
    value: item.id,
    label: item.expense_name,
  }));

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
              initialValues={createProductInitialValues(
                expenseToEdit,
                pass_amount,
              )}
              validationSchema={createProductValidationSchema(
                expenseTypesList,
                status,
              )}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, setFieldValue, values, isSubmitting }) => {
                return (
                  <>
                    <SyncExpenseType
                      expenseTypesList={expenseTypesList}
                      setSelectedExpenseType={setSelectedExpenseType}
                    />
                    <Form>
                      <div className="mt-3 justify-content-center">
                        <div className="mb-3 py-4">
                          <div className="row  mx-0 px-2 gy-3  d-flex">
                            {createEditFlag === "createEdit" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group text-start">
                                  <label
                                    htmlFor="expense_type_id"
                                    className="mb-1 form_label"
                                  >
                                    Expense Types
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
                                        selectedExpenseType?.expense_name || "—"
                                      }
                                      disabled
                                    />
                                  ) : (
                                    <FormikCustomSearchDropdown
                                      name="expense_type_id"
                                      options={productTypesOptions}
                                      onChange={(
                                        selectedOption,
                                        setFieldValue,
                                      ) => {
                                        const expenseType =
                                          expenseTypesList.find(
                                            (e) =>
                                              e.id ===
                                              Number(selectedOption?.value),
                                          );

                                        setSelectedExpenseType(expenseType);

                                        // Clear dependent fields on change
                                        setFieldValue("amount", "");
                                        setFieldValue("kilometers", "");
                                        setFieldValue("image", null);

                                        // Case 2: fixed amount
                                        if (
                                          expenseType?.expense_subtype === 1 &&
                                          Number(expenseType?.fix_amount) > 0
                                        ) {
                                          setFieldValue(
                                            "amount",
                                            expenseType.fix_amount,
                                          );
                                        }
                                      }}
                                      className={`${
                                        errors.expense_type_id &&
                                        touched.expense_type_id
                                          ? "is-invalid input-box-error"
                                          : ""
                                      }`}
                                    />
                                  )}
                                  <ErrorMessage
                                    name="expense_type_id"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {selectedExpenseType?.expense_subtype === 2 &&
                              status !== "pass" &&
                              status !== "reject" && (
                                <div className="col-12 col-md-6">
                                  <div className="form-group text-start">
                                    <label className="pb-2 form_label">
                                      Kilometers{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    {isViewOnly ? (
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={values.kilometers || "—"}
                                        disabled
                                      />
                                    ) : (
                                      <Field
                                        type="number"
                                        name="kilometers"
                                        className="form-control"
                                        onChange={(e: any) => {
                                          const km = Number(
                                            e.target.value || 0,
                                          );
                                          setFieldValue("kilometers", km);
                                          setFieldValue(
                                            "amount",
                                            km *
                                              Number(
                                                selectedExpenseType?.amount_per_km ||
                                                  0,
                                              ),
                                          );
                                        }}
                                      />
                                    )}

                                    <ErrorMessage
                                      name="kilometers"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                              )}

                            {createEditFlag === "createEdit" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group text-start">
                                  <label
                                    htmlFor="amount"
                                    className="pb-2 form_label"
                                  >
                                    Amount
                                    <span className="text-danger">*</span>
                                  </label>
                                  {isViewOnly ? (
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={values.amount || "—"}
                                      disabled
                                    />
                                  ) : (
                                    <Field
                                      type="text"
                                      name="amount"
                                      disabled={
                                        selectedExpenseType?.expense_subtype ===
                                          2 || selectedExpenseType?.fix_amount
                                      }
                                      maxLength={MINI_TEXT_LENGTH}
                                      className={`form-control font-size-15 rounded-1   ${
                                        errors.amount &&
                                        touched.amount &&
                                        "is-invalid input-box-error"
                                      }`}
                                      onInput={(e: {
                                        target: { value: string };
                                      }) => {
                                        e.target.value = e.target.value.replace(
                                          /[^0-9.]/g,
                                          "",
                                        ); // Allow only numbers and dots
                                        if (
                                          (e.target.value.match(/\./g) || [])
                                            .length > 1
                                        ) {
                                          e.target.value = e.target.value.slice(
                                            0,
                                            -1,
                                          ); // Remove extra dots
                                        }
                                      }}
                                    />
                                  )}
                                  <ErrorMessage
                                    name="amount"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {createEditFlag === "createEdit" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group text-start">
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
                                <div className="form-group text-start">
                                  <label className="pb-2 form_label">
                                    Expense Date
                                  </label>
                                  <Field
                                    type="date"
                                    name="expense_date"
                                    disabled={isViewOnly}
                                    className={`form-control ${
                                      errors.expense_date &&
                                      touched.expense_date
                                        ? "is-invalid input-box-error"
                                        : ""
                                    }`}
                                    max={new Date().toISOString().split("T")[0]} // optional: prevent future dates
                                  />
                                  <ErrorMessage
                                    name="expense_date"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}

                            {createEditFlag === "createEdit" && !isViewOnly && (
                              <div className="col-12 col-md-6">
                                <div className="form-group text-start">
                                  <Field name="image">
                                    {({
                                      field,
                                      form,
                                    }: {
                                      field: { value: any };
                                      form: any;
                                    }) => (
                                      <>
                                        <label
                                          htmlFor="image"
                                          className="mb-1 form_label"
                                        >
                                          Expense Image
                                          {selectedExpenseType?.compulsory_image ===
                                            1 && (
                                            <span className="text-danger">
                                              *
                                            </span>
                                          )}
                                        </label>
                                        <input
                                          type="file"
                                          id="image"
                                          accept="image/*"
                                          onChange={(event) => {
                                            const file =
                                              event.currentTarget.files?.[0];
                                            if (file) {
                                              form.setFieldValue("image", file);
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
                                    name="image"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {previewImage && (
                              <div className="col-12 col-md-6">
                                <div className="form-group text-start">
                                  <label
                                    htmlFor="visit_type_id"
                                    className="mb-1 form_label"
                                  >
                                    Expense Image
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
                            {status === "pass" && (
                              <div className="col-12 col-md-6">
                                <div className="form-group text-start">
                                  <label
                                    htmlFor="pass_amount"
                                    className="pb-2 form_label"
                                  >
                                    Pass Amount
                                    <span className="text-danger">*</span>
                                  </label>
                                  <Field
                                    type="text"
                                    name="pass_amount"
                                    className={`form-control font-size-15 rounded-1   ${
                                      errors.pass_amount &&
                                      touched.pass_amount &&
                                      "is-invalid input-box-error"
                                    }`}
                                    onInput={(e: {
                                      target: { value: string };
                                    }) => {
                                      e.target.value = e.target.value.replace(
                                        /[^0-9.]/g,
                                        "",
                                      ); // Allow only numbers and dots
                                      if (
                                        (e.target.value.match(/\./g) || [])
                                          .length > 1
                                      ) {
                                        e.target.value = e.target.value.slice(
                                          0,
                                          -1,
                                        ); // Remove extra dots
                                      }
                                    }}
                                  />
                                  <ErrorMessage
                                    name="pass_amount"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}
                            {(status === "pass" || status === "reject") && (
                              <div className="col-12 col-md-6">
                                <div className="form-group text-start">
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
                                disabled={isSubmitting}
                                className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                                style={{
                                  backgroundColor: "#f58634",
                                }}
                              >
                                {isSubmitting ? "Saving..." : "Save Expense"}
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

export default CreateExpenseView;
