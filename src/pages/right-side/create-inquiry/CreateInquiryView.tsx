import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikTouched,
} from "formik";
import React, { useEffect, useState, useRef } from "react";
import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import {
  formatDateSendDataBaseV2,
  formatDateTimeSendDataBaseV2,
  getCustomFieldDatavalues,
  openInNewTab,
} from "../../../common/SharedFunction";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import AddCategoryModal from "../../../components/model/AddCategoryModal";
import {
  MINI_TEXT_LENGTH,
  TEXTAREA_TEXT_LENGTH,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  createInquiry,
  createInquiryInitialValues,
  createInquiryValidationSchema,
  fetchCategoryApi,
  fetchCustomInqFromApiForInquiry,
  ICreateInquiry,
  ICustomFromList,
  updateInquiry,
} from "./CreateInquiryController";

interface IPropsCreateInquiry {
  show: boolean;
  onHide: () => void;
  contactData?: any;
  setRefreshInquiry: any;
  contact_id: any;
  headerName: string;
}
const CreateInquiryView = ({
  show,
  onHide,
  setRefreshInquiry,
  contactData,
  contact_id,
  headerName,
}: IPropsCreateInquiry) => {
  const [categoryList, setCategoryList] = useState<any>([]);
  const [productList, setProductList] = useState<any>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
  const [customFormList, setCustomFromList] = useState<ICustomFromList[]>([]);
  const [isSwitchActive, setIsSwitchActive] = useState(false);
  const [datasorce, setDataScorce] = useState<any[]>([]);
  const [dropdownDataMap, setDropdownDataMap] = useState<{
    [key: number]: any[];
  }>({});
  const [isOpenAddCategoryModal, setIsOpenAddCategoryModal] =
    useState<boolean>(false);
  const isSubmittingRef = useRef(false);

  const canViewCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.VIEW,
  );
  const canAddCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.ADD,
  );
  const canViewProduct = useCheckUserPermission(
    PAGE_ID.PRODUCT,
    PERMISSION_TYPE.VIEW,
  );

  const canViewSource = useCheckUserPermission(
    PAGE_ID.SOURCE,
    PERMISSION_TYPE.VIEW,
  );
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

  const [sourceOfTypesList, setSourceOfTypesList] = useState([]);
  const requirementTypesList = [
    { id: "0", requirement_name: "One time" },
    { id: "1", requirement_name: "Recurring" },
  ];
  const handleSubmit = async (values: ICreateInquiry, formikHelpers: any) => {
    const { setSubmitting, setFieldError } = formikHelpers;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      setSubmitting(true);

      for (const item of customFormList) {
        if (item.form_type !== 2) continue; // only inquiry custom fields

        const fieldName = item.reference_column_name;
        const rawValue = (values as any)[fieldName];

        // Skip if not filled (required already handled by Yup)
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          continue;
        }

        const strValue = String(rawValue).trim();

        // 1. Min / Max length
        if (item.min_limit || item.max_limit) {
          const min = Number(item.min_limit) || 0;
          const max = Number(item.max_limit) || Infinity;

          if (min > 0 && strValue.length < min) {
            setFieldError(
              fieldName,
              `${item.title} must be at least ${min} characters`,
            );
            toast.error(`${item.title} must be at least ${min} characters`);
            setSubmitting(false);
            return;
          }

          if (max < Infinity && strValue.length > max) {
            setFieldError(
              fieldName,
              `${item.title} must not exceed ${max} characters`,
            );
            toast.error(`${item.title} must not exceed ${max} characters`);
            setSubmitting(false);
            return;
          }
        }

        // 2. Validation type (pattern)
        if (item.validation_type) {
          const vt = String(item.validation_type);
          let regex: RegExp | null = null;
          let msg = "";

          switch (vt) {
            case "1": // Numeric
              regex = /^[0-9]+$/;
              msg = `${item.title} must contain only numbers`;
              break;
            case "2": // Alphanumeric
              regex = /^[A-Za-z0-9]+$/;
              msg = `${item.title} must be alphanumeric (letters and numbers)`;
              break;
            case "3": // Alpha
              regex = /^[A-Za-z\s]+$/;
              msg = `${item.title} must contain only letters`;
              break;
            case "4": // Alpha + special char
              regex = /^[A-Za-z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = `${item.title} allows letters and special characters`;
              break;
            case "5": // Numeric + special char
              regex = /^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = `${item.title} allows numbers and special characters`;
              break;
            case "6": // Alphanumeric + special char
              regex = /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = `${item.title} allows letters, numbers & special characters`;
              break;
            default:
              break;
          }

          if (regex && !regex.test(strValue)) {
            setFieldError(fieldName, msg);
            toast.error(msg);
            setSubmitting(false);
            return;
          }
        }
      }

      const DATE_COLUMNS = [
        "column_date_1",
        "column_date_2",
        "column_date_3",
        "column_date_4",
        "column_date_5",
      ];

      const TIME_COLUMNS = [
        "column_time_1",
        "column_time_2",
        "column_time_3",
        "column_time_4",
        "column_time_5",
      ];

      const DATETIME_COLUMNS = [
        "column_date_and_time_1",
        "column_date_and_time_2",
        "column_date_and_time_3",
        "column_date_and_time_4",
        "column_date_and_time_5",
      ];

      const mutableValues = values as Record<string, any>;

      (Object.keys(values) as Array<keyof typeof values>).forEach((key) => {
        const value = values[key];

        if (DATETIME_COLUMNS.includes(key)) {
          mutableValues[key] = value
            ? formatDateTimeSendDataBaseV2(String(value))
            : "";
        } else if (DATE_COLUMNS.includes(key)) {
          mutableValues[key] = value
            ? formatDateSendDataBaseV2(String(value))
            : "";
        } else if (TIME_COLUMNS.includes(key)) {
          mutableValues[key] = value;
        }
      });

      if (contactData?.id) {
        await updateInquiry(values, setRefreshInquiry, contactData, onHide);
      } else {
        await createInquiry(values, setRefreshInquiry, contact_id, onHide);
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const fetchSourceTypeApi = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");
    const requestData = {
      a_application_login_id: getUUID,
    };
    if (canViewSource) {
      try {
        const response = await axiosInstance.post("sourceOfTypes", requestData);
        setSourceOfTypesList(response.data.data.item); // Assuming API response is an array of countries
      } catch (error) {
        console.error("Error fetching countries:", error);
        setSourceOfTypesList([]);
      }
    }
  };

  const fetchCategoryApiForInquiry = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "categories",
      columns: "id,category_name",
      where: ["isDelete=0"],
      request_flag: 0,
      order: `{"id":"DESC"}`,
    };
    if (canViewCategory) {
      try {
        const response = await axiosInstance.post("commonGet", requestData);

        setCategoryList(response.data.data); // Assuming API response is an array of countries
      } catch (error) {
        console.error("Error fetching countries:", error);
        setCategoryList([]);
      }
    }
  };
  const handleSourceTypeChange = async (event: any, setFieldValue: any) => {
    const { value } = event.target;
    setFieldValue("source_type_id", value);
  };
  const fetchProductApiForInquiry = async () => {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "products",
      columns: "id,product_name",
      where: [
        "isDelete=0",
        `category_id=${selectedCategoryId}`,
        // `a_application_login_id=${getUUID}||0`,
      ],
      request_flag: 0,
      order: `{"id":"DESC"}`,
    };
    if (canViewProduct) {
      try {
        const response = await axiosInstance.post("commonGet", requestData);

        setProductList(response.data.data); // Assuming API response is an array of countries
      } catch (error) {
        console.error("Error fetching countries:", error);
        setProductList([]);
      }
    }
  };
  // const handleCountriesChange = async (
  //   selectedOption: SingleValue<IOption>,
  //   setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
  // ) => {
  //   if (selectedOption) {
  //     setFieldValue("category_id", selectedOption.value);
  //     setSelectedCategoryId(selectedOption.value as number);
  //   } else {
  //     setFieldValue("category_id", "");
  //     setSelectedCategoryId(undefined);
  //     setProductList([]);
  //   }
  // };

  const handleDropChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    console.log("selectedOption", selectedOption);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (contactData?.category_id && !selectedCategoryId) {
        setSelectedCategoryId(contactData?.category_id || undefined);
        await fetchProductApiForInquiry();
        await fetchCategoryApiForInquiry();
        await fetchSourceTypeApi();
      } else {
        await fetchSourceTypeApi();
        await fetchCategoryApiForInquiry();
        if (selectedCategoryId) {
          await fetchProductApiForInquiry();
        }
      }
      // Reset product_id when category changes
      // setFieldValue("product_id", ""); // Reset product_id when category changes
    };

    fetchData();
  }, [contactData?.category_id, selectedCategoryId, show]);

  const handleCountriesChange = async (
    selectedOption: SingleValue<IOption>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption) {
      setFieldValue("category_id", selectedOption.value);
      setFieldValue("product_id", ""); // Reset product_id when category changes
      setSelectedCategoryId(selectedOption.value as number);
    } else {
      setFieldValue("category_id", "");
      setFieldValue("product_id", "");
      setSelectedCategoryId(undefined);
      setProductList([]);
    }
  };

  useEffect(() => {
    fetchCustomInqFromApiForInquiry(setCustomFromList, setDataScorce);
  }, [show]);
  const categoryOptions = categoryList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.category_name,
  }));

  const dropDownOptions =
    datasorce &&
    datasorce.map((item) => ({
      value: item,
      label: item,
    }));

  const productOptions = productList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.product_name,
  }));
  const requirementTypesOptions = requirementTypesList.map((itemState) => ({
    value: itemState.id,
    label: itemState.requirement_name,
  }));
  const sourceTypeOptions = sourceOfTypesList.map((itemState: any) => ({
    value: itemState.id,
    label: itemState.source_name,
  }));

  const fetchDropdownData = async (fieldId: number) => {
    try {
      const datas = await getCustomFieldDatavalues(fieldId);
      return datas;
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllDropdownData = async () => {
      const dropdownPromises = customFormList.map(async (item) => {
        try {
          const data = await fetchDropdownData(item.id);
          return { id: item.id, data };
        } catch (error) {
          console.error(`Error fetching dropdown data for ${item.id}:`, error);
          return { id: item.id, data: [] };
        }
      });

      const results = await Promise.all(dropdownPromises);
      const dataMap: { [key: number]: any[] } = {};
      results.forEach((result) => {
        dataMap[result.id] = result.data;
      });
      setDropdownDataMap(dataMap);
    };

    if (customFormList && customFormList.length > 0) {
      fetchAllDropdownData();
    }
  }, [customFormList]);

  const renderInputField = (
    item: {
      id: number;
      data_type: number;
      display_order: number;
      required_or_not: number;
      data_sorce: string;
    },
    name: string,
    fieldName: string,
    setFieldValue: any,
    error: FormikErrors<ICreateInquiry>,
    touched: FormikTouched<ICreateInquiry>,
  ) => {
    switch (item.data_type) {
      case 1:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className={`form-control`}
                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, ""); // Allows only numbers
                }}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className={`form-control font-size-15 rounded-1  `}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>

              <Field
                as="textarea"
                name={fieldName}
                className={`form-control`}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
                rows={1}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div>
                <Field name={fieldName}>
                  {({ form, field }: any) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => {
                        form.setFieldValue(fieldName, date);
                      }}
                      format="DD-MM-YYYY"
                      placeholder={`Enter ${name}`}
                      inputClass="form-control"
                    />
                  )}
                </Field>
              </div>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div>
                <Field name={fieldName}>
                  {({ form, field }: any) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => {
                        form.setFieldValue(fieldName, date);
                      }}
                      format="DD-MM-YYYY hh:mm A"
                      plugins={[<TimePicker hideSeconds position="right" />]}
                      placeholder={`Enter ${name}`}
                      inputClass="form-control"
                    />
                  )}
                </Field>
              </div>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>

              <Field
                type="time"
                name={fieldName}
                className={`form-control font-size-15 rounded-1`}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
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
                      id="descriptionSwitch"
                      {...field}
                      checked={field.value === true} // Ensure the checked state is correctly set
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        form.setFieldValue(fieldName, e.target.checked);
                      }}
                    />
                    <ErrorMessage
                      name={fieldName}
                      component="div"
                      className="field-error text-danger"
                    />
                  </div>
                )}
              </Field>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>

              <Field
                type="text"
                name={fieldName}
                className={`form-control`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  let value = e.target.value;

                  if (!/^\d*\.?\d*$/.test(value)) {
                    value = value.replace(/[^0-9.]/g, ""); // Remove non-numeric & extra dots
                  }
                  const decimalCount = (value.match(/\./g) || []).length;
                  if (decimalCount > 1) {
                    value = value.slice(0, -1); // Remove extra decimal point
                  }

                  setFieldValue(fieldName, value);
                }}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 9:
        const datas = dropdownDataMap[item.id] || [];

        const dropDownOptions = datas.map((dataItem: any) => ({
          value: dataItem.data_sorce,
          label: dataItem.data_sorce,
        }));

        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>

              <FormikCustomSearchDropdown
                name={fieldName}
                options={dropDownOptions}
                className={` `}
                onChange={handleDropChange}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 10:
        const radioData = dropdownDataMap[item.id] || [];

        const radioOptions = radioData.map(
          (dataItem: any) => dataItem.data_sorce,
        );
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name " className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div className="mt-1">
                <div>
                  {radioOptions &&
                    radioOptions.map((option, index) => (
                      <label key={index} className="p-1">
                        <Field type="radio" name={fieldName} value={option} />
                        {option}
                      </label>
                    ))}
                </div>
              </div>

              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      default:
        return "No More filed Add";
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
                <span>
                  <p
                    className="landing-page-text text-end"
                    style={{
                      cursor: "pointer",
                      color: "blue",
                      float: "right",
                      fontSize: "13px",
                    }}
                    onClick={() => openInNewTab("/videoTutorial", 13)}
                  >
                    Learn More :{" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#0000FF"
                    >
                      <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                    </svg>
                  </p>
                </span>
              </div>
            </div>

            <Formik
              enableReinitialize
              initialValues={createInquiryInitialValues(
                contactData,
                setIsSwitchActive,
              )}
              validationSchema={createInquiryValidationSchema(customFormList)}
              onSubmit={handleSubmit}
            >
              {({
                errors,
                touched,
                isSubmitting,
                setFieldValue,
                values,
                setFieldError,
                setFieldTouched,
                submitForm,
                handleSubmit: formikHandleSubmit,
                validateForm,
              }) => (
                <Form>
                  <div className="  mt-3    d-flex justify-content-center">
                    <div className="mb-3 py-4  ">
                      <div
                        className="row  mx-0 px-2 gy-3  d-flex justify-content-center"
                        style={{ maxHeight: "600px", overflowX: "scroll" }}
                      >
                        <div className="col-6 col-md-6 ">
                          <div className="form-group">
                            <label
                              htmlFor="category_id"
                              className="pb-2 mb-1 form_label"
                            >
                              Product Category Name
                            </label>
                            {canAddCategory && (
                              <span
                                className="ms-2"
                                style={{ cursor: "pointer" }}
                                onClick={() => setIsOpenAddCategoryModal(true)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  height="24px"
                                  viewBox="0 -960 960 960"
                                  width="24px"
                                  fill="currentColor"
                                >
                                  <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                </svg>
                              </span>
                            )}
                            <FormikCustomSearchDropdown
                              name="category_id"
                              options={categoryOptions}
                              className={`  ${
                                errors.category_id &&
                                touched.category_id &&
                                "is-invalid input-box-error"
                              }`}
                              onChange={handleCountriesChange}
                            />
                            <ErrorMessage
                              name="category_id"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-6 col-md-6 ">
                          <div className="form-group">
                            <label htmlFor="name " className="pb-2 form_label">
                              Product Name
                            </label>
                            <FormikCustomSearchDropdown
                              name="product_id"
                              options={productOptions}
                              className={`  ${
                                errors.product_id &&
                                touched.product_id &&
                                "is-invalid input-box-error"
                              }`}
                            />

                            <ErrorMessage
                              name="product_id"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-6 col-md-6 ">
                          <div className="form-group">
                            <label htmlFor="name " className="pb-2 form_label">
                              Required Quantity
                            </label>
                            <Field
                              type="text"
                              name="qty"
                              maxlength={MINI_TEXT_LENGTH}
                              className={`form-control font-size-15 rounded-1   ${
                                errors.qty &&
                                touched.qty &&
                                "is-invalid input-box-error"
                              }`}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                              ) => {
                                let value = e.target.value;
                                if (!/^\d*\.?\d*$/.test(value)) {
                                  value = value.replace(/[^0-9.]/g, ""); // Remove non-numeric & extra dots
                                }

                                // Ensure only one decimal point exists
                                const decimalCount = (value.match(/\./g) || [])
                                  .length;
                                if (decimalCount > 1) {
                                  value = value.slice(0, -1); // Remove extra decimal point
                                }

                                setFieldValue("qty", value);
                              }}
                            />
                            <ErrorMessage
                              name="qty"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-6 col-md-6 ">
                          <div className="form-group">
                            <label htmlFor="static" className="mb-1 form_label">
                              Requirement Type
                            </label>
                            <FormikCustomSearchDropdown
                              name="static"
                              options={requirementTypesOptions}
                              className={`  ${
                                errors.static &&
                                touched.static &&
                                "is-invalid input-box-error"
                              }`}
                            />

                            <ErrorMessage
                              name="static"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-6 col-md-6">
                          <div className="form-group">
                            <label
                              htmlFor="description"
                              className="pb-2 form_label"
                            >
                              Description <span className="text-danger">*</span>
                            </label>
                            <Field
                              as="textarea"
                              name="description"
                              maxlength={TEXTAREA_TEXT_LENGTH}
                              className={`form-control ${
                                errors.description && touched.description
                                  ? "is-invalid input-box-error"
                                  : ""
                              }`}
                              onInput={(
                                e: React.FormEvent<HTMLTextAreaElement>,
                              ) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height =
                                  target.scrollHeight + "px";
                              }}
                              rows={1}
                            />
                            <ErrorMessage
                              name="description"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        <div className="col-6 ">
                          <div className="form-group">
                            <label htmlFor="city" className="mb-1 form_label">
                              Source type
                            </label>
                            <FormikCustomSearchDropdown
                              name="source_type_id"
                              options={sourceTypeOptions}
                              className={`  ${
                                errors.source_type_id &&
                                touched.source_type_id &&
                                "is-invalid input-box-error"
                              }`}
                            />

                            <ErrorMessage
                              name="source_type_id"
                              component="div"
                              className="field-error text-danger"
                            />
                          </div>
                        </div>
                        {customFormList.length > 0 && (
                          <div className="col-12 border rounded bg-secondary">
                            <b
                              style={{
                                cursor: "pointer",
                                display: "block",
                                color: "#ffff",
                              }}
                            >
                              More Inquiry Information
                              <span className="ms-2"></span>
                            </b>
                          </div>
                        )}
                        <div className="row mt-2">
                          {customFormList &&
                            customFormList.map((item) => (
                              <React.Fragment key={item.reference_column_name}>
                                {renderInputField(
                                  item,
                                  item.title,
                                  item.reference_column_name,
                                  setFieldValue,
                                  errors,
                                  touched,
                                )}
                              </React.Fragment>
                            ))}
                        </div>
                      </div>
                      <div className="col-12 col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                        <button className="modal-button1" onClick={onHide}>
                          Close
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                          style={{ backgroundColor: "#f58634" }}
                          disabled={isSubmitting}
                          onClick={async (e) => {
                            e.preventDefault();

                            const validationErrors = await validateForm(values);
                            if (Object.keys(validationErrors).length !== 0) {
                              toast.error(
                                "Required Field Is Missing Please Check Form",
                              );
                              Object.keys(validationErrors).forEach((field) => {
                                setFieldTouched(field, true, false);
                              });
                            } else {
                              try {
                                await submitForm();
                              } catch (error) {
                                console.error("Form submission error:", error);
                              }
                            }
                          }}
                        >
                          {isSubmitting ? "Saving..." : "Save Inquiry"}
                        </button>

                        {/* <button
                          type="submit"
                          className="btn btn-primary px-4 py-2 ms-2  text-light form_label rounded-1"

                          style={{
                            backgroundColor: "#f58634",
                          }}
                        >
                          Save Inquiry
                        </button> */}
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
          {isOpenAddCategoryModal && (
            <AddCategoryModal
              show={isOpenAddCategoryModal}
              onHide={() => {
                setIsOpenAddCategoryModal(false);
                fetchCategoryApi(setCategoryList);
                // fetchCategoryApiForProduct(setCategoryList);
              }}
              title="Add Product Category"
              placeholder="Enter Product Category"
              btn1="Cancel"
              btn2="Add"
              displayClearButton={true}
              payloadKey="addProductCategory"
            />
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default CreateInquiryView;
