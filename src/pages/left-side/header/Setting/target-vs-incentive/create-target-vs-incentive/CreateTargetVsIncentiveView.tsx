import { ErrorMessage, Field, Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../../../common/SharedFunction";
import FormikCustomSearchDropdown from "../../../../../../components/FormikCustomSearchDropdown";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  MINI_TEXT_LENGTH,
} from "../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../../services/axiosInstance";
import { ITargetVsIncentiveView } from "../TargetVsIncentiveController";
import {
  createTargetInitialValues,
  createTargetValidationSchema,
  createTargetVsIncentive,
  incentiveTypeList,
  ITargetVsIncentiveCreate,
  reqTypesCustomInquiryList,
  targetTypeList,
  updateTarget,
} from "./createTargetVsIncentiveController";

interface IPropsCreateTarget {
  show: boolean;
  onHide: () => void;
  headerName: string;
  productToEdit: ITargetVsIncentiveView | undefined;
  setTargetVsIncentiveList: TReactSetState<ITargetVsIncentiveCreate[]>;
  setLoading: TReactSetState<boolean>;
  setRefreshProduct: TReactSetState<boolean>;
}
const CreateTargetVsIncentive = ({
  show,
  onHide,
  headerName,
  productToEdit,
  setTargetVsIncentiveList,
  setLoading,
  setRefreshProduct,
}: IPropsCreateTarget) => {
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<any>([]);
  const [initialFormValues, setInitialFormValues] =
    useState<ITargetVsIncentiveCreate>(
      createTargetInitialValues(productToEdit),
    );

  const fetchAllCompanyApi = async () => {
    const token = await localStorage.getItem("token");
    const getUUID = await localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
    };
    try {
      const data = await axiosInstance.post(
        "my-team",
        requestData,

        {
          headers: {
            Authorization: `${token}`,
          },
        },
      );
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setCategoryList([]);
      }
      setCategoryList(data.data.data.item);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  useEscapeKey(onHide);

  const categoryOptions = categoryList.map((category: any) => ({
    value: category.id,
    label: category.username,
  }));

  const requiredDisplayOptions =
    reqTypesCustomInquiryList &&
    reqTypesCustomInquiryList.map((option) => ({
      value: option.id,
      label: option.order_type_display,
    }));
  const targetTypeDisplayOptions =
    targetTypeList &&
    targetTypeList.map((option) => ({
      value: option.value,
      label: option.label,
    }));
  const incentiveTypeDisplayOptions =
    incentiveTypeList &&
    incentiveTypeList.map((option) => ({
      value: option.value,
      label: option.label,
    }));

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Enter") {
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
    if (productToEdit) {
      const formValues = createTargetInitialValues(productToEdit);
      setInitialFormValues(formValues);
    } else {
      setInitialFormValues(createTargetInitialValues(undefined));
    }
  }, [productToEdit]);

  const handleSubmit = async (values: ITargetVsIncentiveCreate) => {
    if (productToEdit?.id) {
      updateTarget(
        values,
        setTargetVsIncentiveList,
        productToEdit?.id,
        setLoading,
        onHide,
      );
    } else {
      const formattedValues = {
        ...values,
        id: productToEdit?.id || 0,
      };

      createTargetVsIncentive(
        formattedValues,
        setTargetVsIncentiveList,
        setLoading,
        onHide,
      );
    }
  };

  const handelClose = () => {
    setProductPreview("");
    onHide();
  };

  useEffect(() => {
    if (show) {
      fetchAllCompanyApi();
    }
  }, [show]);

  return (
    <React.Fragment>
      {show && (
        <div className="modal1 ">
          <div className="modal-content1">
            <span className="close" onClick={handelClose}>
              &times;
            </span>
            <h2 className="modal-title1 form_header_text">{headerName}</h2>

            <Formik
              enableReinitialize={true}
              initialValues={initialFormValues}
              validationSchema={createTargetValidationSchema()}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, setFieldValue, values }) => (
                <Form>
                  <div className="mt-3 d-flex justify-content-center">
                    <div className="mb-3 py-4">
                      <div className="row mx-0 px-2 gy-3 d-flex justify-content-center">
                        <div className="col-12">
                          <div className="form-group">
                            <label
                              htmlFor="assigned_team_member"
                              className="mb-1 form_label"
                            >
                              Assign User
                              <span className="text-danger">*</span>
                            </label>
                            <FormikCustomSearchDropdown
                              name="assigned_team_member"
                              options={categoryOptions}
                              className={`${
                                errors.assigned_team_member &&
                                touched.assigned_team_member &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="assigned_team_member"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <div className="form-group">
                            <label
                              htmlFor="target_fromdate"
                              className="mb-1 form_label"
                            >
                              From Date
                              <span className="text-danger">*</span>
                            </label>
                            <div>
                              <Field name="target_fromdate">
                                {({ field, form }: any) => (
                                  <DatePicker
                                    value={field.value}
                                    onChange={(date: DateObject) => {
                                      if (date) {
                                        form.setFieldValue(
                                          "target_fromdate",
                                          date.format("YYYY-MM-DD"),
                                        );
                                      } else {
                                        form.setFieldValue(
                                          "target_fromdate",
                                          "",
                                        );
                                      }
                                    }}
                                    format="YYYY-MM-DD"
                                    placeholder={`Enter From Date`}
                                    inputClass={`form-control font-size-15 rounded-1 ${
                                      errors.target_fromdate &&
                                      touched.target_fromdate &&
                                      "is-invalid input-box-error"
                                    }`}
                                  />
                                )}
                              </Field>
                            </div>
                            <ErrorMessage
                              name="target_fromdate"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="form-group">
                            <label
                              htmlFor="target_todate"
                              className="mb-1 form_label"
                            >
                              To Date <span className="text-danger">*</span>
                            </label>
                            <div>
                              <Field name="target_todate">
                                {({ field, form }: any) => (
                                  <DatePicker
                                    value={field.value}
                                    onChange={(date: DateObject) => {
                                      if (date) {
                                        form.setFieldValue(
                                          "target_todate",
                                          date.format("YYYY-MM-DD"),
                                        );
                                      } else {
                                        form.setFieldValue("target_todate", "");
                                      }
                                    }}
                                    format="YYYY-MM-DD"
                                    placeholder={`Enter To Date`}
                                    inputClass={`form-control font-size-15 rounded-1 ${
                                      errors.target_todate &&
                                      touched.target_todate &&
                                      "is-invalid input-box-error"
                                    }`}
                                  />
                                )}
                              </Field>
                            </div>
                            <ErrorMessage
                              name="target_todate"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="form-group">
                            <label
                              htmlFor="target_type"
                              className="mb-1 form_label"
                            >
                              Target Type
                              <span className="text-danger">*</span>
                            </label>
                            <FormikCustomSearchDropdown
                              name="target_type"
                              options={targetTypeDisplayOptions}
                              className={`${
                                errors.target_type &&
                                touched.target_type &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="target_type"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="form-group">
                            <label
                              htmlFor="target_count"
                              className="pb-2 form_label"
                            >
                              Target Count
                            </label>
                            <Field
                              type="text"
                              name="target_count"
                              maxLength={MINI_TEXT_LENGTH}
                              className={`form-control font-size-15 rounded-1 ${
                                errors.target_count &&
                                touched.target_count &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="target_count"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-4 col-md-4">
                          <div className="form-group">
                            <label
                              htmlFor="target_value"
                              className="pb-2 form_label"
                            >
                              Target Value
                            </label>
                            <Field
                              type="text"
                              name="target_value"
                              maxLength={MINI_TEXT_LENGTH}
                              className={`form-control font-size-15 rounded-1 ${
                                errors.target_value &&
                                touched.target_value &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="target_value"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-4 col-md-4">
                          <div className="form-group">
                            <label
                              htmlFor="incentive_type"
                              className="mb-1 form_label"
                            >
                              Incentive Type
                            </label>
                            <FormikCustomSearchDropdown
                              name="incentive_type"
                              options={incentiveTypeDisplayOptions}
                              className={`${
                                errors.incentive_type &&
                                touched.incentive_type &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="incentive_type"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-4 col-md-4">
                          <div className="form-group">
                            <label
                              htmlFor="incentive_value"
                              className="pb-2 form_label"
                            >
                              Incentive Value
                            </label>
                            <Field
                              type="text"
                              name="incentive_value"
                              maxLength={MINI_TEXT_LENGTH}
                              className={`form-control font-size-15 rounded-1 ${
                                errors.incentive_value &&
                                touched.incentive_value &&
                                "is-invalid input-box-error"
                              }`}
                            />
                            <ErrorMessage
                              name="incentive_value"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-12 col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                        <button
                          className="modal-button1"
                          onClick={handelClose}
                          type="button"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                          style={{
                            backgroundColor: "#f58634",
                          }}
                        >
                          {productToEdit ? "Update Target" : "Save Target"}
                        </button>
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
export default CreateTargetVsIncentive;
