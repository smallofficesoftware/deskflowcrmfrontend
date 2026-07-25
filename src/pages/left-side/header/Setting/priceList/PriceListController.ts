import { toast } from "react-toastify";
import {
  checkDuplication,
  checkDuplicationUpdate,
} from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IPriceListView {
  price_list_name: string;
  id: number;
  effective_from: any;
  created_date_time?: string;
  country_id: string;
  state_id: string;
  city_id: string;
  city_name: string;
  state_name: string;
  country_name: string;
}
export interface IPriceListCreate {
  price_list_name: string;
  effective_from: any;
  created_date_time?: string;
  country_id: string;
  state_id: number;
  city_id: number;
}

export const handleDeletePriceList = async (
  priceListIds: number[] | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setPriceListList: TReactSetState<IPriceListView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!priceListIds || priceListIds.length === 0) {
    toast.error("Invalid price list ID(s)");
    return;
  }

  const requestData = {
    priceListId: priceListIds.join(","),
    a_application_login_id: getUUID,
  };

  try {
    setLoading(true);
    const data = await axiosInstance.post("delete-pricelist", requestData);

    if (data.data.code === 200) {
      setIsDeleteConfirmation(false);
      fetchPriceListApi(setPriceListList, setLoading);
      toast.success(
        priceListIds.length > 1
          ? "Price Lists deleted successfully"
          : "Price List deleted successfully"
      );
    } else {
      toast.error(data.data.ack_msg || "Unknown error occurred");
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || "Unknown error occurred");
  } finally {
    setLoading(false);
  }
};
export const createPriceList = async (
  priceListInput: IPriceListCreate,
  setLoading: TReactSetState<boolean>,
  clearForm: () => void
) => {
  if (
    !(await checkDuplication(
      priceListInput.price_list_name,
      "pricelist_masters",
      "price_list_name"
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
      table: "pricelist_masters",
      data: JSON.stringify({
        price_list_name: priceListInput.price_list_name,
        effective_from: priceListInput.effective_from,
        country_id: priceListInput.country_id, // Include the HTML content here
        state_id: priceListInput.state_id,
        city_id: priceListInput.city_id,
        created_date_time: formattedDateTime,
        a_application_login_id: Number(getUUID),
      }),
    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          clearForm();
          toast.success(data.ack_msg);
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

export const fetchCountryApiForPriceList = async (setCountriesList: any) => {
  const requestData = {
    table: "a_countries",
    columns: "id,country_name,country_code",
    where: `{"isDelete": "0"}`,
  };
  const getUUID = localStorage.getItem("UUID")

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setCountriesList(response.data.data); // Assuming API response is an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setCountriesList([]);
  }
};

export const fetchStateApiForPriceList = async (
  setStateList: any,
  selectedCountryId: any
) => {
  const requestData = {
    table: "a_states",
    columns: "id,state_name",
    where: `{"country_id": "${selectedCountryId}"}`,
  };
  const getUUID = localStorage.getItem("UUID")

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setStateList(response.data.data); // Assuming API response is an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setStateList([]);
  }
};
export const fetchCityApiForPriceList = async (
  setCityList: TReactSetState<any>,
  selectedStateId: any
) => {
  const requestData = {
    table: "a_cities",
    columns: "id,city_name",
    where: `{"state_id": ${selectedStateId}}`,
  };
  const getUUID = localStorage.getItem("UUID")

  try {
    const response = await axiosInstance.post("commonGet", requestData);

    setCityList(response.data.data); // Assuming API response is an array of countries
  } catch (error) {
    console.error("Error fetching countries:", error);
    // Handle error (e.g., show error message, clear filtered list)
    setCityList([]);
  }
};
export const fetchPriceListApi = async (
  setPriceListList: TReactSetState<IPriceListView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const token = await localStorage.getItem("token");

  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("priceListMaster", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setPriceListList([]);

      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
    setLoading(true);
    setPriceListList(data.data.data.item);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const updatePriceList = async (
  priceListInput: IPriceListCreate,
  editPriceListId: number | undefined,
  setLoading: TReactSetState<boolean>,
  clearForm: () => void
) => {
  if (
    !(await checkDuplicationUpdate(
      priceListInput.price_list_name,
      "pricelist_masters",
      "price_list_name",
      editPriceListId
    ))
  ) {
    const requestData = {
      table: "pricelist_masters",
      where: `{"id":"${editPriceListId}"}`,
      data: JSON.stringify({
        price_list_name: priceListInput.price_list_name,
        effective_from: priceListInput.effective_from,
        country_id: priceListInput.country_id, // Include the HTML content here
        state_id: priceListInput.state_id,
        city_id: priceListInput.city_id,
      }),
    };
    const getUUID = localStorage.getItem("UUID")

    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          clearForm();
          toast.success(data.ack_msg);
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