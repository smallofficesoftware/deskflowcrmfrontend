import React, { useEffect, useState, useRef } from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select, { SingleValue } from "react-select";
import { axiosInstance } from "../../../services/axiosInstance";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  BACKEND_OF_SMALL_OFFICE_CRM_END_POINT,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { getCustomFieldDatavalues } from "../../../common/SharedFunction";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";

interface IOption {
  value: number | string;
  label: string;
}

interface CreateContactFormValues {
  person_name: string;
  company_name: string;
  mobile_number: string;
  source_type: IOption | null;
  email: string;
  country: IOption | null;
  state: IOption | null;
  city: IOption | null;
  area: IOption | null;
  priceList: IOption | null;
  shippingAddress: string;
  gst: string;
  isUsingExistingCRM: boolean;
  productCategoryName: IOption | null;
  requiredQuantity: string;
  requirementType: IOption | null;
  description: string;
  column_number_1: number | string;
  column_number_2: number | string;
  column_number_3: number | string;
  column_number_4: number | string;
  column_number_5: number | string;
  column_text_1: string;
  column_text_2: string;
  column_text_3: string;
  column_text_4: string;
  column_text_5: string;
  column_text_area_1: string;
  column_text_area_2: string;
  column_text_area_3: string;
  column_text_area_4: string;
  column_text_area_5: string;
  column_date_1: string;
  column_date_2: string;
  column_date_3: string;
  column_date_4: string;
  column_date_5: string;
  column_date_and_time_1: string;
  column_date_and_time_2: string;
  column_date_and_time_3: string;
  column_date_and_time_4: string;
  column_date_and_time_5: string;
  column_time_1: string;
  column_time_2: string;
  column_time_3: string;
  column_time_4: string;
  column_time_5: string;
  column_switch_1: number | boolean;
  column_switch_2: number | boolean;
  column_switch_3: number | boolean;
  column_switch_4: number | boolean;
  column_switch_5: number | boolean;
  column_decimal_1: number | string;
  column_decimal_2: number | string;
  column_decimal_3: number | string;
  column_decimal_4: number | string;
  column_decimal_5: number | string;
  column_dropdown_1: string;
  column_dropdown_2: string;
  column_dropdown_3: string;
  column_dropdown_4: string;
  column_dropdown_5: string;
  column_radio_1: string;
  column_radio_2: string;
  column_radio_3: string;
  column_radio_4: string;
  column_radio_5: string;
}

const initialValues: CreateContactFormValues = {
  person_name: "",
  company_name: "",
  mobile_number: "",
  source_type: { value: "qr", label: "QR Code" },
  email: "",
  country: null,
  state: null,
  city: null,
  area: null,
  priceList: null,
  shippingAddress: "",
  gst: "",
  isUsingExistingCRM: false,
  productCategoryName: null,
  requiredQuantity: "",
  requirementType: null,
  description: "",
  column_number_1: "",
  column_number_2: "",
  column_number_3: "",
  column_number_4: "",
  column_number_5: "",
  column_text_1: "",
  column_text_2: "",
  column_text_3: "",
  column_text_4: "",
  column_text_5: "",
  column_text_area_1: "",
  column_text_area_2: "",
  column_text_area_3: "",
  column_text_area_4: "",
  column_text_area_5: "",
  column_date_1: "",
  column_date_2: "",
  column_date_3: "",
  column_date_4: "",
  column_date_5: "",
  column_date_and_time_1: "",
  column_date_and_time_2: "",
  column_date_and_time_3: "",
  column_date_and_time_4: "",
  column_date_and_time_5: "",
  column_time_1: "",
  column_time_2: "",
  column_time_3: "",
  column_time_4: "",
  column_time_5: "",
  column_switch_1: false,
  column_switch_2: false,
  column_switch_3: false,
  column_switch_4: false,
  column_switch_5: false,
  column_decimal_1: "",
  column_decimal_2: "",
  column_decimal_3: "",
  column_decimal_4: "",
  column_decimal_5: "",
  column_dropdown_1: "",
  column_dropdown_2: "",
  column_dropdown_3: "",
  column_dropdown_4: "",
  column_dropdown_5: "",
  column_radio_1: "",
  column_radio_2: "",
  column_radio_3: "",
  column_radio_4: "",
  column_radio_5: "",
};

export interface Company {
  company_logo?: string;
  company_name?: string;
  company_email?: string;
  company_contact?: string;
  address?: string;
}

export interface ICustomFromList {
  id: number;
  title: string;
  data_type: number;
  display_order: number;
  required_or_not: number;
  reference_column_name: string;
  data_sorce: string;
  form_type: number;
}

