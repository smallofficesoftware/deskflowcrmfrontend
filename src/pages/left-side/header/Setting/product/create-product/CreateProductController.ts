import { toast } from "react-toastify";
import * as Yup from "yup";
import {
  formatDate,
  formatDateAndTime,
} from "../../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../helpers/AppType";
import {
  axiosInstance,
  axiosInstanceFormData,
} from "../../../../../../services/axiosInstance";
import { ICustomFromList } from "../ProductController";

//is_point_value_allow:0 mins not allowd to added point value 1 mins allowd
export const productUnitList = [
  { id: "1", unit: "Piece", is_point_value_allow: 0 },
  { id: "2", unit: "Kg", is_point_value_allow: 1 },
  { id: "3", unit: "Gram", is_point_value_allow: 1 },
  { id: "4", unit: "Liter", is_point_value_allow: 1 },
  { id: "5", unit: "Milliliter", is_point_value_allow: 1 },
  { id: "6", unit: "Meter", is_point_value_allow: 1 },
  { id: "7", unit: "Centimeter", is_point_value_allow: 1 },
  { id: "8", unit: "Box", is_point_value_allow: 0 },
  { id: "9", unit: "Packet", is_point_value_allow: 0 },
  { id: "10", unit: "Dozen", is_point_value_allow: 0 },
  { id: "11", unit: "Set", is_point_value_allow: 0 },
  { id: "12", unit: "Bundle", is_point_value_allow: 0 },
  { id: "13", unit: "Carton", is_point_value_allow: 0 },
  { id: "14", unit: "Ton", is_point_value_allow: 1 },
  { id: "15", unit: "Unit", is_point_value_allow: 0 },
  { id: "16", unit: "Nos", is_point_value_allow: 0 },
  { id: "17", unit: "Second", is_point_value_allow: 1 },
  { id: "18", unit: "Minute", is_point_value_allow: 1 },
  { id: "19", unit: "Month", is_point_value_allow: 0 },
  { id: "20", unit: "Year", is_point_value_allow: 0 },
  { id: "21", unit: "Square meter", is_point_value_allow: 1 },
  { id: "22", unit: "Cubic meter", is_point_value_allow: 1 },
  { id: "23", unit: "Milligram", is_point_value_allow: 1 },
];

export interface IProductCreate {
  product_name: string;
  product_alias: string;
  product_code: string;
  product_description: string;
  created_date_time?: string;
  category_id: string;
  product_group_id: string;
  unit: string;
  unit_id: number | string;
  category_name?: string;
  rate: string;
  net_rate: string;
  GST: string;
  gst_id: number;
  purchase_rate: string;
  purchase_net_rate: string;
  purchase_gst_per: string;
  purchase_gst_id: number;
  weight_or_size: string;
  min_stock_quantity: string;
  product_inner_qty: string;
  product_outer_qty: string;
  product_inner_unit: number | string;
  product_outer_unit: number | string;
  product_length: string;
  product_width: string;
  product_height: string;
  max_stock_quantity: string;
  product_img: string;
  product_types: any;
  hsn_code: string;
  miracle_uom_name?: string;
  is_serial_number: any;
  products_column_number_1?: number | string;
  products_column_number_2?: number | string;
  products_column_number_3?: number | string;
  products_column_number_4?: number | string;
  products_column_number_5?: number | string;
  products_column_text_1?: string;
  products_column_text_2?: string;
  products_column_text_3?: string;
  products_column_text_4?: string;
  products_column_text_5?: string;
  products_column_text_area_1?: string;
  products_column_text_area_2?: string;
  products_column_text_area_3?: string;
  products_column_text_area_4?: string;
  products_column_text_area_5?: string;
  products_column_date_1?: string;
  products_column_date_2?: string;
  products_column_date_3?: string;
  products_column_date_4?: string;
  products_column_date_5?: string;
  products_column_date_and_time_1?: string;
  products_column_date_and_time_2?: string;
  products_column_date_and_time_3?: string;
  products_column_date_and_time_4?: string;
  products_column_date_and_time_5?: string;
  products_column_time_1?: string;
  products_column_time_2?: string;
  products_column_time_3?: string;
  products_column_time_4?: string;
  products_column_time_5?: string;
  products_column_switch_1?: number | boolean;
  products_column_switch_2?: number | boolean;
  products_column_switch_3?: number | boolean;
  products_column_switch_4?: number | boolean;
  products_column_switch_5?: number | boolean;
  products_column_decimal_1?: number | string;
  products_column_decimal_2?: number | string;
  products_column_decimal_3?: number | string;
  products_column_decimal_4?: number | string;
  products_column_decimal_5?: number | string;
  products_column_dropdown_1?: string;
  products_column_dropdown_2?: string;
  products_column_dropdown_3?: string;
  products_column_dropdown_4?: string;
  products_column_dropdown_5?: string;
  products_column_radio_1?: string;
  products_column_radio_2?: string;
  products_column_radio_3?: string;
  products_column_radio_4?: string;
  products_column_radio_5?: string;
}

