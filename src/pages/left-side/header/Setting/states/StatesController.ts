import { toast } from "react-toastify";
import {
  checkDuplicationUpdateTwoColum
} from "../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export interface IStatesView {
  id: number;
  state_name: string;
  country_id: number;
  isDelete: number;
  isActive: number;
}

export interface ICountriesView {
  id: number;
  country_name: string;
}

export interface IStatesCreate {
  state_name: string;
  country_id: number;
}

interface IAddStatesObj {
  state_name: string;
  country_id: number;
}

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
  countryId: number | null,
  selectedDemography?: string[] | null,
) => {
  const getUUID = localStorage.getItem("UUID");

  const whereClause = ["isDelete=0"];

  if (countryId) {
    whereClause.push(`country_id=${countryId}`);
  }

  // Only add the demography filters if they actually exist and have length
  if (selectedDemography && selectedDemography.length > 0) {
    whereClause.push(...selectedDemography); // Use the spread operator (...) to keep it flat
  }

  const requestData = {
    table: "a_states",
    columns: "id, state_name, country_id, isDelete, isActive",
    where: whereClause,
    request_flag: 0,
    // order: '{"state_name":"ASC"}',
    order: `{"state_name":"ASC"}`
  };


  try {
    const response = await axiosInstance.post("commonGet", requestData);
    const data = response.data;
    if (data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      console.warn("API returned non-success status:", data.ack_msg);
      setLoading(false);
      setStatesList([]);
    } else {
      const states = data.data?.data || data.data || [];
      setLoading(true);
      setStatesList(states);
    }
  } catch (error: any) {
    console.error("States API Error:", error); // Debug the error
    toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setStatesList([]);
  } finally {
    setTimeout(() => setLoading(false), 1000);
  }
};

export const createStates = async (
  statesInput: IAddStatesObj,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    table: "a_states",
    data: `{"state_name":"${statesInput.state_name}","country_id":"${statesInput.country_id}","isActive":"1"}`,
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

export const handleDeleteStates = async (
  stateIds: number[], // Changed to accept an array of IDs
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setStatesList: TReactSetState<IStatesView[]>,
  setCountriesList: TReactSetState<ICountriesView[]>,
  setLoading: TReactSetState<boolean>,
  countryId: number | null // Keep countryId for filtering states
) => {
  if (!stateIds || stateIds.length === 0) return; // Guard clause for empty or undefined stateIds

  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "a_states",
    where: `{"id":"${stateIds.join(",")}"}`, // Comma-separated IDs
    data: `{"isDelete":"1"}`,
    a_application_login_id: getUUID,
  };
  try {
    setLoading(true);
    const data = await axiosInstance.post("commonUpdate", requestData);
    if (data.data.code === 200 && data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDeleteConfirmation(false);
      if (countryId !== null) {
        await fetchStatesApi(setStatesList, setLoading, countryId);
      } else {
        await fetchStatesApi(setStatesList, setLoading, null);
      }
      toast.success(
        stateIds.length > 1
          ? "States Deleted Successfully"
          : "State Deleted Successfully"
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

export const updateStates = async (
  statesInput: IStatesCreate,
  setLoading: TReactSetState<boolean>,
  editStateId: number | undefined,
  clearForm: () => void
) => {
  if (
    !(await checkDuplicationUpdateTwoColum(
      statesInput.state_name,
      "states",
      "state_name",
      "country_id",
      statesInput.country_id,
      editStateId
    ))
  ) {
    const getUUID = localStorage.getItem("UUID");
    const requestData = {
      table: "a_states",
      where: `{"id":"${editStateId}"}`,
      data: `{"state_name":"${statesInput.state_name}","country_id":"${statesInput.country_id}"}`,
    };
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
    toast.error("State and Country already available");
  }
};