interface ThankYouCardProps {
  company: Company;
}

export const ThankYouCard: React.FC<ThankYouCardProps> = ({ company }) => (
  <div className="d-flex justify-content-center align-items-center vh-100 bg-light px-2">
    <style>{`
            @keyframes tick-pop {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); }
            }
            .tick-icon {
                color: green;
                font-size: 3rem;
                animation: tick-pop 0.8s ease;
            }
        `}</style>
    <div
      className="bg-white p-4 rounded shadow d-flex flex-column w-100"
      style={{ maxWidth: "100mm", width: "100%", height: "150mm" }}
    >
      {company && company?.company_logo && (
        <img
          src={`${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/companyImg/${company?.company_logo}`}
          alt="Logo"
          className="rounded-circle mx-auto mb-2"
          style={{ width: 100, height: 100, objectFit: "cover" }}
        />
      )}
      <h1
        className="h5 text-center text-dark fw-bold mb-1"
        style={{ fontSize: 18 }}
      >
        {company?.company_name}
      </h1>
      <p
        className="text-center text-muted mb-1 text-break"
        style={{ fontSize: 14 }}
      >
        {company?.company_email}
      </p>
      <p className="text-center text-muted mb-1" style={{ fontSize: 14 }}>
        {company?.company_contact}
      </p>
      <p
        className="text-center text-muted mb-2 text-break"
        style={{ fontSize: 14 }}
      >
        {company?.address}
      </p>
      <div className="flex-fill d-flex flex-column justify-content-center align-items-center">
        <i className="bi bi-check-circle-fill tick-icon mb-3" />
        <h2 className="fw-bold" style={{ color: "green", fontSize: 24 }}>
          Thank You!
        </h2>
      </div>
    </div>
  </div>
);

const validationSchema = Yup.object({
  person_name: Yup.string().required("Name is Required"),
  mobile_number: Yup.string()
    .matches(/^[0-9]+$/, "Enter Digits only")
    .min(10, "Mobile Number is Too short")
    .max(15, "Mobile Number is Too long")
    .required("Mobile Number is Required"),
  source_type: Yup.object().nullable().required("Required"),
  email: Yup.string().email("Invalid email"),
  description: Yup.string()
    .max(500, "Maximum 500 characters allowed")
    .test(
      "no-special-chars",
      "Characters $, =, &, <, > are not allowed",
      (value) => value === undefined || !/[=&$<>]/.test(value),
    ),
});

