import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";

export const gettemplate = async (
  showTaskTemplateFor: number | undefined,
  setDropdownData: TReactSetState<any>,
) => {
  try {
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      table: "task_templete_masters",
      columns: "id,name,templete_type",
      where: ["isDelete=0", `templete_type=${showTaskTemplateFor}`],
      request_flag: 0,
      order: `{"id":"DESC"}`,
      a_application_login_id: Number(getUUID),
    };

    const template = await axiosInstance.post("commonGet", requestData);

    if (template.data.ack == 1) {
      setDropdownData(template.data.data);
    } else {
      setDropdownData([]);
    }
  } catch (e) {
    toast.error("something Want wrong");
  }
};

export const startWorkflow = async (
  selecetdTemplate: { value: number; label: string } | undefined,
  showOrderId: number | undefined,
  setWorkFlowFor: string | undefined,
  closeConformation: (shouldClose: boolean) => void,
) => {
  try {
    const getUUID = localStorage.getItem("UUID");

    const requestDataforgetTaskIds = {
      a_application_login_id: getUUID,
      task_template_master_id: selecetdTemplate?.value,
      isDelete: 0,
    };

    const getTaskids = await axiosInstance.post(
      "getTaskTemplateDataSource",
      requestDataforgetTaskIds,
    );

    const firstAckCheck = getTaskids.data.ack;

    if (firstAckCheck !== 1) {
      toast.error(getTaskids.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
      return;
    } else {
      const taskIds = getTaskids.data.data.map(
        (item: any) => item.data_sorce.id,
      );
      const getDatavalues = await axiosInstance.post("startWorkflow", {
        ids: taskIds.join(","),
        a_application_login_id: getUUID,
        showOrderId: showOrderId,
        setWorkFlowFor: setWorkFlowFor,
        task_template_master_id: selecetdTemplate?.value,
      });

      const secondAckCheck = getDatavalues.data.ack;

      if (secondAckCheck === 1) {
        toast.success("Task created successfully");
        closeConformation(false);
      } else {
        toast.error(getDatavalues.data.ack_msg || "Workflow creation failed");
      }
    }
  } catch (e) {
    toast.error("Something went wrong while starting workflow");
  }
};

export const checkIsExistWorkflow = async (
  task_template_data_id: string | number,
  reference_table: string | undefined,
  reference_id: string | number | undefined,
  setIsStartWorkFlowStop: TReactSetState<boolean>,
) => {
  try {
    let table;
    if (reference_table === "cart") {
      const type = await cartTypeGet(reference_id);
      let backName = "";

      if (type == 1) {
        backName = "quotation";
      } else if (type == 2) {
        backName = "order";
      } else if (type == 3) {
        backName = "invoice";
      } else if (type == 4) {
        backName = "purchase_order";
      } else if (type == 5) {
        backName = "order_purchase";
      } else if (type == 6) {
        backName = "return_sales_invoice";
      } else if (type == 7) {
        backName = "return_purchase_invoice";
      }
      table = "cart_" + backName;
    } else if (reference_table === "Contact") {
      table = "contact_masters";
    } else if (reference_table === "Inquiry") {
      table = "inquiries";
    } else if (reference_table === "Visit") {
      table = "visits";
    }
    const requestData = {
      table: "task_managements",
      columns: "id",
      where: [
        "isDelete=0",
        `task_template_data_id=${task_template_data_id}`,
        `reference_table=${table}`,
        `reference_id=${reference_id}`,
      ],
      request_flag: 0,
      order: `{"id":"DESC"}`,
    };

    const template = await axiosInstance.post("commonGet", requestData);

    if (template.data.ack == 1) {
      setIsStartWorkFlowStop(template.data.data.length > 0);
    } else {
      setIsStartWorkFlowStop(false);
    }
  } catch (e) {}
};

export const stopWorkFlow = async (
  task_template_data_id: string | number,
  reference_table: string | undefined,
  reference_id: string | number | undefined,
  setIsStopWorkFlowLoading: TReactSetState<boolean>,
) => {
  setIsStopWorkFlowLoading(true);
  let table;
  if (reference_table === "cart") {
    const type = await cartTypeGet(reference_id);
    let backName = "";

    if (type == 1) {
      backName = "quotation";
    } else if (type == 2) {
      backName = "order";
    } else if (type == 3) {
      backName = "invoice";
    } else if (type == 4) {
      backName = "purchase_order";
    } else if (type == 5) {
      backName = "order_purchase";
    } else if (type == 6) {
      backName = "return_sales_invoice";
    } else if (type == 7) {
      backName = "return_purchase_invoice";
    } else if (type == 8) {
      backName = "inward";
    } else if (type == 9) {
      backName = "dispatch";
    }
    table = "cart_" + backName;
  } else if (reference_table === "Contact") {
    table = "contact_masters";
  } else if (reference_table === "Inquiry") {
    table = "inquiries";
  } else if (reference_table === "Visit") {
    table = "visits";
  }
  const requestData = {
    table: "task_managements",
    where: `{"reference_table":"${table}","reference_id":"${reference_id}","task_template_data_id":"${task_template_data_id}"}`,
    data: `{"isDelete":"1"}`,
  };

  try {
    const { data } = await axiosInstance.post("commonUpdate", requestData);

    if (data.code === 200) {
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success("Workflow stop successfully!");
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } else {
      toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  } catch (error) {
    toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
  } finally {
    setIsStopWorkFlowLoading(false);
  }
};

const cartTypeGet = async (cart_id: string | number | undefined) => {
  try {
    const requestData = {
      table: "carts",
      columns: "type",
      where: ["isDelete=0", `id=${cart_id}`],
      request_flag: 0,
      order: `{"id":"DESC"}`,
    };

    const template = await axiosInstance.post("commonGet", requestData);

    if (template.data.ack == 1) {
      return template.data.data?.[0]?.type;
    } else {
      return 0;
    }
  } catch (e) {
    return 0;
  }
};
