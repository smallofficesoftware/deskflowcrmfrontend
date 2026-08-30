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
} from "../../../common/SharedFunction";
import CustomSearchDropdown from "../../../components/CustomSearchDropdown";
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
  // Multi-product rows — collapse to Formik's category_id/product_id/qty
  // as comma-separated, positionally-paired strings (e.g. "3,7" / "5,12" /
  // "2,1") on every change; matches the DB column contract directly, no
  // new field names needed. Each row remembers the category it was added
  // under (an inquiry can span multiple categories). Initialized from an
  // existing inquiry's already-comma-joined values when editing (see
  // effect below).
  const [productRows, setProductRows] = useState<
    { category_id: string; product_id: string; qty: string; remarks: string }[]
  >([]);
  const [newRowProduct, setNewRowProduct] = useState<IOption | null>(null);
  const [newRowQty, setNewRowQty] = useState("");
  // Per-product remarks are free text (commas / newlines), so unlike
  // category_id/product_id/qty they can't be comma-joined — product_remarks
  // is stored as a JSON array string positionally paired with product_id.
  const [newRowRemarks, setNewRowRemarks] = useState("");
  // productOptions is category-filtered (only the currently-selected
  // category's products), so it can't resolve the label for a row added
  // under a DIFFERENT category once the filter switches — this cache
  // accumulates every product name we've ever seen (from adding a row, or
  // from the edit-load lookup below) so row labels stay correct regardless
  // of which category is currently selected in the filter.
  const [productNameCache, setProductNameCache] = useState<Record<string, string>>({});
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

  // Rebuild the product+qty rows from an existing inquiry's comma-joined
  // product_id/qty whenever the modal opens for a different record —
  // works identically for a legacy single-product value ("5"/"2") or a
  // multi-product one ("5,12,18"/"2,1,3").
  useEffect(() => {
    if (!show) return;
    if (contactData?.product_id) {
      const ids = String(contactData.product_id)
        .split(",")
        .map((id: string) => id.trim())
        .filter(Boolean);
      const qtys = String(contactData.qty || "")
        .split(",")
        .map((q: string) => q.trim());
      const catIds = String(contactData.category_id || "")
        .split(",")
        .map((c: string) => c.trim());
      let remarksArr: string[] = [];
      try {
        const parsed = JSON.parse(String(contactData.product_remarks || "[]"));
        if (Array.isArray(parsed)) remarksArr = parsed.map((r) => String(r ?? ""));
      } catch {
        remarksArr = [];
      }
      setProductRows(
        ids.map((id: string, i: number) => ({
          category_id: catIds[i] || "",
          product_id: id,
          qty: qtys[i] || "",
          remarks: remarksArr[i] || "",
        })),
      );
      // Resolve names for every row's product regardless of category — the
      // category-filtered productOptions can't be relied on here since the
      // rows may span several categories.
      (async () => {
        try {
          const response = await axiosInstance.post("commonGet", {
            table: "products",
            columns: "id,product_name",
            where: ["isDelete=0", `id IN (${ids.join(",")})`],
            request_flag: 0,
          });
          const fetched = response.data?.data || [];
          setProductNameCache((prev) => {
            const next = { ...prev };
            fetched.forEach((p: any) => {
              next[String(p.id)] = p.product_name;
            });
            return next;
          });
        } catch (error) {
          console.error("Error resolving row product names:", error);
        }
      })();
    } else {
      setProductRows([]);
    }
    setNewRowProduct(null);
    setNewRowQty("");
    setNewRowRemarks("");
  }, [contactData?.id, show]);

  const syncProductRowsToFormik = (
    rows: { category_id: string; product_id: string; qty: string; remarks: string }[],
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void,
  ) => {
    setFieldValue("category_id", rows.map((r) => r.category_id).join(","));
    setFieldValue("product_id", rows.map((r) => r.product_id).join(","));
    setFieldValue("qty", rows.map((r) => r.qty).join(","));
    // Free text — JSON array, not comma-joined. "[]" when no rows.
    setFieldValue("product_remarks", JSON.stringify(rows.map((r) => r.remarks || "")));
  };

  const sanitizeQtyInput = (value: string) => {
    let next = value;
    if (!/^\d*\.?\d*$/.test(next)) {
      next = next.replace(/[^0-9.]/g, "");
    }
    const decimalCount = (next.match(/\./g) || []).length;
    if (decimalCount > 1) {
      next = next.slice(0, -1);
    }
    return next;
  };

  const addProductRow = (
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void,
  ) => {
    if (!newRowProduct || !newRowQty) {
      toast.error("Select a product and enter its quantity");
      return;
    }
    if (productRows.some((r) => r.product_id === String(newRowProduct.value))) {
      toast.error("That product is already added");
      return;
    }
    const nextRows = [
      ...productRows,
      {
        category_id: selectedCategoryId ? String(selectedCategoryId) : "",
        product_id: String(newRowProduct.value),
        qty: newRowQty,
        remarks: newRowRemarks.trim(),
      },
    ];
    setProductRows(nextRows);
    syncProductRowsToFormik(nextRows, setFieldValue);
    setProductNameCache((prev) => ({
      ...prev,
      [String(newRowProduct.value)]: newRowProduct.label,
    }));
    setNewRowProduct(null);
    setNewRowQty("");
    setNewRowRemarks("");
  };

  const removeProductRow = (
    index: number,
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void,
  ) => {
    const nextRows = productRows.filter((_, i) => i !== index);
    setProductRows(nextRows);
    syncProductRowsToFormik(nextRows, setFieldValue);
  };

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
      setSelectedCategoryId(selectedOption.value as number);
    } else {
      setFieldValue("category_id", "");
      setSelectedCategoryId(undefined);
      setProductList([]);
    }
    // Category only narrows which products the "+ Add" picker offers below
    // (an inquiry can hold products from several categories) — already-
    // added rows are left untouched on category switch.
    setNewRowProduct(null);
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
                        <div className="col-12">
                          <div className="form-group">
                            <div className="d-flex gap-2 align-items-end flex-wrap mb-2">
                              <div style={{ flex: "1 1 200px" }}>
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
                              <div style={{ flex: "1 1 200px" }}>
                                <label className="pb-2 mb-1 form_label">Products</label>
                                <CustomSearchDropdown
                                  options={productOptions}
                                  value={newRowProduct}
                                  onChange={(opt: IOption | null) => setNewRowProduct(opt)}
                                  placeholder="Select product"
                                  styles={{
                                    control: (base: any) => ({ ...base, minHeight: "45px" }),
                                  }}
                                />
                              </div>
                              <div style={{ maxWidth: "110px" }}>
                                <label className="pb-2 mb-1 form_label">Qty</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  style={{
                                    height: "45px",
                                    marginBottom: 0,
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                    lineHeight: "43px",
                                  }}
                                  placeholder="Qty"
                                  maxLength={MINI_TEXT_LENGTH}
                                  value={newRowQty}
                                  onChange={(e) => setNewRowQty(sanitizeQtyInput(e.target.value))}
                                />
                              </div>
                              <div style={{ flex: "1 1 160px" }}>
                                <label className="pb-2 mb-1 form_label">Remarks</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  style={{
                                    height: "45px",
                                    marginBottom: 0,
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                    lineHeight: "43px",
                                  }}
                                  placeholder="Remarks (optional)"
                                  maxLength={TEXTAREA_TEXT_LENGTH}
                                  value={newRowRemarks}
                                  onChange={(e) => setNewRowRemarks(e.target.value)}
                                />
                              </div>
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                style={{ whiteSpace: "nowrap", height: "45px" }}
                                onClick={() => addProductRow(setFieldValue)}
                              >
                                + Add
                              </button>
                            </div>
                            {productRows.map((row, index) => {
                              const label =
                                productNameCache[row.product_id] ||
                                productOptions.find(
                                  (o: IOption) => String(o.value) === row.product_id,
                                )?.label ||
                                row.product_id;
                              const categoryLabel = categoryOptions.find(
                                (o: IOption) => String(o.value) === row.category_id,
                              )?.label;
                              return (
                                <div
                                  key={`${row.product_id}-${index}`}
                                  className="d-flex justify-content-between align-items-start mb-2 px-3 py-2"
                                  style={{
                                    background: "#f8f9fa",
                                    borderRadius: "8px",
                                    border: "1px solid #e9ecef",
                                  }}
                                >
                                  <div>
                                    <span style={{ fontWeight: 500 }}>{label}</span>
                                    {categoryLabel && (
                                      <span className="badge bg-light text-secondary border ms-2">
                                        {categoryLabel}
                                      </span>
                                    )}
                                    <span className="text-muted ms-2">Qty: {row.qty}</span>
                                    {row.remarks && (
                                      <div
                                        className="text-muted mt-1"
                                        style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}
                                      >
                                        📝 {row.remarks}
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    style={{ cursor: "pointer", fontSize: "1rem" }}
                                    className="text-danger"
                                    title="Remove"
                                    onClick={() => removeProductRow(index, setFieldValue)}
                                  >
                                    🗑
                                  </span>
                                </div>
                              );
                            })}
                            <ErrorMessage
                              name="product_id"
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
