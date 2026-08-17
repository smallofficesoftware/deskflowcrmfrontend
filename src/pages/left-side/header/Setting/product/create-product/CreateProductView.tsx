import {
  ErrorMessage,
  Field,
  FieldProps,
  Form,
  Formik,
  FormikErrors,
  FormikTouched,
  useFormikContext,
} from "formik";
import React, { useEffect, useRef, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import no_image from "../../../../../../assets/images/no_image.jpeg";
import {
  formatDateSendDataBaseV2,
  formatDateTimeSendDataBaseV2,
  getCustomFieldDatavalues,
} from "../../../../../../common/SharedFunction";
import FormikCustomSearchDropdown from "../../../../../../components/FormikCustomSearchDropdown";
import AddCategoryModal from "../../../../../../components/model/AddCategoryModal";
import ImageCropperToolModel from "../../../../../../components/model/ImageCroperToolModel";
import {
  BIG_TEXT_LENGTH,
  SMALL_TEXT_LENGTH,
} from "../../../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../../../helpers/AppEnum";
import { IOption } from "../../../../../../helpers/AppInterface";
import {
  TOnChangeInput,
  TReactSetState,
} from "../../../../../../helpers/AppType";
import useCheckUserPermission from "../../../../../../hooks/useCheckUserPermission";
import useMiracleFlagStore from "../../../../../../store/miracle/useMiracleFlagStore";
import {
  fetchCustomInqFromApiForProduct,
  fetchOrderUnitClassification,
  ICustomFromList,
  IProductCreate,
  IProductView,
  syncMiracleProduct,
} from "../ProductController";
import {
  createProduct,
  createProductInitialValues,
  createProductValidationSchema,
  fetchCategoryApiForProduct,
  fetchGroupApiForProduct,
  fetchGSTTaxApi,
  fetchProductTypeApiForProduct,
  fetchProductUnitData,
  updateProduct,
} from "./CreateProductController";

const UpdateNetRate = () => {
  const { values, setFieldValue, touched } = useFormikContext<any>(); // Access Formik context

  return null; // This component doesn't render anything
};
interface IPropsCreateProduct {
  show: boolean;
  onHide: () => void;
  productToEdit: IProductView | undefined;
  headerName: string;
  setRefreshProduct: TReactSetState<boolean>;
}
interface Option {
  value: string | number;
  label: string;
}
const CreateProductView = ({
  show,
  onHide,
  productToEdit,
  headerName,
  setRefreshProduct,
}: IPropsCreateProduct) => {
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<any>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>();
  const [productGroupsList, setProductGroupsList] = useState<any>([]);
  const [productTypesList, setProductList] = useState<any>([]);
  const [isProductUnitList, isSetProductUnitList] = useState<any>([]);
  const [customFormList, setCustomFormList] = useState<ICustomFromList[]>([]);
  const [dropdownDataMap, setDropdownDataMap] = useState<{
    [key: number]: any[];
  }>({});
  const [isOpenAddCategoryModal, setIsOpenAddCategoryModal] =
    useState<boolean>(false);
  const [isModalImageTool, setIsModalImageTool] = useState<boolean>(false);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const setFieldValueRef = useRef<(field: string, value: any) => void>();
  const isSubmittingRef = useRef(false);
  const canAddCategory = useCheckUserPermission(
    PAGE_ID.CATEGORY,
    PERMISSION_TYPE.ADD,
  );

  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );
  const syncButtonClickedRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [gstTaxList, setGstTaxList] = useState<
    { id: number; value: string; name: string }[]
  >([]);

  const [isInnerFieldsOn, setIsInnerFieldsOn] = useState<boolean>(true);
  const [isOuterFieldsOn, setIsOuterFieldsOn] = useState<boolean>(true);
  const [orderUnitClassification, setOrderUnitClassification] =
    useState<number>(4);
  const innerOutSelection = (value: number) => {
    switch (value) {
      case 1:
        setIsInnerFieldsOn(false);
        setIsOuterFieldsOn(false);
        break;

      case 2:
        setIsInnerFieldsOn(true);
        setIsOuterFieldsOn(false);
        break;

      case 3:
        setIsInnerFieldsOn(false);
        setIsOuterFieldsOn(true);
        break;

      case 4:
        setIsInnerFieldsOn(true);
        setIsOuterFieldsOn(true);
        break;

      default:
        setIsInnerFieldsOn(true);
        setIsOuterFieldsOn(true);
    }
  };

  useEffect(() => {
    fetchCustomInqFromApiForProduct(setCustomFormList);
    fetchOrderUnitClassification(setOrderUnitClassification);
  }, []);

  useEffect(() => {
    const value: number = orderUnitClassification;
    innerOutSelection(value);
  }, [orderUnitClassification]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "Enter" && target.tagName !== "TEXTAREA") {
        // Allow Enter to submit the form if the Save Product button is focused
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.classList.contains("save-product-button")) {
          return; // Let the default behavior (form submission) proceed
        }
        event.preventDefault(); // Prevent default Enter behavior for other elements
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

  const handleViewImageTool = () => {
    setIsModalImageTool(true);
  };

  const handleCroppedImage = (blob: Blob | null, url: string | null) => {
    if (blob && url) {
      setCroppedImageBlob(blob);
      setCroppedImageUrl(url);
      const croppedFile = new File([blob], "cropped-product.jpg", {
        type: "image/jpeg",
      });
      setFieldValueRef.current?.("product_img", croppedFile);
      setProductPreview(url); // Optional: also update preview
    }
    setIsModalImageTool(false);
  };

  const isFieldForProductMaster = (f: any) => {
    if (f.form_type !== 4) return false;
    if (!f.applicable_modules) return true;
    const mods = String(f.applicable_modules).split(",").map((m: string) => m.trim());
    return mods.includes("4");
  };

  const handleSubmit = async (
    values1: any,
    { setSubmitting, setFieldError }: any,
  ) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      setSubmitting(true);

      const requiredCustomFields = customFormList.filter(
        (f) =>
          isFieldForProductMaster(f) && f.required_or_not === 1 && f.data_type !== 7, // skip checkbox/switch
      );

      for (const field of requiredCustomFields) {
        const key = field.reference_column_name;
        const value = values1[key];

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
        if (!isFieldForProductMaster(item)) continue;

        const fieldName = item.reference_column_name;
        const rawValue = values1[fieldName];

        // Skip if empty (required already checked)
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          continue;
        }

        const strValue = String(rawValue).trim();

        // ─── Min / Max character length ────────────────────────────────
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

        // ─── Validation type (pattern/content rules) ───────────────────
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

      const DATE_COLUMNS = [
        "products_column_date_1",
        "products_column_date_2",
        "products_column_date_3",
        "products_column_date_4",
        "products_column_date_5",
      ];

      const TIME_COLUMNS = [
        "products_column_time_1",
        "products_column_time_2",
        "products_column_time_3",
        "products_column_time_4",
        "products_column_time_5",
      ];

      const DATETIME_COLUMNS = [
        "products_column_date_and_time_1",
        "products_column_date_and_time_2",
        "products_column_date_and_time_3",
        "products_column_date_and_time_4",
        "products_column_date_and_time_5",
      ];

      for (const key in values1) {
        const value = values1[key];

        if (DATETIME_COLUMNS.includes(key)) {
          values1[key] = value ? formatDateTimeSendDataBaseV2(value) : "";
        } else if (DATE_COLUMNS.includes(key)) {
          values1[key] = value ? formatDateSendDataBaseV2(value) : "";
        } else if (TIME_COLUMNS.includes(key)) {
          values1[key] = value;
        } else {
          values1[key] = value; // normal field
        }
      }

      if (productToEdit?.id) {
        const res = await updateProduct(
          formData,
          values1,
          setRefreshProduct,
          productToEdit?.id,
          onHide,
        );
        if (res?.success && syncButtonClickedRef.current) {
          await syncMiracleProduct(setIsSyncing, productToEdit.id);
        }
      } else {
        const res = await createProduct(
          formData,
          values1,
          setRefreshProduct,
          onHide,
        );
        if (res?.success && syncButtonClickedRef.current && res.id) {
          await syncMiracleProduct(setIsSyncing, res.id);
        }
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handelClose = () => {
    setProductPreview("");
    onHide();
  };

  const handleFileChange = (
    event: TOnChangeInput,
    fieldName: string,
    setFieldValue: (field: string, value: File | undefined) => void,
    setPreview: (url: string) => void,
  ) => {
    const file = event.currentTarget.files?.[0];

    if (file) {
      // Check if the file size is greater than 1MB
      if (file.size > 1024 * 1024) {
        toast.error("File size must be less than 1MB");
        return;
      }

      // Check if the file type is JPG, JPEG, or PNG
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only JPG, JPEG, and PNG files are allowed");
        return;
      }

      // Set the field value and preview image
      setFieldValue(fieldName, file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleGroupChange = async (
    selectedOption: SingleValue<Option>,
    setFieldValue: (
      field: string,
      value: any,
      shouldValidate?: boolean,
    ) => void,
  ) => {
    if (selectedOption) {
      setFieldValue("product_group_id", selectedOption.value);
      setSelectedGroupId(selectedOption.value as number);
    } else {
      setFieldValue("product_group_id", "");
      setSelectedGroupId(undefined);
      setProductList([]);
    }
  };

  useEffect(() => {
    fetchGroupApiForProduct(setProductGroupsList);
    fetchProductTypeApiForProduct(setProductList);
    fetchProductUnitData(isSetProductUnitList);
    setSelectedGroupId(Number(productToEdit?.product_group_id));
  }, [show]);

  useEffect(() => {
    if (selectedGroupId) {
      const fetchCategory = async () => {
        try {
          await fetchCategoryApiForProduct(setCategoryList, selectedGroupId);
        } catch (error) {
          console.error("Error fetching Category options:", error);
        }
      };
      fetchCategory();
    }
  }, [selectedGroupId]);

  const categoryOptions = categoryList.map((category: any) => ({
    value: category.id,
    label: category.category_name,
  }));
  const productGroupOptions = productGroupsList.map((group: any) => ({
    value: group.id,
    label: group.group_name,
  }));

  const productTypesOptions = productTypesList.map((item: any) => ({
    value: item.id,
    label: item.name,
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
      form_type: number;
    },
    name: string,
    fieldName: string,
    setFieldValue: any,
    error: FormikErrors<IProductCreate>,
    touched: FormikTouched<IProductCreate>,
  ) => {
    const isError =
      error[fieldName as keyof IProductCreate] &&
      touched[fieldName as keyof IProductCreate];

    switch (item.data_type) {
      case 1:
        return (
          <div className="col-6">
            <div className="form-group">
              <label htmlFor="name" className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
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
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
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
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                as="textarea"
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
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div>
                <Field name={fieldName}>
                  {({ field, form }: any) => (
                    <DatePicker
                      value={field.value}
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
                      inputClass={`form-control font-size-15 rounded-1 ${
                        isError ? "is-invalid input-box-error" : ""
                      }`}
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
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div>
                <Field name={fieldName}>
                  {({ field, form }: any) => {
                    return (
                      <DatePicker
                        value={field.value}
                        onChange={(date: DateObject | null) => {
                          form.setFieldValue(
                            fieldName,
                            date ? date.format("DD-MM-YYYY hh:mm A") : null,
                          );
                        }}
                        format="DD-MM-YYYY hh:mm A"
                        plugins={[<TimePicker position="right" hideSeconds />]}
                        placeholder={`Enter ${name}`}
                        inputClass={`form-control font-size-15 rounded-1 ${
                          isError ? "is-invalid input-box-error" : ""
                        }`}
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
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="time"
                name={fieldName}
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
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
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
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <FormikCustomSearchDropdown
                name={fieldName}
                options={dropDownOptions}
                className={` ${isError ? "is-invalid input-box-error" : ""}`}
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
        return "No More field Add";
    }
  };

  const productUnitOptions = isProductUnitList.map((item: any) => ({
    value: Number(item.id), // "1", "2", etc. (string)
    label: item.unit,
  }));
  useEffect(() => {
    fetchGSTTaxApi(setGstTaxList);
  }, [show]);

  const gstTypeOptions = gstTaxList.map((item) => ({
    value: Number(item.id),
    label: String(item.name),
  }));

  const purchaseGstTypeOptions = gstTaxList.map((item) => ({
    value: Number(item.id),
    label: String(item.name),
  }));

  return (
    <React.Fragment>
      {show && (
        <div className="modal1 ">
          <div className="modal-content1" style={{ width: "65%" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="col-8">
                <h2 className="modal-title1 form_header_text">{headerName}</h2>
              </div>
              <div className="col-4">
                <span
                  className="close ms-3 pb-3"
                  onClick={handelClose}
                  style={{ cursor: "pointer" }}
                >
                  ×
                </span>
              </div>
            </div>

            <Formik
              enableReinitialize
              initialValues={createProductInitialValues(productToEdit)}
              validationSchema={createProductValidationSchema(customFormList)}
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
              }) => {
                console.log("valuesvaluesvaluesvalues", values);

                setFieldValueRef.current = setFieldValue;
                return (
                  <Form>
                    <div className="  mt-3    d-flex justify-content-center">
                      <div className="mb-3 py-4  ">
                        <div className="row  mx-0 px-2 gy-3  d-flex ">
                          <div className="col-6 ">
                            <div className="form-group">
                              <label
                                htmlFor="product_types"
                                className="mb-1 form_label"
                              >
                                Product Types
                                <span className="text-danger">*</span>
                              </label>
                              <FormikCustomSearchDropdown
                                name="product_types"
                                options={productTypesOptions}
                                className={`  ${
                                  errors.product_types &&
                                  touched.product_types &&
                                  "is-invalid input-box-error"
                                }`}
                              />
                              <ErrorMessage
                                name="product_types"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-6">
                            <div className="form-group">
                              <label
                                htmlFor="product_group_id"
                                className="mb-1 form_label"
                              >
                                Product Group
                                <span className="text-danger">*</span>
                              </label>
                              <FormikCustomSearchDropdown
                                name="product_group_id"
                                options={productGroupOptions}
                                className={`${
                                  errors.product_group_id &&
                                  touched.product_group_id &&
                                  "is-invalid input-box-error"
                                }`}
                                onChange={handleGroupChange}
                              />
                              <ErrorMessage
                                name="product_group_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="category_id_b2b"
                                className="mb-1 form_label"
                              >
                                Product Category
                                <span className="text-danger">*</span>
                                {values.product_group_id && canAddCategory && (
                                  <span
                                    className="ms-2"
                                    style={{ cursor: "pointer" }}
                                    onClick={() =>
                                      setIsOpenAddCategoryModal(true)
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
                              </label>
                              <FormikCustomSearchDropdown
                                name="category_id"
                                options={categoryOptions}
                                className={`  ${
                                  errors.category_id &&
                                  touched.category_id &&
                                  "is-invalid input-box-error"
                                }`}
                              />
                              <ErrorMessage
                                name="category_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="product_name"
                                className="mb-1 form_label"
                              >
                                Product Name
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="product_name"
                                maxLength={BIG_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.product_name &&
                                  touched.product_name &&
                                  "is-invalid input-box-error"
                                }`}
                              />
                              <ErrorMessage
                                name="product_name"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="product_alias"
                                className="mb-1 form_label"
                              >
                                Product Alias
                              </label>
                              <Field
                                type="text"
                                name="product_alias"
                                maxLength={BIG_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 `}
                              />
                              <ErrorMessage
                                name="product_alias"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          {isInnerFieldsOn && (
                            <div className="col-12 col-md-3">
                              <div className="form-group">
                                <label
                                  htmlFor="product_inner_qty"
                                  className="pb-2 form_label"
                                >
                                  Product Inner Qty.
                                </label>
                                <Field
                                  type="text"
                                  name="product_inner_qty"
                                  maxLength={SMALL_TEXT_LENGTH}
                                  className={`form-control font-size-15 rounded-1 ${
                                    errors.product_inner_qty &&
                                    touched.product_inner_qty &&
                                    "is-invalid input-box-error"
                                  }`}
                                  onInput={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) => {
                                    e.target.value = e.target.value.replace(
                                      /[^0-9.]/g,
                                      "",
                                    );
                                    if (
                                      (e.target.value.match(/\./g) || [])
                                        .length > 1
                                    ) {
                                      e.target.value = e.target.value.slice(
                                        0,
                                        -1,
                                      );
                                    }
                                  }}
                                />
                                <ErrorMessage
                                  name="product_inner_qty"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>
                          )}
                          {isInnerFieldsOn && (
                            <div className="col-12 col-md-3">
                              <div className="form-group">
                                <label className="pb-2 form_label">
                                  Product Inner Unit
                                  {values.product_inner_qty &&
                                    Number(values.product_inner_qty) > 0 && (
                                      <span className="text-danger"> *</span>
                                    )}
                                </label>

                                <Field name="product_inner_unit">
                                  {({ field, form }: FieldProps) => {
                                    const selectedOption =
                                      productUnitOptions.find(
                                        (option: any) =>
                                          String(option.value) ===
                                          String(field.value),
                                      );

                                    return (
                                      <FormikCustomSearchDropdown
                                        name="product_inner_unit"
                                        options={productUnitOptions}
                                        value={selectedOption || null}
                                        onChange={(
                                          selectedOption: Option | null,
                                        ) => {
                                          form.setFieldValue(
                                            "product_inner_unit",
                                            selectedOption?.value ?? "",
                                          );
                                          form.setFieldValue(
                                            "unit",
                                            selectedOption?.label ?? "",
                                          );
                                          form.setFieldTouched(
                                            "product_inner_unit",
                                            true,
                                            false,
                                          );
                                        }}
                                        className={
                                          form.errors.product_inner_unit &&
                                          form.touched.product_inner_unit
                                            ? "is-invalid input-box-error"
                                            : ""
                                        }
                                        // placeholder="Select Unit"
                                      />
                                    );
                                  }}
                                </Field>

                                <ErrorMessage
                                  name="product_inner_unit"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>
                          )}
                          {isOuterFieldsOn && (
                            <div className="col-12 col-md-3">
                              <div className="form-group">
                                <label
                                  htmlFor="product_outer_qty"
                                  className="pb-2 form_label"
                                >
                                  Product Outer Qty.
                                </label>
                                <Field
                                  type="text"
                                  name="product_outer_qty"
                                  maxLength={SMALL_TEXT_LENGTH}
                                  className={`form-control font-size-15 rounded-1 ${
                                    errors.product_outer_qty &&
                                    touched.product_outer_qty &&
                                    "is-invalid input-box-error"
                                  }`}
                                  onInput={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) => {
                                    e.target.value = e.target.value.replace(
                                      /[^0-9.]/g,
                                      "",
                                    );
                                    if (
                                      (e.target.value.match(/\./g) || [])
                                        .length > 1
                                    ) {
                                      e.target.value = e.target.value.slice(
                                        0,
                                        -1,
                                      );
                                    }
                                  }}
                                />
                                <ErrorMessage
                                  name="product_outer_qty"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>
                          )}
                          {isOuterFieldsOn && (
                            <div className="col-12 col-md-3">
                              <div className="form-group">
                                <label className="pb-2 form_label">
                                  Product Outer Unit
                                  {values.product_outer_qty &&
                                    Number(values.product_outer_qty) > 0 && (
                                      <span className="text-danger"> *</span>
                                    )}
                                </label>

                                <Field name="product_outer_unit">
                                  {({ field, form }: FieldProps) => {
                                    const selectedOption =
                                      productUnitOptions.find(
                                        (option: any) =>
                                          String(option.value) ===
                                          String(field.value),
                                      );

                                    return (
                                      <FormikCustomSearchDropdown
                                        name="product_outer_unit"
                                        options={productUnitOptions}
                                        value={selectedOption || null}
                                        onChange={(
                                          selectedOption: Option | null,
                                        ) => {
                                          form.setFieldValue(
                                            "product_outer_unit",
                                            selectedOption?.value ?? "",
                                          );
                                          form.setFieldValue(
                                            "unit",
                                            selectedOption?.label ?? "",
                                          );
                                          form.setFieldTouched(
                                            "product_outer_unit",
                                            true,
                                            false,
                                          );
                                        }}
                                        className={
                                          form.errors.product_outer_unit &&
                                          form.touched.product_outer_unit
                                            ? "is-invalid input-box-error"
                                            : ""
                                        }
                                        // placeholder="Select Unit"
                                      />
                                    );
                                  }}
                                </Field>

                                <ErrorMessage
                                  name="product_outer_unit"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>
                          )}
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="product_length"
                                className="pb-2 form_label"
                              >
                                Length (L)
                              </label>
                              <Field
                                type="text"
                                name="product_length"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.product_length &&
                                  touched.product_length &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(e: { target: { value: string } }) => {
                                  e.target.value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  ); // Allow only numbers and dots
                                  if (
                                    (e.target.value.match(/\./g) || []).length >
                                    1
                                  ) {
                                    e.target.value = e.target.value.slice(
                                      0,
                                      -1,
                                    ); // Remove extra dots
                                  }
                                }}
                              />
                              <ErrorMessage
                                name="product_length"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="product_width"
                                className="pb-2 form_label"
                              >
                                Width (W)
                              </label>
                              <Field
                                type="text"
                                name="product_width"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.product_width &&
                                  touched.product_width &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(e: { target: { value: string } }) => {
                                  e.target.value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  ); // Allow only numbers and dots
                                  if (
                                    (e.target.value.match(/\./g) || []).length >
                                    1
                                  ) {
                                    e.target.value = e.target.value.slice(
                                      0,
                                      -1,
                                    ); // Remove extra dots
                                  }
                                }}
                              />
                              <ErrorMessage
                                name="product_width"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="product_height"
                                className="pb-2 form_label"
                              >
                                Height (H)
                              </label>
                              <Field
                                type="text"
                                name="product_height"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.product_height &&
                                  touched.product_height &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(e: { target: { value: string } }) => {
                                  e.target.value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  ); // Allow only numbers and dots
                                  if (
                                    (e.target.value.match(/\./g) || []).length >
                                    1
                                  ) {
                                    e.target.value = e.target.value.slice(
                                      0,
                                      -1,
                                    ); // Remove extra dots
                                  }
                                }}
                              />
                              <ErrorMessage
                                name="product_height"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="product_code"
                                className="mb-1 form_label"
                              >
                                Product Code
                              </label>
                              <Field
                                type="text"
                                name="product_code"
                                maxLength={BIG_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1`}
                              />
                              <ErrorMessage
                                name="product_code"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="hsn_code"
                                className="pb-2 form_label"
                              >
                                HSN Code
                              </label>
                              <Field
                                type="text"
                                name="hsn_code"
                                maxLength={SMALL_TEXT_LENGTH}
                                className="form-control font-size-15 rounded-1"
                              />
                              <ErrorMessage
                                name="hsn_code"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                Sales Unit
                                <span className="text-danger">*</span>
                              </label>

                              <Field name="unit_id">
                                {({ field, form }: FieldProps) => {
                                  const selectedOption =
                                    productUnitOptions.find(
                                      (option: any) =>
                                        String(option.value) ===
                                        String(field.value),
                                    );

                                  return (
                                    <FormikCustomSearchDropdown
                                      name="unit_id"
                                      options={productUnitOptions}
                                      value={selectedOption || null}
                                      onChange={(
                                        selectedOption: Option | null,
                                      ) => {
                                        form.setFieldValue(
                                          "unit_id",
                                          selectedOption?.value ?? "",
                                        );
                                        form.setFieldValue(
                                          "unit",
                                          selectedOption?.label ?? "",
                                        );
                                        form.setFieldTouched(
                                          "unit_id",
                                          true,
                                          false,
                                        );
                                      }}
                                      className={
                                        form.errors.unit_id &&
                                        form.touched.unit_id
                                          ? "is-invalid input-box-error"
                                          : ""
                                      }
                                      // placeholder="Select Unit"
                                    />
                                  );
                                }}
                              </Field>

                              <ErrorMessage
                                name="unit_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          {(isFeatureEnabled || Boolean((productToEdit as any)?.miracle_uom_name)) && (
                            <div className="col-12 col-md-4">
                              <div className="form-group">
                                <label
                                  htmlFor="miracle_uom_name"
                                  className="pb-2 form_label"
                                >
                                  Miracle UOM Name
                                </label>
                                <Field
                                  type="text"
                                  name="miracle_uom_name"
                                  id="miracle_uom_name"
                                  placeholder="e.g. U1, NOS, PCS"
                                  className="form-control font-size-15 rounded-1"
                                />
                              </div>
                            </div>
                          )}

                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="weight_or_size"
                                className="pb-2 form_label"
                              >
                                Weight(Gram)
                              </label>
                              <Field
                                type="text"
                                name="weight_or_size"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.weight_or_size &&
                                  touched.weight_or_size &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(e: { target: { value: string } }) => {
                                  e.target.value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  ); // Allow only numbers and dots
                                  if (
                                    (e.target.value.match(/\./g) || []).length >
                                    1
                                  ) {
                                    e.target.value = e.target.value.slice(
                                      0,
                                      -1,
                                    ); // Remove extra dots
                                  }
                                }}
                              />
                              <ErrorMessage
                                name="weight_or_size"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="min_stock_quantity"
                                className="pb-2 form_label"
                              >
                                Min Stock Quantity
                              </label>
                              <Field
                                type="text"
                                name="min_stock_quantity"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.min_stock_quantity &&
                                  touched.min_stock_quantity &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  e.target.value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  );
                                  if (
                                    (e.target.value.match(/\./g) || []).length >
                                    1
                                  ) {
                                    e.target.value = e.target.value.slice(
                                      0,
                                      -1,
                                    );
                                  }
                                }}
                              />
                              <ErrorMessage
                                name="min_stock_quantity"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="max_stock_quantity"
                                className="pb-2 form_label"
                              >
                                Max Stock Quantity
                              </label>
                              <Field
                                type="text"
                                name="max_stock_quantity"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1 ${
                                  errors.max_stock_quantity &&
                                  touched.max_stock_quantity &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  e.target.value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  );
                                  if (
                                    (e.target.value.match(/\./g) || []).length >
                                    1
                                  ) {
                                    e.target.value = e.target.value.slice(
                                      0,
                                      -1,
                                    );
                                  }
                                }}
                              />
                              <ErrorMessage
                                name="max_stock_quantity"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <hr />
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label htmlFor="rate" className="pb-2 form_label">
                                Sale Rate
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="rate"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.rate &&
                                  touched.rate &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(e: { target: { value: string } }) => {
                                  let value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  ); // Allow only numbers and dots
                                  if ((value.match(/\./g) || []).length > 1) {
                                    value = value.slice(0, -1); // Remove extra dots
                                  }
                                  e.target.value = value;
                                  const rate = parseFloat(value) || 0;
                                  const GST = parseFloat(values.GST) || 0;
                                  const netRate = rate * (1 + GST / 100);
                                  setFieldValue("rate", value);
                                  setFieldValue("net_rate", netRate.toFixed(2)); // Update net_rate immediately
                                }}
                              />
                              <div style={{ fontSize: "10px", color: "red" }}>
                                <b>*Before GST Rate</b>
                              </div>
                              <ErrorMessage
                                name="rate"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label className="pb-2 form_label">
                                GST (%)
                                <span className="text-danger">*</span>
                              </label>

                              <FormikCustomSearchDropdown
                                name="gst_id"
                                options={gstTypeOptions}
                                value={gstTypeOptions.find(
                                  (item) =>
                                    Number(item.value) == Number(values.gst_id),
                                )}
                                className={
                                  errors.gst_id && touched.gst_id
                                    ? "is-invalid"
                                    : ""
                                }
                                onChange={(selected: SingleValue<IOption>) => {
                                  // console.log("GST VALUE", values.GST);
                                  // console.log("SELECTED", selectedGSTOption);

                                  // const gstValue = selected?.label || "0";
                                  const gstValue =
                                    gstTaxList.find(
                                      (item) => item.id == selected?.value,
                                    )?.value || "0";

                                  const GST = Number(gstValue) || 0;
                                  const rate = Number(values.rate) || 0;

                                  const netRate = rate + (rate * GST) / 100;

                                  // STORE LABEL
                                  // setFieldValue("GST", selected?.value || "0");
                                  setFieldValue("GST", gstValue || "0");
                                  setFieldValue(
                                    "gst_id",
                                    selected?.value || "0",
                                  );

                                  // UPDATE NET RATE
                                  setFieldValue("net_rate", netRate.toFixed(2));
                                }}
                              />

                              <ErrorMessage
                                name="GST"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="net_rate"
                                className="pb-2 form_label"
                              >
                                Sale Net Rate
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="net_rate"
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.net_rate &&
                                  touched.net_rate &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(e: { target: { value: string } }) => {
                                  let value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  );
                                  if ((value.match(/\./g) || []).length > 1) {
                                    value = value.slice(0, -1);
                                  }
                                  e.target.value = value;
                                  const netRate = parseFloat(value) || 0;
                                  const GST = parseFloat(values.GST) || 0;
                                  const calculatedRate =
                                    netRate / (1 + GST / 100);
                                  setFieldValue("net_rate", value);
                                  setFieldValue(
                                    "rate",
                                    calculatedRate.toFixed(2),
                                  );
                                }}
                              />
                              <div style={{ fontSize: "10px", color: "red" }}>
                                <b>*After GST Rate</b>
                              </div>
                              <ErrorMessage
                                name="net_rate"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <hr />
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="purchase_rate"
                                className="pb-2 form_label"
                              >
                                Purchase Rate
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="purchase_rate"
                                maxLength={SMALL_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.purchase_rate &&
                                  touched.purchase_rate &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(e: { target: { value: string } }) => {
                                  let value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  ); // Allow only numbers and dots
                                  if ((value.match(/\./g) || []).length > 1) {
                                    value = value.slice(0, -1); // Remove extra dots
                                  }
                                  e.target.value = value;
                                  const purchase_rate = parseFloat(value) || 0;
                                  const purchase_gst_per =
                                    parseFloat(values.purchase_gst_per) || 0;
                                  const purchase_net_rate =
                                    purchase_rate *
                                    (1 + purchase_gst_per / 100);
                                  setFieldValue("purchase_rate", value);
                                  setFieldValue(
                                    "purchase_net_rate",
                                    purchase_net_rate.toFixed(2),
                                  ); // Update net_rate immediately
                                }}
                              />
                              <div style={{ fontSize: "10px", color: "red" }}>
                                <b>*Before GST Rate</b>
                              </div>
                              <ErrorMessage
                                name="purchase_rate"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="purchase_gst_per"
                                className="pb-2 form_label"
                              >
                                GST (%)
                                <span className="text-danger">*</span>
                              </label>

                              <FormikCustomSearchDropdown
                                name="purchase_gst_id"
                                options={purchaseGstTypeOptions}
                                value={purchaseGstTypeOptions.find(
                                  (item) =>
                                    item.value ===
                                    Number(values.purchase_gst_id),
                                )}
                                className={
                                  errors.purchase_gst_id &&
                                  touched.purchase_gst_id
                                    ? "is-invalid"
                                    : ""
                                }
                                onChange={(selected: SingleValue<IOption>) => {
                                  // const gstValue = selected?.value || "0";
                                  const gstValue =
                                    gstTaxList.find(
                                      (item) => item.id == selected?.value,
                                    )?.value || "0";

                                  const purchaseGST = Number(gstValue) || 0;

                                  const purchaseRate =
                                    Number(values.purchase_rate) || 0;

                                  const purchaseNetRate =
                                    purchaseRate +
                                    (purchaseRate * purchaseGST) / 100;

                                  // STORE GST
                                  // setFieldValue("purchase_gst_per", gstValue);

                                  setFieldValue(
                                    "purchase_gst_per",
                                    gstValue || "0",
                                  );
                                  setFieldValue(
                                    "purchase_gst_id",
                                    selected?.value || "0",
                                  );

                                  // AUTO CALCULATE NET RATE
                                  setFieldValue(
                                    "purchase_net_rate",
                                    purchaseNetRate.toFixed(2),
                                  );
                                }}
                              />
                              <ErrorMessage
                                name="purchase_gst_id"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="form-group">
                              <label
                                htmlFor="purchase_net_rate"
                                className="pb-2 form_label"
                              >
                                Purchase Net Rate
                                <span className="text-danger">*</span>
                              </label>
                              <Field
                                type="text"
                                name="purchase_net_rate"
                                className={`form-control font-size-15 rounded-1   ${
                                  errors.purchase_net_rate &&
                                  touched.purchase_net_rate &&
                                  "is-invalid input-box-error"
                                }`}
                                onInput={(e: { target: { value: string } }) => {
                                  let value = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  );
                                  if ((value.match(/\./g) || []).length > 1) {
                                    value = value.slice(0, -1);
                                  }
                                  e.target.value = value;
                                  const purchase_net_rate =
                                    parseFloat(value) || 0;
                                  const purchase_gst_per =
                                    parseFloat(values.purchase_gst_per) || 0;
                                  const calculatedRate =
                                    purchase_net_rate /
                                    (1 + purchase_gst_per / 100);
                                  setFieldValue("purchase_net_rate", value);
                                  setFieldValue(
                                    "purchase_rate",
                                    calculatedRate.toFixed(2),
                                  );
                                }}
                              />
                              <div style={{ fontSize: "10px", color: "red" }}>
                                <b>*After GST Rate</b>
                              </div>
                              <ErrorMessage
                                name="purchase_net_rate"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div className="col-12">
                            <hr />
                          </div>
                          <div className="col-12 col-md-12">
                            <div className="add-source-of-type-section">
                              <p>
                                Product Image
                                <small className="text-danger ps-2">
                                  Best Size(521 X 419px)
                                </small>
                              </p>
                            </div>
                            <div className="imgBox-product">
                              <label htmlFor="input-files-product">
                                {croppedImageUrl ? (
                                  <img
                                    onClick={handleViewImageTool}
                                    src={croppedImageUrl}
                                    alt=""
                                    className="imgBox-product-cover animate__animated animate__fadeIn"
                                  />
                                ) : productPreview ? (
                                  <img
                                    onClick={handleViewImageTool}
                                    src={productPreview}
                                    alt=""
                                    className="imgBox-product-cover animate__animated animate__fadeIn"
                                  />
                                ) : values.product_img ? (
                                  <img
                                    onClick={handleViewImageTool}
                                    src={values.product_img}
                                    alt=""
                                    className="imgBox-product-cover animate__animated animate__fadeIn"
                                  />
                                ) : (
                                  <img
                                    onClick={handleViewImageTool}
                                    src={no_image}
                                    alt=""
                                    className="imgBox-product-cover animate__animated animate__fadeIn"
                                  />
                                )}

                                {/* <div>
                                  <div className="form-group1">
                                    <input
                                      type="file"
                                      name="image"
                                      id="input-files-product"
                                      className="form-control-file border"
                                      onChange={(event) =>
                                        handleFileChange(
                                          event,
                                          "product_img",
                                          setFieldValue,
                                          setProductPreview
                                        )
                                      }
                                      style={{ display: "none" }}
                                      accept=".png,.jpg,.jpeg"
                                    />
                                  </div>
                                </div> */}
                              </label>
                            </div>
                          </div>
                          <div className="col-12 col-md-12">
                            <div className="form-group">
                              <label
                                htmlFor="product_description"
                                className="mb-1 form_label"
                              >
                                Product Description
                              </label>
                              <Field
                                as="textarea"
                                name="product_description"
                                // maxLength={TEXTAREA_TEXT_LENGTH}
                                className={`form-control font-size-15 rounded-1`}
                                onInput={(
                                  e: React.FormEvent<HTMLTextAreaElement>,
                                ) => {
                                  const target =
                                    e.target as HTMLTextAreaElement;
                                  target.style.height = "auto";
                                  target.style.height =
                                    target.scrollHeight + "px";
                                }}
                                onKeyDown={(
                                  e: React.KeyboardEvent<HTMLTextAreaElement>,
                                ) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.stopPropagation();
                                  }
                                }}
                              />

                              <ErrorMessage
                                name="product_description"
                                component="div"
                                className="field-error text-danger"
                              />
                            </div>
                          </div>
                          <div
                            className="form-check form-switch"
                            style={{ marginTop: "1.8%" }}
                          >
                            <label htmlFor="is_serial_number">
                              Allow Serial Number
                            </label>
                            <Field
                              type="checkbox"
                              name="is_serial_number"
                              className="form-check-input"
                              checked={values.is_serial_number === 2}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                              ) => {
                                setFieldValue(
                                  "is_serial_number",
                                  e.target.checked ? 2 : 1,
                                );
                              }}
                            />
                          </div>
                          <div className="col-12">
                            <hr />
                          </div>
                          {customFormList &&
                            customFormList.map((item) => (
                              <React.Fragment key={item.reference_column_name}>
                                {isFieldForProductMaster(item)
                                  ? renderInputField(
                                      item,
                                      item.title,
                                      item.reference_column_name,
                                      setFieldValue,
                                      errors,
                                      touched,
                                    )
                                  : null}
                              </React.Fragment>
                            ))}
                        </div>

                        <div className="col-12 col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                          <button
                            type="button"
                            className="modal-button1"
                            onClick={handelClose}
                          >
                            Close
                          </button>

                          {isFeatureEnabled && (
                            <button
                              type="button"
                              disabled={isSubmitting || isSyncing}
                              onClick={async (e) => {
                                e.preventDefault();
                                syncButtonClickedRef.current = true;
                                const validationErrors =
                                  await validateForm(values);
                                if (
                                  Object.keys(validationErrors).length !== 0
                                ) {
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
                              className="btn px-4 py-2 ms-2 text-light form_label rounded-1"
                              style={{
                                backgroundColor: "#2b388f",
                                borderColor: "#2b388f",
                              }}
                            >
                              {isSubmitting && syncButtonClickedRef.current
                                ? "Saving & Syncing..."
                                : "Save & Sync Miracle"}
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1 save-product-button"
                            style={{ backgroundColor: "#f58634" }}
                            disabled={isSubmitting || isSyncing}
                            onClick={async (e) => {
                              e.preventDefault();
                              syncButtonClickedRef.current = false;
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
                            {isSubmitting && !syncButtonClickedRef.current
                              ? productToEdit
                                ? "Saving..."
                                : "Creating..."
                              : productToEdit
                                ? "Save"
                                : "Create Product"}
                          </button>
                        </div>
                      </div>
                    </div>
                    {isOpenAddCategoryModal && (
                      <AddCategoryModal
                        show={isOpenAddCategoryModal}
                        onHide={() => {
                          setIsOpenAddCategoryModal(false);
                          fetchCategoryApiForProduct(
                            setCategoryList,
                            selectedGroupId,
                          );
                        }}
                        title="Add Product Category"
                        placeholder="Enter Product Category"
                        btn1="Cancel"
                        btn2="Add"
                        displayClearButton={true}
                        payloadKey="addProductCategory"
                        group_id={selectedGroupId}
                      />
                    )}
                    {isModalImageTool && (
                      <ImageCropperToolModel
                        show={isModalImageTool}
                        onHide={() => setIsModalImageTool(false)}
                        onSubmit={handleCroppedImage}
                        initialImage={
                          croppedImageUrl ||
                          productPreview ||
                          values.product_img ||
                          ""
                        }
                        width={521 * 2}
                        height={419 * 2}
                        title="Crop Your Product Image"
                      />
                    )}
                    <UpdateNetRate />
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CreateProductView;
