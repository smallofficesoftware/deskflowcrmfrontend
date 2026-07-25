import * as Yup from "yup";

import { toast } from "react-toastify";
import { formatDate, formatDateAndTime } from "../../../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../helpers/AppType";
import {
  axiosInstance
} from "../../../../../../services/axiosInstance";
import { ICustomFromList } from "../VisitController";

export interface IVisitCreate {
  [x: string]: any;
  created_date_time?: string;
  visit_type_id: string;
  remark: string;
  visitId: number | string;
  visit_status: number;
  status_remark: string;
  visit_image?: File | string | null;
  contactId?: number | string;
  contactName?: string;
  end_date?: string;
  visit_column_number_1: number | string;
  visit_column_number_2: number | string;
  visit_column_number_3: number | string;
  visit_column_number_4: number | string;
  visit_column_number_5: number | string;
  visit_column_text_1: string;
  visit_column_text_2: string;
  visit_column_text_3: string;
  visit_column_text_4: string;
  visit_column_text_5: string;
  visit_column_text_area_1: string;
  visit_column_text_area_2: string;
  visit_column_text_area_3: string;
  visit_column_text_area_4: string;
  visit_column_text_area_5: string;
  visit_column_date_1: string;
  visit_column_date_2: string;
  visit_column_date_3: string;
  visit_column_date_4: string;
  visit_column_date_5: string;
  visit_column_date_and_time_1: string;
  visit_column_date_and_time_2: string;
  visit_column_date_and_time_3: string;
  visit_column_date_and_time_4: string;
  visit_column_date_and_time_5: string;
  visit_column_time_1: string;
  visit_column_time_2: string;
  visit_column_time_3: string;
  visit_column_time_4: string;
  visit_column_time_5: string;
  visit_column_switch_1: number | boolean;
  visit_column_switch_2: number | boolean;
  visit_column_switch_3: number | boolean;
  visit_column_switch_4: number | boolean;
  visit_column_switch_5: number | boolean;
  visit_column_decimal_1: number | string;
  visit_column_decimal_2: number | string;
  visit_column_decimal_3: number | string;
  visit_column_decimal_4: number | string;
  visit_column_decimal_5: number | string;
  visit_column_dropdown_1: string;
  visit_column_dropdown_2: string;
  visit_column_dropdown_3: string;
  visit_column_dropdown_4: string;
  visit_column_dropdown_5: string;
  visit_column_radio_1: string;
  visit_column_radio_2: string;
  visit_column_radio_3: string;
  visit_column_radio_4: string;
  visit_column_radio_5: string;
  visit_column_attechments_1?: File | string | null;
  visit_column_attechments_2?: File | string | null;
  visit_column_attechments_3?: File | string | null;
  visit_column_attechments_4?: File | string | null;
  visit_column_attechments_5?: File | string | null;
}

