import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";

interface AddCategoryModalProps {
    show: boolean;
    onHide: () => void;
    handleSubmit?: (value: any) => void;
    title: string;
    placeholder?: string;
    handleClearInput?: () => void;
    btn1: string;
    btn2: string;
    displayClearButton?: boolean;
    apiURL?: string;
    payload?: any;
    payloadKey?: string;
    group_id: number | undefined;
    dynamicFields?: { name: string; placeholder: string; label?: string }[];
    extraPayloadFields?: { [key: string]: any };
}

const getPaylaod = (payloadKey: string, input: any, group_id: any, extraFields: { [key: string]: any } = {}) => {
    const UUID = localStorage.getItem("UUID");
    switch (payloadKey) {
        case "addProductCategory":
            return {
                table: "categories",
                data: JSON.stringify({ category_name: input, isDelete: 0, group_id: group_id, a_application_login_id: Number(UUID), ...extraFields }),
                a_application_login_id: UUID
            };
        case "addContactSourceType":
            return {
                table: "source_types",
                data: JSON.stringify({ source_name: input, isDelete: 0, a_application_login_id: Number(UUID), ...extraFields })
            }
        case "addContactAssignLabel":
            return {
                table: "lable_masters",
                data: JSON.stringify({ lable_name: input, isDelete: 0, a_application_login_id: Number(UUID), ...extraFields })
            }
        case "addCountry":
            return {
                table: "a_countries",
                data: JSON.stringify({ country_name: input.country_name, country_code: input.country_code, country_iso: input.country_iso, isDelete: 0, a_application_login_id: Number(UUID), ...extraFields })
            }
        case "addState":
            return {
                table: "a_states",
                data: JSON.stringify({ state_name: input, isActive: 1, isDelete: 0, ...extraFields })
            }
        case "addCity":
            return {
                table: "a_cities",
                data: JSON.stringify({ city_name: input, isActive: 1, isDelete: 0, ...extraFields })
            }
        case "addArea":
            return {
                table: "a_areas",
                data: JSON.stringify({ area_name: input, isActive: 1, isDelete: 0, ...extraFields })
            }
        case "addVisitType":
            return {
                table: "visit_type_masters",
                data: JSON.stringify({ visit_type: input, isActive: 1, isDelete: 0, a_application_login_id: Number(UUID), ...extraFields }),
                a_application_login_id: Number(UUID)
            }
        case "addExpenseType":
            return {
                table: "expense_type_masters",
                data: JSON.stringify({ expense_name: input, isActive: 1, isDelete: 0, a_application_login_id: Number(UUID), ...extraFields })
            }
        case "addTaskCategory":
            return {
                table: "task_categories",
                data: JSON.stringify({ task_category_name: input, isDelete: 0, a_application_login_id: Number(UUID), ...extraFields }),
                a_application_login_id: Number(UUID)
            }
        case "addDepartment":
            return {
                table: "departments",
                data: JSON.stringify({ department_name: input, isDelete: 0, a_application_login_id: Number(UUID), ...extraFields }),
                a_application_login_id: Number(UUID)
            }
        default:
            return {};
    }
}

const AddCategoryModal: FC<AddCategoryModalProps> = ({
    show,
    onHide,
    handleSubmit,
    handleClearInput,
    title,
    placeholder,
    btn1,
    btn2,
    displayClearButton,
    apiURL,
    payload,
    payloadKey,
    group_id,
    dynamicFields = [],
    extraPayloadFields = {}
}) => {
    useEffect(() => {
        if (!show) return;
    }, [])
    const [input, setInput] = useState<string>("");
    const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [productGroups, setProductGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(group_id);


    useEffect(() => {
        if (payloadKey === "addProductCategory" && show) {
            fetchProductGroups();
        }
    }, [payloadKey, show]);

    const fetchProductGroups = async () => {
        try {
            const requestData = {
                table: "product_groups",
                columns: "id, group_name",
                where: ["id IN (1,-1)", "isDelete=0"],
                request_flag: 0
            };

            const res = await axiosInstance.post("commonGet", requestData);

            if (res.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                setProductGroups(res.data.data || []);
            }
        } catch (err) {
            toast.error("Failed to load product groups");
        }
    };

    const onClearInput = async () => {
        handleClearInput?.();
        setInput('');
        setInputValues({});
    };
    const handleDynamicChange = (name: string, value: string) => {
        setInputValues((prev) => ({ ...prev, [name]: value }));
    };
    const validateInputs = () => {
        if (payloadKey === "addProductCategory" && !selectedGroupId) {
            setErrorMessage("Please select Product Group");
            return false;
        }
        if (dynamicFields.length > 0) {
            for (const field of dynamicFields) {
                if (!inputValues[field.name]?.trim()) {
                    setErrorMessage(`Please enter ${field.label || field.name}`);
                    return false;
                }
            }
        } else {
            if (!input.trim()) {
                setErrorMessage('Please Enter Value');
                return false;
            }
        }
        setErrorMessage('');
        return true;
    };
    const onSubmit = async () => {
        if (!validateInputs()) return;
        try {
            const getUUID = localStorage.getItem("UUID");
            const formInput = dynamicFields.length > 0 ? inputValues : input;
            const finalGroupId =
                payloadKey === "addProductCategory"
                    ? selectedGroupId
                    : group_id;
            const { data } = await axiosInstance.post(apiURL ?? "commonCreate", payload ?? getPaylaod(payloadKey ?? "", formInput, finalGroupId, extraPayloadFields));
            if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
                handleSubmit?.(formInput);
                onHide();
            } else {
                setErrorMessage(data.ack_msg);
            }
        } catch (error: any) {
            toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setInput('');
            setInputValues({});
            setSelectedGroupId(group_id);
        }
    }
    return (
        <>
            <div className="modal-overlay">
                <div className="modal-content_label">
                    <h4 className="modal-title1 form_header_text">{title}</h4>
                    <div className="overflow-auto" style={{ maxHeight: "300px" }}>
                        <table className="table" border={0}>
                            <tbody>
                                {payloadKey === "addProductCategory" && (
                                    <tr>
                                        <td>
                                            <select
                                                className="form-select mb-2"
                                                value={selectedGroupId ?? ""}
                                                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                                            >
                                                <option value="">Select Product Group</option>
                                                {productGroups.map((group) => (
                                                    <option key={group.id} value={group.id}>
                                                        {group.group_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                )}
                                {
                                    dynamicFields.length > 0 ? (
                                        dynamicFields.map((field) => (
                                            <tr key={field.name}>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className="form-control mb-2"
                                                        placeholder={field.placeholder}
                                                        value={inputValues[field.name] || ""}
                                                        onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={placeholder}
                                                    value={input}
                                                    onChange={(e) => setInput(e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    )
                                }
                                {errorMessage && <tr><td><span className="text-danger">{errorMessage}</span></td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="modal-buttons">
                        <button className="modal-button1" onClick={onHide}>
                            {btn1}
                        </button>
                        {
                            displayClearButton && (
                                (input.length > 0 || Object.values(inputValues).some(val => val.length > 0)) &&
                                <button
                                    className="modal-button1 text-secondary ms-2"
                                    style={{ border: "1.5px solid gray" }}
                                    onClick={onClearInput}
                                >
                                    Clear
                                </button>
                            )
                        }
                        <button className="modal-button2" onClick={() => onSubmit()} style={{ color: "white" }}>
                            {btn2}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AddCategoryModal