import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikTouched,
} from "formik";
import React, { useEffect, useState, useRef } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast } from "react-toastify";
import {
  formatDateSendDataBaseV2,
  formatDateTimeSendDataBaseV2,
  getCustomFieldDatavalues,
} from "../../../../../../common/SharedFunction";
import FormikCustomSearchDropdown from "../../../../../../components/FormikCustomSearchDropdown";
import AddCategoryModal from "../../../../../../components/model/AddCategoryModal";
import { TEXTAREA_TEXT_LENGTH } from "../../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../../helpers/AppEnum";
import { TReactSetState } from "../../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../../hooks/useCheckUserPermission";
import {
  fetchCustomInqFromApiForVisit,
  ICustomFromList,
  IVisitView,
} from "../VisitController";
import {
  createProductInitialValues,
  createProductValidationSchema,
  createVisit,
  fetchVisitTypeApiForVisit,
  IVisitCreate,
  IVisitType,
  updateVisit,
} from "./CreateVisitController";

interface IPropsCreateVisit {
  show: boolean;
  onHide: () => void;
  visitToEdit: IVisitView | undefined;
  headerName: string;
  setRefreshVisit: TReactSetState<boolean>;
  status?: string;
  createEditFlag?: string;
  contactId?: Number;
  contactName?: string;
  setRefreshChat?: (value: boolean | number) => void;
  stop_task_id?: any;
}