export interface IVisitCreateStatus {
  visitId: number | string;
  visit_status: number;
  status_remark: string;
}
export interface IVisitType {
  id: string;
  visit_type: string;
}
export const createProductInitialValues = (
  VisitToEdit: IVisitCreate | undefined
): IVisitCreate => ({
  visit_image: VisitToEdit?.visit_image || "",
  visit_type_id: VisitToEdit?.visit_type_id || "",
  remark: VisitToEdit?.remark || "",
  visitId: VisitToEdit?.visitId || "",
  visit_status: VisitToEdit?.visit_status || 1,
  contact_id: VisitToEdit?.contactId || "",
  person_name: VisitToEdit?.contactName || "",
  status_remark: VisitToEdit?.status_remark || "",
  a_application_login_id:
    VisitToEdit?.a_application_login_id || localStorage.getItem("UUID") || "",
  visit_column_number_1: VisitToEdit?.visit_column_number_1 || "",
  visit_column_number_2: VisitToEdit?.visit_column_number_2 || "",
  visit_column_number_3: VisitToEdit?.visit_column_number_3 || "",
  visit_column_number_4: VisitToEdit?.visit_column_number_4 || "",
  visit_column_number_5: VisitToEdit?.visit_column_number_5 || "",
  visit_column_text_1: VisitToEdit?.visit_column_text_1 || "",
  visit_column_text_2: VisitToEdit?.visit_column_text_2 || "",
  visit_column_text_3: VisitToEdit?.visit_column_text_3 || "",
  visit_column_text_4: VisitToEdit?.visit_column_text_4 || "",
  visit_column_text_5: VisitToEdit?.visit_column_text_5 || "",
  visit_column_text_area_1: VisitToEdit?.visit_column_text_area_1 || "",
  visit_column_text_area_2: VisitToEdit?.visit_column_text_area_2 || "",
  visit_column_text_area_3: VisitToEdit?.visit_column_text_area_3 || "",
  visit_column_text_area_4: VisitToEdit?.visit_column_text_area_4 || "",
  visit_column_text_area_5: VisitToEdit?.visit_column_text_area_5 || "",
  visit_column_date_1: VisitToEdit?.visit_column_date_1 ? formatDate(VisitToEdit?.visit_column_date_1) : "",
  visit_column_date_2: VisitToEdit?.visit_column_date_2 ? formatDate(VisitToEdit?.visit_column_date_2) : "",
  visit_column_date_3: VisitToEdit?.visit_column_date_3 ? formatDate(VisitToEdit?.visit_column_date_3) : "",
  visit_column_date_4: VisitToEdit?.visit_column_date_4 ? formatDate(VisitToEdit?.visit_column_date_4) : "",
  visit_column_date_5: VisitToEdit?.visit_column_date_5 ? formatDate(VisitToEdit?.visit_column_date_5) : "",
  visit_column_date_and_time_1: VisitToEdit?.visit_column_date_and_time_1 ? formatDateAndTime(VisitToEdit?.visit_column_date_and_time_1) : "",
  visit_column_date_and_time_2: VisitToEdit?.visit_column_date_and_time_2 ? formatDateAndTime(VisitToEdit?.visit_column_date_and_time_2) : "",
  visit_column_date_and_time_3: VisitToEdit?.visit_column_date_and_time_3 ? formatDateAndTime(VisitToEdit?.visit_column_date_and_time_3) : "",
  visit_column_date_and_time_4: VisitToEdit?.visit_column_date_and_time_4 ? formatDateAndTime(VisitToEdit?.visit_column_date_and_time_4) : "",
  visit_column_date_and_time_5: VisitToEdit?.visit_column_date_and_time_5 ? formatDateAndTime(VisitToEdit?.visit_column_date_and_time_5) : "",
  visit_column_time_1: VisitToEdit?.visit_column_time_1 || "00:00 AM",
  visit_column_time_2: VisitToEdit?.visit_column_time_2 || "00:00 AM",
  visit_column_time_3: VisitToEdit?.visit_column_time_3 || "00:00 AM",
  visit_column_time_4: VisitToEdit?.visit_column_time_4 || "00:00 AM",
  visit_column_time_5: VisitToEdit?.visit_column_time_5 || "00:00 AM",
  visit_column_switch_1:
    VisitToEdit?.visit_column_switch_1 === 1 ? true : false,
  visit_column_switch_2:
    VisitToEdit?.visit_column_switch_2 === 1 ? true : false,
  visit_column_switch_3:
    VisitToEdit?.visit_column_switch_3 === 1 ? true : false,
  visit_column_switch_4:
    VisitToEdit?.visit_column_switch_4 === 1 ? true : false,
  visit_column_switch_5:
    VisitToEdit?.visit_column_switch_5 === 1 ? true : false,
  visit_column_decimal_1: VisitToEdit?.visit_column_decimal_1 || "",
  visit_column_decimal_2: VisitToEdit?.visit_column_decimal_2 || "",
  visit_column_decimal_3: VisitToEdit?.visit_column_decimal_3 || "",
  visit_column_decimal_4: VisitToEdit?.visit_column_decimal_4 || "",
  visit_column_decimal_5: VisitToEdit?.visit_column_decimal_5 || "",
  visit_column_dropdown_1: VisitToEdit?.visit_column_dropdown_1 || "",
  visit_column_dropdown_2: VisitToEdit?.visit_column_dropdown_2 || "",
  visit_column_dropdown_3: VisitToEdit?.visit_column_dropdown_3 || "",
  visit_column_dropdown_4: VisitToEdit?.visit_column_dropdown_4 || "",
  visit_column_dropdown_5: VisitToEdit?.visit_column_dropdown_5 || "",
  visit_column_radio_1: VisitToEdit?.visit_column_radio_1 || "",
  visit_column_radio_2: VisitToEdit?.visit_column_radio_2 || "",
  visit_column_radio_3: VisitToEdit?.visit_column_radio_3 || "",
  visit_column_radio_4: VisitToEdit?.visit_column_radio_4 || "",
  visit_column_radio_5: VisitToEdit?.visit_column_radio_5 || "",
  visit_column_attechments_1: VisitToEdit?.visit_column_attechments_1 || "",
  visit_column_attechments_2: VisitToEdit?.visit_column_attechments_2 || "",
  visit_column_attechments_3: VisitToEdit?.visit_column_attechments_3 || "",
  visit_column_attechments_4: VisitToEdit?.visit_column_attechments_4 || "",
  visit_column_attechments_5: VisitToEdit?.visit_column_attechments_5 || "",
});

