import axios from "axios";
import { Button } from "primereact/button";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import CsvIcon from "../../../assets/images/CsvIcon.png";
import docxIcon from "../../../assets/images/docxIcon.png";
import excelIcon from "../../../assets/images/excelIcon.png";
import jpgIcon from "../../../assets/images/jpgIcon.png";
import micIcon from "../../../assets/images/micIcon.png";
import MkvIcon from "../../../assets/images/MkvIcon.png";
import Mp4Icon from "../../../assets/images/Mp4Icon.png";
import MpgIcon from "../../../assets/images/MpgIcon.png";
import mp3Icon from "../../../assets/images/music-file.png";
import pdfIcon from "../../../assets/images/pdfIcon.png";
import pngIcon from "../../../assets/images/pngIcon.png";
import PptIcon from "../../../assets/images/PptIcon.png";
import PptxIcon from "../../../assets/images/PptxIcon.png";
import PsdIcon from "../../../assets/images/PsdIcon.png";
import RarIcon from "../../../assets/images/RarIcon.png";
import svgIcon from "../../../assets/images/svgIcon.png";
import TxtIcon from "../../../assets/images/TxtIcon.png";
import XmlIcon from "../../../assets/images/XmlIcon.png";
import zipIcon from "../../../assets/images/zipIcon.png";
import { AppContext } from "../../../common/AppContext";
import { formatTimeToAmPm, useEscapeKey } from "../../../common/SharedFunction";
import CustomEditor from "../../../components/CustomEditor";
import DateTimeRangePicker from "../../../components/DateTimeRangePicker";
import ImageViewer from "../../../components/ImageViewer";
import CheckBoxModal from "../../../components/model/CheckBoxModal";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import ContactDetailModel from "../../../components/model/ContactdetailsModel/ContactDetailModel";
import EventLogs from "../../../components/model/EventLogModel/EventLogsModel";
import RadioButtonModal from "../../../components/model/RadioButtonModal";
import ReminderModal from "../../../components/model/ReminderModal";
import SafeHtml from "../../../components/SafeHtml";
import {
  BIG_TEXT_LENGTH,
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { TReactSetState } from "../../../helpers/AppType";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import { ITitle } from "../../dashboard/DashoardController";
import {
  ITaskView,
  updateStageStatusRadioButton,
} from "../../left-side/header/Setting/taskList/TaskListController";
import Visitsview from "../../left-side/header/Setting/visits/VisitView";
import { ICompany } from "../../left-side/LeftSideController";
import { fetchDepartmentsApi } from "../../left-side/list-company/EditTeamMemberController";
import { ITaskCreate } from "../create-task/CreateTaskController";
import {
  completeReminder,
  createReminder,
  fetchAllCompanyApi,
  fetchStageStatusApi,
  fetchTaskMessageData,
  openPrint,
  TMessagesByDate,
  TMessageTask,
  updateUserCheckBox,
} from "./TaskChatRightController";

interface IPropRightView {
  isDashBoardOpen?: boolean;
  closeDashboard?: () => void;
  showTaskChat?: () => void;
  onHideTaskChat: () => void;
  openTaskRight?: (signleDataTask: ITaskView) => void;
  TaskData?: ITaskCreate[]; // Updated to specific type
  signleDataTask?: ITaskView | undefined;
  setRefreshTask?: (value: boolean | number) => void;
  setNoDataFound1?: TReactSetState<boolean>;
  supportTicketFlag?: number;
}

const TaskChatRightSide = ({
  isDashBoardOpen,
  showTaskChat,
  onHideTaskChat,
  TaskData,
  signleDataTask,
  setRefreshTask,
  closeDashboard,
  setNoDataFound1,
  openTaskRight,
  supportTicketFlag,
}: IPropRightView) => {
  const { isTaskRightSideopen, setIsTaskRightSideOpen, setShowRightSide } =
    useContext(AppContext)!;
  const dropdownRefLeftMsg = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const dropdownRefRightMsg = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [companyLists, setCompanyLists] = useState<ICompany[]>([]);

  const [messageList, setMessageList] = useState<TMessagesByDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [messageSide, setMessageSide] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  //search Mate
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  /* show Task Details Toggle Start */
  const [isShowTaskDetails, setShowTaskDetails] = useState(false);

  /* show Task Details Toggle END */

  /* open three dot's dropdown Start */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  /* open three dot's dropdown End */

  /*chatEdittor State Start  */
  const [editorContent, setEditorContent] = useState<string>("");
  const [isLoadedMessage, setIsLoadedMessage] = useState(false);
  const [editorContentToEditId, setEditorContentToEditId] = useState(0);
  const [isToggledButton, setIsToggledButton] = useState(false);
  const [editorContentToEdit, setEditorContentToEdit] = useState<string>("");
  const [isWhatsAppAuto, setIsWhatsAppAuto] = useState(false);
  /*chatEdittor State End */

  /* getMessage States Start  */
  const [isActive, setIsActive] = useState(false);
  const [noDataFound, setNoDataFound] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [checkedReminder, setCheckedReminder] = useState(false);
  const [checkedAttachment, setCheckedAttachment] = useState(false);
  const [selectDate, setSelectDate] = useState<Date[]>([]);
  /* getMessage States End  */
  const [startDateForUl, setStartDateForUl] = useState<string>("2024-12-02");

  const [imageViewData, setImageViewData] = useState<TMessageTask>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [hasOneData1, setHasOneData1] = useState<any>();
  //edit popup open
  const [dropdownOpenMsgLeft, setDropdownOpenMsgLeft] = useState<any>(null);
  // delete msg
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [deleteMsgId, setDeleteMsgId] = useState<number>();
  // set reminder
  const [reminderForTaskId, setReminderForTaskId] = useState<number>();
  const [isReminderConfirmation, setIsReminderConfirmation] = useState(false);
  const [isReminderConfirmationStatus, setIsReminderConfirmationStatus] =
    useState(false);
  const [isReminderGetMessageData, setIsReminderConfirmationStatus1] =
    useState<TMessageTask>();

  const [hasOneData, setHasOneData] = useState<number | null>(null);
  // move to msg
  const [dropdownOpenMsg, setDropdownOpenMsg] = useState<any>(null);
  const [moveForMsgId, setMoveForMsgId] = useState<number>();
  const [isMoveToClientConfirmation, setIsMoveToClientConfirmation] =
    useState(false);
  const [isMoveToMeConfirmation, setIsMoveToMeConfirmation] = useState(false);
  // assign status
  const [isModalAssignStatusVisible, setIsModalAssignStatusVisible] =
    useState<boolean>(false);
  const [statusAssignContactId, setStatusAssignContactId] = useState<number>();
  const [statusAssignStatusId, setStatusAssignStatusId] = useState<number>();
  const [optionRadioButtonStatus, setOptionRadioButtonStatus] = useState<any[]>(
    [],
  );
  //assign teamMember
  const [userAssignTaskId, setUserAssignTaskId] = useState<number>();
  const [isModalAssignUserVisible, setIsModalAssignUserVisible] =
    useState<boolean>(false);
  const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isContactDetailModalOpen, setIsContactDetailModalOpen] =
    useState(false);
  const [isStageAndStatusModalOpen, setIsStageAndStatusModalOpen] =
    useState(false);
  const [title, setTitle] = useState<ITitle[]>([]);
  const [showVisits, setShowVisits] = useState(false);
  const [refreshVisit, setRefreshVisit] = useState(false);

  // Add this function after all your state declarations (around line 170-180)
  const getViewFormat = (referenceTable: string | undefined) => {
    if (!title || !title[0]) return null;

    const t = title[0];

    const map: Record<string, any> = {
      cart_quotation: t.quotation_view_formate,
      cart_order: t.order_view_formate,
      cart_invoice: t.invoice_view_formate,
      cart_purchase_order: t.purchase_order_view_formate,
      cart_order_purchase: t.purchase_view_formate,
      cart_return_sales_invoice: t.return_sales_invoice_view_formate,
      cart_return_purchase_invoice: t.return_purchase_invoice_view_formate,
      cart_inward: t.inward_view_formate,
      cart_dispatch: t.dispatch_view_formate,
    };

    return map[referenceTable || ""] || null;
  };

  /* Rights Code Start */
  const canAdd = useCheckUserPermission(
    PAGE_ID.TASK_MESSAGE_HISTORY,
    PERMISSION_TYPE.ADD,
  );
  const canEdit = useCheckUserPermission(
    PAGE_ID.TASK_MESSAGE_HISTORY,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.TASK_MESSAGE_HISTORY,
    PERMISSION_TYPE.DELETE,
  );
  const canAddReminder = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.ADD,
  );
  const canViewStatus = useCheckUserPermission(
    PAGE_ID.STATUS,
    PERMISSION_TYPE.VIEW,
  );
  const canAddAssignTeamMember = useCheckUserPermission(
    PAGE_ID.ASSIGN_TO_TEAM_MEMBER,
    PERMISSION_TYPE.ADD,
  );
  const canApproveReminder = useCheckUserPermission(
    PAGE_ID.REMINDER,
    PERMISSION_TYPE.APPROVE,
  );

  const canAddVisit = useCheckUserPermission(
    PAGE_ID.VISIT,
    PERMISSION_TYPE.ADD,
  );

  /* Rights Code End */
  // const OpenTaskchatRightSide = () => { };
  const fetchCompany = async (setTitle: TReactSetState<ITitle[]>) => {
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      table: "company_masters",
      columns:
        "order_title,invoice_title,quotation_title,purchase_title,purchase_order_title,workorder_title,id,invoice_view_formate,order_view_formate,quotation_view_formate,purchase_view_formate,workorder_view_formate,purchase_order_view_formate,inward_title,dispatch_title,inward_view_formate,dispatch_view_formate",
      where: JSON.stringify({ a_application_login_id: uuid }),
      request_flag: 2,
    };
    try {
      const response = await axiosInstance.post("mainCommonGet", requestData);
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setTitle(response.data.data || []);
      } else {
        toast.error(response.data.ack_msg || DEFAULT_STATUS_CODE_SUCCESS);
        setTitle([]);
        return "";
      }
    } catch (error: any) {
      console.error("Error fetching currencyID: ", error);
      toast.error(error || DEFAULT_STATUS_CODE_SUCCESS);
      return "";
    }
  };

  /* first Call This Api When Open Chat */
  useEffect(() => {
    fetchCompany(setTitle);
  }, [setTitle]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageList]);

  useEffect(() => {
    if (signleDataTask?.id) {
      fetchTaskMessageData(
        setNoDataFound,
        "",
        setLoading,
        setMessageList,
        setHasMore,
        currentPage,
        signleDataTask?.id,
        checkedReminder,
        checkedAttachment,
        selectDate,
        startDateForUl,
      );
      // if (messageListRef.current && prevScrollHeight > 0) {
      //   messageListRef.current.scrollTop =
      //     messageListRef.current.scrollHeight - prevScrollHeight;
      // }
    }
    //  fetchGetByIdUser(setLoginById);
    //  fetchCompanyForRightSideViewApi(setCompanyId);
  }, [
    currentPage,
    signleDataTask?.id,
    isDeleteConfirmation,
    isLoadedMessage,
    //  isReminderConfirmationStatus,
    isReminderConfirmation,
    //  isEmailConfirmation,
    checkedReminder,
    checkedAttachment,
    selectDate,
    searchTerm,
    setNoDataFound1,
  ]);

  /* first Call This Api When Open Chat */

  /* General Codes Start */
  useEffect(() => {
    if (signleDataTask?.id) {
      setSearchOpen(false);
      setCheckedReminder(false);
      setSearchTerm("");
      setCheckedAttachment(false);
      setSelectDate([]);
    } else {
      return undefined;
    }
  }, [signleDataTask?.id]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const bottom =
      containerRef.current.scrollHeight ===
      containerRef.current.scrollTop + containerRef.current.clientHeight;
    setIsAtBottom(bottom);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const clickedInsideLeft = Object.values(dropdownRefLeftMsg.current).some(
      (ref) => ref && ref.contains(event.target as Node),
    );

    const clickedInsideRight = Object.values(dropdownRefRightMsg.current).some(
      (ref) => ref && ref.contains(event.target as Node),
    );

    if (!clickedInsideLeft) {
      setDropdownOpenMsgLeft(null);
    }

    if (!clickedInsideRight) {
      setDropdownOpenMsg(null);
    }
  };

  useEffect(() => {
    if (dropdownOpenMsgLeft !== null || dropdownOpenMsg !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpenMsgLeft, dropdownOpenMsg]);

  /* General Codes End */

  /* Close panel on escape key */
  const onHide = () => {
    setIsTaskRightSideOpen(false);
    onHideTaskChat();
  };
  useEscapeKey(onHide);

  // three dot's valu dropdown Open and close no code
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [dropdownRef]);

  /* serach filter code start */
  function openSearch() {
    setSearchOpen(true);
  }
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.length >= 3 || value === "") {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      setSearchTimeout(
        setTimeout(() => {
          fetchTaskMessageData(
            setNoDataFound,
            value.trim(),
            setLoading,
            setMessageList,
            setHasMore,
            currentPage,
            signleDataTask?.id,
            checkedReminder,
            checkedAttachment,
            selectDate,
            startDateForUl,
          );
          setCurrentPage(0);
        }, 1000),
      );
    }
  };

  const handelSearchDateChange = (selectedDates: Date[] | undefined) => {
    setSelectDate(selectedDates || []);
    fetchTaskMessageData(
      setNoDataFound,
      searchTerm,
      setLoading,
      setMessageList,
      setHasMore,
      currentPage,
      signleDataTask?.id,
      checkedReminder,
      checkedAttachment,
      selectedDates,
      startDateForUl,
    );
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    setSelectDate([]);
    setCheckedAttachment(false);
    setCheckedReminder(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchOpen(false);
    setSearchTimeout(
      setTimeout(() => {
        fetchTaskMessageData(
          setNoDataFound,
          "",
          setLoading,
          setMessageList,
          setHasMore,
          currentPage,
          signleDataTask?.id,
          checkedReminder,
          checkedAttachment,
          selectDate,
          startDateForUl,
        );
        setCurrentPage(0);
      }, 1000),
    );
  };

  /* serach filter code End */

  /* show Task Details Code Start */
  useEffect(() => {
    setShowTaskDetails(true); // Reset to true when signleDataTask changes
  }, [signleDataTask]);
  const toggleTaskDetails = () => {
    setIsExpanded((prev) => !prev);
  };

  // Get remark text
  let htmlRemark = signleDataTask?.task_remark || "";
  htmlRemark = htmlRemark.replace(/<br\s*\/?>/gi, "\n");
  let plainText = htmlRemark.replace(/<[^>]+>/g, "");

  plainText = plainText
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "’") // common curly quote
    .replace(/&lsquo;/gi, "‘")
    .replace(/&hellip;/gi, "…");

  const remark = plainText.trim();

  // Trim text if not expanded
  const displayText = isExpanded ? remark : remark.slice(0, BIG_TEXT_LENGTH);
  /* show Task Details Code End */

  const handleWhatsAppToggle = (checked: boolean) => {
    setIsWhatsAppAuto(checked);
  };

  const handleEditorChange = (fieldName: string, html: string) => {
    if (signleDataTask) {
      setEditorContent("");
    } else {
      setEditorContent(html);
    }
  };
  const handleChangeToggleButton = () => {
    setIsToggledButton(!isToggledButton);
    setMessageSide(isToggledButton ? 1 : 2);
  };

  const getUUID = localStorage.getItem("UUID");

  const handleChangeEdit = (itemsDis: TMessageTask) => {
    if (canEdit) {
      if (signleDataTask?.id) {
        setEditorContentToEditId(itemsDis.id);
        setEditorContentToEdit(itemsDis?.description);
        setDropdownOpenMsgLeft(null);
        setDropdownOpenMsg(null);
      } else {
        setEditorContentToEdit("");
      }
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  /* message add & update & Delete code API Call*/
  const handleSend = async (
    html: string,
    crd_flag: string | undefined | null = "",
  ) => {
    if (signleDataTask?.id) {
      setEditorContentToEdit("");
      setEditorContentToEditId(0);
    }
    const getUserName = localStorage.getItem("USERNAME");
    if (editorContentToEditId) {
      setIsLoadedMessage(false);
      if (html.trim()) {
        const requestData = {
          table: "task_message_histories",
          where: `{"id":"${editorContentToEditId}"}`,
          data: JSON.stringify({
            description: html,
          }),
        };
        try {
          const data = await axiosInstance.post("commonUpdate", requestData);
          if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsLoadedMessage(true);
            setEditorContentToEditId(0);
          } else {
            return false;
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } else {
      setIsLoadedMessage(false);
      if (html.trim()) {
        const getUUID = await localStorage.getItem("UUID");

        const requestData = {
          table: "task_message_histories",
          data: JSON.stringify({
            message_side: messageSide,
            a_application_login_id: Number(getUUID),
            description: html, // Include the HTML content here
            task_id: signleDataTask?.id,
            application_login_name: getUserName,
            entry_flag: isWhatsAppAuto ? 1 : 0,
            message_type_id: 0,
            is_reminder: crd_flag === "1" ? 1 : 0,
          }),
          ...(isWhatsAppAuto ? { request_flag: "msg" } : {}),
        };

        try {
          const data = await axiosInstance.post("commonCreate", requestData);
          if (data.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
            setIsLoadedMessage(true);
          } else {
            setIsLoadedMessage(true);
            return false;
          }
        } catch (error: any) {
          toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    }
  };
  const handleDeleteMessage = async () => {
    const getUUID = localStorage.getItem("UUID");
    const requestData = {
      table: "task_message_histories",
      where: `{"id":"${deleteMsgId}"}`,
      data: `{"isDelete":"1", "deleted_by": ${getUUID}}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setIsDeleteConfirmation(false);
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleChangeMoveMsg = async (msgSide: number) => {
    const requestData = {
      table: "task_message_histories",
      where: `{"id":"${moveForMsgId}" }`,
      data: `{"message_side":"${msgSide}"}`,
    };
    try {
      const { data } = await axiosInstance.post("commonUpdate", requestData);
      if (data.code === 200) {
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          if (msgSide === 1) {
            setIsMoveToMeConfirmation(false);
          } else {
            setIsMoveToClientConfirmation(false);
          }
          fetchTaskMessageData(
            setNoDataFound,
            "",
            setLoading,
            setMessageList,
            setHasMore,
            currentPage,
            signleDataTask?.id,
            checkedReminder,
            checkedAttachment,
            selectDate,
            startDateForUl,
          );
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      }
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };
  /* message add & update & Delete code API Call END*/

  /* chat Message Code Start */

  const handelRefreshMessages = async () => {
    try {
      if (signleDataTask?.id) {
        fetchTaskMessageData(
          setNoDataFound,
          "",
          setLoading,
          setMessageList,
          setHasMore,
          currentPage,
          signleDataTask?.id,
          checkedReminder,
          checkedAttachment,
          selectDate,
          startDateForUl,
        );
      }
    } catch (error) {
      console.error("Error refreshing contacts:", error);
    }
  };

  const getFileExtension = (fileName: string): string => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  };

  const getIconForExtension = (extension: string): string => {
    switch (extension) {
      case "pdf":
        return pdfIcon;
      case "png":
        return pngIcon;
      case "svg":
        return svgIcon;
      case "xlsx":
      case "xls":
        return excelIcon;
      case "jpg":
      case "jpeg":
        return jpgIcon;
      case "docx":
      case "doc":
        return docxIcon;
      case "mp4":
        return Mp4Icon;
      case "mkv":
        return MkvIcon;
      case "mpeg":
      case "mpg":
        return MpgIcon;
      case "txt":
        return TxtIcon;
      case "pptx":
        return PptxIcon;
      case "ppt":
        return PptIcon;
      case "csv":
        return CsvIcon;
      case "rar":
        return RarIcon;
      case "psd":
        return PsdIcon;
      case "xml":
        return XmlIcon;
      case "zip":
        return zipIcon;
      case "mp3":
      case "m4a":
        return mp3Icon;
      case "ogg":
      case "wav":
        return micIcon;
      default:
        return "";
    }
  };

  const handleChangeImgViewer = (item: TMessageTask) => {
    setImageViewData(item);
    setViewerOpen(true);
  };

  const handelChangeDeleteRight = (id: number) => {
    if (canDelete) {
      setIsDeleteConfirmation(true);
      setDeleteMsgId(id);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const toggleMoveToClient = (id: number) => {
    setMoveForMsgId(id);
    setIsMoveToClientConfirmation(true);
  };

  const allMessages = messageList.flatMap((item) => item.messages);

  const lastThreeMessages = allMessages.slice(-3);

  const filteredItemIds = lastThreeMessages.map((item) => item.id);

  const toggleDropdownMsgLeft = (id: number) => {
    setHasOneData1(id);
    setDropdownOpenMsgLeft(!dropdownOpenMsgLeft);
  };

  const toggleMoveToMe = (id: number) => {
    setMoveForMsgId(id);
    setIsMoveToMeConfirmation(true);
  };

  const handleDownload = async (item: any) => {
    try {
      const fileUrl = `${item.media_url}`;
      const response = await axios.get(fileUrl, { responseType: "blob" });
      const fileName = item.media_name ? item.media_name : item.media_url;
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file", error);
    }
  };

  const toggleDropdownMsg = (id: number) => {
    setHasOneData((prev) => (prev === id ? null : id));
    setDropdownOpenMsg((prev: any) => !prev);
  };
  const handleLoadMore = () => {
    const currentEndDate = new Date();
    const newStartDate = currentEndDate.toISOString().split("T")[0];
    const lastDate = messageList[0].date;
    const lastDateObj = new Date(lastDate);
    lastDateObj.setDate(lastDateObj.getDate() - 1);
    const nextDate = lastDateObj.toISOString().split("T")[0];
    setStartDateForUl(nextDate);
    fetchTaskMessageData(
      setNoDataFound,
      "",
      setLoading,
      setMessageList,
      setHasMore,
      currentPage,
      signleDataTask?.id,
      checkedReminder,
      checkedAttachment,
      selectDate,
      nextDate,
    );
  };
  /* chat message Code End */
  /* status assign code start */
  useEffect(() => {
    if (isModalAssignStatusVisible) {
      fetchStageStatusApi(setOptionRadioButtonStatus, statusAssignStatusId);
    }
    if (isModalAssignUserVisible) {
      fetchAllCompanyApi(setOptionJoinCompany);
      fetchDepartmentsApi(setDepartments);
    }
  }, [isModalAssignStatusVisible, isModalAssignUserVisible]);
  const getOptionName = (option: { username: string; department: number }) => {
    const departmentObj = departments.find(
      (item) => item.id === option.department,
    );

    if (departmentObj) {
      return `${option.username} (${departmentObj.department_name})`;
    }

    return option.username;
  };

  const handleModalOpenStatusAssign = (
    id: number | undefined,
    taskStatus?: number | undefined,
  ) => {
    if (canViewStatus) {
      setStatusAssignContactId(id);
      if (taskStatus) {
        setStatusAssignStatusId(taskStatus);
      }
      setIsModalAssignStatusVisible(true);
      // setIsTaskRightSideOpen(false)
    } else {
      setIsModalAssignStatusVisible(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleConfirmRadioButton = async (checkedOptions: any[]) => {
    if (statusAssignContactId === undefined) return;

    await updateStageStatusRadioButton(
      statusAssignContactId,
      checkedOptions,
      setLoading,
    );

    setTimeout(() => {
      setCurrentPage(0); // Reset page to 0 when search term changes
    }, 100);

    setIsModalAssignStatusVisible(false);
    setRefreshTask && setRefreshTask(true);
    onHideTaskChat();
    setIsTaskRightSideOpen(false);
    setShowRightSide(true);
  };
  /* status assign code End */
  /*assign Team Member Code start*/
  const handleModalOpenUserAssign = (id: number | undefined) => {
    if (canAddAssignTeamMember) {
      setUserAssignTaskId(id);
      setIsModalAssignUserVisible(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const CloseTaskChat = () => {
    onHideTaskChat();
    setIsTaskRightSideOpen(false);
    setShowRightSide(true);
  };
  const handleConfirmAssignUser = async (
    contactId: number | undefined,
    checkedOptions: any[],
  ) => {
    if (userAssignTaskId === undefined) return;

    await updateUserCheckBox(userAssignTaskId, checkedOptions, setLoading);
    setTimeout(() => {
      setCurrentPage(0); // Reset page to 0 when search term changes
    }, 100);
    setIsModalAssignUserVisible(false);
    setRefreshTask && setRefreshTask(true);
    onHideTaskChat();
    setIsTaskRightSideOpen(false);
    setShowRightSide(true);
  };
  /*assign Team Member Code End*/
  /* Create New Reminder Code Start */
  const toggleReminder = (id: number) => {
    // alert("yes")
    if (canAddReminder) {
      setReminderForTaskId(id);
      setIsReminderConfirmation(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleReminder = async (data: {
    dateTime: string;
    remark: string;
    status: string;
    selectedCategory: any;
  }) => {
    // if (getData?.assinged_to_work_a_application_id === "") {
    //   toast.error("You cannot set a reminder. Please assign the contact first.");
    //   return; // prevent further execution
    // }
    if (
      data.dateTime.trim() &&
      data.remark.trim() &&
      data.selectedCategory !== null &&
      data.selectedCategory !== false
    ) {
      await createReminder(
        data,
        signleDataTask?.id,
        reminderForTaskId,
        setIsReminderConfirmation,
      );
    } else {
      toast.error("Please enter Date and Time, Remark, and Select Team Member");
      setIsReminderConfirmation(true);
    }
  };
  const handleChangeOfReminderRightMsg = (messageData: TMessageTask) => {
    if (canApproveReminder) {
      setIsReminderConfirmationStatus(true);
      setIsReminderConfirmationStatus1(messageData);
      setDropdownOpenMsgLeft(null);
      setDropdownOpenMsg(null);
    } else {
      setIsReminderConfirmationStatus(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handleChangeOfReminderLeftMsg = (messageData: TMessageTask) => {
    if (canApproveReminder) {
      setIsReminderConfirmationStatus(true);
      setIsReminderConfirmationStatus1(messageData);
      setDropdownOpenMsgLeft(null);
      setDropdownOpenMsg(null);
    } else {
      setIsReminderConfirmationStatus(false);
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  const handleComplateReminderFromMsg = async () => {
    const result = await completeReminder({
      reminderId: isReminderGetMessageData?.id,
      userUUID: localStorage.getItem("UUID") || "",
      taskId: signleDataTask?.id,
      setNoDataFound,
      setLoading,
      setMessageList,
      setHasMore,
      currentPage,
      checkedReminder,
      checkedAttachment,
      selectDate,
      startDateForUl,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }

    setIsReminderConfirmationStatus(false);
  };

  function openCallHistoryLog() {
    setIsStageAndStatusModalOpen(true);
  }

  function openContactDetailLog() {
    setIsContactDetailModalOpen(true);
  }

  function openvisit() {
    if (canAddVisit) {
      setShowVisits(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }

  console.log("idididididididid", signleDataTask?.id);

  return (
    <>
      <div className="Right-Container" style={{ flex: "70%", display: "flex" }}>
        <>
          <div className="rightSide" style={{ display: "flex" }} id="rightSide">
            <div className="header">
              <div className="imgText" role="button">
                {/* <div
                        className="imgBox"
                        style={{ backgroundColor: "#CFCFCF" }}
                      >
                        <div
                          className="text-uppercase "
                          style={{ paddingTop: "12px" }}
                        >
                          {getData &&
                            (getData?.person_name?.[0] || "") +
                              (getData?.person_name?.[1] || "")}
                        </div>
                      </div> */}

                <h4
                  style={{
                    wordBreak: "break-word",
                    maxWidth: "230px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    paddingLeft: "10px",
                    margin: "0px",
                  }}
                  title={
                    signleDataTask?.task_title
                      ? `${signleDataTask?.task_remark} ${
                          signleDataTask?.task_remark && "-"
                        } ${signleDataTask?.task_title}`
                      : `${signleDataTask?.task_title}`
                  }
                  aria-label={
                    signleDataTask?.task_title
                      ? `${signleDataTask?.task_remark} ${
                          signleDataTask?.task_remark && "-"
                        } ${signleDataTask?.task_title}`
                      : `${signleDataTask?.task_title}`
                  }
                >
                  {"#"}
                  {signleDataTask?.id} {signleDataTask?.task_title}
                  {/* {signleDataTask?.task_remark} */}
                </h4>
                <h6></h6>
              </div>

              <div className="d-flex">
                <button className="icons mx-2" onClick={openCallHistoryLog}>
                  <span title="Open Status Log">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path d="M640-120q-33 0-56.5-23.5T560-200v-160q0-33 23.5-56.5T640-440h160q33 0 56.5 23.5T880-360v160q0 33-23.5 56.5T800-120H640Zm0-80h160v-160H640v160ZM80-240v-80h360v80H80Zm560-280q-33 0-56.5-23.5T560-600v-160q0-33 23.5-56.5T640-840h160q33 0 56.5 23.5T880-760v160q0 33-23.5 56.5T800-520H640Zm0-80h160v-160H640v160ZM80-640v-80h360v80H80Zm640 360Zm0-400Z" />
                    </svg>
                  </span>
                </button>
                {supportTicketFlag == 0 &&
                  signleDataTask?.contact_masters_id != 0 && (
                    <button className="icons mx-1" onClick={openvisit}>
                      <span title="Visits">
                        <svg
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="currentColor"
                        >
                          <path
                            xmlns="http://www.w3.org/2000/svg"
                            d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z"
                          />
                        </svg>
                      </span>
                    </button>
                  )}
                {signleDataTask?.reference_id != 0 &&
                  signleDataTask?.reference_table?.startsWith("cart") && (
                    <Button
                      icon="pi pi-eye"
                      className="p-button-text"
                      onClick={() => {
                        const viewFormat = getViewFormat(
                          signleDataTask.reference_table,
                        );
                        openPrint(signleDataTask.reference_id, viewFormat, 1);
                      }}
                      tooltip="View Print"
                    />
                  )}

                {supportTicketFlag == 1 && (
                  <button
                    className="icons mx-2 text-end"
                    onClick={openContactDetailLog}
                  >
                    <span title="View Contact Details">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="currentColor"
                      >
                        <path d="M40-160v-640q0-33 23.5-56.5T120-880h720q33 0 56.5 23.5T920-800v640q0 33-23.5 56.5T840-120H120q-33 0-56.5-23.5T40-160Zm80-80h720v-560H120v560Zm80-80h560v-80q0-33-23.5-56.5T680-480H280q-33 0-56.5 23.5T200-400v80Zm280-240q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0 80Z" />
                      </svg>
                    </span>
                  </button>
                )}
                <div
                  className="text-end"
                  onClick={() =>
                    handleModalOpenStatusAssign(
                      signleDataTask?.id,
                      signleDataTask?.status,
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <span
                    style={{
                      backgroundColor: signleDataTask?.stage_status_color
                        ? signleDataTask?.stage_status_color
                        : "#eeeeee",
                      fontWeight: "normal",
                    }}
                    className="badge rounded-pill"
                    title={"Change Status"}
                  >
                    {signleDataTask?.stage_status_name}
                  </span>
                </div>

                <button
                  className="icons pP"
                  onClick={handelRefreshMessages}
                  title="Refresh"
                >
                  <svg width="28" height="28" viewBox="0 0 50 50">
                    <path
                      fill="currentColor"
                      d="M25 38c-7.2 0-13-5.8-13-13 0-3.2 1.2-6.2 3.3-8.6l1.5 1.3C15 19.7 14 22.3 14 25c0 6.1 4.9 11 11 11 1.6 0 3.1-.3 4.6-1l.8 1.8c-1.7.8-3.5 1.2-5.4 1.2z"
                    />
                    <path
                      fill="currentColor"
                      d="M34.7 33.7l-1.5-1.3c1.8-2 2.8-4.6 2.8-7.3 0-6.1-4.9-11-11-11-1.6 0-3.1.3-4.6 1l-.8-1.8c1.7-.8 3.5-1.2 5.4-1.2 7.2 0 13 5.8 13 13 0 3.1-1.2 6.2-3.3 8.6z"
                    />
                    <path fill="currentColor" d="M18 24h-2v-6h-6v-2h8z" />
                    <path fill="currentColor" d="M40 34h-8v-8h2v6h6z" />
                  </svg>
                </button>
                <div className="chat-side">
                  <button
                    className="icons pP"
                    onClick={openSearch}
                    title="Search"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path
                        fill="currentColor"
                        d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"
                      ></path>
                    </svg>
                  </button>

                  <div className="dropdown-icon">
                    <button
                      className="pressed icons pP"
                      id="dropDown"
                      onClick={toggleDropdown}
                      ref={dropdownRef}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className=""
                      >
                        <path
                          fill="currentColor"
                          d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                        ></path>
                      </svg>
                    </button>
                    <ul
                      className={`drop ${
                        dropdownOpen ? "isVisible" : "isHidden"
                      }`}
                      id="drop"
                    >
                      {/* <li
                        className="listItem"
                        role="button"
                        onClick={() =>
                          handleModalOpenStatusAssign(signleDataTask?.id)
                        }
                      >
                        Assign Status
                      </li> */}
                      <li
                        className="listItem"
                        role="button"
                        onClick={() =>
                          handleModalOpenUserAssign(signleDataTask?.id)
                        }
                      >
                        Assign Team Member
                      </li>
                      <li
                        className="listItem"
                        style={{ color: "red", fontWeight: "bold" }}
                        role="button"
                        onClick={() => CloseTaskChat()}
                        id="closeChat"
                      >
                        Close chat
                      </li>
                      {/* {getCompanyId === Number(getUUID) ? (
                              <li
                                className="listItem"
                                role="button"
                                data-bs-toggle="modal"
                                data-bs-target="#clear-modal"
                                onClick={openModelClearMsg}
                              >
                                Clear messages
                              </li>
                            ) : (
                              <span></span>
                            )} */}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {searchOpen && (
              <div className="header-search" style={{ zIndex: "1" }}>
                <div className="search-bar" style={{ width: "40%" }}>
                  <div className=" d-flex justify-content-between">
                    <button className="search">
                      <span className="">
                        <svg
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          className=""
                        >
                          <path
                            fill="currentColor"
                            d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"
                          ></path>
                        </svg>
                      </span>
                    </button>

                    <span className="go-back">
                      <svg
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className=""
                      >
                        <path
                          fill="currentColor"
                          d="m12 4 1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"
                        ></path>
                      </svg>
                    </span>

                    <input
                      type="text"
                      title="Search or start new chat"
                      aria-label="Search or start new chat"
                      placeholder="Search message"
                      maxLength={BIG_TEXT_LENGTH}
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="search-message-input"
                    />
                  </div>
                </div>
                <div
                  className="d-flex align-items-center justify-content-between "
                  style={{ width: "55%" }}
                >
                  <div className="">
                    <input
                      className="custom-checkbox"
                      type="checkbox"
                      checked={checkedReminder}
                      onChange={(e) => setCheckedReminder(e.target.checked)}
                    />

                    <label className="p-2  header-search-front">
                      Reminders
                    </label>
                  </div>
                  <div>
                    <input
                      className="custom-checkbox"
                      type="checkbox"
                      onChange={(e) => setCheckedAttachment(e.target.checked)}
                    />
                    <label className="p-2 header-search-front">
                      Attachment
                    </label>
                  </div>
                  <div>
                    <DateTimeRangePicker
                      value={selectDate}
                      onChange={handelSearchDateChange}
                      showTime={false}
                      numberOfMonthsShow={1}
                    />
                    <span className="p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="22px"
                        viewBox="0 -960 960 960"
                        width="22px"
                        fill="#5f6368"
                      >
                        <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-160 0q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm320 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
                      </svg>
                    </span>
                  </div>

                  <span
                    role="button"
                    className="p-1"
                    onClick={handleSearchClear}
                  >
                    <svg
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="M280-80q-83 0-141.5-58.5T80-280q0-83 58.5-141.5T280-480q83 0 141.5 58.5T480-280q0 83-58.5 141.5T280-80Zm544-40L568-376q-12-13-25.5-26.5T516-428q38-24 61-64t23-88q0-75-52.5-127.5T420-760q-75 0-127.5 52.5T240-580q0 6 .5 11.5T242-557q-18 2-39.5 8T164-535q-2-11-3-22t-1-23q0-109 75.5-184.5T420-840q109 0 184.5 75.5T680-580q0 43-13.5 81.5T629-428l251 252-56 56Zm-615-61 71-71 70 71 29-28-71-71 71-71-28-28-71 71-71-71-28 28 71 71-71 71 28 28Z" />
                    </svg>
                  </span>
                </div>
              </div>
            )}
            {/* view Task Title And Remakrk */}
            <div className="header-task mt-2">
              <div className="task-contant">
                <p
                  className="task-desc"
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <strong>Task Description:</strong> {displayText}
                  {!isExpanded && remark.length > BIG_TEXT_LENGTH && " ..."}
                </p>
              </div>

              {/* Arrow toggle button only at the bottom */}
              {remark.length > BIG_TEXT_LENGTH && (
                <div className="mt-2" style={{ textAlign: "left" }}>
                  <button
                    className="icons pP"
                    onClick={toggleTaskDetails}
                    title={
                      isExpanded
                        ? "Hide Task Description"
                        : "View Task Description"
                    }
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="M480-360 280-560h400L480-360Z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* view Task Title And Remakrk */}
            <div className="chatBox" ref={containerRef} onScroll={handleScroll}>
              {loading ? (
                <div className="d-flex justify-content-center h-50">
                  <div
                    className="spinner-border text-secondary "
                    role="status"
                  ></div>
                </div>
              ) : (
                <>
                  {searchTerm && noDataFound && (
                    <div className="d-flex justify-content-center h-75 ">
                      <p className="no_found">No data found</p>
                    </div>
                  )}
                  {messageList &&
                    [...messageList].reverse().map((group, index) => (
                      <div>
                        <div className="chat__date-wrapper" key={index}>
                          <span className="chat__date">
                            {group.date
                              ? new Date(group.date)
                                  .toLocaleDateString("en-GB", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                  })
                                  .replace(/\//g, "-")
                              : ""}
                          </span>
                        </div>
                        {group &&
                          group.messages.map((message, index1) => {
                            const extension = getFileExtension(
                              message.media_name,
                            );
                            const icon = getIconForExtension(extension);
                            return (
                              <div key={index1}>
                                <>
                                  {message.message_side === 2 && (
                                    <>
                                      {message.isDelete === 1 ? (
                                        <p className="chatMessageDelete my-chat-delete tooltip-wrapper2">
                                          Deleted By --
                                          {message.deleted_by}
                                          {companyLists.some(
                                            (item) => item.company_flag === 1,
                                          ) && (
                                            <span className="tooltip-content">
                                              <SafeHtml
                                                htmlContent={
                                                  message.description
                                                }
                                              />
                                            </span>
                                          )}
                                        </p>
                                      ) : (
                                        <>
                                          <div
                                            className="chatMessage frnd-chat"
                                            style={{
                                              maxWidth: "45%",
                                              height: "100%",
                                              flexDirection: "column",
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                justifyContent: "end",
                                                paddingRight: "10px",
                                              }}
                                            >
                                              <span className="chat__msg-filler2">
                                                {message.is_reminder ? (
                                                  <span
                                                    role="button"
                                                    onClick={() =>
                                                      handleChangeOfReminderLeftMsg(
                                                        message,
                                                      )
                                                    }
                                                  >
                                                    <svg
                                                      height="16px"
                                                      viewBox="0 -960 960 960"
                                                      width="16 px"
                                                      className=""
                                                      fill="currentColor"
                                                    >
                                                      <path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-800q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Zm0-360Zm112 168 56-56-128-128v-184h-80v216l152 152ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z" />
                                                    </svg>
                                                  </span>
                                                ) : (
                                                  "  "
                                                )}
                                              </span>
                                            </div>
                                            <div
                                              style={{
                                                width: "100%",
                                              }}
                                            >
                                              <span>
                                                <SafeHtml
                                                  htmlContent={
                                                    message.description
                                                  }
                                                />
                                              </span>
                                              {extension === "png" ||
                                              extension === "jpg" ||
                                              extension === "jpeg" ? (
                                                <span
                                                  onClick={() =>
                                                    handleChangeImgViewer(
                                                      message,
                                                    )
                                                  }
                                                  style={{
                                                    cursor: "pointer",
                                                  }}
                                                >
                                                  <span
                                                    className="d-flex justify-content-center"
                                                    style={{
                                                      maxHeight: "30vh",
                                                    }}
                                                  >
                                                    <img
                                                      src={`${message.media_url}`}
                                                      alt="Avatar"
                                                      className="align-text-top w-100"
                                                    />
                                                  </span>
                                                </span>
                                              ) : extension === "ogg" ||
                                                extension === "wav" ||
                                                extension === "mp3" ? (
                                                <audio
                                                  controls
                                                  src={`${message.media_url}`}
                                                ></audio>
                                              ) : (
                                                <span
                                                  onClick={() =>
                                                    handleDownload(message)
                                                  }
                                                  style={{
                                                    cursor: "pointer",
                                                    paddingRight: "6px",
                                                  }}
                                                >
                                                  {icon && (
                                                    <img
                                                      src={icon}
                                                      alt={`${extension} icon`}
                                                      style={{
                                                        width: 30,
                                                        verticalAlign:
                                                          "text-top",
                                                      }}
                                                    />
                                                  )}
                                                  <span>
                                                    {message.media_name}
                                                  </span>
                                                  {extension && (
                                                    <span className="px-3">
                                                      <svg
                                                        viewBox="0 -960 960 960"
                                                        width="20px"
                                                        fill="#5f6368"
                                                      >
                                                        <path d="M280-280h400v-80H280v80Zm200-120 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160Zm0 320q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                                                      </svg>
                                                    </span>
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                            <span className="chat__msg-filler"></span>
                                            <span className="status1">
                                              <span>
                                                {message.created_date_time
                                                  ? formatTimeToAmPm(
                                                      message.created_date_time,
                                                    )
                                                  : ""}
                                              </span>
                                            </span>

                                            <span className="status1 ">
                                              <span>
                                                <i>
                                                  {message.entry_flag === 1 ? (
                                                    <>
                                                      {
                                                        message.application_login_name
                                                      }
                                                    </>
                                                  ) : (
                                                    <>
                                                      {
                                                        message.application_login_name
                                                      }
                                                    </>
                                                  )}
                                                </i>
                                              </span>
                                            </span>
                                            <div>
                                              <ul
                                                className={`${
                                                  filteredItemIds.includes(
                                                    message.id,
                                                  )
                                                    ? "drop_msg1"
                                                    : "drop_msg_left"
                                                } ${
                                                  hasOneData1 === message.id &&
                                                  dropdownOpenMsgLeft
                                                    ? "isVisible"
                                                    : "isHidden"
                                                }`}
                                                ref={(el) =>
                                                  (dropdownRefLeftMsg.current[
                                                    message.id
                                                  ] = el)
                                                }
                                                style={{ height: "27vh" }}
                                              >
                                                {message.message_type_id ===
                                                0 ? (
                                                  <li
                                                    className="drop_listItem"
                                                    role="button"
                                                    onClick={() =>
                                                      handleChangeEdit(message)
                                                    }
                                                  >
                                                    Edit
                                                  </li>
                                                ) : (
                                                  <span></span>
                                                )}
                                                <li
                                                  className="drop_listItem"
                                                  role="button"
                                                  onClick={() =>
                                                    handelChangeDeleteRight(
                                                      message.id,
                                                    )
                                                  }
                                                >
                                                  Delete
                                                </li>

                                                {!message.is_reminder &&
                                                (message.message_type_id ===
                                                  0 ||
                                                  message.message_type_id ===
                                                    2) ? (
                                                  <li
                                                    className="drop_listItem"
                                                    role="button"
                                                    onClick={() =>
                                                      toggleReminder(message.id)
                                                    }
                                                  >
                                                    Reminders
                                                  </li>
                                                ) : (
                                                  <span></span>
                                                )}
                                                {/* <li
                                                  className="drop_listItem"
                                                  role="button"
                                                  onClick={() => showTaskFromDashbord()}
                                                >
                                                  Add Task
                                                </li> */}
                                                <li
                                                  className="drop_listItem"
                                                  role="button"
                                                  onClick={() =>
                                                    toggleMoveToMe(message.id)
                                                  }
                                                >
                                                  Move to Me
                                                </li>
                                              </ul>
                                            </div>
                                            <button
                                              aria-label="Message options"
                                              className="chat__msg-options"
                                              onClick={() =>
                                                toggleDropdownMsgLeft(
                                                  message.id,
                                                )
                                              }
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 19 20"
                                                width="19"
                                                height="20"
                                                className="chat__msg-options-icon"
                                              >
                                                <path
                                                  fill="currentColor"
                                                  d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                                ></path>
                                              </svg>
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </>
                                  )}
                                  {message.message_side === 1 && (
                                    <>
                                      {message.isDelete === 1 ? (
                                        <p className="chatMessageDelete my-chat-delete tooltip-wrapper">
                                          Deleted By --
                                          {message.deleted_by}
                                          {companyLists.some(
                                            (item) => item.company_flag === 1,
                                          ) && (
                                            <span className="tooltip-content">
                                              <SafeHtml
                                                htmlContent={
                                                  message.description
                                                }
                                              />
                                            </span>
                                          )}
                                        </p>
                                      ) : (
                                        <div
                                          className="chatMessage my-chat"
                                          style={{
                                            maxWidth: "45%",
                                            height: "100%",
                                            flexDirection: "column",
                                            paddingRight: "30px",
                                          }}
                                        >
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "end",
                                              paddingRight: "10px",
                                            }}
                                          >
                                            <span className="chat__msg-filler2">
                                              {message.is_reminder ? (
                                                <span
                                                  role="button"
                                                  onClick={() =>
                                                    handleChangeOfReminderRightMsg(
                                                      message,
                                                    )
                                                  }
                                                >
                                                  <svg
                                                    height="16px"
                                                    viewBox="0 -960 960 960"
                                                    width="16 px"
                                                    className=""
                                                    fill="currentColor"
                                                  >
                                                    <path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-800q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Zm0-360Zm112 168 56-56-128-128v-184h-80v216l152 152ZM224-866l56 56-170 170-56-56 170-170Zm512 0 170 170-56 56-170-170 56-56ZM480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160Z" />
                                                  </svg>
                                                </span>
                                              ) : (
                                                "  "
                                              )}

                                              {message.entry_flag === 2 && (
                                                <span role="button">
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    height="20px"
                                                    viewBox="0 -960 960 960"
                                                    width="20px"
                                                    fill="#5f6368"
                                                  >
                                                    <path d="M480-440 160-640v400h360v80H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v280h-80v-200L480-440Zm0-80 320-200H160l320 200ZM760-40l-56-56 63-64H600v-80h167l-64-64 57-56 160 160L760-40ZM160-640v440-240 3-283 80Z" />
                                                  </svg>
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                          <span>
                                            {message.message_type_id === 1 ? (
                                              <></>
                                            ) : (
                                              ""
                                            )}
                                          </span>

                                          <span>
                                            <SafeHtml
                                              htmlContent={message.description}
                                            />
                                          </span>

                                          {extension === "png" ||
                                          extension === "jpg" ||
                                          extension === "jpeg" ? (
                                            <span
                                              onClick={() =>
                                                handleChangeImgViewer(message)
                                              }
                                              style={{
                                                cursor: "pointer",
                                                //   paddingRight: "6px",
                                              }}
                                            >
                                              <span
                                                className="d-flex justify-content-center"
                                                style={{
                                                  maxHeight: "30vh",
                                                }}
                                              >
                                                <img
                                                  src={`${message.media_url}`}
                                                  alt="Avatar"
                                                  className="align-text-top w-100"
                                                />
                                              </span>
                                            </span>
                                          ) : extension === "ogg" ||
                                            extension === "wav" ||
                                            extension === "mp3" ? (
                                            <audio
                                              controls
                                              src={`${message.media_url}`}
                                            ></audio>
                                          ) : (
                                            <span
                                              onClick={() =>
                                                handleDownload(message)
                                              }
                                              style={{
                                                cursor: "pointer",
                                                paddingRight: "6px",
                                              }}
                                            >
                                              {icon && (
                                                <img
                                                  src={icon}
                                                  alt={`${extension} icon`}
                                                  style={{
                                                    width: 30,
                                                    verticalAlign: "text-top",
                                                  }}
                                                />
                                              )}
                                              <span>{message.media_name}</span>
                                              {extension && (
                                                <span className="px-3">
                                                  <svg
                                                    viewBox="0 -960 960 960"
                                                    width="20px"
                                                    fill="#5f6368"
                                                  >
                                                    <path d="M280-280h400v-80H280v80Zm200-120 160-160-56-56-64 62v-166h-80v166l-64-62-56 56 160 160Zm0 320q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
                                                  </svg>
                                                </span>
                                              )}
                                            </span>
                                          )}
                                          {/* <span>{messag}</span> */}
                                          <span className="chat__msg-filler"></span>

                                          <span className="status1">
                                            <span>
                                              {message.created_date_time
                                                ? formatTimeToAmPm(
                                                    message.created_date_time,
                                                  )
                                                : ""}
                                            </span>
                                          </span>
                                          <span className="status1">
                                            <span className="">
                                              <i>
                                                {message.application_login_name}
                                              </i>
                                            </span>
                                          </span>
                                          <div>
                                            <ul
                                              className={`${
                                                filteredItemIds.includes(
                                                  message.id,
                                                )
                                                  ? "drop_msg1"
                                                  : "drop_msg"
                                              } ${
                                                hasOneData === message.id &&
                                                dropdownOpenMsg
                                                  ? "isVisible"
                                                  : "isHidden"
                                              }`}
                                              ref={(el) =>
                                                (dropdownRefRightMsg.current[
                                                  message.id
                                                ] = el)
                                              }
                                              style={{ height: "27vh" }}
                                            >
                                              {message.message_type_id === 0 ? (
                                                <li
                                                  className="drop_listItem"
                                                  role="button"
                                                  onClick={() =>
                                                    handleChangeEdit(message)
                                                  }
                                                >
                                                  Edit
                                                </li>
                                              ) : (
                                                <span></span>
                                              )}
                                              <li
                                                className="drop_listItem"
                                                role="button"
                                                onClick={() =>
                                                  handelChangeDeleteRight(
                                                    message.id,
                                                  )
                                                }
                                              >
                                                Delete
                                              </li>

                                              {!message.is_reminder &&
                                              (message.message_type_id === 0 ||
                                                message.message_type_id ===
                                                  2) ? (
                                                <li
                                                  className="drop_listItem"
                                                  role="button"
                                                  onClick={() =>
                                                    toggleReminder(message.id)
                                                  }
                                                >
                                                  Reminders
                                                </li>
                                              ) : (
                                                <span></span>
                                              )}
                                              {/* <li
                                                className="drop_listItem"
                                                role="button"
                                                onClick={() => showTask(message)}
                                              >
                                                Add Task
                                              </li> */}
                                              <li
                                                className="drop_listItem"
                                                role="button"
                                                onClick={() =>
                                                  toggleMoveToClient(message.id)
                                                }
                                              >
                                                Move to Client
                                              </li>
                                            </ul>
                                          </div>
                                          <button
                                            id="dropDown2"
                                            className="chat__msg-options"
                                            onClick={() =>
                                              toggleDropdownMsg(message.id)
                                            }
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 19 20"
                                              width="19"
                                              height="20"
                                              className="chat__msg-options-icon"
                                            >
                                              <path
                                                fill="currentColor"
                                                d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                              ></path>
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              </div>
                            );
                          })}
                      </div>
                    ))}

                  {/* <div className="text-center">
                    {hasMore ? (
                      <p
                        className="no_found"
                        style={{ marginTop: "0px" }}
                      >
                        No data found
                      </p>
                    ) : (
                      <button
                        onClick={handleLoadMore}
                        className="btn  te xt-light   rounded-5   fw_500"
                        style={{ backgroundColor: "#f58634" }}
                      >
                        Load More
                      </button>
                    )}
                  </div> */}
                </>
              )}

              <div ref={messagesEndRef}> </div>
            </div>
            <div className="chat-footer">
              <div className="chat-input-wrapper">
                <button
                  aria-label="Close emojis"
                  className="icons hidden"
                  id="emoji-remove-icon"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    className="chat__input-icon"
                  >
                    <path
                      fill="currentColor"
                      d="M19.1 17.2l-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"
                    ></path>
                  </svg>
                </button>
                <button
                  aria-label="Choose GIF"
                  className={`icons ${isActive ? "" : "hidden"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    className="chat__input-icon"
                  >
                    <path
                      fill="currentColor"
                      d="M13.177 12.013l-.001-.125v-.541-.512c0-.464 0-.827-.002-1.178a.723.723 0 0 0-.557-.7.715.715 0 0 0-.826.4c-.05.115-.072.253-.073.403-.003 1.065-.003 1.917-.002 3.834v.653c0 .074.003.136.009.195a.72.72 0 0 0 .57.619c.477.091.878-.242.881-.734.002-.454.003-.817.002-1.633l-.001-.681zm-3.21-.536a35.751 35.751 0 0 0-1.651-.003c-.263.005-.498.215-.565.48a.622.622 0 0 0 .276.7.833.833 0 0 0 .372.104c.179.007.32.008.649.005l.137-.001v.102c-.001.28-.001.396.003.546.001.044-.006.055-.047.081-.242.15-.518.235-.857.275-.767.091-1.466-.311-1.745-1.006a2.083 2.083 0 0 1-.117-1.08 1.64 1.64 0 0 1 1.847-1.41c.319.044.616.169.917.376.196.135.401.184.615.131a.692.692 0 0 0 .541-.562c.063-.315-.057-.579-.331-.766-.789-.542-1.701-.694-2.684-.482-2.009.433-2.978 2.537-2.173 4.378.483 1.105 1.389 1.685 2.658 1.771.803.054 1.561-.143 2.279-.579.318-.193.498-.461.508-.803.014-.52.015-1.046.001-1.578-.009-.362-.29-.669-.633-.679zM18 4.25H6A4.75 4.75 0 0 0 1.25 9v6A4.75 4.75 0 0 0 6 19.75h12A4.75 4.75 0 0 0 22.75 15V9A4.75 4.75 0 0 0 18 4.25zM21.25 15A3.25 3.25 0 0 1 18 18.25H6A3.25 3.25 0 0 1 2.75 15V9A3.25 3.25 0 0 1 6 5.75h12A3.25 3.25 0 0 1 21.25 9v6zm-2.869-6.018H15.3c-.544 0-.837.294-.837.839V14.309c0 .293.124.525.368.669.496.292 1.076-.059 1.086-.651.005-.285.006-.532.004-1.013v-.045l-.001-.46v-.052h1.096l1.053-.001a.667.667 0 0 0 .655-.478c.09-.298-.012-.607-.271-.757a.985.985 0 0 0-.468-.122 82.064 82.064 0 0 0-1.436-.006h-.05l-.523.001h-.047v-1.051h1.267l1.22-.001c.458-.001.768-.353.702-.799-.053-.338-.35-.56-.737-.561z"
                    ></path>
                  </svg>
                </button>

                <button
                  aria-label="Choose sticker"
                  className={`icons ${isActive ? "" : "hidden"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    className="chat__input-icon"
                  >
                    <path
                      fill="currentColor"
                      d="M21.799 10.183c-.002-.184-.003-.373-.008-.548-.02-.768-.065-1.348-.173-1.939a6.6 6.6 0 0 0-.624-1.87 6.24 6.24 0 0 0-1.171-1.594 6.301 6.301 0 0 0-1.614-1.159 6.722 6.722 0 0 0-1.887-.615c-.59-.106-1.174-.15-1.961-.171-.318-.008-3.607-.012-4.631 0-.798.02-1.383.064-1.975.17a6.783 6.783 0 0 0-1.888.616 6.326 6.326 0 0 0-2.785 2.753 6.658 6.658 0 0 0-.623 1.868c-.107.591-.152 1.186-.173 1.941-.008.277-.016 2.882-.016 2.882 0 .52.008 1.647.016 1.925.02.755.066 1.349.172 1.938.126.687.33 1.3.624 1.871.303.59.698 1.126 1.173 1.595a6.318 6.318 0 0 0 1.614 1.159 6.786 6.786 0 0 0 2.146.656c.479.068.833.087 1.633.108.035.001 2.118-.024 2.578-.035a6.873 6.873 0 0 0 4.487-1.811 210.877 210.877 0 0 0 2.928-2.737 6.857 6.857 0 0 0 2.097-4.528l.066-1.052.001-.668c.001-.023-.005-.738-.006-.755zm-3.195 5.92c-.79.757-1.784 1.684-2.906 2.716a5.356 5.356 0 0 1-2.044 1.154c.051-.143.116-.276.145-.433.042-.234.06-.461.067-.74.003-.105.009-.789.009-.789.013-.483.042-.865.107-1.22.069-.379.179-.709.336-1.016.16-.311.369-.595.621-.844.254-.252.542-.458.859-.617.314-.158.65-.268 1.037-.337a8.127 8.127 0 0 1 1.253-.106s.383.001.701-.003a4.91 4.91 0 0 0 .755-.066c.186-.034.348-.105.515-.169a5.35 5.35 0 0 1-1.455 2.47zm1.663-4.757a1.128 1.128 0 0 1-.615.859 1.304 1.304 0 0 1-.371.119 3.502 3.502 0 0 1-.52.043c-.309.004-.687.004-.687.004-.613.016-1.053.049-1.502.129a5.21 5.21 0 0 0-1.447.473 4.86 4.86 0 0 0-2.141 2.115 5.088 5.088 0 0 0-.479 1.434 9.376 9.376 0 0 0-.131 1.461s-.006.684-.008.777c-.006.208-.018.37-.043.511a1.154 1.154 0 0 1-.626.86c-.072.036-.168.063-.37.098-.027.005-.25.027-.448.031-.021 0-1.157.01-1.192.009-.742-.019-1.263-.046-1.668-.126a5.27 5.27 0 0 1-1.477-.479 4.823 4.823 0 0 1-2.127-2.1 5.141 5.141 0 0 1-.482-1.453c-.09-.495-.13-1.025-.149-1.71a36.545 36.545 0 0 1-.012-.847c-.003-.292.005-3.614.012-3.879.02-.685.061-1.214.151-1.712a5.12 5.12 0 0 1 .481-1.45c.231-.449.53-.856.892-1.213.363-.36.777-.657 1.233-.886a5.26 5.26 0 0 1 1.477-.479c.503-.09 1.022-.129 1.74-.149a342.03 342.03 0 0 1 4.561 0c.717.019 1.236.058 1.737.148a5.263 5.263 0 0 1 1.476.478 4.835 4.835 0 0 1 2.126 2.098c.228.441.385.913.482 1.453.091.499.131 1.013.15 1.712.008.271.014 1.098.014 1.235a2.935 2.935 0 0 1-.037.436z"
                    ></path>
                  </svg>
                </button>

                {canAdd ? (
                  <CustomEditor
                    fieldName="myField"
                    text={editorContent}
                    onChange={handleEditorChange}
                    onSend={handleSend}
                    isToggledButton={isToggledButton}
                    handleChangeToggleButton={handleChangeToggleButton}
                    contactData={signleDataTask}
                    setIsLoadedMessage={setIsLoadedMessage}
                    editMsg={editorContentToEdit}
                    isWhatsAppAuto={isWhatsAppAuto} // Pass state
                    handleWhatsAppToggle={handleWhatsAppToggle} // Pass function
                    setIsWhatsAppAuto={setIsWhatsAppAuto} // Pass function
                    taskFlagtoHideWP={1}
                  />
                ) : (
                  <span></span>
                )}
              </div>
            </div>
          </div>
        </>
        {/* {isOpenTaskCreateModel && (
          <CreateTaskView
            show={isOpenTaskCreateModel}
            onHide={() => {
              setIsOpenTaskCreateModel(false);
              setTaskData({});
            }}
            setTargetVsIncentiveList={setTargetVsIncentiveList}
            setLoading={setLoading}
            headerName="Create Task"
            setRefreshProduct={setRefreshProduct}
            productToEdit={undefined}
            messageId={taskData.messageId}
            messageDescription={taskData.messageDescription}
            contactId={taskData.contactId}
            referenceTable={taskData.referenceTable}
          />
        )}
        */}

        {/* <RightSearch
          isSearchShow={showSearch}
          closeSearch={() => setShowSearch(false)}
        /> */}

        {/* {isClearConfirmation && (
          <ConfirmationModal
            show={isClearConfirmation}
            onHide={() => setIsClearConfirmation(false)}
            handleSubmit={() => handelClearMessages()}
            title={"Clear this chats"}
            message={"Are you sure you want Clear this Chats?"}
            btn1="CANCEL"
            btn2="CLEAR CHATS"
          />
        )} */}

        {isDeleteConfirmation && (
          <ConfirmationModal
            show={isDeleteConfirmation}
            onHide={() => setIsDeleteConfirmation(false)}
            handleSubmit={handleDeleteMessage}
            title={"Delete this message"}
            message={"Are you sure you want delete this message? "}
            btn1="CANCEL"
            btn2="DELETE"
          />
        )}
        {isMoveToMeConfirmation && (
          <ConfirmationModal
            show={isMoveToMeConfirmation}
            onHide={() => setIsMoveToMeConfirmation(false)}
            handleSubmit={() => handleChangeMoveMsg(1)}
            title={"Move this message to Me"}
            message={"Are you sure you want Move this message to Me? "}
            btn1="No"
            btn2="Yes"
          />
        )}
        {isMoveToClientConfirmation && (
          <ConfirmationModal
            show={isMoveToClientConfirmation}
            onHide={() => setIsMoveToClientConfirmation(false)}
            handleSubmit={() => handleChangeMoveMsg(2)}
            title={"Move this message to Client"}
            message={"Are you sure you want Move this message to Client? "}
            btn1="No"
            btn2="Yes"
          />
        )}
        {isReminderConfirmationStatus && (
          <ConfirmationModal
            show={isReminderConfirmationStatus}
            onHide={() => setIsReminderConfirmationStatus(false)}
            handleSubmit={handleComplateReminderFromMsg}
            title="Are you sure you want to complete this Reminder?"
            message={`Remark: ${isReminderGetMessageData?.reminder_remark || " "}`}
            btn1="CANCEL"
            btn2="Complete Reminder Now"
            message1={`Reminder Date : ${
              isReminderGetMessageData?.reminder_data_time
            }`}
          />
        )}
        {isReminderConfirmation && (
          <ReminderModal
            show={isReminderConfirmation}
            onHide={() => setIsReminderConfirmation(false)}
            handleSubmit={handleReminder}
            title={" Set Reminder "}
            message={"Are you sure you want delete this message? "}
            btn1="CANCEL"
            btn2="set Reminder"
            ContactMessageId={reminderForTaskId}
            request_flag="3"
          />
        )}

        {viewerOpen && (
          <ImageViewer
            image={imageViewData}
            onClose={() => setViewerOpen(false)}
          />
        )}

        {isModalAssignStatusVisible && (
          <RadioButtonModal
            show={isModalAssignStatusVisible}
            onHide={() => setIsModalAssignStatusVisible(false)}
            handleSubmit={handleConfirmRadioButton}
            title="Assign your Status"
            message="Please select the Status for this contact."
            btn1="Cancel"
            btn2="Submit"
            options={optionRadioButtonStatus}
            // selectedLabelIds={getData?.stage_status_name}
            selectedLabelIds={signleDataTask?.status}
            contactId={signleDataTask?.id}
            getOptionColor={(option) => option.color || "#eeeeee"}
            getOptionName={(option) => option.name}
            showColorBadge={true}
            // setRefreshStatus={() => setRefreshStatus(true)}
          />
        )}
        {isModalAssignUserVisible && (
          <CheckBoxModal
            show={isModalAssignUserVisible}
            onHide={() => setIsModalAssignUserVisible(false)}
            handleSubmit={handleConfirmAssignUser}
            title="Assign your User"
            message="Please select the Users for this contact."
            btn1="Cancel"
            btn2="Submit"
            options={optionJoinCompany}
            selectedLabelIds={signleDataTask?.assigned_team_member}
            contactId={signleDataTask?.id}
            getOptionName={getOptionName}
            showColorBadge={false}
          />
        )}

        {isContactDetailModalOpen && (
          <ContactDetailModel
            show={isContactDetailModalOpen}
            onHide={() => setIsContactDetailModalOpen(false)}
            contactId={signleDataTask?.contact_masters_id}
          />
        )}
        {isStageAndStatusModalOpen && (
          <EventLogs
            show={isStageAndStatusModalOpen}
            onHide={() => setIsStageAndStatusModalOpen(false)}
            reference_id={signleDataTask?.id}
            reference_table="task_managements"
            requiredTabs={["status_timeline"]}
          />
        )}
        {showVisits && (
          <Visitsview
            isVisitView={showVisits}
            closeVisitView={() => {
              setShowVisits(false);
              // setshowSetting(true);
            }}
            contactId={signleDataTask?.contact_masters_id}
            contactName={signleDataTask?.contact_person_name}
            setRefreshVisit={() => setRefreshVisit(true)}
            is_task={1}
            stop_task_id={signleDataTask?.id}
          />
        )}
      </div>

      {/* <IntroductionVideo /> */}
    </>
  );
};

export default TaskChatRightSide;