export const createProductInitialValues = (
  productToEdit: IProductCreate | undefined,
): IProductCreate => ({
  is_serial_number: productToEdit?.is_serial_number || 1,
  product_name: productToEdit?.product_name || "",
  product_alias: productToEdit?.product_alias || "",
  product_code: productToEdit?.product_code || "",
  product_description: productToEdit?.product_description || "",
  category_id: productToEdit?.category_id || "",
  product_group_id: productToEdit?.product_group_id || "",
  unit: productToEdit?.unit || "Nos", // e.g., "Kg"
  unit_id: productToEdit?.unit_id ? Number(productToEdit.unit_id) : 16,
  rate: productToEdit?.rate ?? "0",
  net_rate: productToEdit?.net_rate ?? "0.00",
  GST:
    productToEdit?.GST !== undefined && productToEdit?.GST !== null
      ? String(productToEdit.GST) // ← Important: Convert to string
      : "0",
  gst_id:
    productToEdit?.gst_id !== undefined && productToEdit?.gst_id !== null
      ? productToEdit.gst_id // ← Important: Convert to string
      : 0,
  purchase_rate: productToEdit?.purchase_rate ?? "0",

  purchase_gst_per:
    productToEdit?.purchase_gst_per !== undefined &&
      productToEdit?.purchase_gst_per !== null
      ? String(productToEdit.purchase_gst_per) // ← Important: Convert to string
      : "0",
  purchase_gst_id:
    productToEdit?.purchase_gst_id !== undefined &&
      productToEdit?.purchase_gst_id !== null
      ? Number(productToEdit.purchase_gst_id) // ← Important: Convert to string
      : 0,
  purchase_net_rate: productToEdit?.purchase_net_rate ?? "0.00",
  weight_or_size: productToEdit?.weight_or_size || "",
  min_stock_quantity: productToEdit?.min_stock_quantity || "",
  product_inner_qty: productToEdit?.product_inner_qty || "",
  product_outer_qty: productToEdit?.product_outer_qty || "",
  product_inner_unit: productToEdit?.product_inner_unit
    ? Number(productToEdit.product_inner_unit)
    : "",
  product_outer_unit: productToEdit?.product_outer_unit
    ? Number(productToEdit.product_outer_unit)
    : "",
  product_length: productToEdit?.product_length || "",
  product_width: productToEdit?.product_width || "",
  product_height: productToEdit?.product_height || "",
  max_stock_quantity: productToEdit?.max_stock_quantity || "",
  product_img: productToEdit?.product_img || "",
  product_types: productToEdit?.product_types
    ? Number(productToEdit.product_types)
    : 5,
  hsn_code: productToEdit?.hsn_code || "",
  miracle_uom_name: (productToEdit as any)?.miracle_uom_name || "",
  products_column_number_1: productToEdit?.products_column_number_1 || "",
  products_column_number_2: productToEdit?.products_column_number_2 || "",
  products_column_number_3: productToEdit?.products_column_number_3 || "",
  products_column_number_4: productToEdit?.products_column_number_4 || "",
  products_column_number_5: productToEdit?.products_column_number_5 || "",
  products_column_text_1: productToEdit?.products_column_text_1 || "",
  products_column_text_2: productToEdit?.products_column_text_2 || "",
  products_column_text_3: productToEdit?.products_column_text_3 || "",
  products_column_text_4: productToEdit?.products_column_text_4 || "",
  products_column_text_5: productToEdit?.products_column_text_5 || "",
  products_column_text_area_1: productToEdit?.products_column_text_area_1 || "",
  products_column_text_area_2: productToEdit?.products_column_text_area_2 || "",
  products_column_text_area_3: productToEdit?.products_column_text_area_3 || "",
  products_column_text_area_4: productToEdit?.products_column_text_area_4 || "",
  products_column_text_area_5: productToEdit?.products_column_text_area_5 || "",
  products_column_date_1: productToEdit?.products_column_date_1
    ? formatDate(productToEdit?.products_column_date_1)
    : "",
  products_column_date_2: productToEdit?.products_column_date_2
    ? formatDate(productToEdit?.products_column_date_2)
    : "",
  products_column_date_3: productToEdit?.products_column_date_3
    ? formatDate(productToEdit?.products_column_date_3)
    : "",
  products_column_date_4: productToEdit?.products_column_date_4
    ? formatDate(productToEdit?.products_column_date_4)
    : "",
  products_column_date_5: productToEdit?.products_column_date_5
    ? formatDate(productToEdit?.products_column_date_5)
    : "",
  products_column_date_and_time_1:
    productToEdit?.products_column_date_and_time_1
      ? formatDateAndTime(productToEdit?.products_column_date_and_time_1)
      : "",
  products_column_date_and_time_2:
    productToEdit?.products_column_date_and_time_2
      ? formatDateAndTime(productToEdit?.products_column_date_and_time_2)
      : "",
  products_column_date_and_time_3:
    productToEdit?.products_column_date_and_time_3
      ? formatDateAndTime(productToEdit?.products_column_date_and_time_3)
      : "",
  products_column_date_and_time_4:
    productToEdit?.products_column_date_and_time_4
      ? formatDateAndTime(productToEdit?.products_column_date_and_time_4)
      : "",
  products_column_date_and_time_5:
    productToEdit?.products_column_date_and_time_5
      ? formatDateAndTime(productToEdit?.products_column_date_and_time_5)
      : "",
  products_column_time_1: productToEdit?.products_column_time_1 || "00:00 AM",
  products_column_time_2: productToEdit?.products_column_time_2 || "00:00 AM",
  products_column_time_3: productToEdit?.products_column_time_3 || "00:00 AM",
  products_column_time_4: productToEdit?.products_column_time_4 || "00:00 AM",
  products_column_time_5: productToEdit?.products_column_time_5 || "00:00 AM",
  products_column_switch_1:
    productToEdit?.products_column_switch_1 === 1 ? true : false,
  products_column_switch_2:
    productToEdit?.products_column_switch_2 === 1 ? true : false,
  products_column_switch_3:
    productToEdit?.products_column_switch_3 === 1 ? true : false,
  products_column_switch_4:
    productToEdit?.products_column_switch_4 === 1 ? true : false,
  products_column_switch_5:
    productToEdit?.products_column_switch_5 === 1 ? true : false,
  products_column_decimal_1: productToEdit?.products_column_decimal_1 || "",
  products_column_decimal_2: productToEdit?.products_column_decimal_2 || "",
  products_column_decimal_3: productToEdit?.products_column_decimal_3 || "",
  products_column_decimal_4: productToEdit?.products_column_decimal_4 || "",
  products_column_decimal_5: productToEdit?.products_column_decimal_5 || "",
  products_column_dropdown_1: productToEdit?.products_column_dropdown_1 || "",
  products_column_dropdown_2: productToEdit?.products_column_dropdown_2 || "",
  products_column_dropdown_3: productToEdit?.products_column_dropdown_3 || "",
  products_column_dropdown_4: productToEdit?.products_column_dropdown_4 || "",
  products_column_dropdown_5: productToEdit?.products_column_dropdown_5 || "",
  products_column_radio_1: productToEdit?.products_column_radio_1 || "",
  products_column_radio_2: productToEdit?.products_column_radio_2 || "",
  products_column_radio_3: productToEdit?.products_column_radio_3 || "",
  products_column_radio_4: productToEdit?.products_column_radio_4 || "",
  products_column_radio_5: productToEdit?.products_column_radio_5 || "",
});

