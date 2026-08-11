import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import {
  axiosInstance,
  axiosInstanceFormData,
} from "../../../../../services/axiosInstance";

export interface IProductView {
  product_name: string;
  product_alias: string;
  product_code: string;
  product_description: string;
  id: number;
  created_date_time?: string;
  product_group_id: string;
  category_id: string;
  group_id: string;
  unit: string;
  group_name: string;
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
  product_img: string;
  weight_or_size: string;
  min_stock_quantity: string;
  product_inner_qty: string;
  product_outer_qty: string;
  product_inner_unit: string;
  product_outer_unit: string;
  product_length: string;
  product_width: string;
  product_height: string;
  max_stock_quantity: string;
  product_types: string;
  hsn_code: string;
  product_barcode_number: string;
  miracle_uom_name?: string;
  is_serial_number: any;
}

export interface IProductStockMovement {
  id: number;
  cart_date: string;
  cart_type: number;
  item_qty: number;
  cart_number: string;
  item_total: number;
  closing_qty: number;
  item_unit_name: string;
  item_outer_quantity: number;
  item_inner_quantity: number;
  outer_qty_unit: string;
  inner_qty_unit: string;
  to_customer_name: string;
}
export interface IProductCreate {
  product_name: string;
  product_alias: string;
  product_code: string;
  product_description: string;
  created_date_time?: string;
  category_id: string;
  unit: string;
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
}

export const productProductTypesList = [
  { id: "1", order_type: "Quotation" },
  { id: "2", order_type: "Sales Order" },
  { id: "3", order_type: "Sales Invoice" },
  { id: "4", order_type: "Purchase Invoice" },
  { id: "5", order_type: "Purchase Order" },
  { id: "6", order_type: "Return Sales Invoice" },
  { id: "7", order_type: "Return Purchase Invoice" },
  { id: "8", order_type: "Inward" },
  { id: "9", order_type: "Dispatch" },
  { id: "10", order_type: "Stock Adjustment Inward" },
  { id: "11", order_type: "Stock Adjustment Outward" },
];
// export const handleDeleteProduct = async (
//   productId: number | undefined,
//   setIsDeleteConfirmation: TReactSetState<boolean>,
//   setLoading: TReactSetState<boolean>,
//   setProductList: TReactSetState<IProductView[]>
// ) => {
//   const requestData = {
//     table: "products",
//     where: `{"id":${productId}}`,
//     data: `{"isDelete":"1"}`,
//   };
//   const getUUID = localStorage.getItem("UUID");
//   try {
//     const data = await axiosInstance.post("commonUpdate", requestData);
//     if (data.data.code === 200) {
//       if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
//         setIsDeleteConfirmation(false);
//         fetchProductApi(setProductList, setLoading, "");
//       } else {
//         toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//       }
//     }
//   } catch (error: any) {
//     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//   }
// };