const CreateVisitView = ({
  show,
  onHide,
  visitToEdit,
  headerName,
  setRefreshVisit,
  status,
  createEditFlag,
  contactId,
  contactName,
  setRefreshChat,
  stop_task_id,
}: IPropsCreateVisit) => {
  const [visitTypesList, setVisitTypeList] = useState<IVisitType[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dropdownDataMap, setDropdownDataMap] = useState<{
    [key: number]: any[];
  }>({});
  const isSubmittingRef = useRef(false);
  const [isOpenAddVisitTypeModal, setIsOpenAddVisitTypeModal] =
    useState<boolean>(false);
  const [customFormList, setCustomFormList] = useState<ICustomFromList[]>([]);

  const canAddVisitType = useCheckUserPermission(
    PAGE_ID.VISIT_TYPE,
    PERMISSION_TYPE.ADD,
  );
  useEffect(() => {
    fetchCustomInqFromApiForVisit(setCustomFormList);
  }, []);

  useEffect(() => {
    if (visitToEdit?.visit_image) {
      setPreviewImage(visitToEdit.visit_image);
    } else {
      setPreviewImage(null);
    }
  }, [visitToEdit, show]);

  useEffect(() => {
    console.log("contactId received in CreateVisitView:", contactId);
  }, [contactId]);
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

  const handleSubmit = async (
    values: IVisitCreate,
    { setSubmitting, setFieldError }: any,
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      setSubmitting(true);
      const requiredCustomFields = customFormList.filter(
        (f) =>
          f.form_type === 3 &&
          f.required_or_not === 1 &&
          f.data_type !== 7 && // skip checkbox
          ((visitToEdit && (f.required_for === 2 || f.required_for === 3)) ||
            (!visitToEdit && (f.required_for === 1 || f.required_for === 3))),
      );

      for (const field of requiredCustomFields) {
        const key = field.reference_column_name;
        const value = (values as any)[key];

        if (!value && value !== 0 && value !== false) {
          setFieldError(key, `${field.title} is required`);
          toast.error(`${field.title} is required`);
          setSubmitting(false);
          return;
        }
      }

      // ───────────────────────────────────────────────────────────────
      // 2. Min / Max length + Validation type checks for custom fields
      // ───────────────────────────────────────────────────────────────
      for (const item of customFormList) {
        if (item.form_type !== 3) continue; // only visit custom fields

        const fieldName = item.reference_column_name;
        const rawValue = (values as any)[fieldName];

        // Skip empty values (required already checked)
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          continue;
        }

        const strValue = String(rawValue).trim();

        // ─── 2.1 Min / Max character length ────────────────────────────
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

        // ─── 2.2 Validation type (pattern/content rules) ───────────────
        if (item.validation_type) {
          const vt = String(item.validation_type);
          let regex: RegExp | null = null;
          let errorMessage = "";

          switch (vt) {
            case "1": // Numeric only
              regex = /^[0-9]+$/;
              errorMessage = `${item.title} must contain only numbers`;
              break;

            case "2": // Alphanumeric
              regex = /^[A-Za-z0-9]+$/;
              errorMessage = `${item.title} must be alphanumeric (letters and numbers only)`;
              break;

            case "3": // Alpha only
              regex = /^[A-Za-z\s]+$/;
              errorMessage = `${item.title} must contain only letters`;
              break;

            case "4": // Alpha + special characters
              regex = /^[A-Za-z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              errorMessage = `${item.title} can contain letters and special characters`;
              break;

            case "5": // Numeric + special characters
              regex = /^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              errorMessage = `${item.title} can contain numbers and special characters`;
              break;

            case "6": // Alphanumeric + special characters
              regex = /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              errorMessage = `${item.title} can contain letters, numbers, and special characters`;
              break;

            default:
              break;
          }

          if (regex && !regex.test(strValue)) {
            setFieldError(fieldName, errorMessage);
            toast.error(errorMessage);
            setSubmitting(false);
            return;
          }
        }
      }
      const formData = new FormData();
      // if (!values.visit_type_id) {
      //   toast.error("Missing required fields.");
      // }
      formData.append("visit_type_id", values.visit_type_id?.toString() || "");
      formData.append("remark", values.remark || "");
      formData.append(
        "a_application_login_id",
        values.a_application_login_id?.toString() || "",
      );

      // Append contact_id and person_name if available
      if (contactId && contactName) {
        formData.append("contact_id", contactId.toString());
        formData.append("person_name", contactName || "");
      } else if (values.contactId) {
        formData.append("contact_id", values.contactId.toString());
        formData.append("person_name", values.contactName || "");
      } else {
        console.warn("No contact_id provided. Using empty values.");
        formData.append("contact_id", "");
        formData.append("person_name", "");
      }
      if (values.visit_image instanceof File) {
        formData.append("visit_image", values.visit_image);
      }
      const dynamicFields = [
        "visit_column_number_1",
        "visit_column_number_2",
        "visit_column_number_3",
        "visit_column_number_4",
        "visit_column_number_5",
        "visit_column_text_1",
        "visit_column_text_2",
        "visit_column_text_3",
        "visit_column_text_4",
        "visit_column_text_5",
        "visit_column_text_area_1",
        "visit_column_text_area_2",
        "visit_column_text_area_3",
        "visit_column_text_area_4",
        "visit_column_text_area_5",
        "visit_column_date_1",
        "visit_column_date_2",
        "visit_column_date_3",
        "visit_column_date_4",
        "visit_column_date_5",
        "visit_column_date_and_time_1",
        "visit_column_date_and_time_2",
        "visit_column_date_and_time_3",
        "visit_column_date_and_time_4",
        "visit_column_date_and_time_5",
        "visit_column_time_1",
        "visit_column_time_2",
        "visit_column_time_3",
        "visit_column_time_4",
        "visit_column_time_5",
        "visit_column_switch_1",
        "visit_column_switch_2",
        "visit_column_switch_3",
        "visit_column_switch_4",
        "visit_column_switch_5",
        "visit_column_decimal_1",
        "visit_column_decimal_2",
        "visit_column_decimal_3",
        "visit_column_decimal_4",
        "visit_column_decimal_5",
        "visit_column_dropdown_1",
        "visit_column_dropdown_2",
        "visit_column_dropdown_3",
        "visit_column_dropdown_4",
        "visit_column_dropdown_5",
        "visit_column_radio_1",
        "visit_column_radio_2",
        "visit_column_radio_3",
        "visit_column_radio_4",
        "visit_column_radio_5",
      ];

      const DATE_COLUMNS = [
        "visit_column_date_1",
        "visit_column_date_2",
        "visit_column_date_3",
        "visit_column_date_4",
        "visit_column_date_5",
      ];

      const TIME_COLUMNS = [
        "visit_column_time_1",
        "visit_column_time_2",
        "visit_column_time_3",
        "visit_column_time_4",
        "visit_column_time_5",
      ];

      const DATETIME_COLUMNS = [
        "visit_column_date_and_time_1",
        "visit_column_date_and_time_2",
        "visit_column_date_and_time_3",
        "visit_column_date_and_time_4",
        "visit_column_date_and_time_5",
      ];
      const ATTECHMENT_COLUMNS = [
        "visit_column_attechments_1",
        "visit_column_attechments_2",
        "visit_column_attechments_3",
        "visit_column_attechments_4",
        "visit_column_attechments_5",
      ];

      const mutableValues = values as Record<string, any>;

      (Object.keys(values) as Array<keyof typeof values>).forEach((key) => {
        const value = values[key];

        if (DATETIME_COLUMNS.includes(String(key))) {
          mutableValues[key] = value
            ? formatDateTimeSendDataBaseV2(String(value))
            : "";
        } else if (DATE_COLUMNS.includes(String(key))) {
          mutableValues[key] = value
            ? formatDateSendDataBaseV2(String(value))
            : "";
        } else if (TIME_COLUMNS.includes(String(key))) {
          mutableValues[key] = value;
        }
      });

      dynamicFields.forEach((field) => {
        if (values[field] !== undefined && values[field] !== null) {
          formData.append(field, values[field].toString());
        }
      });
      ATTECHMENT_COLUMNS.forEach((field) => {
        const file = values[field as keyof IVisitCreate];

        if (file instanceof File) {
          formData.append(field, file);
        }
      });
      setRefreshChat && setRefreshChat(true);
      // for (const pair of formData.entries()) {
      //   console.log("22222222222222222", pair[0], pair[1]);
      // }
      // For edit mode
      if (visitToEdit?.id) {
        formData.append("visit_id", visitToEdit.id.toString());
        await updateVisit(
          formData,
          values,
          setRefreshVisit,
          visitToEdit.id,
          onHide,
          stop_task_id,
        );
      } else {
        await createVisit(formData, values, setRefreshVisit, onHide);
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handelClose = () => {
    onHide();
  };

  useEffect(() => {
    fetchVisitTypeApiForVisit(setVisitTypeList);
  }, [show]);

  const productTypesOptions = visitTypesList.map((item) => ({
    value: item.id,
    label: item.visit_type,
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

  const handleDownload = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = url.split("/").pop() || "file";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  const renderInputField = (
    item: {
      id: number;
      data_type: number;
      display_order: number;
      required_or_not: number;
      data_sorce: string;
      form_type: number;
      required_for: number;
    },
    name: string,
    fieldName: string,
    setFieldValue: any,
    error: FormikErrors<IVisitCreate>,
    touched: FormikTouched<IVisitCreate>,
    values: IVisitCreate,
  ) => {
    const isError =
      error[fieldName as keyof IVisitCreate] &&
      touched[fieldName as keyof IVisitCreate];

    switch (item.data_type) {
      case 1:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <Field
                type="text"
                name={fieldName}
                disabled={createEditFlag === "createView" ? true : false}
                className={`form-control ${
                  isError ? "is-invalid input-box-error" : ""
                }`}
                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
                raw={1}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <Field
                type="text"
                name={fieldName}
                disabled={createEditFlag === "createView" ? true : false}
                className={`form-control font-size-15 rounded-1 ${
                  isError ? "is-invalid input-box-error" : ""
                }`}
                raw={1}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <Field
                as="textarea"
                disabled={createEditFlag === "createView" ? true : false}
                name={fieldName}
                className={`form-control ${
                  isError ? "is-invalid input-box-error" : ""
                }`}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <div>
                <Field name={fieldName}>
                  {({ field, form }: any) => (
                    <DatePicker
                      value={field.value}
                      disabled={createEditFlag === "createView" ? true : false}
                      onChange={(date: DateObject) => {
                        if (date) {
                          form.setFieldValue(
                            fieldName,
                            date.format("DD-MM-YYYY"),
                          );
                        } else {
                          form.setFieldValue(fieldName, "");
                        }
                      }}
                      format="DD-MM-YYYY"
                      placeholder={`Enter ${name}`}
                      inputClass={`form-control font-size-15 rounded-1 ${isError ? "is-invalid input-box-error" : ""}`}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <div>
                <Field name={fieldName}>
                  {({ field, form }: any) => {
                    return (
                      <DatePicker
                        value={field.value}
                        disabled={
                          createEditFlag === "createView" ? true : false
                        }
                        onChange={(date: DateObject | null) => {
                          form.setFieldValue(
                            fieldName,
                            date ? date.format("DD-MM-YYYY hh:mm A") : null,
                          );
                        }}
                        format="DD-MM-YYYY hh:mm A"
                        plugins={[<TimePicker position="right" hideSeconds />]}
                        placeholder={`Enter ${name}`}
                        inputClass={`form-control font-size-15 rounded-1 ${isError ? "is-invalid input-box-error" : ""}`}
                      />
                    );
                  }}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <Field
                type="time"
                name={fieldName}
                disabled={createEditFlag === "createView" ? true : false}
                className={`form-control font-size-15 rounded-1 ${
                  isError ? "is-invalid input-box-error" : ""
                }`}
                raw={1}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
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
                      disabled={createEditFlag === "createView" ? true : false}
                      checked={field.value ?? false}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <Field
                type="text"
                name={fieldName}
                disabled={createEditFlag === "createView" ? true : false}
                className={`form-control ${
                  isError ? "is-invalid input-box-error" : ""
                }`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  let value = e.target.value;
                  if (!/^\d*\.?\d*$/.test(value)) {
                    value = value.replace(/[^0-9.]/g, "");
                  }
                  const decimalCount = (value.match(/\./g) || []).length;
                  if (decimalCount > 1) {
                    value = value.slice(0, -1);
                  }
                  setFieldValue(fieldName, value);
                }}
                raw={1}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <FormikCustomSearchDropdown
                name={fieldName}
                options={dropDownOptions}
                className={` ${isError ? "is-invalid input-box-error" : ""}`}
                disabled={createEditFlag === "createView" ? true : false}
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
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>
              <div className="mt-1">
                <div>
                  {radioOptions &&
                    radioOptions.map((option, index) => (
                      <label key={index} className="p-1">
                        <Field
                          type="radio"
                          name={fieldName}
                          value={option}
                          disabled={
                            createEditFlag === "createView" ? true : false
                          }
                        />
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
      case 13:
        const currentValue = values?.[fieldName];

        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor={fieldName} className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 &&
                  ((visitToEdit &&
                    (item.required_for === 2 || item.required_for === 3)) ||
                    (!visitToEdit &&
                      (item.required_for === 1 ||
                        item.required_for === 3))) && (
                    <span className="text-danger">*</span>
                  )}
              </label>

              <Field name={fieldName}>
                {({ form }: any) => (
                  <>
                    <input
                      type="file"
                      className={`form-control ${
                        isError ? "is-invalid input-box-error" : ""
                      }`}
                      disabled={createEditFlag === "createView"}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0] || null;
                        form.setFieldValue(fieldName, file);
                      }}
                    />

                    {typeof currentValue === "string" &&
                      currentValue.trim() !== "" && (
                        <div className="mt-2">
                          {/\.(jpg|jpeg|png|gif|webp)$/i.test(currentValue) ? (
                            <>
                              <img
                                src={currentValue}
                                alt="attachment"
                                style={{
                                  width: "120px",
                                  height: "120px",
                                  objectFit: "cover",
                                  borderRadius: "5px",
                                  border: "1px solid #ddd",
                                }}
                              />

                              <div className="mt-2 d-flex gap-2">
                                {/* View */}
                                {/* <a
                                  href={currentValue}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-info"
                                >
                                  View
                                </a> */}

                                {/* Download */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleDownload(currentValue)}
                                  style={{ backgroundColor: "#f58634" }}
                                >
                                  Download
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="mt-2">
                              {/* Download for PDF/DOC/XLS etc */}
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleDownload(currentValue)}
                                style={{ backgroundColor: "#f58634" }}
                              >
                                Download
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                  </>
                )}
              </Field>

              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      default:
        return "No More field Add";
    }
  };
  return (
    <React.Fragment>
      {show && (
        <div className="modal1">
          <div className="modal-content1">
            <span className="close" onClick={handelClose}>
              ×
            </span>
            <h2 className="modal-title1 form_header_text">{headerName}</h2>

            <Formik
              enableReinitialize
              initialValues={createProductInitialValues(visitToEdit)}
              validationSchema={createProductValidationSchema(
                customFormList,
                visitToEdit,
              )}
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
                  <div className="mt-3 justify-content-center">
                    <div className="mb-3 py-4">
                      <div className="row mx-0 px-2 gy-3 d-flex">
                        {/* Person Name Field - Display only */}
                        {contactName && createEditFlag === "createEdit" && (
                          <div className="col-12 col-md-6">
                            <div className="form-group">
                              <label
                                htmlFor="person_name"
                                className="mb-1 form_label"
                                style={{
                                  wordBreak: "break-word",
                                  maxWidth: "120px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  padding: "0px",
                                  margin: "0px",
                                }}
                              >
                                Contact Name
                              </label>
                              <input
                                type="text"
                                value={contactName}
                                className="form-control font-size-15 rounded-1"
                                readOnly
                              />
                            </div>
                          </div>
                        )}

                        {createEditFlag === "createView" && (
                          <div className="col-12 col-md-6">
                            <div className="form-group">
                              <label
                                htmlFor="visit_type_id"
                                className="mb-1 form_label"
                              >
                                Visit Types
                                <span className="text-danger">*</span>
                              </label>
                              <FormikCustomSearchDropdown
                                name="visit_type_id"
                                options={productTypesOptions}
                                className={`${
                                  errors.visit_type_id &&
                                  touched.visit_type_id &&
                                  "is-invalid input-box-error"
                                }`}
                                disabled={
                                  createEditFlag === "createView" ? true : false
                                }
                              />
                              <ErrorMessage
                                name="visit_type_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                        )}

                        {createEditFlag === "createView" && (
                          <div className="col-12 col-md-6">
                            <div className="form-group">
                              <label
                                htmlFor="remark"
                                className="pb-2 form_label"
                              >
                                Remark
                                <span className="text-danger">*</span>
                              </label>

                              <Field
                                as="textarea"
                                name="remark"
                                maxLength={TEXTAREA_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.remark &&
                                  touched.remark &&
                                  "is-invalid input-box-error"
                                }`}
                                disabled={true}
                                onInput={(
                                  e: React.FormEvent<HTMLTextAreaElement>,
                                ) => {
                                  const target =
                                    e.target as HTMLTextAreaElement;
                                  target.style.height = "auto";
                                  target.style.height =
                                    target.scrollHeight + "px";
                                }}
                              />

                              <ErrorMessage
                                name="remark"
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
                                Visit Image
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

                        {/* Visit Type Field */}
                        {createEditFlag === "createEdit" && (
                          <div className="col-12 col-md-6">
                            <div className="form-group">
                              <label
                                htmlFor="visit_type_id"
                                className="mb-1 form_label"
                              >
                                Visit Types
                                <span className="text-danger">*</span>
                              </label>
                              {canAddVisitType && (
                                <span
                                  className="ms-2"
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    setIsOpenAddVisitTypeModal(true)
                                  }
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
                                name="visit_type_id"
                                options={productTypesOptions}
                                className={`${
                                  errors.visit_type_id &&
                                  touched.visit_type_id &&
                                  "is-invalid input-box-error"
                                }`}
                              />
                              <ErrorMessage
                                name="visit_type_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                        )}

                        {createEditFlag === "createView"
                          ? ""
                          : visitToEdit && (
                              <div className="col-12 col-md-6">
                                <div className="form-group">
                                  <Field name="visit_image">
                                    {({
                                      field,
                                      form,
                                    }: {
                                      field: { value: any };
                                      form: any;
                                    }) => (
                                      <>
                                        <label
                                          htmlFor="visit_image"
                                          className="mb-1 form_label"
                                        >
                                          Visit Image
                                        </label>
                                        <input
                                          type="file"
                                          id="visit_image"
                                          accept="image/*"
                                          onChange={(event) => {
                                            const file =
                                              event.currentTarget.files?.[0];
                                            if (file) {
                                              form.setFieldValue(
                                                "visit_image",
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
                                    name="visit_image"
                                    component="div"
                                    className="field-error text-danger"
                                  />
                                </div>
                              </div>
                            )}

                        {/* Remark Field */}
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

                              <Field
                                as="textarea"
                                name="remark"
                                maxLength={TEXTAREA_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.remark &&
                                  touched.remark &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(
                                  e: React.FormEvent<HTMLTextAreaElement>,
                                ) => {
                                  const target =
                                    e.target as HTMLTextAreaElement;
                                  target.style.height = "auto";
                                  target.style.height =
                                    target.scrollHeight + "px";
                                }}
                              />

                              <ErrorMessage
                                name="remark"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                        )}

                        {customFormList &&
                          customFormList.map((item) => (
                            <React.Fragment key={item.reference_column_name}>
                              {item.form_type === 3
                                ? renderInputField(
                                    item,
                                    item.title,
                                    item.reference_column_name,
                                    setFieldValue,
                                    errors,
                                    touched,
                                    values,
                                  )
                                : null}
                            </React.Fragment>
                          ))}
                      </div>

                      {createEditFlag === "createView" ? (
                        ""
                      ) : (
                        <div className="col-12 col-12 pt-4 d-flex justify-content-end modal-buttons">
                          <button
                            type="button"
                            className="modal-button1"
                            onClick={handelClose}
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                            style={{ backgroundColor: "#f58634" }}
                            disabled={isSubmitting}
                            onClick={async (e) => {
                              e.preventDefault();

                              const validationErrors =
                                await validateForm(values);
                              if (Object.keys(validationErrors).length !== 0) {
                                toast.error(
                                  "Required Field Is Missing Please Check Form",
                                );
                                Object.keys(validationErrors).forEach(
                                  (field) => {
                                    setFieldTouched(field, true, false);
                                  },
                                );
                              } else {
                                try {
                                  await submitForm();
                                } catch (error) {
                                  console.error(
                                    "Form submission error:",
                                    error,
                                  );
                                }
                              }
                            }}
                          >
                            {isSubmitting ? "Saving..." : "Save Visit"}
                          </button>
                        </div>
                      )}

                      {/* Form Buttons */}
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
            {isOpenAddVisitTypeModal && (
              <AddCategoryModal
                show={isOpenAddVisitTypeModal}
                onHide={() => {
                  setIsOpenAddVisitTypeModal(false);
                  fetchVisitTypeApiForVisit(setVisitTypeList);
                }}
                title="Add Visit Type"
                placeholder="Enter Visit Type"
                btn1="Cancel"
                btn2="Add"
                displayClearButton={true}
                payloadKey="addVisitType"
              />
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CreateVisitView;
