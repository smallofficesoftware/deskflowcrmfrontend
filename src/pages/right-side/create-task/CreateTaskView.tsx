import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikTouched,
} from "formik";
import React, { useEffect, useMemo, useState, useRef } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import {
  formatDateAndTime,
  getCustomFieldDatavalues,
  useEscapeKey,
} from "../../../common/SharedFunction";
import CustomSearchDropdown from "../../../components/CustomSearchDropdown";
import FormikCustomSearchDropdown from "../../../components/FormikCustomSearchDropdown";
import AddCategoryModal from "../../../components/model/AddCategoryModal";
import MultiSelect from "../../../components/MultiSelect";
import {
  BIG1_TEXT_LENGTH,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
  TASK_ATTEECHMENT_VIEW,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { IOption } from "../../../helpers/AppInterface";
import { TReactSetState } from "../../../helpers/AppType";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import CreateContactView from "../../left-side/create-contact/CreateContactView";
import {
  fetchCompanyApi,
  ICompanyView,
} from "../../left-side/header/Setting/task-template/TaskTemplateController";
import { ITaskView } from "../../left-side/header/Setting/taskList/TaskListController";
import {
  createTask,
  createTaskInitialValues,
  createTaskValidationSchema,
  fetchCategoryApiForProduct,
  fetchCustomInqFromApiForTask,
  fetchTemplateName,
  ICustomFromList,
  ITaskCreate,
  selectWeeklyDays,
  taskPriorityList,
  taskTypesList,
  updateTarget,
} from "./CreateTaskController";

interface IPropsCreateTarget {
  show: boolean;
  onHide: () => void;
  onTaskCreated?: () => void;
  headerName: string;
  productToEdit: number | undefined;
  setTargetVsIncentiveList: TReactSetState<ITaskView[]>;
  setLoading: TReactSetState<boolean>;
  messageId?: number;
  messageDescription?: string;
  messageRemark?: string;
  contactId?: number;
  referenceTable?: string;
  selectedButton?: string;
  selectedStageStatusId?: number | undefined;
  selectedPriorityId?: number | undefined;
  selectedButtonDue?: any;
  supportTicketFlag?: any;
  setIsLoadedMessage?: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateTaskView = ({
  show,
  onHide,
  onTaskCreated,
  headerName,
  productToEdit,
  setTargetVsIncentiveList,
  setLoading,
  messageId,
  messageDescription,
  messageRemark,
  contactId,
  referenceTable,
  selectedButton,
  selectedStageStatusId,
  selectedPriorityId,
  selectedButtonDue,
  supportTicketFlag,
  setIsLoadedMessage,
}: IPropsCreateTarget) => {
  const [categoryList, setCategoryList] = useState<any>([]);
  const [taskData, setTaskData] = useState<ITaskView>();
  const [titleList, setTitleList] = useState<ICompanyView[]>([]);
  const [initialFormValues, setInitialFormValues] = useState<ITaskCreate>(
    createTaskInitialValues(taskData),
  );
  const [taskCategoryList, setTaskCategoryList] = useState<any>([]);
  const [taskTemplateList, setTaskTemplateList] = useState<any>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedDays, setSelectedDays] = useState<any[]>([]);
  const [isOpenAddTaskCategoryModal, setIsOpenAddTaskCategoryModal] =
    useState<boolean>(false);
  const [checkedOptionsAddInTemplate, setcheckedOptionsAddInTemplate] =
    useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [selectedAssignmentTypeOption, setAssignmentTypeSelectedOption] =
    useState<string>("1");
  const [isStrEndDateDisabled, setIsStrEndDateDisabled] =
    useState<boolean>(false);
  const [isTeamListAllowSingle, setIsTeamListAllowSingle] =
    useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedReqList, setSelectedReqList] =
    useState<SingleValue<IOption> | null>(null);
  const [isEditButtonDisabled, setIsEditButtonDisabled] =
    useState<boolean>(false);
  const [multiSelectKey, setMultiSelectKey] = useState(0);
  const [isOpenCreateContact, setIsOpenCreateContact] =
    useState<boolean>(false);
  const isSubmittingRef = useRef(false);
  // const [stagesStatusOptions, setStagesStatusOptions] = useState<any[]>([]);

  useEffect(() => {
    if (taskData?.task_attechment) {
      const imageUrl = taskData.task_attechment;

      setPreviewImage(imageUrl);
    } else {
      setPreviewImage(null);
    }
  }, [taskData]);

  // useEffect(() => {
  //   fetchStageStatusApi(setStagesStatusOptions);
  // }, []);

  useEscapeKey(onHide);

  const canAddExpenseCategory = useCheckUserPermission(
    PAGE_ID.TASK_CATEGORY,
    PERMISSION_TYPE.ADD,
  );

  // const stageStatusDropdownOptions = useMemo(
  //   () =>
  //     stagesStatusOptions.map((item: any) => ({
  //       value: item.id,
  //       label: item.name,
  //     })),
  //   [stagesStatusOptions]
  // );

  const fetchAllCompanyApi = async () => {
    const token = localStorage.getItem("token");
    const getUUID = localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
    };
    try {
      const data = await axiosInstance.post("my-team", requestData, {
        headers: {
          Authorization: `${token}`,
        },
      });
      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setCategoryList([]);
      }
      setCategoryList(data.data.data.item);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };
  const [contactDataForEdit, setContactDataForEdit] = useState<any>(null);

  const fetchContactData = async (contactMasterId: number) => {
    if (!contactMasterId) return null;

    const token = localStorage.getItem("token");
    const requestData = {
      table: "contact_masters",
      where: [`isDelete=0`, `id=${contactMasterId}`],
      request_flag: 0,
    };

    try {
      const response = await axiosInstance.post("commonGet", requestData, {
        headers: { Authorization: `${token}` },
      });

      if (
        response.data.ack === DEFAULT_STATUS_CODE_SUCCESS &&
        response.data.data.length > 0
      ) {
        return response.data.data[0];
      }
    } catch (err) {
      console.error("Error fetching contact:", err);
    }

    return null;
  };

  const fetchTaskDataWithId = async () => {
    const token = localStorage.getItem("token");

    const requestData = {
      table: "task_managements",
      where: ["isDelete=0", `id=${productToEdit}`],
      request_flag: 0,
    };

    try {
      const data = await axiosInstance.post("commonGet", requestData, {
        headers: { Authorization: `${token}` },
      });

      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS || !data.data.data[0]) {
        setTaskData(undefined);
        return;
      }

      const task = data.data.data[0];

      task.task_remark = task.task_remark
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&rsquo;/gi, "’")
        .replace(/&lsquo;/gi, "‘")
        .replace(/&hellip;/gi, "…")
        .trim();

      setIsEditButtonDisabled(task.status === -6);
      setTaskData(task);
      setAssignmentTypeSelectedOption(
        String(task.team_task_assignement_type || "1"),
      );

      let contactData = null;
      if (task.contact_masters_id) {
        contactData = await fetchContactData(task.contact_masters_id);
      }

      // Important: Store contact data in state so the second useEffect can use it
      setContactDataForEdit(contactData); // We'll add this state below
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  // console.log(taskData)

  const categoryOptions = useMemo(
    () =>
      categoryList.map((category: any) => ({
        value: category.id,
        label: category.username,
      })),
    [categoryList],
  );

  const taskTypesOptions = useMemo(
    () =>
      taskTypesList.map((itemType) => ({
        value: Number(itemType.id),
        label: itemType.type_name,
      })),
    [taskTypesList],
  );

  const taskPriorityOptions = useMemo(
    () =>
      taskPriorityList.map((itemprioprity) => ({
        value: Number(itemprioprity.id),
        label: itemprioprity.mode_name,
      })),
    [taskPriorityList],
  );

  const taskCategoryOptions = useMemo(
    () =>
      taskCategoryList.map((category: any) => ({
        value: category.id,
        label: category.task_category_name,
      })),
    [taskCategoryList],
  );

  const selectWeeklyOptions = useMemo(
    () =>
      selectWeeklyDays.map((WeeklyDays: any) => ({
        value: Number(WeeklyDays.id),
        label: WeeklyDays.days_name,
      })),
    [selectWeeklyDays],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "Enter" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show]);

  useEffect(() => {
    if (show) {
      const init = async () => {
        setIsDataLoading(true);
        if (productToEdit) {
          await fetchTaskDataWithId();
        }
        const formType = supportTicketFlag == 0 ? 14 : 15;
        await fetchAllCompanyApi();
        await fetchTemplateName(setTaskTemplateList);
        await fetchCategoryApiForProduct(setTaskCategoryList);
        await fetchCompanyApi(setTitleList);
        await fetchCustomInqFromApiForTask(setCustomFromList, formType);
        setIsDataLoading(false);
      };

      init();
    }
  }, [show, productToEdit]);

  // Constants
  const TASK_TYPES_WITH_DAYS = ["2"];
  const TASK_TYPES_WITH_DATE = ["3", "4", "6", "7", "8", "9", "10"];
  const DEFAULT_TASK_TYPE = 5;
  const DEFAULT_PRIORITY = 1;
  const DEFAULT_CATEGORY_ID = -1;

  const orderTypesStageList = [
    { id: "1", order_type_display: "Contact" },
    { id: "2", order_type_display: "Inquiry" },
    { id: "3", order_type_display: "Visit" },
    { id: "4", order_type_display: "Product" },
    { id: "5", order_type_display: "Quotation" },
    { id: "6", order_type_display: "Sales Order" },
    { id: "7", order_type_display: "Sales Invoice" },
    { id: "8", order_type_display: "Return Sales Invoice" },
    { id: "9", order_type_display: "Purchase Order" },
    { id: "10", order_type_display: "Purchase Invoice" },
    { id: "11", order_type_display: "Return Purchase Invoice" },
    { id: "12", order_type_display: "Goods Received Note" },
    { id: "13", order_type_display: "Dispatch" },
  ];

  const customLabels: Record<string, string> = {
    "5": titleList?.[0]?.quotation_title || "Quotation",
    "6": titleList?.[0]?.order_title || "Sales Order",
    "7": titleList?.[0]?.invoice_title || "Sales Invoice",
    "8": titleList?.[0]?.return_sales_invoice_title || "Return Sales Invoice",
    "9": titleList?.[0]?.purchase_order_title || "Purchase Order",
    "10": titleList?.[0]?.purchase_title || "Purchase Invoice",
    "11":
      titleList?.[0]?.return_purchase_invoice_title ||
      "Return Purchase Invoice",
    "12": titleList?.[0]?.inward_title || "Goods Received Note",
    "13": titleList?.[0]?.dispatch_title || "Dispatch",
  };

  const taskTemplateOptionList = useMemo(
    () =>
      taskTemplateList?.map((option: any) => {
        const typeId = option.templete_type?.toString();

        const customLabel = customLabels[typeId];

        const matchedType = orderTypesStageList.find(
          (type) => type.id === typeId,
        );

        const typeDisplay =
          customLabel || matchedType?.order_type_display || "Unknown Type";

        const label = `${typeDisplay} - ${option.name}`;

        return {
          value: option.id,
          label,
        };
      }) || [],
    [taskTemplateList, customLabels, orderTypesStageList],
  );

  useEffect(() => {
    if (taskData) {
      const baseValues = createTaskInitialValues(taskData);
      const contactValues = { reference_contact: contactDataForEdit?.id };

      if (taskData.task_type != DEFAULT_TASK_TYPE) {
        setIsStrEndDateDisabled(true);
        if (taskData.task_type != 1) {
          baseValues.task_fromdate = "";
          baseValues.task_enddate = "";
        }
      }

      const formattedValues = {
        ...baseValues,
        ...contactValues,
      };

      setInitialFormValues(formattedValues);

      // Rest of your logic (selectedUsers, selectedDays, etc.)
      setSelectedUsers(
        categoryOptions.filter((option: any) =>
          String(baseValues.assigned_team_member || "")
            .split(",")
            .map((id) => id.trim())
            .includes(String(option.value)),
        ),
      );

      setSelectedReqList({
        value: contactDataForEdit?.id,
        label: `${contactDataForEdit?.person_name}-${contactDataForEdit?.mobile_number}${contactDataForEdit?.company_name ? "-" + contactDataForEdit?.company_name : ""}`,
      });

      setSelectedDays(
        selectWeeklyOptions.filter((option: any) =>
          String(baseValues.selected_task_days || "")
            .split(",")
            .map((id) => id.trim())
            .includes(String(option.value)),
        ),
      );
    } else {
      setInitialFormValues({
        ...createTaskInitialValues(undefined),
        task_type: DEFAULT_TASK_TYPE,
        task_priority: DEFAULT_PRIORITY,
        task_category_id: DEFAULT_CATEGORY_ID,
        task_title: messageDescription || "",
        task_remark: messageRemark || "",
        task_template: 0,
        messageId,
        contactId,
        referenceTable,
        reference_contact: contactId || undefined,
      });
      setSelectedUsers([]);
      setSelectedDays([]);
    }
  }, [
    taskData,
    contactDataForEdit,
    productToEdit,
    categoryList,
    messageDescription,
    messageRemark,
    messageId,
    contactId,
    referenceTable,
  ]);
  const handleSubmit = async (values: ITaskCreate, formikHelpers: any) => {
    // console.log("handleSubmit 1111", values);
    const { setSubmitting, setFieldError } = formikHelpers;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      for (const item of customFormList) {
        if (item.form_type !== 14 && item.form_type !== 15) continue;

        const fieldName = item.reference_column_name;
        const rawValue = (values as any)[fieldName];

        // Skip if not filled (required already handled by Yup)
        if (rawValue === undefined || rawValue === null || rawValue === "") {
          continue;
        }

        const strValue = String(rawValue).trim();

        // 1. Min / Max length
        if (item.min_limit || item.max_limit) {
          const min = Number(item.min_limit) || 0;
          const max = Number(item.max_limit) || Infinity;

          if (min > 0 && strValue.length < min) {
            setFieldError(
              fieldName,
              `${item.title} must be at least ${min} characters`,
            );
            toast.error(`${item.title} must be at least ${min} characters`);
            setSubmitting(false);
            return;
          }

          if (max < Infinity && strValue.length > max) {
            setFieldError(
              fieldName,
              `${item.title} must not exceed ${max} characters`,
            );
            toast.error(`${item.title} must not exceed ${max} characters`);
            setSubmitting(false);
            return;
          }
        }

        // 2. Validation type (pattern)
        if (item.validation_type) {
          const vt = String(item.validation_type);
          let regex: RegExp | null = null;
          let msg = "";

          switch (vt) {
            case "1": // Numeric
              regex = /^[0-9]+$/;
              msg = `${item.title} must contain only numbers`;
              break;
            case "2": // Alphanumeric
              regex = /^[A-Za-z0-9]+$/;
              msg = `${item.title} must be alphanumeric (letters and numbers)`;
              break;
            case "3": // Alpha
              regex = /^[A-Za-z\s]+$/;
              msg = `${item.title} must contain only letters`;
              break;
            case "4": // Alpha + special char
              regex = /^[A-Za-z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = `${item.title} allows letters and special characters`;
              break;
            case "5": // Numeric + special char
              regex = /^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = `${item.title} allows numbers and special characters`;
              break;
            case "6": // Alphanumeric + special char
              regex = /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;
              msg = `${item.title} allows letters, numbers & special characters`;
              break;
            default:
              break;
          }

          if (regex && !regex.test(strValue)) {
            setFieldError(fieldName, msg);
            toast.error(msg);
            setSubmitting(false);
            return;
          }
        }
      }
      const updatedValues = {
        ...values,
        assigned_team_member: selectedUsers
          .map((user: any) => user.value)
          .join(","),
        selected_task_days: selectedDays.map((day: any) => day.value).join(","),
        task_template: checkedOptionsAddInTemplate.includes(1)
          ? values.task_template
          : "",
        messageId,
        contactId,
        referenceTable,
        // Keep task_attechment as File object (don't stringify)
        task_attechment: values.task_attechment,
        task_enddate: values.task_enddate,
        task_fromdate: values.task_fromdate,
        // task_status: values.task_status
      };

      if (taskData?.id) {
        await updateTarget(
          updatedValues,
          setTargetVsIncentiveList,
          taskData.id,
          setLoading,
          onHide,
          selectedButton,
          selectedStageStatusId,
          selectedPriorityId,
          selectedButtonDue,
          supportTicketFlag,
          customFormList,
        );
      } else {
        await createTask(
          updatedValues,
          setTargetVsIncentiveList,
          setLoading,
          onHide,
          selectedButton,
          selectedStageStatusId,
          selectedPriorityId,
          selectedButtonDue,
          selectedAssignmentTypeOption,
          supportTicketFlag,
          customFormList,
          onTaskCreated,
          setIsLoadedMessage,
        );
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handelClose = () => {
    setSelectedUsers([]);
    setSelectedDays([]);
    onHide();
  };

  useEffect(() => {
    if (taskData?.task_template && Number(taskData?.task_template) > 0) {
      setcheckedOptionsAddInTemplate([1]);
    }
  }, [taskData]);

  const handleUnassignCheckboxChange = (value: number) => {
    setcheckedOptionsAddInTemplate((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const loadContactOptions = async (inputValue: string): Promise<IOption[]> => {
    const result = await loadContactOptionsv(inputValue);
    return result || [];
  };

  const loadContactOptionsv = async (
    inputValue: string,
  ): Promise<IOption[]> => {
    if (inputValue) {
      try {
        const getUUID = localStorage.getItem("UUID");
        const { data } = await axiosInstance.post(`Contact`, {
          searchTerm: inputValue,
          a_application_login_id: getUUID,
        });

        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          const list = data.data.item.map((item: any) => ({
            value: item.id,
            label: `${item.person_name}-${item.mobile_number}${item.company_name ? "-" + item.company_name : ""}`,
          }));
          return list;
        }

        return [];
      } catch (error) {
        console.error("Error loading options:", error);
        return [];
      }
    }
    return [];
  };

  const handleReqDisplayChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedReqList(selectedOption || null);
  };
  /* custum FormFiled Code */
  const [customFormList, setCustomFromList] = useState<ICustomFromList[]>([]);
  const [dropdownDataMap, setDropdownDataMap] = useState<{
    [key: number]: any[];
  }>({});
  // console.log("customFormListcustomFormListcustomFormList", customFormList);

  // useEffect(() => {
  //   fetchCustomInqFromApiForTask(setCustomFromList);
  // }, [show]);

  const fetchDropdownData = async (fieldId: number) => {
    try {
      const datas = await getCustomFieldDatavalues(fieldId);
      return datas;
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllDropdownData = async () => {
      const dropdownPromises = customFormList.map(async (item) => {
        try {
          const data = await fetchDropdownData(item.id);
          return { id: item.id, data };
        } catch (error) {
          console.error(`Error fetching dropdown data for ${item.id}:`, error);
          return { id: item.id, data: [] };
        }
      });

      const results = await Promise.all(dropdownPromises);
      const dataMap: { [key: number]: any[] } = {};
      results.forEach((result) => {
        dataMap[result.id] = result.data;
      });
      setDropdownDataMap(dataMap);
    };

    if (customFormList && customFormList.length > 0) {
      fetchAllDropdownData();
    }
  }, [customFormList]);

  const handleDownload = async (filePath: string) => {
    try {
      const fileUrl = `${TASK_ATTEECHMENT_VIEW}${filePath}`;

      const response = await fetch(fileUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filePath.split("/").pop() || "file";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Unable to download file");
    }
  };

  const renderInputField = (
    item: any,
    name: string,
    fieldName: string,
    setFieldValue: any,
    error: FormikErrors<any>,
    touched: FormikTouched<any>,
    values: ITaskCreate,
  ) => {
    const isError =
      Boolean((error as any)?.[fieldName]) &&
      Boolean((touched as any)?.[fieldName]);

    switch (item.data_type) {
      case 1: // Number
        return (
          <div style={{ width: "calc(50% - 15px)" }} key={item.id}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className={`form-control ${isError ? "is-invalid input-box-error" : ""}`}
                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );

      case 2: // Text
        return (
          <div style={{ width: "calc(50% - 15px)" }} key={item.id}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className={`form-control font-size-15 rounded-1 ${isError ? "is-invalid input-box-error" : ""}`}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );

      case 3: // Text Area
        return (
          <div style={{ width: "calc(50% - 15px)" }} key={item.id}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                as="textarea"
                name={fieldName}
                className={`form-control font-size-15 rounded-1 ${isError ? "is-invalid input-box-error" : ""}`}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
                rows={1}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );

      case 8: // Decimal
        return (
          <div style={{ width: "calc(50% - 15px)" }} key={item.id}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <Field
                type="text"
                name={fieldName}
                className={`form-control ${isError ? "is-invalid input-box-error" : ""}`}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  let value = e.target.value;
                  if (!/^\d*\.?\d*$/.test(value)) {
                    value = value.replace(/[^0-9.]/g, "");
                  }
                  if ((value.match(/\./g) || []).length > 1) {
                    value = value.slice(0, -1);
                  }
                  setFieldValue(fieldName, value);
                }}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );

      case 9: // Dropdown
        const datas = dropdownDataMap[item.id] || [];
        const dropDownOptions = datas.map((dataItem: any) => ({
          value: dataItem.data_sorce,
          label: dataItem.data_sorce,
        }));

        return (
          <div style={{ width: "calc(50% - 15px)" }} key={item.id}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <FormikCustomSearchDropdown
                name={fieldName}
                options={dropDownOptions}
                className={isError ? "is-invalid input-box-error" : ""}
              />
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );

      case 10: // Radio
        const radioData = dropdownDataMap[item.id] || [];
        const radioOptions = radioData.map(
          (dataItem: any) => dataItem.data_sorce,
        );

        return (
          <div style={{ width: "calc(50% - 15px)" }} key={item.id}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>
              <div className="mt-1">
                {radioOptions.map((option, index) => (
                  <label key={index} className="p-1">
                    <Field type="radio" name={fieldName} value={option} />
                    <span className="ms-1">{option}</span>
                  </label>
                ))}
              </div>
              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      case 13:
        const currentValue = values?.[fieldName];

        return (
          <div style={{ width: "calc(50% - 15px)" }} key={item.id}>
            <div className="form-group">
              <label className="pb-2 form_label">
                {name}
                {item.required_or_not === 1 && (
                  <span className="text-danger">*</span>
                )}
              </label>

              <Field name={fieldName}>
                {({ form }: any) => (
                  <>
                    <input
                      type="file"
                      className={`form-control ${
                        isError ? "is-invalid input-box-error" : ""
                      }`}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0] || null;
                        form.setFieldValue(fieldName, file);
                      }}
                    />

                    {typeof currentValue === "string" &&
                      currentValue.trim() !== "" && (
                        <div className="mt-2">
                          {/\.(jpg|jpeg|png|gif|webp)$/i.test(currentValue) ? (
                            <>
                              <div className="mb-2">
                                <img
                                  src={`${TASK_ATTEECHMENT_VIEW}${currentValue}`}
                                  alt="attachment"
                                  className="img-fluid rounded border"
                                  style={{
                                    maxHeight: "120px",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>

                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                style={{ backgroundColor: "#f58634" }}
                                onClick={() => handleDownload(currentValue)}
                              >
                                Download
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{ backgroundColor: "#f58634" }}
                              onClick={() => handleDownload(currentValue)}
                            >
                              Download
                            </button>
                          )}
                        </div>
                      )}
                  </>
                )}
              </Field>

              <ErrorMessage
                name={fieldName}
                component="div"
                className="field-error text-danger"
              />
            </div>
          </div>
        );
      default:
        return null; // Better than string
    }
  };
  return (
    <React.Fragment>
      {show && (
        <>
          {isDataLoading ? (
            <div className="modal1" style={{ zIndex: "999999999 !important" }}>
              <div
                className="modal-content1 create-task-modal-content d-flex align-items-center justify-content-center"
                style={{ minHeight: "300px" }}
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="modal1">
              <div className="modal-content1 create-task-modal-content">
                <span className="close" onClick={handelClose}>
                  &times;
                </span>
                <h2 className="modal-title1 form_header_text">{headerName}</h2>

                <Formik
                  enableReinitialize={true}
                  initialValues={initialFormValues}
                  validationSchema={createTaskValidationSchema(
                    checkedOptionsAddInTemplate.includes(1),
                    supportTicketFlag,
                    customFormList,
                  )}
                  onSubmit={handleSubmit}
                >
                  {({
                    errors,
                    touched,
                    setFieldValue,
                    values,
                    isSubmitting,
                  }) => (
                    <Form>
                      <div className="mt-3 d-flex justify-content-center">
                        <div className="mb-3 py-1">
                          <div className="row mx-0 px-2 gy-3 d-flex">
                            <div
                              style={{ flex: 1, display: "flex", gap: "30px" }}
                            >
                              <div style={{ height: "100%", width: "49%" }}>
                                {supportTicketFlag == 1 && !contactId && (
                                  <div className="w-100 mb-3">
                                    <div className="form-group autosuggest-container">
                                      <label className="pb-2 form_label">
                                        Search Contact
                                        <span className="text-danger">*</span>
                                        <span
                                          className="ms-2"
                                          style={{ cursor: "pointer" }}
                                          onClick={() =>
                                            setIsOpenCreateContact(true)
                                          }
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
                                      </label>

                                      <CustomSearchDropdown
                                        isAsync={true}
                                        loadOptions={loadContactOptions}
                                        value={selectedReqList}
                                        onChange={(selected: any) => {
                                          handleReqDisplayChange(selected);
                                          setFieldValue(
                                            "reference_contact",
                                            selected ? selected.value : null,
                                          );
                                        }}
                                        className="w-100"
                                        placeholder="search by (Mobile no., Contact name,
                                        Company name)"
                                      />
                                      <ErrorMessage
                                        name="reference_contact"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                )}
                                <div className="w-100 mb-3">
                                  <div className="form-group text-start">
                                    <label
                                      htmlFor="task_title"
                                      className="pb-1 form_label"
                                    >
                                      Title{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <Field
                                      type="text"
                                      name="task_title"
                                      maxLength={BIG1_TEXT_LENGTH}
                                      className={`form-control font-size-15 rounded-1 ${
                                        errors.task_title &&
                                        touched.task_title &&
                                        "is-invalid input-box-error"
                                      }`}
                                    />
                                    <ErrorMessage
                                      name="task_title"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="w-100 mb-3">
                                  <div className="form-group text-start">
                                    <label
                                      htmlFor="task_remark"
                                      className="pb-2 form_label"
                                    >
                                      Description
                                    </label>
                                    <Field
                                      as="textarea"
                                      name="task_remark"
                                      className={`form-control font-size-15 rounded-1 ${
                                        errors.task_remark &&
                                        touched.task_remark
                                          ? "is-invalid input-box-error"
                                          : ""
                                      }`}
                                      onInput={(
                                        e: React.FormEvent<HTMLTextAreaElement>,
                                      ) => {
                                        const target =
                                          e.target as HTMLTextAreaElement;
                                        target.style.height = "auto";
                                        target.style.height =
                                          target.scrollHeight + "px";
                                      }}
                                      onKeyDown={(
                                        e: React.KeyboardEvent<HTMLTextAreaElement>,
                                      ) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          // ✅ allow new line (do not prevent default)
                                          e.stopPropagation(); // just stop bubbling, not preventDefault
                                        }
                                      }}
                                    />
                                    <ErrorMessage
                                      name="task_remark"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="w-100 mb-3">
                                  <div className="form-group text-start">
                                    <label
                                      htmlFor="task_attechment"
                                      className="mb-1 form_label"
                                    >
                                      Attachment
                                    </label>

                                    {/* Hidden Field to store file or URL */}
                                    <Field name="task_attechment">
                                      {({
                                        field,
                                        form,
                                      }: {
                                        field: any;
                                        form: any;
                                      }) => (
                                        <>
                                          <input
                                            type="file"
                                            id="task_attechment"
                                            accept="image/*"
                                            className="form-control"
                                            onChange={(event) => {
                                              const file =
                                                event.currentTarget.files?.[0];
                                              if (file) {
                                                form.setFieldValue(
                                                  "task_attechment",
                                                  file,
                                                );
                                                setPreviewImage(
                                                  URL.createObjectURL(file),
                                                );
                                              }
                                            }}
                                          />
                                          {/* Show Preview: New file OR existing image from DB */}
                                          {(previewImage || field.value) && (
                                            <div
                                              className="mt-3 position-relative"
                                              style={{ maxWidth: "140px" }}
                                            >
                                              <img
                                                src={
                                                  TASK_ATTEECHMENT_VIEW +
                                                    previewImage || field.value
                                                }
                                                alt="Task Attachment"
                                                className="img-fluid rounded shadow-sm"
                                                style={{
                                                  maxHeight: "200px",
                                                  objectFit: "cover",
                                                }}
                                              />
                                              {/* Remove Button (only for new uploads or when editing) */}
                                              <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle"
                                                style={{
                                                  transform:
                                                    "translate(50%, -50%)",
                                                }}
                                                onClick={() => {
                                                  form.setFieldValue(
                                                    "task_attechment",
                                                    null,
                                                  );
                                                  setPreviewImage(null);
                                                  // Reset file input
                                                  const input =
                                                    document.getElementById(
                                                      "task_attechment",
                                                    ) as HTMLInputElement;
                                                  if (input) input.value = "";
                                                }}
                                              >
                                                ×
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </Field>

                                    <ErrorMessage
                                      name="task_attechment"
                                      component="div"
                                      className="field-error text-danger mt-1"
                                    />
                                  </div>
                                </div>
                                {/* {productToEdit === undefined && (<div className="col-12 col-md-12">
                              <div className="form-group">
                                <label
                                  htmlFor="task_status"
                                  className="mb-1 form_label"
                                >
                                  Status{" "}
                                </label>
                                <FormikCustomSearchDropdown
                                  name="task_status"
                                  options={stageStatusDropdownOptions}
                                // className={` ${errors.task_status &&
                                //   touched.task_status &&
                                //   "is-invalid input-box-error"
                                //   }`}
                                />
                                <ErrorMessage
                                  name="task_status"
                                  component="div"
                                  className="field-error text-danger"
                                />
                              </div>
                            </div>)} */}
                                <div className="w-100 mb-3">
                                  <div className="form-group text-start">
                                    <label className="pb-2 form_label">
                                      Task for customer and send notfication via
                                    </label>
                                    <div className="d-flex gap-4 flex-wrap">
                                      {/* WhatsApp Checkbox */}
                                      <label className="d-flex align-items-center cursor-pointer">
                                        <Field name="is_notification_sand_wp">
                                          {({ field, form }: any) => (
                                            <input
                                              disabled={
                                                taskData?.id ? true : false
                                              }
                                              type="checkbox"
                                              checked={field.value === 1} // <-- default false means value=0
                                              onChange={(e) => {
                                                form.setFieldValue(
                                                  "is_notification_sand_wp",
                                                  e.target.checked ? 1 : 0, // <-- checked => 1, unchecked => 0
                                                );

                                                setIsTeamListAllowSingle(
                                                  e.target.checked
                                                    ? true
                                                    : false,
                                                );
                                                setAssignmentTypeSelectedOption(
                                                  e.target.checked ? "2" : "1",
                                                );
                                              }}
                                              className="form-check-input"
                                            />
                                          )}
                                        </Field>
                                        <span className="form_label mb-0 m-1">
                                          {" "}
                                          WhatsApp
                                        </span>
                                      </label>

                                      {/* Email Checkbox */}
                                      <label className="d-flex align-items-center cursor-pointer">
                                        <Field name="is_notification_sand_email">
                                          {({ field, form }: any) => (
                                            <input
                                              disabled={
                                                taskData?.id ? true : false
                                              }
                                              type="checkbox"
                                              checked={field.value === 1}
                                              onChange={(e) => {
                                                form.setFieldValue(
                                                  "is_notification_sand_email",
                                                  e.target.checked ? 1 : 0,
                                                );
                                                setIsTeamListAllowSingle(
                                                  e.target.checked
                                                    ? true
                                                    : false,
                                                );
                                                setAssignmentTypeSelectedOption(
                                                  e.target.checked ? "2" : "1",
                                                );
                                              }}
                                              className="form-check-input"
                                            />
                                          )}
                                        </Field>
                                        <span className="form_label mb-0 m-1">
                                          {" "}
                                          Email
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                <div className="w-100 d-flex mb-3">
                                  <div className="" style={{ width: "49%" }}>
                                    <div className="form-group text-start">
                                      <label
                                        htmlFor="task_fromdate"
                                        className="mb-1 form_label"
                                      >
                                        Start Date{" "}
                                        {!isStrEndDateDisabled && (
                                          <span className="text-danger">*</span>
                                        )}
                                      </label>
                                      <div>
                                        <Field name="task_fromdate">
                                          {({ field, form }: any) => (
                                            <DatePicker
                                              value={field.value}
                                              onOpen={() =>
                                                setMultiSelectKey(
                                                  (prev) => prev + 1,
                                                )
                                              }
                                              style={{ width: "100%" }}
                                              onChange={(date: DateObject) => {
                                                if (date) {
                                                  form.setFieldValue(
                                                    "task_fromdate",
                                                    date.format(
                                                      "DD-MM-YYYY hh:mm A",
                                                    ),
                                                  );
                                                } else {
                                                  form.setFieldValue(
                                                    "task_fromdate",
                                                    "",
                                                  );
                                                }
                                              }}
                                              disableDayPicker={false}
                                              plugins={[
                                                <TimePicker
                                                  position="right"
                                                  hideSeconds={true}
                                                />,
                                              ]}
                                              disabled={isStrEndDateDisabled}
                                              format="DD-MM-YYYY hh:mm A"
                                              placeholder={`Enter From Date`}
                                              minDate={new DateObject()}
                                              inputClass={`form-control font-size-15 rounded-1 ${
                                                errors.task_fromdate &&
                                                touched.task_fromdate &&
                                                "is-invalid input-box-error"
                                              }`}
                                            />
                                          )}
                                        </Field>
                                      </div>
                                      <ErrorMessage
                                        name="task_fromdate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                  <div className="" style={{ width: "49%" }}>
                                    <div className="form-group text-start">
                                      <label
                                        htmlFor="task_enddate"
                                        className="mb-1 form_label"
                                      >
                                        End Date{" "}
                                        {!isStrEndDateDisabled && (
                                          <span className="text-danger">*</span>
                                        )}
                                      </label>
                                      <div>
                                        <Field name="task_enddate">
                                          {({ field, form }: any) => (
                                            <DatePicker
                                              value={field.value}
                                              onOpen={() =>
                                                setMultiSelectKey(
                                                  (prev) => prev + 1,
                                                )
                                              }
                                              style={{ width: "100%" }}
                                              onChange={(date: DateObject) => {
                                                if (date) {
                                                  form.setFieldValue(
                                                    "task_enddate",
                                                    date.format(
                                                      "DD-MM-YYYY hh:mm A",
                                                    ),
                                                  );
                                                } else {
                                                  form.setFieldValue(
                                                    "task_enddate",
                                                    "",
                                                  );
                                                }
                                              }}
                                              disableDayPicker={false}
                                              plugins={[
                                                <TimePicker
                                                  position="right"
                                                  hideSeconds={true}
                                                />,
                                              ]}
                                              disabled={isStrEndDateDisabled}
                                              minDate={new DateObject()}
                                              format="DD-MM-YYYY hh:mm A"
                                              placeholder={`Enter From Date`}
                                              inputClass={`form-control font-size-15 rounded-1 ${
                                                errors.task_enddate &&
                                                touched.task_enddate &&
                                                "is-invalid input-box-error"
                                              }`}
                                            />
                                          )}
                                        </Field>
                                      </div>
                                      <ErrorMessage
                                        name="task_enddate"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div style={{ height: "100%", width: "49%" }}>
                                <div className="w-100 mb-3">
                                  <div className="form-group text-start">
                                    <label
                                      htmlFor="task_category_id"
                                      className="mb-1 form_label"
                                    >
                                      Category
                                      <span className="text-danger">*</span>
                                    </label>
                                    {canAddExpenseCategory && (
                                      <span
                                        className="ms-2"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          setIsOpenAddTaskCategoryModal(true)
                                        }
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
                                    )}

                                    <FormikCustomSearchDropdown
                                      name="task_category_id"
                                      options={taskCategoryOptions}
                                      className={` ${
                                        errors.task_category_id &&
                                        touched.task_category_id &&
                                        "is-invalid input-box-error"
                                      }`}
                                    />
                                    <ErrorMessage
                                      name="task_category_id"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                <div className="w-100 mb-3">
                                  <div className="form-group text-start">
                                    <label
                                      htmlFor="task_priority"
                                      className="mb-1 form_label"
                                    >
                                      Priority{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <FormikCustomSearchDropdown
                                      name="task_priority"
                                      options={taskPriorityOptions}
                                      className={` ${
                                        errors.task_priority &&
                                        touched.task_priority &&
                                        "is-invalid input-box-error"
                                      }`}
                                    />
                                    <ErrorMessage
                                      name="task_priority"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>

                                <div className="w-100 mb-3">
                                  <div className="form-group text-start">
                                    <label
                                      htmlFor="assigned_team_member"
                                      className="mb-1 form_label"
                                    >
                                      Assign User
                                      <span className="text-danger">*</span>
                                    </label>
                                    <label style={{ margin: "0 5px 0 5px" }}>
                                      <input
                                        type="radio"
                                        value="1"
                                        disabled={
                                          taskData?.id
                                            ? true
                                            : isTeamListAllowSingle
                                              ? true
                                              : false
                                        }
                                        checked={
                                          selectedAssignmentTypeOption === "1"
                                        }
                                        onChange={(e) =>
                                          setAssignmentTypeSelectedOption(
                                            e.target.value,
                                          )
                                        }
                                      />
                                      <span style={{ margin: "0 0 0 5px" }}>
                                        Groups
                                      </span>
                                    </label>
                                    <label>
                                      <input
                                        type="radio"
                                        value="2"
                                        disabled={
                                          taskData?.id
                                            ? true
                                            : isTeamListAllowSingle
                                              ? true
                                              : false
                                        }
                                        checked={
                                          selectedAssignmentTypeOption === "2"
                                        }
                                        onChange={(e) =>
                                          setAssignmentTypeSelectedOption(
                                            e.target.value,
                                          )
                                        }
                                      />
                                      <span style={{ margin: "0 0 0 5px" }}>
                                        Individual
                                      </span>
                                    </label>
                                    {isTeamListAllowSingle && (
                                      <span
                                        className="m-1"
                                        style={{
                                          fontSize: "12px",
                                          color: "red",
                                        }}
                                      >
                                        <br />
                                        Please select one team member through
                                        whom this notfication will be sent.
                                      </span>
                                    )}
                                    <MultiSelect
                                      key={multiSelectKey}
                                      allowSingle={isTeamListAllowSingle}
                                      options={categoryOptions}
                                      value={selectedUsers}
                                      isDisabled={taskData?.id ? true : false}
                                      onChange={(selected: any) => {
                                        setSelectedUsers(selected);
                                        setFieldValue(
                                          "assigned_team_member",
                                          selected
                                            .map((item: any) => item.value)
                                            .join(","),
                                        );
                                      }}
                                      isSelectAll={true}
                                      menuPlacement="bottom"
                                      menuStyle={{
                                        left: "90%",
                                        right: "auto",
                                        transform: "none",
                                        height: "42px",
                                      }}
                                    />
                                    <ErrorMessage
                                      name="assigned_team_member"
                                      component="div"
                                      className="field-error text-danger"
                                    />
                                  </div>
                                </div>
                                {supportTicketFlag === 0 && (
                                  <div className="w-100 mb-3">
                                    <div className="form-group text-start">
                                      <label
                                        htmlFor="task_type"
                                        className="mb-1 form_label"
                                      >
                                        Task Type{" "}
                                        <span className="text-danger">*</span>
                                      </label>

                                      <FormikCustomSearchDropdown
                                        name="task_type"
                                        options={taskTypesOptions}
                                        className={` ${
                                          errors.task_type &&
                                          touched.task_type &&
                                          "is-invalid input-box-error"
                                        }`}
                                        onChange={(option: any) => {
                                          setFieldValue(
                                            "task_type",
                                            option?.value || 0,
                                          );
                                          setFieldValue(
                                            "task_fromdate",
                                            formatDateAndTime(new Date()),
                                          );
                                          setFieldValue(
                                            "task_enddate",
                                            formatDateAndTime(new Date()),
                                          );
                                          setSelectedDays([]);
                                          setIsStrEndDateDisabled(false);

                                          if (option?.value != "5") {
                                            option?.value == "1"
                                              ? setFieldValue(
                                                  "task_fromdate",
                                                  formatDateAndTime(new Date()),
                                                )
                                              : setFieldValue(
                                                  "task_fromdate",
                                                  "",
                                                );
                                            option?.value == "1"
                                              ? setFieldValue(
                                                  "task_enddate",
                                                  formatDateAndTime(new Date()),
                                                )
                                              : setFieldValue(
                                                  "task_enddate",
                                                  "",
                                                );

                                            setIsStrEndDateDisabled(true);
                                          }
                                        }}
                                      />

                                      <ErrorMessage
                                        name="task_type"
                                        component="div"
                                        className="field-error text-danger"
                                      />
                                    </div>
                                  </div>
                                )}
                                {supportTicketFlag == 0 && (
                                  <>
                                    {TASK_TYPES_WITH_DAYS.includes(
                                      String(values.task_type),
                                    ) ? (
                                      <div className="w-100 mb-3">
                                        <div className="form-group text-start">
                                          <label
                                            htmlFor="selected_task_days"
                                            className="mb-1 form_label"
                                          >
                                            Select Days{" "}
                                            <span className="text-danger">
                                              *
                                            </span>
                                          </label>

                                          <MultiSelect
                                            options={selectWeeklyOptions}
                                            value={selectedDays}
                                            onChange={(selected: any) => {
                                              setSelectedDays(selected);
                                              setFieldValue(
                                                "selected_task_days",
                                                selected
                                                  .map(
                                                    (item: any) => item.value,
                                                  )
                                                  .join(","),
                                              );
                                            }}
                                            isSelectAll={true}
                                            menuPlacement="bottom"
                                            menuStyle={{
                                              left: "90%",
                                              right: "auto",
                                              transform: "none",
                                              height: "42px",
                                            }}
                                          />

                                          <ErrorMessage
                                            name="selected_task_days"
                                            component="div"
                                            className="field-error text-danger"
                                          />
                                        </div>
                                      </div>
                                    ) : TASK_TYPES_WITH_DATE.includes(
                                        String(values.task_type),
                                      ) ? (
                                      <div className="w-100 mb-3">
                                        <div className="form-group text-start">
                                          <label
                                            htmlFor="task_selected_date"
                                            className="mb-1 form_label"
                                          >
                                            Selected Date{" "}
                                            <span className="text-danger">
                                              *
                                            </span>
                                          </label>

                                          <Field name="task_selected_date">
                                            {({ field, form }: any) => (
                                              <DatePicker
                                                value={field.value}
                                                onChange={(
                                                  date: DateObject,
                                                ) => {
                                                  if (date) {
                                                    form.setFieldValue(
                                                      "task_selected_date",
                                                      date.format("YYYY-MM-DD"),
                                                    );
                                                  } else {
                                                    form.setFieldValue(
                                                      "task_selected_date",
                                                      "",
                                                    );
                                                  }
                                                }}
                                                format="YYYY-MM-DD"
                                                placeholder="Enter From Date"
                                                minDate={new DateObject()}
                                                inputClass={`form-control font-size-15 rounded-1 ${
                                                  errors.task_selected_date &&
                                                  touched.task_selected_date &&
                                                  "is-invalid input-box-error"
                                                }`}
                                              />
                                            )}
                                          </Field>

                                          <ErrorMessage
                                            name="task_selected_date"
                                            component="div"
                                            className="field-error text-danger"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      // DEFAULT
                                      <div className="w-100 mb-3">
                                        <div className="form-group text-start">
                                          <label
                                            htmlFor="task_title"
                                            className="pb-1 form_label"
                                          >
                                            ---
                                          </label>
                                          <Field
                                            type="text"
                                            name="dummy_set"
                                            disabled={true}
                                            className="form-control font-size-15 rounded-1"
                                            value="---"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                                {supportTicketFlag == 0 && (
                                  <>
                                    <div className="w-100 mb-3">
                                      <div className="form-group text-start">
                                        <input
                                          type="checkbox"
                                          className="custom-checkbox mx-1"
                                          checked={checkedOptionsAddInTemplate.includes(
                                            1,
                                          )}
                                          onChange={() =>
                                            handleUnassignCheckboxChange(1)
                                          }
                                        />
                                        <label
                                          style={{ paddingLeft: "10px" }}
                                          className="pb-2 form_label"
                                          onClick={() =>
                                            handleUnassignCheckboxChange(1)
                                          }
                                        >
                                          Save as template
                                        </label>
                                        <ErrorMessage
                                          name="task_remark"
                                          component="div"
                                          className="field-error text-danger"
                                        />
                                      </div>
                                    </div>
                                    <div className="w-100 mb-3">
                                      {checkedOptionsAddInTemplate.includes(
                                        1,
                                      ) && (
                                        <>
                                          <div className="form-group text-start">
                                            <label
                                              htmlFor="task_template"
                                              className="mb-1 form_label"
                                            >
                                              Task Template{" "}
                                              <span className="text-danger">
                                                *
                                              </span>
                                            </label>
                                            <FormikCustomSearchDropdown
                                              name="task_template"
                                              options={taskTemplateOptionList}
                                              className={`form-control font-size-15 rounded-1 ${
                                                errors.task_template &&
                                                touched.task_template &&
                                                "is-invalid input-box-error"
                                              }`}
                                            />
                                            <ErrorMessage
                                              name="task_template"
                                              component="div"
                                              className="field-error text-danger"
                                            />
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Third Box: Custom Form Fields (Full Width) */}
                            {customFormList && customFormList.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "30px",
                                }}
                                className="w-100 mt-2"
                              >
                                {customFormList?.map((item) => (
                                  <React.Fragment
                                    key={
                                      item.reference_column_name || item.id
                                    }
                                  >
                                    {renderInputField(
                                      item,
                                      item.title,
                                      item.reference_column_name,
                                      setFieldValue,
                                      errors,
                                      touched,
                                      values,
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            )}

                            <div className="col-12 col-12 pt-4 pe-3 d-flex justify-content-end modal-buttons">
                              <button
                                className="modal-button1"
                                onClick={handelClose}
                                type="button"
                              >
                                Close
                              </button>
                              <button
                                disabled={isEditButtonDisabled || isSubmitting}
                                type="submit"
                                className="btn btn-primary px-4 py-2 ms-2 text-light form_label rounded-1"
                                style={{
                                  backgroundColor: "#f58634",
                                }}
                              >
                                {isSubmitting
                                  ? productToEdit
                                    ? "Updating...."
                                    : "Saving...."
                                  : productToEdit
                                    ? "Update Task"
                                    : "Save Task"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Form>
                  )}
                </Formik>
                {isOpenAddTaskCategoryModal && (
                  <AddCategoryModal
                    show={isOpenAddTaskCategoryModal}
                    onHide={() => {
                      setIsOpenAddTaskCategoryModal(false);
                      fetchCategoryApiForProduct(setTaskCategoryList);
                    }}
                    title="Add Task Category"
                    placeholder="Enter Task Category"
                    btn1="Cancel"
                    btn2="Add"
                    displayClearButton={true}
                    payloadKey="addTaskCategory"
                    group_id={undefined}
                  />
                )}
                {isOpenCreateContact && (
                  <CreateContactView
                    show={isOpenCreateContact}
                    onHide={() => setIsOpenCreateContact(false)}
                    // setContact={setRefreshContact}
                    headerName={"Create Contact"}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </React.Fragment>
  );
};

export default CreateTaskView;