export interface ICustomFromList {
  id: number;
  title: string;
  data_type: number;
  display_order: number;
  required_or_not: number;
  reference_column_name: string;
  data_sorce: string;
  form_type: number;
  min_limit: number;
  max_limit: number;
  validation_type: number;
}
export const fetchCustomInqFromApiForProduct = async (
  setCustomFromList: TReactSetState<ICustomFromList[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const data = await axiosInstance.post("getCustomFieldFrom", {
      a_application_login_id: Number(getUUID),
      form_type: 4,
    });
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCustomFromList([]);

      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setCustomFromList(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const handleDeleteProduct = async (
  productIds: number[] | undefined, // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setLoading: TReactSetState<boolean>,
  setProductList: TReactSetState<IProductView[]>,
  options?: { checkAll?: number },
) => {
  const getUUID = localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    setLoading(true);

    if (options?.checkAll === 1) {
      const requestData = {
        a_application_login_id: getUUID,
        checkAllProducts: 1,
      };

      const data = await axiosInstance.post("delete-product", requestData);

      if (data.data.code === 200) {
        setIsDeleteConfirmation(false);
        fetchProductApi(0, ITEMS_PER_PAGE, setProductList, setLoading, "");
        toast.success(data.data.ack_msg || "All Products Deleted Successfully");
      } else {
        toast.error(data.data.ack_msg || "Unknown error occurred");
      }
    } else if (productIds && productIds.length > 0) {
      const requestData = {
        product_id: productIds.join(","), // Comma-separated IDs
        a_application_login_id: getUUID,
      };

      const data = await axiosInstance.post("delete-product", requestData);

      if (data.data.ack === 1) {
        setIsDeleteConfirmation(false);
        fetchProductApi(0, ITEMS_PER_PAGE, setProductList, setLoading, "");
        toast.success(
          productIds.length > 1
            ? "Products Deleted Successfully"
            : "Product Deleted Successfully",
        );
      } else {
        toast.error(data.data.ack_msg || "Unknown error occurred");
      }
    } else {
      toast.error("Invalid product ID");
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || "Unknown error occurred");
  } finally {
    setLoading(false);
  }
};
export const createProduct = async (
  productInput: IProductCreate,
  setProductList: TReactSetState<IProductView[]>,
  selectedFile: File | null,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void, //
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  const requestData = {
    table: "products",
    data: `{"product_name":"${productInput.product_name}",
      "product_alias":"${productInput.product_alias}",
      "product_code":"${productInput.product_code}",
      "product_description":"${productInput.product_description}",
      "unit":"${productInput.unit}",
      "category_id":"${productInput.category_id}",
      "rate":"${productInput.rate}",
      "GST":"${productInput.GST}",
      "gst_id":"${productInput.gst_id}",
      "purchase_gst_id":"${productInput.purchase_gst_id}",
      "net_rate":"${productInput.net_rate}",
      "a_application_login_id":${Number(getUUID)}}`,
  };
  if (!getUUID) {
    return;
  }
  const formData = new FormData();
  if (selectedFile) {
    formData.append("product_img", selectedFile);
  }

  formData.append("product_name", productInput.product_name);
  formData.append("product_alias", productInput.product_alias);
  formData.append("product_code", productInput.product_code);
  formData.append("product_description", productInput.product_description);
  formData.append("unit", productInput.unit);
  formData.append("category_id", productInput.category_id);
  formData.append("rate", productInput.rate);
  formData.append("GST", productInput.GST);
  formData.append("gst_id", String(productInput.gst_id));
  formData.append("purchase_gst_id", String(productInput.purchase_gst_id));
  formData.append("net_rate", productInput.net_rate);
  formData.append("weight_or_size", productInput.weight_or_size);
  formData.append("a_application_login_id", getUUID);

  try {
    const { data } = await axiosInstanceFormData.post(
      "create-product",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `${token}`,
          "x-tenant-id": getUUID,
        },
      },
    );
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        fetchProductApi(0, 0, setProductList, setLoading, "");
        toast.success(data.ack_msg);
        clearFormCallback();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCategoryApiForProduct = async (
  setCategoryList: TReactSetState<[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "categories",
    columns: "id,category_name",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID,
  };
  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setCategoryList(response.data.data); // Assuming API response is an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setCategoryList([]);
  }
};

export const fetchProductApi = async (
  page: number,
  itemsPerPage: number,
  setProductList: (items: IProductView[]) => void,
  setLoading: TReactSetState<boolean>,
  term: string,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");
  const start: number = page * itemsPerPage;

  const requestData = {
    ul: start, // Upper limit based on page number
    ll: itemsPerPage, // Lower limit based on page number
    a_application_login_id: getUUID,
    searchTerm: term,
  };
  try {
    const data = await axiosInstance.post("product", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLoading(false);
        setProductList([]);
      }
      setLoading(true);
      setProductList(data.data.data.item);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const fetchExportProductApi = async (
  term: string,
  setShareId: TReactSetState<boolean>,
) => {
  const getUUID = localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id: getUUID,
    searchTerm: term,
  };
  try {
    const data = await axiosInstance.post("export-product", requestData);
    if (data.status === 200) {
      const link: HTMLAnchorElement = document.createElement("a");
      link.href = data.data.data.fileUrl;
      link.download = data.data.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setShareId(false);
  }
};

export const updateProduct = async (
  productInput: IProductCreate,
  setProductList: TReactSetState<IProductView[]>,
  editCategoryId: number | undefined,
  setLoading: TReactSetState<boolean>,
  selectedFile: File | null,
  clearForm: () => void,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");
  const requestData = {
    table: "products",
    where: `{"id":"${editCategoryId}"}`,
    data: `{"product_name":"${productInput.product_name}",
    "product_alias":"${productInput.product_alias}",
    "product_code":"${productInput.product_code}",
    "product_description":"${productInput.product_description}",
    "unit":"${productInput.unit}","category_id":"${
      productInput.category_id
    }","rate":"${productInput.rate}","GST":"${productInput.GST}","gst_id":"${productInput.gst_id}","purchase_gst_id":"${productInput.purchase_gst_id}","net_rate":"${
      productInput.net_rate
    }","a_application_login_id":${Number(getUUID)}}`,
  };
  const formData = new FormData();
  if (!getUUID) {
    return;
  }
  if (selectedFile) {
    formData.append("product_img", selectedFile);
  }
  if (editCategoryId !== undefined) {
    formData.append("product_id", editCategoryId.toString());
  } else {
    console.error("editCategoryId is undefined");
  }
  formData.append("product_name", productInput.product_name);
  formData.append("product_alias", productInput.product_alias);
  formData.append("product_code", productInput.product_code);
  formData.append("product_description", productInput.product_description);
  formData.append("unit", productInput.unit);
  formData.append("category_id", productInput.category_id);
  formData.append("rate", productInput.rate);
  formData.append("GST", productInput.GST);
  formData.append("gst_id", String(productInput.gst_id));
  formData.append("purchase_gst_id", String(productInput.purchase_gst_id));
  formData.append("net_rate", productInput.net_rate);
  formData.append("weight_or_size", productInput.weight_or_size);

  formData.append("a_application_login_id", getUUID);

  try {
    const { data } = await axiosInstanceFormData.post(
      "update-product",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `${token}`,
        },
      },
    );
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setProductList((prevList) =>
          prevList.map((category) =>
            category.id === editCategoryId ? data.data : category,
          ),
        );
        clearForm();
        fetchProductApi(0, 0, setProductList, setLoading, "");
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

const innerOutSelection = (
  value: number,
  setIsInnerActive: any,
  setIsOuterActive: any,
) => {
  switch (value) {
    case 1:
      setIsInnerActive(false);
      setIsOuterActive(false);
      break;

    case 2:
      setIsInnerActive(true);
      setIsOuterActive(false);
      break;

    case 3:
      setIsInnerActive(false);
      setIsOuterActive(true);
      break;

    case 4:
      setIsInnerActive(true);
      setIsOuterActive(true);
      break;

    default:
      setIsInnerActive(true);
      setIsOuterActive(true);
  }
};

export const fetchOrderUnitClassification = async (
  setOrderUnitClassification: any,
) => {
  const uuid = localStorage.getItem("UUID");
  const requestData = {
    table: "company_masters",
    columns: "id,order_qty_unit",
    where: JSON.stringify({ a_application_login_id: uuid }),
    request_flag: 2,
  };
  try {
    const response = await axiosInstance.post("mainCommonGet", requestData);
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setOrderUnitClassification(response.data.data[0].order_qty_unit);
    } else {
      toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
      return "";
    }
  } catch (error: any) {
    console.error("Error fetching currencyID: ", error);
    toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
    return "";
  }
};

export const fetchApiProductStockMovement = async (
  setProductStockMovement: TReactSetState<IProductStockMovement[]>,
  productId: number | undefined,
  selectedDates: Date[] | undefined,
  setClosingQty: TReactSetState<number>,
  setOpenQty: TReactSetState<number>,
  warehouseIds: string = "",
  setIsInnerActive: any,
  setIsOuterActive: any,
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  const requestData: any = {
    a_application_login_id: getUUID,
    productId: productId,
  };

  if (selectedDates && selectedDates.length > 0) {
    requestData.selectedDates = selectedDates;
  }

  if (warehouseIds) {
    requestData.warehouse_id = warehouseIds; // ← backend expects this field
  }

  try {
    const data = await axiosInstance.post(
      "get-product-stock-movement",
      requestData,
    );
    if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setProductStockMovement(data.data.data.item);
      setClosingQty(data.data.data.closing_qty);
      setOpenQty(data.data.data.open_qty);
      const value: number = data.data.data.company_unit_classification;
      innerOutSelection(value, setIsInnerActive, setIsOuterActive);
    } else {
      setProductStockMovement([]);
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    setProductStockMovement([]);

    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchApiStockMovementSerialNumberwise = async (
  setProductStockMovement: TReactSetState<IProductStockMovement[]>,
  serialNumber: string,
  selectedDates: Date[] | undefined,
  setClosingQty: TReactSetState<number>,
  setOpenQty: TReactSetState<number>,
  warehouseIds: string = "",
  setIsInnerActive: any,
  setIsOuterActive: any,
) => {
  const getUUID = localStorage.getItem("UUID");

  const requestData: any = {
    a_application_login_id: getUUID,
    serial_number: serialNumber, // ← Changed to serial_number
  };

  if (selectedDates?.length) {
    requestData.selectedDates = selectedDates;
  }
  if (warehouseIds) {
    requestData.warehouse_id = warehouseIds;
  }

  try {
    const response = await axiosInstance.post(
      "get-serial-number-stock",
      requestData,
    );

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setProductStockMovement(response.data.data.item || []);
      setClosingQty(response.data.data.closing_qty || 0);
      setOpenQty(response.data.data.open_qty || 0);

      const value = response.data.data.company_unit_classification;
      innerOutSelection(value, setIsInnerActive, setIsOuterActive);
    } else {
      setProductStockMovement([]);
      toast.error(response.data.ack_msg || "No data found");
    }
  } catch (error: any) {
    setProductStockMovement([]);
    toast.error(error?.message || "Something went wrong");
  }
};

export const fetchwrehouse = async (
  setWarehouse: TReactSetState<any>,
  setLoading?: TReactSetState<boolean>,
) => {
  try {
    setLoading?.(true);

    const token = localStorage.getItem("token");
    const uuid = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: uuid,
    };

    const response = await axiosInstance.post("getwarehouse", requestData, {
      headers: { Authorization: token },
    });

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setWarehouse(response.data.data.item);
    } else {
      setWarehouse([]);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Error fetching warehouse:", error);
    setWarehouse([]);
    toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading?.(false);
  }
};

export const fetchCurrencyIDOfCompany = async () => {
  const uuid = localStorage.getItem("UUID");
  const requestData = {
    table: "company_masters",
    columns: "id,currency_id",
    where: JSON.stringify({ a_application_login_id: uuid }),
    request_flag: 2,
  };
  try {
    const response = await axiosInstance.post("mainCommonGet", requestData);
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      const currencyResponse = await axiosInstance.post("mainCommonGet", {
        table: "currencies",
        columns: "short_name",
        where: JSON.stringify({
          id: response.data?.data[0]?.currency_id,
          isDelete: 0,
        }),
        request_flag: 2,
      });
      if (currencyResponse.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        return currencyResponse.data.data[0]?.short_name;
      } else {
        toast.error(
          currencyResponse.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS,
        );
        return "";
      }
    } else {
      toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
      return "";
    }
  } catch (error: any) {
    console.error("Error fetching currencyID: ", error);
    toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
    return "";
  }
};

export const syncMiracleProduct = async (
  setSyncLoading: (data: boolean) => void,
  item?: any,
) => {
  const uuid = localStorage.getItem("UUID");
  const requestData = {
    item_id: item,
    a_application_login_id: uuid,
  };

  try {
    if (setSyncLoading) setSyncLoading(true);

    // Make sure your endpoint matches your actual route name
    const response = await axiosInstance.post("sync-product", requestData);

    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success(response.data.ack_msg || "Product synced successfully.");
    } else {
      toast.error(response.data.ack_msg || "Failed to sync product.");
    }
  } catch (error: any) {
    console.error("Sync Product Error:", error);

    // Safely parse the backend rejection
    const errorMessage =
      error?.response?.data?.ack_msg ||
      error?.response?.data?.message ||
      error?.message ||
      "An unexpected error occurred.";

    toast.error(errorMessage);
  } finally {
    if (setSyncLoading) setSyncLoading(false);
  }
};
