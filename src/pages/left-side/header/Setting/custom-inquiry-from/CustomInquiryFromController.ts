import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";

export const orderTypesCustomInquiryList = [
  { id: "1", order_type_display: "Number" },
  { id: "2", order_type_display: "Text" },
  { id: "3", order_type_display: "TextArea" },
  { id: "4", order_type_display: "Date" },
  { id: "5", order_type_display: "DateAndTime" },
  { id: "6", order_type_display: "Time" },
  { id: "7", order_type_display: "Switch" },
  { id: "8", order_type_display: "Decimal" },
  { id: "9", order_type_display: "DropDown" },
  { id: "10", order_type_display: "Radio" },
  { id: "11", order_type_display: "Page Text" },
  { id: "12", order_type_display: "Page Url" },
  { id: "13", order_type_display: "Attachments" },
  { id: "14", order_type_display: "Document Designer Page" },
];

export const validationTypeList = [
  { id: "1", label: "Numeric" },
  { id: "2", label: "Alphanumeric" },
  { id: "3", label: "Alpha" },
  { id: "4", label: "Alpha with special Character" },
  { id: "5", label: "Numeric + Special Character" },
  { id: "6", label: "Alphanumeric + Special Character" },
];

export const reqTypesCustomInquiryList = [
  { id: "1", order_type_display: "Yes" },
  { id: "2", order_type_display: "No" },
];
export const printTypesCustomInquiryList = [
  { id: "1", order_type_display: "Yes" },
  { id: "2", order_type_display: "No" },
];
export const rowOrColumnTypesCustomInquiryList = [
  { id: "1", order_type_display: "Row" },
  { id: "2", order_type_display: "Column" },
];

export const requiredForTypesCustomInquiryList = [
  { id: "1", order_type_display: "Create" },
  { id: "2", order_type_display: "Stop" },
];

export const reportPrintTypesCustomInquiryList = [
  { id: "1", order_type_display: "Yes" },
  { id: "2", order_type_display: "No" },
];

export const pageTypesCustomFieldList = [
  { id: "1", order_type_display: "contact" },
  { id: "2", order_type_display: "Inquiry" },
  { id: "3", order_type_display: "Visit" },
  { id: "4", order_type_display: "Product" },
  { id: "5", order_type_display: "Quotation" },
  { id: "6", order_type_display: "Sales Order" },
  { id: "7", order_type_display: "Sales Invoice" },
  { id: "10", order_type_display: "Return Sales Invoice" },
  { id: "9", order_type_display: "Purchase Order" },
  { id: "8", order_type_display: "Purchase Invoice" },
  { id: "11", order_type_display: "Return Purchase Invoice" },
  { id: "12", order_type_display: "Goods Received Note" },
  { id: "13", order_type_display: "Dispatch" },
  { id: "14", order_type_display: "Task" },
  { id: "15", order_type_display: "Support Ticket" },
  { id: "16", order_type_display: "Proforma Invoice" },
];
export const productApplicableModulesList = [
  { id: "4", order_type_display: "Product Master" },
  { id: "5", order_type_display: "Quotation" },
  { id: "6", order_type_display: "Sales Order" },
  { id: "7", order_type_display: "Sales Invoice" },
  { id: "8", order_type_display: "Purchase Invoice" },
  { id: "9", order_type_display: "Purchase Order" },
  { id: "10", order_type_display: "Return Sales Invoice" },
  { id: "11", order_type_display: "Return Purchase Invoice" },
  { id: "12", order_type_display: "Goods Received Note" },
  { id: "13", order_type_display: "Dispatch" },
  { id: "16", order_type_display: "Proforma Invoice" },
];
export interface ICustomInquiryFromList {
  id: number;
  title: string;
  data_type: number;
  display_order: number;
  required_or_not: number;
  print_or_not: number;
  data_sorce: string;
  form_type: number;
  report_print_or_not: number;
  reference_column_name: string;
  product_feild_row_column: number;
  required_for: number;
  min_limit: number;
  max_limit: number;
  validation_type: number;
  third_party_field_name?: string;
  applicable_modules?: string;
}
interface IAddCustomInquiryFromObj {
  title: string;
  data_type: number;
  display_order: number;
  required_or_not: number;
  print_or_not: number;
  form_type: number;
  report_print_or_not: number;
  product_feild_row_column: number;
  required_for: number;
  min_limit: number;
  max_limit: number;
  validation_type: number;
  third_party_field_name?: string;
  applicable_modules?: string;
}
export interface ICompany {
  quotation_title: string;
  order_title: string;
  invoice_title: string;
  purchase_title: string;
  purchase_order_title: string;
  return_sales_invoice_title: string;
  return_purchase_invoice_title: string;
  inward_title: string;
  dispatch_title: string;
}
export const fetchCustomInquiryFromApi = async (
  setCustomInquiryFromList: TReactSetState<ICustomInquiryFromList[]>,
  setLoading: TReactSetState<boolean>,
  pageType: number
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "custom_field_form_masters",
    columns: "id,title,data_type,display_order,required_or_not,print_or_not,data_sorce,report_print_or_not,reference_column_name,form_type,product_feild_row_column,required_for,min_limit,max_limit,validation_type,third_party_field_name,applicable_modules",
    where: [
      "isDelete=0",
      `form_type=${pageType}`,
      // `a_application_login_id=${getUUID}||0`,
    ],
    request_flag: 0,
    order: `{"display_order":"ASC"}`,
  };
  try {
    const data = await axiosInstance.post("commonGet", requestData);
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setLoading(false);
      setCustomInquiryFromList([]);
    }
    setLoading(true);
    setCustomInquiryFromList(data.data.data);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setTimeout(() => {
      setLoading(false); // Set loading to false after minimum time
    }, 1000); // 1000 milliseconds (1 seconds)
  }
};

