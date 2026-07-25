import { toast } from "react-toastify";
import {
  checkDuplicationTwoColum
} from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";
export interface IPriceListItemCreate {
  pricelist_masters_id: number | undefined;
  product_id: string;
  rate: number;
  discount: number | undefined;
  net_rate: number;
  created_date_time?: string;
  discount_amount: number | undefined;
}
export interface IPriceListItemRefCatCreate {
  discount: number | undefined;
  category_id: string;
  pricelist_masters_id: number | undefined;
  a_application_login_id: number | string | null;
  discount_type: string | undefined;
}

export interface IPriceListItemView {
  pricelist_masters_id: string;
  product_id: string;
  rate: string;
  discount: number;
  net_rate: number;
  created_date_time: string;
  id: number;
  product_name: string;
  gst_number: number;
  last_updated_date_time: string;
  last_updated_by_name: string;
  discount_amount: number | undefined;

}

export const handleDeletePriceListItem = async (
  priceListId: number | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setPriceListList: TReactSetState<IPriceListItemView[]>,
  pricelist_masters_id: any
) => {
  const requestData = {
    table: "price_lists",
    where: `{"id":${priceListId}}`,
    data: `{"isDelete":"1"}`,
  };
  const getUUID = localStorage.getItem("UUID")
  try {
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200) {
      if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        fetchPriceListItemApi(setPriceListList, pricelist_masters_id);
      } else {
        toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
export const fetchProductApiForPriceListItem = async (
  setProductList: TReactSetState<any>
) => {
  const token = await localStorage.getItem("token");

  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("product", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setProductList([]);
    }
    setProductList(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const createPriceListItem = async (
  priceListInput: IPriceListItemCreate,
  setPriceListItem: TReactSetState<IPriceListItemView[]>,
  pricelist_masters_id: any,
  clearForm: () => void
) => {
  if (
    !(await checkDuplicationTwoColum(
      priceListInput.product_id,
      "price_lists",
      "product_id",
      "pricelist_masters_id",
      priceListInput.pricelist_masters_id
    ))
  ) {
    const date = new Date();

    const formattedDateTime = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
      date.getSeconds()
    ).padStart(2, "0")}`;
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "price_lists",
      data: JSON.stringify({
        pricelist_masters_id: priceListInput.pricelist_masters_id,
        product_id: priceListInput.product_id,
        rate: priceListInput.rate, // Include the HTML content here
        discount: priceListInput.discount,
        discount_amount: priceListInput.discount_amount,
        net_rate: priceListInput.net_rate,
        created_date_time: formattedDateTime,
        last_updated_date_time: formattedDateTime,
        last_updated_by: Number(getUUID),
        a_application_login_id: Number(getUUID),
      }),
    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          fetchPriceListItemApi(setPriceListItem, pricelist_masters_id);
          toast.success(data.ack_msg);
          clearForm();
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("PriceList already available");
  }
};

export const fetchPriceListItemApi = async (
  setPriceListList: TReactSetState<IPriceListItemView[]>,
  pricelist_masters_id: any
) => {
  const token = await localStorage.getItem("token");

  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    pricelist_masters_id: pricelist_masters_id,
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("priceListItem", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setPriceListList([]);

      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setPriceListList(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updatePriceListItem = async (
  productInput: IPriceListItemCreate,
  setProductList: TReactSetState<IPriceListItemView[]>,
  editCategoryId: number | undefined,
  pricelist_masters_id: number | undefined,
  clearForm: () => void
) => {
  const date = new Date();
  const getUUID = localStorage.getItem("UUID")
  const formattedDateTime = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds()
  ).padStart(2, "0")}`;

  const requestData = {
    table: "price_lists",
    where: `{"id":"${editCategoryId}"}`,
    data: JSON.stringify({
      product_id: productInput.product_id,
      rate: productInput.rate, // Include the HTML content here
      discount: productInput.discount,
      discount_amount: productInput.discount_amount,
      net_rate: productInput.net_rate,
      last_updated_by: Number(getUUID),
      last_updated_date_time: formattedDateTime,
    }),
  };

  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setProductList((prevList) =>
          prevList.map((category) =>
            category.id === editCategoryId ? data.data : category
          )
        );
        clearForm();
        fetchPriceListItemApi(setProductList, pricelist_masters_id);
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const fetchCategoryApiForPriceListItem = async (setCategoryList: TReactSetState<any>) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "categories",
    columns: "id,category_name,color",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
    a_application_login_id: getUUID
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setCategoryList([]);
      }
      setCategoryList(data.data.data);
    }
  } catch (error: any) {
    // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};


export const createPriceListThroughCategory = async (
  priceListInput: IPriceListItemRefCatCreate,
  setPriceListItem: TReactSetState<IPriceListItemView[]>,
  pricelist_masters_id: any,
  clearForm: () => void
) => {
  const date = new Date();
  const formattedDateTime = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds()
  ).padStart(2, "0")}`;
  try {
    const { data } = await axiosInstance.post("/add-pricelist-category-wise", priceListInput);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        fetchPriceListItemApi(setPriceListItem, pricelist_masters_id);
        toast.success(data.ack_msg);
        clearForm();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
}