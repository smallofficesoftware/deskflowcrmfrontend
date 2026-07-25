import { toast } from "react-toastify";
import * as Yup from "yup";
import { formatDateTimeSendDataBase } from "../../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../../helpers/AppConstants";
import { TReactSetState } from "../../../../../../helpers/AppType";
import { axiosInstance } from "../../../../../../services/axiosInstance";
import { IEmpAccountTransaction } from "../EmpAccountTransactionController";


export const paymentTypesList = [
    { id: "1", type_name: "Credit" },
    { id: "2", type_name: "Debit" },
];
export const paymentModeList = [
    { id: "1", mode_name: "Cash" },
    { id: "2", mode_name: "Cheque" },
    { id: "3", mode_name: "Online Portal" },
    { id: "4", mode_name: "UPI" },
    { id: "5", mode_name: "Bank transfer by NEFT" },
    { id: "6", mode_name: "Bank transfer by RTGS" },
    { id: "7", mode_name: "Bank transfer by IMPS" },
    { id: "-1", mode_name: "Other" },
    { id: "-2", mode_name: "Kasar Account" },

];
export interface ICreateEmpAccountTransaction {
    type: string;
    mode: string;
    amount: number | string;
    payment_date_time: string | Date
    remark: string;
    auto_reverse_entry?: number;
}

const formatDateForDateTimeLocal = (dateString: any) => {
    if (!dateString) return "";

    // Assuming input format is "DD-MM-YYYY HH:mm"
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("-");

    // Reformat to "YYYY-MM-DDTHH:mm"
    return `${year}-${month}-${day}T${timePart}`;
};
const formatRemark = (input: string) =>
    input
        .replace(/<br\s*\/?>/gi, "\n") // Replace <br> or <br/> with \n
        .replace(/<[^>]*>/g, ""); // Remove other HTML tags

export const createAccountTransactionInitialValues = (
    accountTransactionToEdit: IEmpAccountTransaction | undefined
): ICreateEmpAccountTransaction => ({
    type: accountTransactionToEdit?.type || "",
    mode: accountTransactionToEdit?.mode || "",
    amount: accountTransactionToEdit?.amount || " ",
    payment_date_time: accountTransactionToEdit?.payment_date_time
        ? formatDateForDateTimeLocal(accountTransactionToEdit.payment_date_time)
        : "",
    remark: accountTransactionToEdit?.remark
        ? formatRemark(accountTransactionToEdit.remark)
        : "",
    auto_reverse_entry: 0
});

export const createEmpAccountTransactionValidationSchema = () =>
    Yup.object().shape({
        amount: Yup.number()
            .transform((value, originalValue) =>
                typeof originalValue === "string" && originalValue.trim() === "" ? null : value
            )
            .typeError("Amount must be a valid number") // Prevents non-numeric strings
            .test("not-zero", "Amount cannot be 0", (value) => value !== 0)
            .required("Amount is required"),
        type: Yup.string().required("Payment Type is required"),
        mode: Yup.string().required("Payment By is required"),
        payment_date_time: Yup.string().required("Payment Date & Time is required")

    });

export const createAccountTransaction = async (
    values: ICreateEmpAccountTransaction,
    team_id: number,
    onHide: () => void,
    setRefreshTransactions: TReactSetState<boolean>
) => {



    const getUUID = await localStorage.getItem("UUID");
    const convertPaymentDateTimeDate = formatDateTimeSendDataBase(
        new Date(values.payment_date_time)
    );
    const currentDateTime = new Date();
    const formattedDateTime = formatDateTimeSendDataBase(currentDateTime);

    try {
        const requestData = {
            a_application_login_id: getUUID,
            team_id: team_id,
            amount: values.amount,
            type: values.type,
            mode: values.mode,
            remark: values.remark,
            payment_date_time: convertPaymentDateTimeDate,
            auto_reverse_entry: values.auto_reverse_entry
        };

        const { data } = await axiosInstance.post("employeeAccountTransactionCreate", requestData
        );
        if (data.code === 200) {
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                toast.success(data.ack_msg);
                setRefreshTransactions(true)
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

export const updateAccountTransaction = async (
    values: ICreateEmpAccountTransaction,
    onHide: () => void,
    accountTransactionItemId: number,
    setRefreshTransactions: TReactSetState<boolean>
) => {
    const convertPaymentDateTimeDate = formatDateTimeSendDataBase(
        new Date(values.payment_date_time)
    );

    try {
        const requestData = {
            table: "employee_account_transactions",
            where: `{"id":"${accountTransactionItemId}"}`,
            data: JSON.stringify({
                amount: values.amount,
                type: values.type,
                mode: values.mode,
                remark: values.remark.replace(/\n/g, "<br>"),
                payment_date_time: convertPaymentDateTimeDate,
            }),
        };
        const getUUID = localStorage.getItem("UUID")

        const { data } = await axiosInstance.post("commonUpdate", requestData
        );
        if (data.code === 200) {
            if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                toast.success(data.ack_msg);
                setRefreshTransactions(true)
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

export const fetchCategoryApiForProduct = async (
    setTaskCategoryList: TReactSetState<
        { id: number; task_category_name: string }[]
    >,
) => {
    const getUUID = await localStorage.getItem("UUID");
    const token = await localStorage.getItem("token");

    if (!getUUID || !token) {
        toast.error("Authentication details are missing");
        setTaskCategoryList([]);
        return;
    }

    const requestData = {
        table: "payment_types",
        columns: "id,payment_type_name",
        where: ["isDelete=0"],
        request_flag: 0,
        order: `{"id":"DESC"}`,
        a_application_login_id: Number(getUUID),
    };

    try {
        const response = await axiosInstance.post("commonGet", requestData);

        if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setTaskCategoryList(response.data.data);
        } else {
            toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            setTaskCategoryList([]);
        }
    } catch (error: any) {
        toast.error(
            error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
        );
        setTaskCategoryList([]);
    }
};