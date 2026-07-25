import { toast } from "react-toastify";
import {
  generateCustomNumber
} from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface ICitiesView {
  id: number;
  city_name: string;
  state_id: number;
  country_id: number;
  isDelete: number;
  isActive: number;
}

export interface ICountriesView {
  id: number;
  country_name: string;
}

export interface IStatesView {
  id: number;
  state_name: string;
  country_id: number;
}

export interface ICitiesCreate {
  city_name: string;
  state_id: number;
  country_id: number;
}

interface IAddCitiesObj {
  city_name: string;
  state_id: number;
  country_id: number;
}

// Custom implementation for three-column duplication check
// export const checkDuplicationThreeColum = async (
//   value: string | number,
//   tableName: string,
//   columnName: string,
//   columnName1: string,
//   value1: string | number | undefined,
//   columnName2: string,
//   value2: string | number | undefined
// ) => {
//   const getUUID = await localStorage.getItem("UUID");
//   const requestData = {
//     table: tableName,
//     columns: "id",
//     where: `{"isDelete":"0","${columnName}":"${value}","${columnName1}":"${value1}","${columnName2}":"${value2}"}`,
//   };
//   try {
//     const data = await axiosInstance.post("commonGet", requestData);
//     return data.data.ack === DEFAULT_STATUS_CODE_SUCCESS;
//   } catch (error: any) {
//     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//     return false;
//   }
// };

// // Custom implementation for three-column update duplication check
// export const checkDuplicationUpdateThreeColum = async (
//   value: string | number,
//   tableName: string,
//   columnName: string,
//   columnName1: string,
//   value1: string | number | undefined,
//   columnName2: string,
//   value2: string | number | undefined,
//   UpdateId: number | undefined
// ) => {
//   const getUUID = await localStorage.getItem("UUID");
//   const requestData = {
//     table: tableName,
//     columns: "id",
//     where: `{"isDelete":"0","${columnName}":"${value}","${columnName1}":"${value1}","${columnName2}":"${value2}","id":"${UpdateId}"}`,
//     request_flag: 2,
//   };
//   try {
//     const data = await axiosInstance.post("commonGet", requestData);
//     return data.data.ack === DEFAULT_STATUS_CODE_SUCCESS;
//   } catch (error: any) {
//     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
//     return false;
//   }
// };

export const fetchCountriesApi = async (
  setCountriesList: TReactSetState<ICountriesView[]>,
  setLoading: TReactSetState<boolean>
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    table: "a_countries",
    columns: "id, country_name",
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
    setTimeout(() => setLoading(false), 1000);
  }
};

export const fetchStatesApi = async (
  setStatesList: TReactSetState<IStatesView[]>,
  setLoading: TReactSetState<boolean>,
  countryId: number | null
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    table: "a_states",
    columns: "id, state_name, country_id",
    where: countryId ? [`isDelete=0`, `isActive=1`, `country_id=${countryId}`] : ["isDelete=0", "isActive=1"],
    request_flag: 0,
    order: `{"state_name":"ASC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setStatesList([]);
    }
    setLoading(true);
    setStatesList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => setLoading(false), 1000);
  }
};

export const fetchCitiesApi = async (
  setCitiesList: TReactSetState<ICitiesView[]>,
  setLoading: TReactSetState<boolean>,
  countryId: number | null,
  stateId: number | null
) => {
  const getUUID = localStorage.getItem("UUID");
  const whereConditions = ["isDelete=0"];
  if (countryId) whereConditions.push(`country_id=${countryId}`);
  if (stateId) whereConditions.push(`state_id=${stateId}`);

  const requestData = {
    table: "a_cities",
    columns: "id, city_name, state_id, country_id, isDelete, isActive",
    where: whereConditions,
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setCitiesList([]);
    }
    setLoading(true);
    setCitiesList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => setLoading(false), 1000);
  }
};

export const createCities = async (
  citiesInput: IAddCitiesObj,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void
) => {
  const customNumber = await generateCustomNumber();
  {
    const getUUID = localStorage.getItem("UUID");
    const requestData = {
      table: "a_cities",
      data: `{"city_name":"${citiesInput.city_name}","state_id":"${citiesInput.state_id}","country_id":"${citiesInput.country_id}","isActive":"1","custom_number":"${customNumber}"}`,
    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
      if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(data.ack_msg);
        clearFormCallback();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  }
};

export const handleDeleteCities = async (
  cityIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setCitiesList: TReactSetState<ICitiesView[]>,
  setLoading: TReactSetState<boolean>,
  countryId: number | null,
  stateId: number | null
) => {
  if (!cityIds || cityIds.length === 0) return; // Guard clause for empty or undefined cityIds

  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "a_cities",
    where: `{"id":"${cityIds.join(",")}"}`, // Comma-separated IDs
    data: `{"isDelete":"1"}`,
    a_application_login_id: getUUID,
  };
  try {
    setLoading(true);
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchCitiesApi(setCitiesList, setLoading, countryId, stateId);
      toast.success(
        cityIds.length > 1
          ? "Cities Deleted Successfully"
          : "City Deleted Successfully"
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

export const updateCities = async (
  citiesInput: ICitiesCreate,
  setLoading: TReactSetState<boolean>,
  editCityId: number | undefined,
  clearForm: () => void
) => {
  if (!editCityId) return;

  const customNumber = await generateCustomNumber();
  {
    const getUUID = localStorage.getItem("UUID");
    const requestData = {
      table: "a_cities",
      where: `{"id":"${editCityId}"}`,
      data: `{"city_name":"${citiesInput.city_name}","state_id":"${citiesInput.state_id}","country_id":"${citiesInput.country_id}","custom_number":"${customNumber}"}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        clearForm();
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  }
};