export const fetchColumnData = async (
  setCustomFeildCount: TReactSetState<number>,
  columnName: string,
  setFormType: number,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");


  let table = "contact_masters";
  let type;
  let is_support_ticket;

  // Dynamically assign the table based on form type
  switch (setFormType) {
    case 1:
      table = "contact_masters";
      break;
    case 2:
      table = "inquiries";
      break;
    case 3:
      table = "visits";
      break;
    case 4:
      table = "products";
      break;
    case 5:
      table = "carts";
      type = 1;
      break;
    case 6:
      table = "carts";
      type = 2;
      break;
    case 7:
      table = "carts";
      type = 3;
      break;
    case 8:
      table = "carts";
      type = 4;
      break;
    case 9:
      table = "carts";
      type = 5;
      break;
    case 10:
      table = "carts";
      type = 6;
      break;
    case 11:
      table = "carts";
      type = 7;
      break;
    case 12:
      table = "task_managements";
      is_support_ticket = 0;
      break;
    case 13:
      table = "task_managements";
      is_support_ticket = 1;
      break;
    default:
      table = "contact_masters";
  }

  // const columns = setCustomFeildName && setCustomFeildName.length > 0 && setCustomFeildName.some(field => field && field.trim() !== "") 
  //   ? setCustomFeildName
  //   : null;

  const whereObj = [
    `${columnName} != `,
    ...(type ? [`type = ${type}`] : [])
  ]

  // Prepare the request data
  const requestData = {
    table,
    columns: `${columnName}`,
    where: whereObj,
    request_flag: 0,
    order: JSON.stringify({ id: "DESC" }),
  };
  // console.log("requestDatarequestDatarequestData", requestData);

  try {
    const data = await axiosInstance.post("commonGet", requestData);

    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      setCustomFeildCount(0);
    } else {
      setCustomFeildCount(data.data.data.length);
    }
  } catch (e) {
    console.log(e);
  }
};