export const createProductValidationSchema = (
  customFormList: ICustomFromList[],
) => {
  const dynamicSchema: any = {};

  customFormList.forEach((item: any) => {
    const isProductMaster = !item.applicable_modules || 
      String(item.applicable_modules).split(",").map((m: string) => m.trim()).includes("4");

    if (
      item.required_or_not === 1 &&
      item.form_type === 4 &&
      isProductMaster &&
      item.data_type !== 7
    ) {
      switch (item.data_type) {
        case 1: // Number
          dynamicSchema[item.reference_column_name] = Yup.number()
            .typeError(`${item.title} must be a number`)
            .required(`${item.title} is required`);
          break;
        case 2: // Text
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 3: // Text Area
          dynamicSchema[item.reference_column_name] = Yup.string()
            .trim()
            .required(`${item.title} is required`);
          break;
        case 4: // Date
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 5: // Date and Time
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 6: // Time
          dynamicSchema[item.reference_column_name] = Yup.string()
            .matches(
              /^([01]\d|2[0-3]):([0-5]\d)$/,
              `${item.title} must be a valid time (HH:mm)`,
            )
            .required(`${item.title} is required`);
          break;
        case 7: // Checkbox
          dynamicSchema[item.reference_column_name] =
            Yup.boolean().default(false);
          break;
        case 8: // Decimal
          dynamicSchema[item.reference_column_name] = Yup.number()
            .typeError(`${item.title} must be a valid decimal`)
            .required(`${item.title} is required`);
          break;
        case 9: // Dropdown
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        case 10: // Radio
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`,
          );
          break;
        default:
          console.warn(
            `Unknown data_type: ${item.data_type} for ${item.title}`,
          );
          break;
      }
    }
  });

  return Yup.object().shape({
    product_types: Yup.string().required("Product type is required"),
    category_id: Yup.string().required("Product Category Name is required"),
    product_group_id: Yup.string().required("Product Group Name is required"),
    product_name: Yup.string().trim().required("Product Name is required"),
    unit_id: Yup.string().required("Unit is required"),
    product_inner_unit: Yup.string().when("product_inner_qty", {
      is: (val: any) => {
        const num = Number(val);
        return val !== undefined && val !== "" && !isNaN(num) && num > 0;
      },
      then: (schema) => schema.required("Inner Unit is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    product_outer_unit: Yup.string().when("product_outer_qty", {
      is: (val: any) => {
        const num = Number(val);
        return val !== undefined && val !== "" && !isNaN(num) && num > 0;
      },
      then: (schema) => schema.required("Outer Unit is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    /*     GST: Yup.string()
      .required("GST is required")
      .oneOf(["0", "5", "12", "18", "28", "40"], "Invalid GST rate"), */
    rate: Yup.string().required("Sale Rate is required"),
    /*     purchase_gst_per: Yup.string()
      .required("GST is required")
      .oneOf(["0", "5", "12", "18", "28", "40"], "Invalid GST rate"), */
    purchase_rate: Yup.string().required("Purchase Rate is required"),
    ...dynamicSchema,
  });
};

const logFormData = (formData: FormData) => {
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }
};

const appendCommonFormData = (
  formData: FormData,
  values: IProductCreate,
  getUUID: string,
  productId?: number,
) => {
  if (productId !== undefined) {
    formData.append("product_id", productId.toString());
  }
  if (values.product_img) {
    formData.append("product_img", values.product_img);
  }
  formData.append("product_types", values.product_types || "");
  formData.append("product_name", values.product_name || "");
  formData.append("is_serial_number", values.is_serial_number || "");
  formData.append("miracle_uom_name", values.miracle_uom_name || "");
  formData.append("product_alias", values.product_alias || "");
  formData.append("product_code", values.product_code || "");
  formData.append("product_description", values.product_description || "");
  formData.append("unit", values.unit || "");
  formData.append("unit_id", String(values.unit_id || ""));
  formData.append("category_id", values.category_id || "");
  formData.append("product_group_id", values.product_group_id || "");
  formData.append("rate", values.rate || "");
  formData.append("GST", values.GST || "");
  formData.append("gst_id", String(values.gst_id) || "");
  formData.append("net_rate", values.net_rate || "");
  formData.append("purchase_rate", values.purchase_rate || "");
  formData.append("purchase_gst_per", values.purchase_gst_per || "");
  formData.append("purchase_gst_id", String(values.purchase_gst_id) || "");
  formData.append("purchase_net_rate", values.purchase_net_rate || "");
  formData.append("weight_or_size", values.weight_or_size || "");
  formData.append("min_stock_quantity", values.min_stock_quantity || "");
  formData.append("product_inner_qty", values.product_inner_qty || "1");
  formData.append("product_outer_qty", values.product_outer_qty || "1");
  formData.append(
    "product_inner_unit",
    String(values.product_inner_unit || ""),
  );
  formData.append(
    "product_outer_unit",
    String(values.product_outer_unit || ""),
  );
  formData.append("product_length", values.product_length || "");
  formData.append("product_width", values.product_width || "");
  formData.append("product_height", values.product_height || "");
  formData.append("max_stock_quantity", values.max_stock_quantity || "");
  formData.append("hsn_code", values.hsn_code || "");
  formData.append("a_application_login_id", getUUID);

  // Dynamic fields
  const dynamicFields = [
    "products_column_number_1",
    "products_column_number_2",
    "products_column_number_3",
    "products_column_number_4",
    "products_column_number_5",
    "products_column_text_1",
    "products_column_text_2",
    "products_column_text_3",
    "products_column_text_4",
    "products_column_text_5",
    "products_column_text_area_1",
    "products_column_text_area_2",
    "products_column_text_area_3",
    "products_column_text_area_4",
    "products_column_text_area_5",
    "products_column_date_1",
    "products_column_date_2",
    "products_column_date_3",
    "products_column_date_4",
    "products_column_date_5",
    "products_column_date_and_time_1",
    "products_column_date_and_time_2",
    "products_column_date_and_time_3",
    "products_column_date_and_time_4",
    "products_column_date_and_time_5",
    "products_column_time_1",
    "products_column_time_2",
    "products_column_time_3",
    "products_column_time_4",
    "products_column_time_5",
    "products_column_switch_1",
    "products_column_switch_2",
    "products_column_switch_3",
    "products_column_switch_4",
    "products_column_switch_5",
    "products_column_decimal_1",
    "products_column_decimal_2",
    "products_column_decimal_3",
    "products_column_decimal_4",
    "products_column_decimal_5",
    "products_column_dropdown_1",
    "products_column_dropdown_2",
    "products_column_dropdown_3",
    "products_column_dropdown_4",
    "products_column_dropdown_5",
    "products_column_radio_1",
    "products_column_radio_2",
    "products_column_radio_3",
    "products_column_radio_4",
    "products_column_radio_5",
  ];

  dynamicFields.forEach((field) => {
    const value = values[field as keyof IProductCreate];
    if (value !== undefined && value !== null) {
      if (field.startsWith("products_column_switch_")) {
        formData.append(field, value === true || value === 1 ? "1" : "0");
      } else {
        formData.append(field, String(value));
      }
    } else {
      formData.append(field, "");
    }
  });
  logFormData(formData);
};

export const createProduct = async (
  formData: FormData,
  values: IProductCreate,
  setRefreshProduct: TReactSetState<boolean>,
  onHide: () => void,
): Promise<{ success: boolean; id?: any }> => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    return { success: false };
  }

  const requestFormData = new FormData();
  appendCommonFormData(requestFormData, values, getUUID);

  try {
    const { data } = await axiosInstanceFormData.post(
      "create-product",
      requestFormData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `${token}`,
          "x-tenant-id": getUUID,
        },
      },
    );

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Product created successfully");
      setRefreshProduct(true);
      onHide();
      return {
        success: true,
        id: data.data?.item?.id || data.data || data.inserted_id,
      };
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return { success: false };
    }
  } catch (error: any) {
    console.error("Error in createProduct:", error);
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    return { success: false };
  }
};

export const updateProduct = async (
  formData: FormData,
  values: IProductCreate,
  setRefreshProduct: TReactSetState<boolean>,
  productId: number,
  onHide: () => void,
): Promise<{ success: boolean }> => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    return { success: false };
  }

  const requestFormData = new FormData();
  appendCommonFormData(requestFormData, values, getUUID, productId);

  try {
    const { data } = await axiosInstanceFormData.post(
      "update-product",
      requestFormData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `${token}`,
          "x-tenant-id": getUUID,
        },
      },
    );

    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(data.ack_msg || "Product updated successfully");
      setRefreshProduct(true);
      onHide();
      return { success: true };
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return { success: false };
    }
  } catch (error: any) {
    console.error("Error in updateProduct:", error);
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    return { success: false };
  }
};

export const fetchCategoryApiForProduct = async (
  setCategoryList: TReactSetState<{ id: number; category_name: string }[]>,
  selectedGroupId: any,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    setCategoryList([]);
    return;
  }

  const requestData = {
    table: "categories",
    columns: "id,category_name",
    where: `{"group_id": "${selectedGroupId}","isDelete": 0}`,
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setCategoryList(response.data.data);
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setCategoryList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setCategoryList([]);
  }
};

export const fetchGroupApiForProduct = async (
  setProductGroupsList: TReactSetState<{ id: number; category_name: string }[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    setProductGroupsList([]);
    return;
  }

  const requestData = {
    table: "product_groups",
    columns: "id,group_name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: Number(getUUID),
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setProductGroupsList(response.data.data);
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setProductGroupsList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setProductGroupsList([]);
  }
};

export const fetchProductTypeApiForProduct = async (
  setProductTypeList: TReactSetState<{ id: number; name: string }[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    setProductTypeList([]);
    return;
  }

  const requestData = {
    table: "product_types",
    columns: "id,name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setProductTypeList(response.data.data);
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setProductTypeList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setProductTypeList([]);
  }
};

export const fetchProductUnitData = async (
  isSetProductUnitList: TReactSetState<
    { id: number; unit: string; is_point_value_allow: number }[]
  >,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  const requestData = {
    a_application_login_id: getUUID,
  };

  try {
    const response = await axiosInstance.post("product-unit-get", requestData, {
      headers: {
        Authorization: `${token}`,
        "x-tenant-id": getUUID,
      },
    });

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      isSetProductUnitList(response.data.data);
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      isSetProductUnitList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    isSetProductUnitList([]);
  }
};

export const fetchGSTTaxApi = async (
  setGSTTaxList: TReactSetState<{ id: number; value: string; name: string }[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID || !token) {
    toast.error("Authentication details are missing");
    setGSTTaxList([]);
    return;
  }

  const requestData = {
    table: "tax_masters",
    columns: "id,value,name",
    where: `{"isDelete":"0"}`,
    a_application_login_id: Number(getUUID),
  };

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setGSTTaxList(response.data.data);
    } else {
      toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setGSTTaxList([]);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
    );
    setGSTTaxList([]);
  }
};
