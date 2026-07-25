import { toast } from "react-toastify";
import { checkDuplication, checkDuplicationUpdate } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ICountriesView {
  country_name: string;
  id: number;
  country_code: string | undefined | null;
  country_iso: string | undefined | null;
}

export interface ICountriesCreate {
  country_name: string;
  country_code: string | undefined | null;
  country_iso: string | undefined | null;
}

interface IAddCountriesObj {
  country_name: string;
  country_code: string | undefined | null;
  country_iso: string | undefined | null;
}

export const handleDeleteCountries = async (
  countryIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setCountriesList: TReactSetState<ICountriesView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "a_countries",
    where: `{"id":"${countryIds.join(",")}"}`, // Comma-separated IDs
    data: `{"isDelete":"1"}`,
    a_application_login_id: getUUID,
  };
  try {
    setLoading(true);
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchCountriesApi(setCountriesList, setLoading);
      toast.success(
        countryIds.length > 1
          ? "Countries Deleted Successfully"
          : "Country Deleted Successfully"
      );
    } else {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const createCountries = async (
  countryInput: IAddCountriesObj,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void
) => {
  if (
    !(await checkDuplication(
      countryInput.country_name,
      "a_countries",
      "country_name"
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "a_countries",
      data: `{"country_name":"${countryInput.country_name}","country_code":"${countryInput.country_code || ''}","country_iso":"${countryInput.country_iso || ''}","a_application_login_id":${Number(getUUID)}}`,
    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(data.ack_msg);
        clearFormCallback();
      } else {
        console.log("fgfd")
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      console.log("dsad")
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Country already available");
  }
};

export const fetchCountriesApi = async (
  setCountriesList: TReactSetState<ICountriesView[]>,
  setLoading: TReactSetState<boolean>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "a_countries",
    columns: "id, country_name, country_code,country_iso",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setCountriesList([]);
    }
    setLoading(true);
    setCountriesList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const updateCountries = async (
  countryInput: ICountriesCreate,
  setLoading: TReactSetState<boolean>,
  editCountryId: number | undefined,
  clearFormCallback: () => void
) => {
  if (
    !(await checkDuplicationUpdate(
      countryInput.country_name,
      "a_countries",
      "country_name",
      editCountryId
    ))
  ) {
    const getUUID = await localStorage.getItem("UUID");
    const requestData = {
      table: "a_countries",
      where: `{"id":"${editCountryId}"}`,
      data: `{"country_name":"${countryInput.country_name}","country_code":"${countryInput.country_code || ''}","country_iso":"${countryInput.country_iso || ''}","a_application_login_id":${Number(getUUID)}}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);

      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        clearFormCallback();
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }

    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } else {
    toast.error("Country already available");
  }
};