export const fetchCompanyForTitle = async (
  setCompanyTitle: TReactSetState<ICompany | undefined>,
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  try {
    const data = await axiosInstance.post(
      "company",
      {
        a_application_login_id: Number(getUUID),
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(data.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return;
    }
    setCompanyTitle(data.data.data.item[0]);
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    setCompanyTitle(undefined);
  }
};


export const createCustomInquiryFrom = async (
  customInquiryFromInput: IAddCustomInquiryFromObj,
  setLoading: TReactSetState<boolean>,
  clearFormCallback: () => void, //,
  pageType: number
) => {
  const getUUID = await localStorage.getItem("UUID");
  const token = await localStorage.getItem("token");

  const requestData = {
    title: customInquiryFromInput.title,
    data_type: customInquiryFromInput.data_type,
    display_order: 0, // Include the HTML content here
    required_or_not: customInquiryFromInput.required_or_not,
    product_feild_row_column: customInquiryFromInput.product_feild_row_column,
    required_for: customInquiryFromInput.required_for,
    print_or_not: customInquiryFromInput.print_or_not,
    report_print_or_not: customInquiryFromInput.report_print_or_not,
    a_application_login_id: Number(getUUID),
    form_type: customInquiryFromInput.form_type,
    min_limit: customInquiryFromInput.min_limit,
    max_limit: customInquiryFromInput.max_limit,
    validation_type: customInquiryFromInput.validation_type,
    third_party_field_name: customInquiryFromInput.third_party_field_name,
    applicable_modules: customInquiryFromInput.applicable_modules,
  };
  console.log("requestDatarequestDatarequestDatarequestData", requestData);

  try {
    const { data } = await axiosInstance.post(
      "createCustomFieldFrom",
      requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
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

export const updateCustomInqFrom = async (
  customInquiryFromInput: IAddCustomInquiryFromObj,
  setLoading: TReactSetState<boolean>,
  editCustomInqFromId: number | undefined,
  clearForm: () => void,
  pageType: number
) => {
  const getUUID = await localStorage.getItem("UUID");
  const requestData = {
    table: "custom_field_form_masters",
    where: `{"id":"${editCustomInqFromId}"}`,
    data: JSON.stringify({
      title: customInquiryFromInput.title,
      data_type: customInquiryFromInput.data_type,
      display_order: customInquiryFromInput.display_order, // Include the HTML content here
      required_or_not: customInquiryFromInput.required_or_not,
      product_feild_row_column: customInquiryFromInput.product_feild_row_column,
      required_for: customInquiryFromInput.required_for,

      print_or_not: customInquiryFromInput.print_or_not,
      report_print_or_not: customInquiryFromInput.report_print_or_not,
      form_type: customInquiryFromInput.form_type,
      min_limit: customInquiryFromInput.min_limit,
      max_limit: customInquiryFromInput.max_limit,
      validation_type: customInquiryFromInput.validation_type,
      third_party_field_name: customInquiryFromInput.third_party_field_name,
      applicable_modules: customInquiryFromInput.applicable_modules,
    }),
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
};

export const handleDeleteCustomInquiryFrom = async (
  customInquiryFromId: number | undefined,
  setIsDeleteConfirmation: TReactSetState<boolean>,
  setCustomInquiryFromList: TReactSetState<ICustomInquiryFromList[]>,
  setLoading: TReactSetState<boolean>,
  pageType: number,
  columnNameForDelete: string | undefined
) => {
  const requestData = {
    table: "custom_field_form_masters",
    where: `{"id":${customInquiryFromId}}`,
    data: `{"isDelete":"1"}`,
    columnNameForDelete: columnNameForDelete
  };
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsDeleteConfirmation(false);
        fetchCustomInquiryFromApi(
          setCustomInquiryFromList,
          setLoading,
          pageType
        );
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};

export interface IDisplayOrderCreate {
  display_order: number | string;
}
export const updateDisplayOrderCustomInqFrom = async (
  displayOrderInput: IDisplayOrderCreate,
  editStageStatusId: number | undefined
) => {
  const requestData = {
    table: "custom_field_form_masters",
    where: `{"id":"${editStageStatusId}"}`,
    data: `{"display_order":"${displayOrderInput.display_order}" }`,
  };
  const getUUID = localStorage.getItem("UUID");
  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);
    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    }
  } catch (error: any) {
    toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  }
};