export const createProductValidationSchema = (
  customFormList: ICustomFromList[],
  visitToEdit?: IVisitCreate | undefined
) => {

  const dynamicSchema: any = {};

  customFormList.forEach((item) => {

    if (item.required_or_not === 1 &&
      item.form_type === 3 &&
      item.data_type !== 7 &&
      (
        (visitToEdit && (item.required_for === 2 || item.required_for === 3)) ||
        (!visitToEdit && (item.required_for === 1 || item.required_for === 3))
      )) {
      switch (item.data_type) {
        case 1: // Number
          dynamicSchema[item.reference_column_name] = Yup.number()
            .typeError(`${item.title} must be a number`)
            .required(`${item.title} is required`);
          break;
        case 2: // Text
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`
          );
          break;
        case 3: // Text Area
          dynamicSchema[item.reference_column_name] = Yup.string()
            .trim()
            .required(`${item.title} is required`);
          break;
        case 4: // Date
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`
          );
          break;
        case 5: // Date and Time
          dynamicSchema[item.reference_column_name] = Yup.string()
            .required(
              `${item.title} is required`
            );
          break;
        case 6: // Time
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`
          );
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
            `${item.title} is required`
          );
          break;
        case 10: // Radio
          dynamicSchema[item.reference_column_name] = Yup.string().required(
            `${item.title} is required`
          );
          break;
        default:
          console.warn(
            `Unknown data_type: ${item.data_type} for ${item.title}`
          );
          break;
      }
    }
  });


  return Yup.object().shape({
    visit_type_id: Yup.string().required("Visit Type is Required"),
    remark: Yup.string().required("Remark is Required"),
    ...dynamicSchema,
  });

};



export const createVisit = async (
  formData: FormData,
  values: IVisitCreate,
  setRefreshVisit: TReactSetState<boolean>,
  onHide: () => void
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  if (!getUUID) {
    return;
  }

  try {
    const { data } = await axiosInstance.post("create-visit", formData ,{
      headers: {
        Authorization: `${token}`,
        "x-tenant-id": getUUID,
        "Content-Type": "multipart/form-data",
      },
    });
    if (data.code === 200) {

      const dynamicFields = [
        "visit_column_attechments_1",
        "visit_column_attechments_2",
        "visit_column_attechments_3",
        "visit_column_attechments_4",
        "visit_column_attechments_5",
      ];

      dynamicFields.forEach((field) => {
        if (values[field] instanceof File) {
          formData.append(field, values[field]);
        }
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(data.ack_msg);
        setRefreshVisit(true);

        onHide();
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

export const updateVisit = async (
  formData: FormData,
  values: IVisitCreate,
  setRefreshVisit: TReactSetState<boolean>,
  visitId: number,
  onHide: () => void,
  stop_task_id: number
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID) {
    return;
  }

  try {
    console.log("stop_visit_idstop_visit_idstop_visit_id", stop_task_id);

    // Create FormData for the request
    const requestFormData = new FormData();

    // Append all fields to FormData
    requestFormData.append("visit_id", visitId.toString());
    if (stop_task_id !== undefined && stop_task_id !== null) {
      requestFormData.append("stop_task_id", stop_task_id.toString());
    }
    requestFormData.append("visit_type_id", values.visit_type_id.toString());
    requestFormData.append("remark", values.remark);
    requestFormData.append("a_application_login_id", getUUID);

    if (values.visit_image instanceof File) {
      requestFormData.append("visit_image", values.visit_image);
    }
    const dynamicFields = [
      "visit_column_number_1",
      "visit_column_number_2",
      "visit_column_number_3",
      "visit_column_number_4",
      "visit_column_number_5",
      "visit_column_text_1",
      "visit_column_text_2",
      "visit_column_text_3",
      "visit_column_text_4",
      "visit_column_text_5",
      "visit_column_text_area_1",
      "visit_column_text_area_2",
      "visit_column_text_area_3",
      "visit_column_text_area_4",
      "visit_column_text_area_5",
      "visit_column_date_1",
      "visit_column_date_2",
      "visit_column_date_3",
      "visit_column_date_4",
      "visit_column_date_5",
      "visit_column_date_and_time_1",
      "visit_column_date_and_time_2",
      "visit_column_date_and_time_3",
      "visit_column_date_and_time_4",
      "visit_column_date_and_time_5",
      "visit_column_time_1",
      "visit_column_time_2",
      "visit_column_time_3",
      "visit_column_time_4",
      "visit_column_time_5",
      "visit_column_switch_1",
      "visit_column_switch_2",
      "visit_column_switch_3",
      "visit_column_switch_4",
      "visit_column_switch_5",
      "visit_column_decimal_1",
      "visit_column_decimal_2",
      "visit_column_decimal_3",
      "visit_column_decimal_4",
      "visit_column_decimal_5",
      "visit_column_dropdown_1",
      "visit_column_dropdown_2",
      "visit_column_dropdown_3",
      "visit_column_dropdown_4",
      "visit_column_dropdown_5",
      "visit_column_radio_1",
      "visit_column_radio_2",
      "visit_column_radio_3",
      "visit_column_radio_4",
      "visit_column_radio_5",
      "visit_column_attechments_1",
      "visit_column_attechments_2",
      "visit_column_attechments_3",
      "visit_column_attechments_4",
      "visit_column_attechments_5",
    ];

    dynamicFields.forEach((field) => {
      if (values[field] !== undefined && values[field] !== null) {
        if (values[field] instanceof File) {
          requestFormData.append(field, values[field]);
        } else {
          requestFormData.append(
            field,
            values[field]?.toString() || ""
          );
        }
      }
    });
    for (let [key, value] of requestFormData.entries()) {
      console.log(`${key}: ${value}`);
    }
    const { data } = await axiosInstance.post("update-visit", requestFormData, {
      headers: {
        Authorization: `${token}`,
        "x-tenant-id": getUUID,
        "Content-Type": "multipart/form-data",
      },
    });

    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        onHide();
        setRefreshVisit(true);
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error: any) {
    console.error("Update error:", error);
    toast.error(
      error.response?.data?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED
    );
  }
};

export const updateVisitStatus = async (
  values: IVisitCreateStatus,
  setRefreshVisit: TReactSetState<boolean>,
  visitId: number | undefined,
  onHide: () => void,
  visitStatus: number
) => {
  const token = await localStorage.getItem("token");
  const getUUID = await localStorage.getItem("UUID");

  if (!getUUID) {
    return;
  }
  const requestDataUpdateVisit = {
    visit_id: visitId,
    visit_status: visitStatus,
    status_remark: values.status_remark,
  };
  try {
    const { data } = await axiosInstance.post(
      "update-visit",
      requestDataUpdateVisit
    );
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        onHide();
        setRefreshVisit(true);
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

export const fetchVisitTypeApiForVisit = async (
  setVisitTypeList: TReactSetState<IVisitType[]>
) => {
  const getUUID = localStorage.getItem("UUID");
  const requestData = {
    table: "visit_type_masters",
    columns: "id,visit_type",
    where: ["isDelete=0"],
    request_flag: 0,
    order: `{"id":"DESC"}`,
  };
  try {
    const response = await axiosInstance.post("commonGet", requestData);
    if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      setVisitTypeList(response.data.data);
    } else {
      setVisitTypeList([]);
      toast.error(response.data.ack_msg);
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);

    // Handle error (e.g., show error message, clear filtered list)
    setVisitTypeList([]);
  }
};
