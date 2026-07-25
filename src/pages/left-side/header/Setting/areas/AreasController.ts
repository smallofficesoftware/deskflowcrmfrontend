import { toast } from "react-toastify";
import { generateCustomNumber } from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IAreasView {
  id: number;
  area_name: string;
  city_id: number;
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

export interface ICitiesView {
  id: number;
  city_name: string;
  state_id: number;
  country_id: number;
}

export interface IAreasCreate {
  area_name: string;
  city_id: number;
  state_id: number;
  country_id: number;
}
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
//     return false;s
//   }
// };

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
  if (!getUUID) {
    toast.error("UUID not found");
    setCountriesList([]);
    return;
  }
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
  if (!getUUID) {
    toast.error("UUID not found");
    setStatesList([]);
    return;
  }
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
  if (!getUUID) {
    toast.error("UUID not found");
    setCitiesList([]);
    return;
  }
  const whereConditions = ["isDelete=0"];
  if (countryId) whereConditions.push(`country_id=${countryId}`);
  if (stateId) whereConditions.push(`state_id=${stateId}`);
  const requestData = {
    table: "a_cities",
    columns: "id, city_name, state_id, country_id",
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

export const fetchAreasApi = async (
  setAreasList: TReactSetState<IAreasView[]>,
  setLoading: TReactSetState<boolean>,
  countryId: number | null,
  stateId: number | null,
  cityId: number | null
) => {
  const getUUID = localStorage.getItem("UUID");
  if (!getUUID) {
    toast.error("UUID not found");
    setAreasList([]);
    return;
  }
  const whereConditions = ["isDelete=0"];
  if (countryId) whereConditions.push(`country_id=${countryId}`);
  if (stateId) whereConditions.push(`state_id=${stateId}`);
  if (cityId) whereConditions.push(`city_id=${cityId}`);
  const requestData = {
    table: "a_areas",
    columns: "id, area_name, city_id, state_id, country_id, isDelete, isActive",
    where: whereConditions,
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setAreasList([]);
    }
    setLoading(true);
    setAreasList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => setLoading(false), 1000);
  }
};

export const createAreas = async (
  areasInput: IAreasCreate,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void
) => {
  const customNumber = await generateCustomNumber();
  // if (
  //   !(await checkDuplicationThreeColum(
  //     areasInput.area_name,
  //     "a_areas",
  //     "area_name",
  //     "city_id",
  //     areasInput.city_id,
  //     "country_id",
  //     areasInput.country_id
  //   ))
  // ) {
  {
    const getUUID = localStorage.getItem("UUID");
    if (!getUUID) {
      toast.error("UUID not found");
      return;
    }
    const requestData = {
      table: "a_areas",
      data: `{"area_name":"${areasInput.area_name}","city_id":"${areasInput.city_id}","state_id":"${areasInput.state_id}","country_id":"${areasInput.country_id}","isActive":"1","custom_number":"${customNumber}"}`,
    };
    try {
      const { data } = await axiosInstance.post("commonCreate", requestData);
      if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(data.ack_msg || "Area Created Successfully");
        clearFormCallback();
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  }
};

export const handleDeleteAreas = async (
  areaIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setAreasList: TReactSetState<IAreasView[]>,
  setLoading: TReactSetState<boolean>,
  countryId: number | null,
  stateId: number | null,
  cityId: number | null
) => {
  if (!areaIds || areaIds.length === 0) return; // Guard clause for empty or undefined areaIds
  const getUUID = await localStorage.getItem("UUID");
  if (!getUUID) {
    toast.error("UUID not found");
    return;
  }
  const requestData = {
    table: "a_areas",
    where: `{"id":"${areaIds.join(",")}"}`, // Comma-separated IDs
    data: `{"isDelete":"1"}`,
    a_application_login_id: getUUID,
  };
  try {
    setLoading(true);
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      await fetchAreasApi(setAreasList, setLoading, countryId, stateId, cityId);
      toast.success(
        areaIds.length > 1
          ? "Areas Deleted Successfully"
          : "Area Deleted Successfully"
      );
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setLoading(false);
  }
};

export const updateAreas = async (
  areasInput: IAreasCreate,
  setLoading: TReactSetState<boolean>,
  editAreaId: number | undefined,
  clearForm: () => void
) => {
  if (!editAreaId) return;
  const customNumber = await generateCustomNumber();

  {
    const getUUID = localStorage.getItem("UUID");
    if (!getUUID) {
      toast.error("UUID not found");
      return;
    }
    const requestData = {
      table: "a_areas",
      where: `{"id":"${editAreaId}"}`,
      data: `{"area_name":"${areasInput.area_name}","city_id":"${areasInput.city_id}","state_id":"${areasInput.state_id}","country_id":"${areasInput.country_id}","custom_number":"${customNumber}"}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        clearForm();
        toast.success(data.ack_msg || "Area Updated Successfully");
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  }
};