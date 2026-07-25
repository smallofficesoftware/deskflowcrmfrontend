import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { ICompany } from "../../../list-company/ListCompanyController";

export interface IConfigList {
    id: number;
    module: string;
    template_id: string;
    template_name: string;
    variable_mappings: string;
    user_id: string;
    created_at: string;
    username: string;
}

export type CompanyField =
    | {
        id: number;
        type: "company";
        key: keyof ICompany;
        label: string;
        module: string;
        action: () => void;
    }
    | {
        id: number;
        type: "static";
        key: string;
        label: string;
        module: string;
        action: () => void;
    };

export const fetchCompanyTitleFields = (
    companyData: ICompany,
    setIsOrderShowNum: TReactSetState<string>,
    setDynamicName: TReactSetState<string>,
    setContextParamsKey: TReactSetState<string>,
    setWhatsappTemplateShowModal: TReactSetState<boolean>,
    setCompanyTitleFields: TReactSetState<CompanyField[] | undefined>
) => {

    const companyTitleFields: CompanyField[] = [
        {
            id: 1, type: "company", key: "quotation_title", module: "carts_1", label: "Quotation", action: () => {
                setIsOrderShowNum(`carts_${1}`);
                const value = companyData?.["quotation_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Quotation",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 2, type: "company", key: "order_title", label: "Order", module: "carts_2", action: () => {
                setIsOrderShowNum(`carts_${2}`);
                const value = companyData?.["order_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Order",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 3, type: "company", key: "dispatch_title", label: "Dispatch", module: "carts_9", action: () => {
                setIsOrderShowNum(`carts_${9}`);
                const value = companyData?.["dispatch_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Dispatch",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 4, type: "company", key: "invoice_title", label: "Invoice", module: "carts_3", action: () => {
                setIsOrderShowNum(`carts_${3}`);
                const value = companyData?.["invoice_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Invoice",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 5, type: "company", key: "return_sales_invoice_title", label: "Return Sales Invoice", module: "carts_6", action: () => {
                setIsOrderShowNum(`carts_${6}`);
                const value = companyData?.["return_sales_invoice_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Return Sales Invoice",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 6, type: "company", key: "purchase_order_title", label: "Purchase Order", module: "carts_5", action: () => {
                setIsOrderShowNum(`carts_${5}`);
                const value = companyData?.["purchase_order_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Purchase Order",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 7, type: "company", key: "inward_title", label: "Inward", module: "carts_8", action: () => {
                setIsOrderShowNum(`carts_${8}`);
                const value = companyData?.["inward_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Inward",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 8, type: "company", key: "purchase_title", label: "Purchase", module: "carts_4", action: () => {
                setIsOrderShowNum(`carts_${4}`);
                const value = companyData?.["purchase_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Purchase",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 9,
            key: "return_purchase_invoice_title",
            label: "Return Purchase Invoice",
            type: "company",
            module: "carts_7",
            action: () => {
                setIsOrderShowNum(`carts_${7}`);
                const value = companyData?.["return_purchase_invoice_title"];

                setDynamicName(
                    typeof value === "string"
                        ? value
                        : "Return Purchase Invoice",
                );
                setContextParamsKey("orderId");
                setWhatsappTemplateShowModal(true);
            }
        },
        {
            id: 10,
            type: "static",
            key: "account_transaction",
            label: "Account Transaction",
            module: "account_transaction",
            action: () => {
                setIsOrderShowNum("account_transaction");
                setDynamicName("Account Transaction");
                setContextParamsKey("acc_id");
                setWhatsappTemplateShowModal(true);
            }
        },

        {
            id: 11,
            type: "static",
            key: "customer_acc_transaction",
            label: "Account Transaction Customer Ledger",
            module: "customer_acc_transaction",
            action: () => {
                setIsOrderShowNum("customer_acc_transaction");
                setDynamicName("Account Transaction Customer Ledger");
                setContextParamsKey("customer_id");
                setWhatsappTemplateShowModal(true);
            }
        },

        {
            id: 12,
            type: "static",
            key: "task_whatsapp_send",
            label: "Task Whatsapp Send",
            module: "task_whatsapp_send",
            action: () => {
                setIsOrderShowNum("task_whatsapp_send");
                setDynamicName("Task Whatsapp Send");
                setContextParamsKey("customer_id");
                setWhatsappTemplateShowModal(true);
            }
        }
    ] as const;

    setCompanyTitleFields(companyTitleFields);
}

export const fetchWhatsappTemplateConfig = async (
    setConfigList: (data: IConfigList[]) => void,
    setLoading: (data: boolean) => void,
) => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = {
        a_application_login_id
    };

    try {
        setLoading(true);

        const response = await axiosInstance.post(
            "/get-whatsapp-template-config",
            payload,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": a_application_login_id,
                },
            }
        );

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setConfigList(response.data.data.item);
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
    } finally {
        setLoading(false);
    }
};

export const removeWhatsappConfig = async (
    module: string,
) => {
    const a_application_login_id = localStorage.getItem("UUID");
    const token = localStorage.getItem("token");

    const payload = {
        module
    };

    try {

        const response = await axiosInstance.post(
            "/delete-whatsapp-template-config",
            payload,
            {
                headers: {
                    Authorization: `${token}`,
                    "x-tenant-id": a_application_login_id,
                },
            }
        );

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            toast.success("Config Removed Successfully");
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED
        );
    }
};