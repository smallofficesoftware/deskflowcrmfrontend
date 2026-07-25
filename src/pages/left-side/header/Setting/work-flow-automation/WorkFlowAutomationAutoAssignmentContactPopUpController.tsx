import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { IOption } from "../../../../../helpers/AppInterface";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";
export interface ISourceTypesList {
  id: string | number;
  source_name: string;
}
export interface ICountryList {
  id: string | number;
  country_name: string;
}
export interface IStateList {
  id: string | number;
  state_name: string;
}
export interface TeamMember {
  id: string | number;
  username: string;
}
export interface IDataList {
  id: string | number;
  source_type_id: string | number;
  country_id: string | number;
  state_id: string | number;
  city_id: string | number;
  area_id: string | number;
  team_person_id: string | number;
  created_at_formatted: string;
  area_name: string;
  city_name: string;
  country_name: string;
  source_name: string;
  state_name: string;
  team_person_name: string;
  text_match_description: string;
  auto_sequence_flag: number;
  is_whatsapp_email_send_flag: number;
  send_description: string;
}
export const getSourceTypes = async (
  setSourceTypesList: TReactSetState<ISourceTypesList[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "source_types",
    columns: "id,source_name",
    where: ["isDelete=0"],
    order: `{"id":"DESC"}`,
    request_flag: 0,
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setSourceTypesList([]);
      }
      setSourceTypesList(data.data.data);
    }
  } catch (error: any) {
    // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const getCountry = async (
  setCountryList: TReactSetState<ICountryList[]>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "a_countries",
    columns: "id,country_name",
    where: ["isDelete=0"],
    order: `{"id":"DESC"}`,
    request_flag: 0,
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setCountryList([]);
      }
      setCountryList(data.data.data);
    }
  } catch (error: any) {
    // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const getState = async (
  selectedCountryId: any,
  setStateList: TReactSetState<IStateList[]>,
) => {
  if (!selectedCountryId?.value) return;
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "a_states",
    columns: "id,state_name",
    where: [`isDelete=0 AND country_id =  ${selectedCountryId?.value}`],
    order: `{"id":"DESC"}`,
    request_flag: 0,
    a_application_login_id: getUUID,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.status === 200) {
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setStateList([]);
      }
      setStateList(data.data.data);
    }
  } catch (error: any) {
    // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const loadCityOptionsv = async (
  inputValue: string,
  selectedCountryId: any,
  selectedStateId: any,
): Promise<IOption[]> => {
  if (!selectedCountryId?.value) return [];
  if (!selectedStateId?.value) return [];
  // Changed to if (inputValue) - only fetch when there's input
  if (inputValue) {
    if (inputValue.length < 2) return [];
    try {
      // localStorage is synchronous - no await needed
      const getUUID = localStorage.getItem("UUID");
      const requestData = {
        table: "a_cities",
        columns: "id,city_name",
        where: [
          `isDelete=0`,
          `city_name LIKE '%${inputValue}%'`,
          `state_id = ${selectedStateId?.value ?? "NULL"}`,
          `country_id = ${selectedCountryId?.value ?? "NULL"}`,
        ],
        // where: `{"isDelete":"0","city_name":"${inputValue}","a_application_login_id":"${getUUID}"}`,
        order: `{"id":"DESC"}`,
        request_flag: 0,
        a_application_login_id: getUUID,
      };
      try {
        const data = await axiosInstance.post("commonGet", requestData);
        if (data.status === 200) {
          if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
            return [];
          }
          const cityArrayList = data.data.data.map((city: any) => ({
            value: city.id,
            label: city.city_name,
          }));
          return cityArrayList;
        }
      } catch (error: any) {
        // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return [];
      }

      return [];
    } catch (error) {
      console.error("Error loading options:", error);
      return [];
    }
  }

  // Return empty array when no input
  return [];
};

