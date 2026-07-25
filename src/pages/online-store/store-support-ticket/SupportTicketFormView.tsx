import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import { useFeatureFlagStore } from "../../../store/supportTicket/useSupportTicketFlag";


interface FormState {
    task_title: string;
    task_remark: string;
    task_category_id: any;
    task_attechment: File | null;
    user_name: string;
    phone_number: string;
}
// interface Props {
//     onSuccess: () => void;
//     showExtraButton?: boolean;   // control extra button
//     onExtraClick?: () => void;  // click handler
//     isExtraVisible?: boolean;   // condition for showing
//     fullWidth?: boolean;
// }
interface HeaderProps {
    onSuccess: () => void;
    qrCode: string;
    contactID: string;
}
const SupportTicketFormView = ({ qrCode, contactID, onSuccess }: HeaderProps) => {

    const fetchCategoryApiForProduct = async (
        setTaskCategoryList: TReactSetState<
            { id: number; task_category_name: string }[]
        >,
    ) => {
        const token = await localStorage.getItem("token");
        const requestData = {
            qr_code: qrCode,
        };
        try {
            const response = await axiosInstance.post("get-store-ticket-category", requestData,
                {
                    headers: {
                        Authorization: `${token}`,
                    },
                }
            );
            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setTaskCategoryList(response.data.data.item);
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

    const fetchContactDetailsApi = async (
        setContactDetailsList: TReactSetState<
            { person_name: string; mobile_number: string }[]
        >,
    ) => {
        const token = await localStorage.getItem("token");
        const requestData = {
            qr_code: qrCode,
            contactID: contactID
        };
        try {
            const response = await axiosInstance.post("get-store-ticket-contact", requestData,
                {
                    headers: {
                        Authorization: `${token}`,
                    },
                }
            );
            if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setContactDetailsList([response.data.data.item]);
            } else {
                toast.error(response.data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
                setContactDetailsList([]);
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED,
            );
            setContactDetailsList([]);
        }
    };

    const createStoreSupportTicket = async (formData: FormState) => {

        const token = localStorage.getItem("token");
        const data = {
            qr_code: qrCode,
            contactID: contactID,
            task_title: formData.task_title,
            task_remark: formData.task_remark,
            task_attechment: formData.task_attechment,
            task_category_id: formData.task_category_id,
            user_name: formData.user_name,
            phone_number: formData.phone_number,
        }

        const response = await axiosInstance.post(
            "create-store-support-ticket",
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `${token}`
                },
            }
        );

        return response.data;
    };

    const handleBack = () => {
        window.close();
    };
    const { flags } = useFeatureFlagStore();
    const shouldShowMessage =
        flags.RAISE_SUPPORT_TICKET_FLAG === 2 &&
        flags.SUPPORT_TICKET_INFO_MESSAGE?.trim() !== "";

    // const [username, setUsername] = useState("");
    // const [phoneNumber, setPhoneNumber] = useState("");

    // useEffect(() => {
    //     const init = async () => {
    //         await fetchNameAndNumber(
    //             (name: string, phone: string) => {
    //                 setFormData((prev) => ({
    //                     ...prev,
    //                     user_name: name,
    //                     phone_number: phone,
    //                 }));
    //             }
    //         );
    //     };
    //     init();
    // }, []);

    const [formData, setFormData] = useState<FormState>({
        task_title: "",
        task_remark: "",
        task_category_id: 0,
        task_attechment: null,
        user_name: "",
        phone_number: "",
    });

    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const [taskCategoryList, setTaskCategoryList] = useState<any>([]);
    const [contactDetailsList, setContactDetailsList] = useState<any>([]);
    const [taskCategoryId, setTaskCategoryId] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {

        const { name, value } = e.target;

        if (e.target instanceof HTMLInputElement && e.target.files) {
            setFormData({
                ...formData,
                [name]: e.target.files[0],
            });
        } else {
            if (name === "task_remark" && value.length >= 30) {
                setShowError(false);
            }
            // Default: update formData
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.task_remark.length < 30) {
            setShowError(true);
            return;
        }

        if (formData.task_remark.length > 400) {
            toast.error("Maximum 400 characters allowed");
            return;
        }

        const htmlRegex = /<\/?[a-z][\s\S]*>/i;
        if (htmlRegex.test(formData.task_remark)) {
            toast.error("Invalid Data Please Add Valid Description");
            return;
        }

        if (formData.phone_number.length > 10 || formData.phone_number.length < 10) {
            toast.error("Phone Number must be of 10 numbers");
            return;
        }

        const file = formData.task_attechment;

        if (file) {
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "application/pdf",
            ];

            const maxSize = 5 * 1024 * 1024;

            if (!allowedTypes.includes(file.type)) {
                toast.error("Only JPG, JPEG, PNG and PDF files are allowed");
                return;
            }

            if (file.size > maxSize) {
                toast.error("File size must be less than 5MB");
                return;
            }
        }

        setShowError(false);
        setLoading(true);

        try {
            await createStoreSupportTicket(formData);
            onSuccess();
            toast.success("Ticket submitted successfully");

            setFormData((prev) => ({
                ...prev,
                task_title: "",
                task_remark: "",
                task_category_id: 0,
                task_attechment: null,
            }));

        } catch (error) {
            console.error("Submit Error:", error);
        }

        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            await fetchCategoryApiForProduct(setTaskCategoryList)
        };
        init();
    }, []);
    useEffect(() => {
        const init = async () => {
            await fetchContactDetailsApi(setContactDetailsList)
        };
        init();
    }, []);

    useEffect(() => {
        if (contactDetailsList && contactDetailsList.length > 0) {
            const firstContact = contactDetailsList[0]; // assuming single contact

            setFormData((prev) => ({
                ...prev,
                user_name: firstContact.person_name || "",
                phone_number: firstContact.mobile_number || "",
            }));
        }
    }, [contactDetailsList]);

    const taskCategoryOptions = useMemo(
        () =>
            taskCategoryList.map((category: any) => ({
                value: category.id,
                label: category.task_category_name,
            })),
        [taskCategoryList],
    );


    return (
        <div
            style={{
                width: "30vw",
                padding: "10px",
                // paddingBottom: 0,
            }}
        >
            <div
                style={{
                    backgroundColor: "#4C4C4C",
                    width: "100%",
                    height: "50px",
                    borderRadius: "7px",
                    color: "white",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "10px 15px",
                    gap: "20px"
                }}
            >
                {/* {isExtraVisible && (
                    <span
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", marginBottom: "3px" }}
                        onClick={handleBack}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="currentColor"
                        >
                            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
                        </svg>
                    </span>
                )} */}



                <h4 style={{ margin: 0 }}>
                    Customer Support Ticket
                </h4>
            </div>
            {/* {shouldShowMessage && (
                <div className="support-message" style={{ textAlign: "center" }}>
                    {flags.SUPPORT_TICKET_INFO_MESSAGE}
                </div>
            )} */}
            <div className="card w-100" >

                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        {/* Title */}
                        <div className="mb-3">
                            <label className="form-label">
                                <b>Company Name</b><span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="task_title"
                                value={formData.task_title}
                                onChange={handleChange}
                                placeholder="Enter company name"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-3">
                            <label className="form-label"><b>Describe Your Problem</b><span className="text-danger">*  <span style={{ fontSize: "0.85rem" }}>(Minimum 30 Characters Required)</span></span>

                            </label>
                            <textarea
                                className="form-control"
                                rows={1}
                                name="task_remark"
                                value={formData.task_remark}
                                onChange={handleChange}
                                placeholder="Enter your problem"
                                required
                                maxLength={400}
                            />
                        </div>
                        {showError && (
                            <span className="text-danger ms-2" style={{ fontSize: "0.85rem" }}>
                                (Minimum 30 and Maximum 400 Characters Required)
                            </span>
                        )}
                        <div className="mb-3">
                            <label className="form-label"><b>Your Name</b><span className="text-danger">*</span>

                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="user_name"
                                value={formData.user_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label"><b>Phone Number</b><span className="text-danger">*</span>

                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <div className="form-group">
                                <label htmlFor="task_category_id" className="mb-1 form_label">
                                    <b>Select Category</b>
                                </label>
                                {/* 
                                {canAddExpenseCategory && (
                                    <span
                                        className="ms-2"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setIsOpenAddTaskCategoryModal(true)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            height="24px"
                                            viewBox="0 -960 960 960"
                                            width="24px"
                                            fill="currentColor"
                                        >
                                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                                        </svg>
                                    </span>
                                )} */}

                                <select
                                    id="task_category_id"
                                    className="form-control"
                                    value={formData.task_category_id ?? 0}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            task_category_id: e.target.value
                                                ? Number(e.target.value)
                                                : null,
                                        })
                                    }
                                >
                                    <option value="">Select Category</option>
                                    {taskCategoryOptions.map((option: any) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* Attachment */}
                        <div className="mb-3">
                            <label className="form-label">
                                <b>Attachment</b>
                                <span className="text-danger" style={{ fontSize: "0.85rem" }}>  (JPG, PNG & PDF files allowed)(Max size: 5 MB)</span>
                            </label>
                            <input
                                type="file"
                                className="form-control"
                                name="task_attechment"
                                onChange={handleChange}
                                accept=".jpg,.jpeg,.png,.pdf"
                            />
                        </div>
                        <div className="d-flex gap-2">
                            {/* {showExtraButton && (
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ backgroundColor: "#6c757d", color: "white", width: "49%" }}
                                    onClick={onExtraClick}
                                >
                                    View All Tickets
                                </button>
                            )} */}
                            {/* Submit */}
                            <button
                                type="submit"
                                className="btn"
                                style={{ backgroundColor: "#F38534", color: "white", width: "100%" }}
                                disabled={loading}
                                // onSubmit={handleSubmit}
                            >
                                {loading ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <style>
                {`

                .support-message {
  color: #f10808;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 500;
  font-style: italic;

  /* Glow effect */
  /* Animation */
  animation: blinkHighlight 0.8s infinite;
}

/* Smooth blinking (not harsh) */
@keyframes blinkHighlight {
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
                `}
            </style>
        </div>
    );
};

export default SupportTicketFormView;