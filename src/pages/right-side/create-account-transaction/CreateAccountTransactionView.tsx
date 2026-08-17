import { ErrorMessage, Field, Form, Formik, useFormikContext } from "formik";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import {
  BIG_TEXT_LENGTH,
  MINI_TEXT_LENGTH,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import useMiracleFlagStore from "../../../store/miracle/useMiracleFlagStore";
import { IAccountTransaction } from "../list-account-transaction/ListAccounTransactionController";
import { syncMiracleAccountEntry } from "../list-account-transaction/ListAccounTransactionController";
import {
  createAccountTransaction,
  createAccountTransactionInitialValues,
  createAccountTransactionValidationSchema,
  fetchCategoryApiForProduct,
  fetchMiracleAccountLedger,
  IAccountLedgerFromMiracleOptions,
  ICreateAccountTransaction,
  paymentTypesList,
  updateAccountTransaction,
} from "./CreateAccountTransactionController";

interface IPropsCreateInquiry {
  show: boolean;
  onHide: () => void;
  accountTransactionItem?: IAccountTransaction;
  contact_id: any;
  headerName: string;
  setRefreshTransactions: TReactSetState<boolean>;
}

// Custom component to watch Formik values and trigger the API call
const MiracleLedgerFetcher = ({
  isFeatureEnabled,
  setAccountLedgerFromMiracle,
}: {
  isFeatureEnabled: boolean;
  setAccountLedgerFromMiracle: TReactSetState<
    IAccountLedgerFromMiracleOptions[]
  >;
}) => {
  const { values } = useFormikContext<ICreateAccountTransaction>();

  useEffect(() => {
    if (isFeatureEnabled && values.mode) {
      // Trigger API when Payment By (mode) is selected
      fetchMiracleAccountLedger(setAccountLedgerFromMiracle, values.mode);
    } else {
      // Clear data if no mode is selected
      setAccountLedgerFromMiracle([]);
    }
  }, [values.mode, isFeatureEnabled, setAccountLedgerFromMiracle]);

  return null;
};

const CreateAccountTransactionView = ({
  show,
  onHide,
  accountTransactionItem,
  contact_id,
  headerName,
  setRefreshTransactions,
}: IPropsCreateInquiry) => {
  const [taskCategoryList, setTaskCategoryList] = useState<any>([]);

  const [accountLedgerFromMiracle, setAccountLedgerFromMiracle] = useState<
    IAccountLedgerFromMiracleOptions[]
  >([]);

  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );

  const [syncButtonClicked, setSyncButtonClicked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
    if (show) {
      const init = async () => {
        await fetchCategoryApiForProduct(setTaskCategoryList);
        // Removed fetchMiracleAccountLedger from here to load it dynamically based on 'mode'
      };
      init();
    }
  }, [show]);

  const handleSubmit = async (values: ICreateAccountTransaction) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      if (accountTransactionItem?.id) {
        const res = await updateAccountTransaction(
          values,
          onHide,
          accountTransactionItem.id,
          setRefreshTransactions,
        );
        if (res?.success && syncButtonClicked) {
          await syncMiracleAccountEntry(
            accountTransactionItem.id,
            setIsSyncing,
          );
        }
      } else {
        const res = await createAccountTransaction(
          values,
          contact_id,
          onHide,
          setRefreshTransactions,
        );
        if (res?.success && syncButtonClicked && res.id) {
          await syncMiracleAccountEntry(res.id, setIsSyncing);
        }
      }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const paymentTypesOptions = paymentTypesList.map((itemType) => ({
    value: Number(itemType.id),
    label: itemType.type_name,
  }));

  const paymentModeOptions = useMemo(
    () =>
      taskCategoryList.map((category: any) => ({
        value: category.id,
        label: category.payment_type_name,
      })),
    [taskCategoryList],
  );
  const dateInputRef = useRef<any>(null);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current?.showPicker?.();
      dateInputRef.current?.focus();
    }
  };
  return (
    <React.Fragment>
      {show && (
        <div className="modal1 ">
          <div className="modal-content1">
            <div className="d-flex align-items-center justify-content-end">
              <div className="col-8">
                {" "}
                <h2 className="modal-title1 form_header_text">{headerName}</h2>
              </div>
              <div className="col-4">
                {" "}
                <span className="close ms-3 pb-3" onClick={onHide}>
                  &times;
                </span>
              </div>
            </div>

            <Formik
              enableReinitialize
              initialValues={createAccountTransactionInitialValues(
                accountTransactionItem,
              )}
              validationSchema={createAccountTransactionValidationSchema()}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, values, setFieldValue, isSubmitting }) => (
                <Form>
                  {/* Ledger Fetcher Observer Placed Inside Form */}
                  <MiracleLedgerFetcher
                    isFeatureEnabled={isFeatureEnabled}
                    setAccountLedgerFromMiracle={setAccountLedgerFromMiracle}
                  />

                  <div className="mt-3 d-flex justify-content-center">
                    <div className="mb-3 py-4  ">
                      <div className="row  mx-0 px-2 gy-3  d-flex justify-content-center">
                        <div className="col-6 col-md-6 ">
                          <div className="form-group">
                            <label htmlFor="type" className="mb-1 form_label">
                              Payment Type{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <FormikCustomSearchDropdown
                              name="type"
                              options={paymentTypesOptions}
                              className={`  ${
                                errors.type &&
                                touched.type &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="type"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-6 col-md-6 ">
                          <div className="form-group">
                            <label htmlFor="mode" className="mb-1 form_label">
                              Payment By <span className="text-danger">*</span>
                            </label>
                            <FormikCustomSearchDropdown
                              name="mode"
                              options={paymentModeOptions}
                              className={`  ${
                                errors.mode &&
                                touched.mode &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="mode"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        {isFeatureEnabled && (
                          <div className="col-6 col-md-6 ">
                            <div className="form-group">
                              <label
                                htmlFor="miracle_account_ledger"
                                className="mb-1 form_label"
                              >
                                Account Ledger From Miracle
                              </label>
                              <FormikCustomSearchDropdown
                                name="miracle_account_ledger"
                                options={accountLedgerFromMiracle}
                                className={"is-invalid input-box-error"}
                              />
                            </div>
                          </div>
                        )}
                        <div className="col-6 col-md-6">
                          <div className="form-group">
                            <label htmlFor="amount" className="pb-2 form_label">
                              Amount <span className="text-danger">*</span>
                            </label>
                            <Field
                              type="text"
                              name="amount"
                              maxlength={MINI_TEXT_LENGTH}
                              className={`form-control font-size-15 rounded-1   ${
                                errors.amount &&
                                touched.amount &&
                                "is-invalid input-box-error"
                              }`}
                              onInput={(e: { target: { value: string } }) => {
                                e.target.value = e.target.value.replace(
                                  /[^0-9.]/g,
                                  "",
                                );
                                if (
                                  (e.target.value.match(/\./g) || []).length > 1
                                ) {
                                  e.target.value = e.target.value.slice(0, -1); // Remove extra dots
                                }
                              }}
                            />
                            <ErrorMessage
                              name="amount"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-6 col-md-6">
                          <div className="form-group">
                            <label
                              htmlFor="payment_date_time"
                              className="pb-2 form_label"
                            >
                              Payment Date & Time{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div>
                              <Field name="payment_date_time">
                                {({ field, form }: any) => {
                                  let pickerValue = field.value;

                                  if (
                                    typeof pickerValue === "string" &&
                                    pickerValue
                                  ) {
                                    try {
                                      pickerValue = new DateObject(
                                        new Date(pickerValue),
                                      ); // ✅ FIX
                                    } catch (e) {
                                      console.warn(
                                        "Invalid date string in form:",
                                        pickerValue,
                                      );
                                    }
                                  }
                                  return (
                                    <DatePicker
                                      value={pickerValue}
                                      onChange={(date: DateObject | null) => {
                                        form.setFieldValue(
                                          "payment_date_time",
                                          date
                                            ? date.format("YYYY-MM-DD HH:mm")
                                            : null,
                                        );
                                      }}
                                      format="YYYY-MM-DD HH:mm"
                                      plugins={[
                                        <TimePicker
                                          position="right"
                                          hideSeconds
                                        />,
                                      ]}
                                      placeholder={``}
                                      inputClass={`form-control font-size-15 rounded-1`}
                                    />
                                  );
                                }}
                              </Field>
                            </div>
                            <ErrorMessage
                              name="payment_date_time"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-6 col-md-6">
                          <div className="form-group">
                            <label htmlFor="remark" className="pb-2 form_label">
                              Remark
                            </label>
                            <Field
                              as="textarea"
                              name="remark"
                              maxlength={BIG_TEXT_LENGTH}
                              className={`form-control font-size-15 rounded-1   ${
                                errors.remark &&
                                touched.remark &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="remark"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        {!accountTransactionItem?.id && (
                          <div className="col-6">
                            <div className="form-group">
                              <label className="form_label d-flex align-items-center gap-2">
                                <Field
                                  type="checkbox"
                                  name="auto_reverse_entry"
                                  className="form-check-input"
                                  checked={values.auto_reverse_entry === 1}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) => {
                                    setFieldValue(
                                      "auto_reverse_entry",
                                      e.target.checked ? 1 : 0,
                                    );
                                  }}
                                />
                                Auto Reverse Entry
                              </label>
                              <small className="text-muted">
                                If checked, a reverse entry will be
                                automatically created.
                              </small>
                            </div>
                          </div>
                        )}

                        <div className="col-6"></div>
                        <div className="col-12 col-12 pt-4 d-flex justify-content-end modal-buttons">
                          <button
                            type="button"
                            className="modal-button1"
                            onClick={onHide}
                          >
                            Close
                          </button>

                          {isFeatureEnabled && (
                            <button
                              type="submit"
                              disabled={isSubmitting || isSyncing}
                              onClick={() => setSyncButtonClicked(true)}
                              className="btn px-4 py-2 ms-2 text-light form_label rounded-1"
                              style={{
                                backgroundColor: "#2b388f",
                                borderColor: "#2b388f",
                              }}
                            >
                              {isSubmitting && syncButtonClicked
                                ? "Saving & Syncing..."
                                : "Save & Sync Miracle"}
                            </button>
                          )}

                          <button
                            type="submit"
                            disabled={isSubmitting || isSyncing}
                            onClick={() => setSyncButtonClicked(false)}
                            className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"
                            style={{
                              backgroundColor: "#f58634",
                            }}
                          >
                            {isSubmitting && !syncButtonClicked
                              ? "Saving..."
                              : "Save Account Transaction"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CreateAccountTransactionView;