export const loadAreaOptionsv = async (
  inputValue: string,
  selectedCountryId: any,
  selectedStateId: any,
  selectedCityId: any,
): Promise<IOption[]> => {
  if (!selectedCountryId?.value) return [];
  if (!selectedStateId?.value) return [];
  if (!selectedCityId?.value) return [];
  // Changed to if (inputValue) - only fetch when there's input
  if (inputValue) {
    if (inputValue.length < 2) return [];
    try {
      // localStorage is synchronous - no await needed
      const getUUID = localStorage.getItem("UUID");
      const requestData = {
        table: "a_areas",
        columns: "id,area_name",
        where: [
          `isDelete=0`,
          `area_name LIKE '%${inputValue}%'`,
          `state_id = ${selectedStateId?.value ?? "NULL"}`,
          `country_id = ${selectedCountryId?.value ?? "NULL"}`,
          `city_id = ${selectedCityId?.value ?? "NULL"}`,
        ],
        order: `{"id":"DESC"}`,
        request_flag: 0,
        a_application_login_id: getUUID,
      };
      try {
        const data = await axiosInstance.post("commonGet", requestData);
        if (data.status === 200) {
          if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
            return [];
          }
          const areaArrayList = data.data.data.map((area: any) => ({
            value: area.id,
            label: area.area_name,
          }));
          return areaArrayList;
        }
      } catch (error: any) {
        // toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return [];
      }

      return [];
    } catch (error) {
      console.error("Error loading options:", error);
      return [];
    }
  }

  // Return empty array when no input
  return [];
};

export const fetchChainWiseTeamApi = async (
  setTeamLoading: TReactSetState<boolean>,
  setTeamMemberList: TReactSetState<TeamMember[]>,
) => {
  setTeamLoading(true);
  const token = localStorage.getItem("token");
  const getUUID = localStorage.getItem("UUID");

  const requestData = {
    a_application_login_id: getUUID,
  };

  try {
    const { data } = await axiosInstance.post(
      "my-team-chain-wise",
      requestData,
      {
        headers: { Authorization: `${token}` },
      },
    );

    if (data.ack !== 1) {
      setTeamMemberList([]);
      toast.error("No team members found.");
      return;
    }

    // Filter out invalid team members
    const validTeamMembers = (data.data.item || []).filter(
      (member: TeamMember) =>
        member.id && member.username && typeof member.username === "string",
    );
    setTeamMemberList(validTeamMembers);
    //   setLocalError("");
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    toast.error(error?.message || "Failed to load team members");
    setTeamMemberList([]);
    //   setLocalError("Failed to load team members");
  } finally {
    setTeamLoading(false);
  }
};
interface IAutoContactAssignementDetail {
  source_type_id: string;
  country_id: string | null;
  state_id: string | null;
  city_id: string | number | null;
  area_id: string | number | null;
  team_person_ids: (string | number)[];
  text_match_description: string;
  auto_sequence_flag: number;
  is_whatsapp_email_send_flag: number;
  send_description: string;
}
export const addWorkFlowAutomationAutoContactAssignementDetail = async (
  detail: IAutoContactAssignementDetail,
  setIsDataRefresh: TReactSetState<boolean>,
) => {
  try {
    setIsDataRefresh(false);
    if (!detail.source_type_id || !detail.team_person_ids) {
      return false;
    }
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");

    const requestData = {
      ...detail,
      a_application_login_id: getUUID,
    };

    const { data } = await axiosInstance.post(
      "add-auto-assignment-contact-detail",
      requestData,
    );

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      // toast.success(data.ack_msg);
      setIsDataRefresh(true);
      if (data.data.isDuplicate == 1) {
        toast.info(data.data.duplicate_msg);
      }
    } else {
      // toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      if (data.data.isDuplicate == 1) {
        toast.info(data.data.duplicate_msg);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const getWorkFlowAutomationAutoContactAssignementDetail = async (
  setDataList: TReactSetState<IDataList[]>,
) => {
  try {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
    };

    const { data } = await axiosInstance.post(
      "get-auto-assignment-contact-detail",
      requestData,
    );

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setDataList(data.data);
      // toast.success(data.ack_msg);
    } else {
      setDataList([]);
      // toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const deleteWorkFlowAutomationAutoContactAssignementDetail = async (
  deleteId: string | number,
  setIsDataRefresh: TReactSetState<boolean>,
) => {
  try {
    setIsDataRefresh(false);
    const requestData = {
      table: "wrkflw_auto_assignment_of_contacts",
      where: `{"id":"${deleteId}"}`,
      data: JSON.stringify({
        isDelete: 1,
      }),
    };

    const { data } = await axiosInstance.post("commonUpdate", requestData);

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setIsDataRefresh(true);
      // toast.success(data.ack_msg);
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export const updateWhatsappModual = async (
  templateUpdateFields: {
    sourceId: string;
  },
  setTemplateUpdateFields: TReactSetState<{
    sourceId: string;
  }>,
) => {
  try {
    const { data } = await axiosInstance.post("update-whatsap-template_id", {
      source_type_id: templateUpdateFields.sourceId,
      template_id: `auto_contact_assignment_${templateUpdateFields.sourceId}`,
    });

    if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTemplateUpdateFields({ sourceId: "" });
  }
};