const CreateContactUsingQR: React.FC = () => {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [showThankYou, setShowThankYou] = useState(false);
  const [company, setCompany] = useState<Company>({});
  const isSubmittingRef = useRef(false);

  // Custom form fields
  const [customFormList, setCustomFormList] = useState<ICustomFromList[]>([]);
  const [dropdownDataMap, setDropdownDataMap] = useState<{
    [key: number]: any[];
  }>({});
  // Fixed & Corrected Function
  const fetchCustomInqFromApiForInquiry = async () => {
    try {
      const response = await axiosInstance.post("getCustomFormFiledbyQr", {
        qrCode,
        form_type: 2,
      });

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setCustomFormList(response.data.data.item || []);
      } else {
        setCustomFormList([]);
        toast.error(response.data.ack_msg || "No custom fields found");
      }
    } catch (error: any) {
      console.error("Error fetching custom fields:", error);
      setCustomFormList([]);
      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    }
  };

  // Critical: Call the function on mount
  useEffect(() => {
    if (qrCode) {
      fetchCustomInqFromApiForInquiry();
    }
  }, [qrCode]);

  // Fetch company data
  const fetchCompanyData = async () => {
    try {
      const response = await axiosInstance.post("mainCommonGet", {
        table: "company_masters",
        columns:
          "company_name,company_logo,company_email,company_contact,address",
        where: JSON.stringify({ qr_code: qrCode }),
      });
      if (response.status === 200 && response.data?.data?.length > 0) {
        setCompany(response.data.data[0]);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [qrCode]);

  // Fetch dropdown data for custom fields
  // useEffect(() => {
  //     const fetchAllDropdownData = async () => {
  //         const dropdownPromises = customFormList
  //             .filter(item => item.data_type === 9 || item.data_type === 10)
  //             .map(async (item) => {
  //                 try {
  //                     const data = await getCustomFieldDatavalues(item.id);
  //                     return { id: item.id, data };
  //                 } catch (error) {
  //                     console.error(`Error fetching dropdown for field ${item.id}:`, error);
  //                     return { id: item.id, data: [] };
  //                 }
  //             });

  //         const results = await Promise.all(dropdownPromises);
  //         const dataMap: { [key: number]: any[] } = {};
  //         results.forEach(result => {
  //             dataMap[result.id] = result.data;
  //         });
  //         setDropdownDataMap(dataMap);
  //     };

  //     if (customFormList.length > 0) {
  //         fetchAllDropdownData();
  //     }
  // }, [customFormList]);

  useEffect(() => {
    const fetchAllDropdownAndRadioData = async () => {
      if (customFormList.length === 0) return;

      const fieldsNeedingData = customFormList.filter(
        (item) => item.data_type === 9 || item.data_type === 10, // Dropdown or Radio
      );

      if (fieldsNeedingData.length === 0) return;

      const fieldIds = fieldsNeedingData.map((item) => item.id);

      try {
        const response = await axiosInstance.post(
          "getCustomFieldDatavalueforQrByinquiry",
          {
            qrCode,
            custom_field_master_id: fieldIds, // Send array of IDs
          },
        );

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          const apiData = response.data.data; // This should be array of objects with custom_field_master_id

          const dataMap: { [key: number]: any[] } = {};

          // Map the response back to each field ID
          fieldsNeedingData.forEach((field) => {
            const fieldData = apiData.filter(
              (item: any) => Number(item.custom_field_master_id) === field.id,
            );
            dataMap[field.id] = fieldData.length > 0 ? fieldData : [];
          });

          setDropdownDataMap(dataMap);
        } else {
          toast.error(
            response.data.ack_msg || "Failed to load dropdown options",
          );
          setDropdownDataMap({});
        }
      } catch (error: any) {
        console.error("Error fetching custom field data values:", error);
        toast.error(
          error?.response?.data?.ack_msg || "Failed to load field options",
        );
        setDropdownDataMap({});
      }
    };

    fetchAllDropdownAndRadioData();
  }, [customFormList]);

  // Dynamic validation schema for custom fields
  const createInquiryValidationSchema = (customFormList: ICustomFromList[]) => {
    const validationSchema: any = {};

    customFormList.forEach((item) => {
      if (item.required_or_not === 1) {
        switch (item.data_type) {
          case 1: // Number
            validationSchema[item.reference_column_name] = Yup.number()
              .typeError("Must be a number")
              .required("This field is required");
            break;
          case 2: // Text
          case 3: // Text Area
          case 4: // Date
          case 5: // DateTime
          case 6: // Time
          case 8: // Decimal
          case 9: // Dropdown
          case 10: // Radio
            validationSchema[item.reference_column_name] =
              Yup.string().required("This field is required");
            break;
          case 7: // Switch
            validationSchema[item.reference_column_name] = Yup.boolean();
            break;
          default:
            break;
        }
      }
    });

    return Yup.object().shape({
      description: Yup.string().trim().required("Description is required"),
      ...validationSchema,
    });
  };

  const renderInputField = (
    item: ICustomFromList,
    setFieldValue: any,
    errors: any,
    touched: any,
  ) => {
    const fieldName = item.reference_column_name;
    const name = item.title;

    switch (item.data_type) {
      case 1: // Number
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className="form-control"
                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 2: // Text
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field type="text" name={fieldName} className="form-control" />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 3: // Textarea
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                as="textarea"
                name={fieldName}
                className="form-control"
                rows={1}
                style={{ overflow: "hidden" }}
                onInput={(e: any) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 4: // Date
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field name={fieldName}>
                {({ field, form }: any) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date: DateObject) => {
                      form.setFieldValue(
                        fieldName,
                        date ? date.format("YYYY-MM-DD") : "",
                      );
                    }}
                    format="YYYY-MM-DD"
                    inputClass="form-control"
                    placeholder={`Select ${name}`}
                  />
                )}
              </Field>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 5: // DateTime
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field name={fieldName}>
                {({ field, form }: any) => (
                  <DatePicker
                    value={field.value}
                    onChange={(date: DateObject | null) => {
                      form.setFieldValue(
                        fieldName,
                        date ? date.format("YYYY-MM-DD HH:mm") : "",
                      );
                    }}
                    format="YYYY-MM-DD HH:mm"
                    plugins={[<TimePicker position="right" hideSeconds />]}
                    inputClass="form-control"
                    placeholder={`Select ${name}`}
                  />
                )}
              </Field>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 6: // Time
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field type="time" name={fieldName} className="form-control" />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 7: // Switch
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field name={fieldName}>
                {({ field, form }: any) => (
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={!!field.value}
                      onChange={(e) =>
                        form.setFieldValue(fieldName, e.target.checked)
                      }
                    />
                  </div>
                )}
              </Field>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 8: // Decimal
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className="form-control"
                onChange={(e: any) => {
                  let val = e.target.value.replace(/[^0-9.]/g, "");
                  const dots = (val.match(/\./g) || []).length;
                  if (dots > 1) val = val.slice(0, -1);
                  setFieldValue(fieldName, val);
                }}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 9: // Dropdown
        const dropdownOptions = (dropdownDataMap[item.id] || []).map(
          (d: any) => ({
            value: d.data_sorce,
            label: d.data_sorce,
          }),
        );
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <FormikCustomSearchDropdown
                name={fieldName}
                options={dropdownOptions}
                // placeholder={`Select ${name}`}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      case 10: // Radio
        const radioOptions = dropdownDataMap[item.id] || [];
        return (
          <div className="col-6" key={fieldName}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}{" "}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div className="mt-2 d-flex flex-wrap gap-3">
                {radioOptions.length > 0 ? (
                  radioOptions.map((opt: any, i: number) => (
                    <div key={i} className="form-check">
                      <Field
                        className="form-check-input"
                        type="radio"
                        name={fieldName}
                        value={opt.data_sorce}
                        id={`${fieldName}-${i}`}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`${fieldName}-${i}`}
                      >
                        {opt.data_sorce}
                      </label>
                    </div>
                  ))
                ) : (
                  <small className="text-muted">No options available</small>
                )}
              </div>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="text-danger small"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  const extractCustomFields = (
    values: any,
    customFormList: ICustomFromList[],
  ) => {
    const dynamicData: any = {};

    customFormList.forEach((item) => {
      const key = item.reference_column_name; // example: column_text_1
      dynamicData[key] = values[key] ?? ""; // add to final JSON
    });

    return dynamicData;
  };
  const handleSubmit = async (
    values: CreateContactFormValues,
    actions: any,
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      if (!company?.company_name) {
        toast.error("Please wait, loading company info...");
        return;
      }
      const customFieldPayload = extractCustomFields(values, customFormList);
      const { status } = await axiosInstance.post(
        `/createContactByQR/${qrCode}`,
        {
          contact_name: values.person_name,
          company_name: values.company_name,
          mobile_number: values.mobile_number,
          contact_email: values.email,
          your_requirement: values.description,
          ...customFieldPayload,
        },
      );

      if (status === 200) {
        actions.resetForm();
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 5000);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
      );
    } finally {
      isSubmittingRef.current = false;
      actions.setSubmitting(false);
    }
  };

  if (showThankYou) return <ThankYouCard company={company} />;

  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create Inquiry</h5>
          </div>
          <div className="modal-body">
            <Formik
              initialValues={initialValues}
              validationSchema={
                customFormList.length > 0
                  ? validationSchema.concat(
                      createInquiryValidationSchema(customFormList),
                    )
                  : validationSchema
              }
              onSubmit={handleSubmit}
              enableReinitialize={true}
            >
              {({
                isSubmitting,
                setFieldValue,
                errors,
                touched,
                resetForm,
              }) => (
                <Form>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6 col-lg-4">
                      <label className="form-label">Your Full Name *</label>
                      <Field
                        name="person_name"
                        className="form-control"
                        placeholder="Enter Full Name"
                      />
                      <ErrorMessage
                        name="person_name"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-12 col-sm-6 col-lg-4">
                      <label className="form-label">Company Name</label>
                      <Field
                        name="company_name"
                        className="form-control"
                        placeholder="Enter Company Name"
                      />
                      <ErrorMessage
                        name="company_name"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-12 col-sm-6 col-lg-4">
                      <label className="form-label">Mobile Number *</label>
                      <Field
                        name="mobile_number"
                        className="form-control"
                        placeholder="Enter Mobile Number"
                      />
                      <ErrorMessage
                        name="mobile_number"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-12 col-sm-6 col-lg-4">
                      <label className="form-label">Email</label>
                      <Field
                        name="email"
                        type="email"
                        className="form-control"
                        placeholder="Enter Email"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Your Inquiry *</label>
                      <Field
                        as="textarea"
                        name="description"
                        className="form-control"
                        rows={3}
                        placeholder="Describe your requirement"
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    {/* {customFormList.length > 0 && (
                                            <div className="col-12 mt-4">
                                                <h6 className="bg-secondary text-white p-2 rounded">Additional Information</h6>
                                            </div>
                                        )} */}

                    <div className="row">
                      {customFormList.map((item) =>
                        renderInputField(item, setFieldValue, errors, touched),
                      )}
                    </div>
                  </div>

                  <div className="mt-4 d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => resetForm()}
                      disabled={isSubmitting}
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ backgroundColor: "#f58634", border: "none" }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Inquiry"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateContactUsingQR;
