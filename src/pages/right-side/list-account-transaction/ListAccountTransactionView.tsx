import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { DateObject } from "react-multi-date-picker";
import { toast } from "react-toastify";
import {
  convertDateTimeFormat,
  formatDate,
  formatDateTimeSendDataBase,
} from "../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../components/model/CheckBoxFilterModal";
import ConfirmationModal from "../../../components/model/ConfirmationModal";
import PrintSettingModal from "../../../components/model/PrintSettingModal";
import {
  whatsappTemplateCloudeSend
} from "../../../components/model/whatsapp_template_sender/WhatsappTemplateSenderController";
import SafeHtml from "../../../components/SafeHtml";
import { useTheme } from "../../../components/ThemeContext";
import {
  DEFAULT_MESSAGE_ERROR_PERMISSION,
  DEFAULT_STATUS_CODE_SUCCESS,
  ITEMS_PER_PAGE,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE, PRINT_SETTING_TYPE_OBJ } from "../../../helpers/AppEnum";
import { IFilterPayload, TFilterDate } from "../../../helpers/AppInterface";
import { TReactSetState } from "../../../helpers/AppType";
import useCheckUserPermission from "../../../hooks/useCheckUserPermission";
import { axiosInstance } from "../../../services/axiosInstance";
import useMiracleFlagStore from "../../../store/miracle/useMiracleFlagStore";
import useWhatsappPlatformStore from "../../../store/whatsapp/useWhatsappPlateformFlagStore";
import {
  fetchprintSetting,
  IprintSetting,
} from "../../order-pdf-view/OrderPdfController";
import CreateAccountTransactionView from "../create-account-transaction/CreateAccountTransactionView";
import {
  contactAllTransactionDownloadPDf,
  fetchAccountPdfmeTemplatesForPicker,
  fetchApiAccountTransitions,
  generateMiracleLedger,
  generateMiracleOutstanding,
  IAccountTransaction,
  PDFaccountv1,
  syncMiracleAccountEntry,
} from "./ListAccounTransactionController";

interface IPropsListAccountTransaction {
  isListAccountTransaction: boolean;
  closeListAccountTransaction: () => void;
  contactData?: any;
  setNoDataFound1: TReactSetState<boolean>;
  setRefreshAccount?: (value: boolean | number) => void;
}

const ListAccountTransactionView = ({
  isListAccountTransaction,
  closeListAccountTransaction,
  contactData,
  setNoDataFound1,
  setRefreshAccount,
}: IPropsListAccountTransaction) => {
  const isFeatureEnabled = useMiracleFlagStore(
    (state) => state.isFeatureEnabled,
  );
  const [syncLoading, setSyncLoading] = useState(false);
  const { platformType } = useWhatsappPlatformStore();

  const listInnerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<Record<number, HTMLUListElement | null>>({});
  const dropdownContactRef = useRef<Record<number, HTMLUListElement | null>>(
    {},
  );
  let itemsPerPage: number = ITEMS_PER_PAGE;
  const [isPDFDownloadLoading, setIsPDFDownloadLoading] =
    useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [miracleLedgerLoading, setMiracleLedgerLoading] = useState(false);
  const [miracleOutstandingLoading, setMiracleOutstandingLoading] =
    useState(false);
  const [isSingleSendingToWhatsApp, setIsSingleSendingToWhatsApp] =
    useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { darkMode, toggleTheme } = useTheme();
  const [noDataFound, setNoDataFound] = useState(false);
  const [accountTransactionList, setAccountTransactionList] = useState<
    IAccountTransaction[]
  >([]);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [isApproveConfirmation, setIsApproveConfirmation] = useState(false);

  const [editInquiry, setEditInquiry] = useState(false);
  const [isCreateAccountTransaction, setIsCreateAccountTransaction] =
    useState(false);
  const [isEditAccountTransaction, setIsEditAccountTransaction] =
    useState(false);

  const [debitDropdownOpen, setDebitDropdownOpen] = useState<any>(null);
  const [creditDropdownOpen, setCreditDropdownOpen] = useState<any>(null);
  const [creditDropdownOpenId, setCreditDropdownOpenId] = useState<number>();
  const [debitDropdownOpenId, setDebitDropdownOpenId] = useState<number>();

  interface IFilterParams {
    startSearchDate: TFilterDate;
    endSearchDate: TFilterDate;
    initialCheckedShowCreditData: number | undefined;
    initialCheckedShowDebitData: number | undefined;
  }

  const [filterParams, setFilterParams] = useState<IFilterParams>({
    startSearchDate: "",
    endSearchDate: "",
    initialCheckedShowCreditData: 0,
    initialCheckedShowDebitData: 0,
  });
  const [approveId, setApproveId] = useState<number>();
  const [accountTransactionDeleteId, setAccountTransactionDeleteId] =
    useState<number>();
  const [isAllSendingToWhatsApp, setIsAllSendingToWhatsApp] = useState(false);
  const [isAllPDFDownloadLoading, setIsAllPDFDownloadLoading] =
    useState<boolean>(false);
  const [accountTransactionItemId, setAccountTransactionItemId] =
    useState<IAccountTransaction>();

  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [refreshTransactions, setRefreshTransactions] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const moredropdownRef = useRef<HTMLButtonElement>(null);

  const [printSetting, setPrintSetting] = useState<IprintSetting>();
  const [isPrintSettingShow, setIsPrintSettingShow] = useState(false);

  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [checkboxesVisible, setIsCheckboxesVisible] = useState(
    selectedIds.length > 0 || isAllSelected,
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const actionDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const actionDropdownWrapperRef = useRef<HTMLDivElement>(null);
  const [hasIdAvail, setHasIdAvail] = useState<number>();
  const actionDropdownRef = useRef<HTMLUListElement>(null);
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        moredropdownRef.current &&
        !moredropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const openPrintSetting = () => {
    if (true) {
      fetchprintSetting(setPrintSetting, Number(PRINT_SETTING_TYPE_OBJ[String(-12) as keyof typeof PRINT_SETTING_TYPE_OBJ]), 1).then(() => {
        setIsPrintSettingShow(true);
      });
    } else {
      setIsPrintSettingShow(true);
    }
  };

  const canAdd = useCheckUserPermission(
    PAGE_ID.ACCOUNT_HISTORY,
    PERMISSION_TYPE.ADD,
  );

  const canEdit = useCheckUserPermission(
    PAGE_ID.ACCOUNT_HISTORY,
    PERMISSION_TYPE.EDIT,
  );
  const canDelete = useCheckUserPermission(
    PAGE_ID.ACCOUNT_HISTORY,
    PERMISSION_TYPE.DELETE,
  );
  const canApprove = useCheckUserPermission(
    PAGE_ID.ACCOUNT_HISTORY,
    PERMISSION_TYPE.APPROVE,
  );

  useEffect(() => {
    const handleScroll = () => {
      if (
        listInnerRef.current &&
        listInnerRef.current.scrollTop + listInnerRef.current.clientHeight ===
        listInnerRef.current.scrollHeight
      ) {
        if (
          accountTransactionList.length <
          (currentPage + 1) * itemsPerPage + 1
        ) {
          fetchApiAccountTransitions(
            currentPage + 1,
            searchTerm,
            setAccountTransactionList,
            itemsPerPage,
            setLoading,
            contactData.id,
            setClosingBalance,
            filterParams.startSearchDate,
            filterParams.endSearchDate,
            filterParams.initialCheckedShowCreditData,
            filterParams.initialCheckedShowDebitData,
          );
        }
        setCurrentPage((prevPage) => prevPage + 1);
      }
    };

    const listInnerElement = listInnerRef.current;

    if (listInnerElement) {
      listInnerElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (listInnerElement) {
        listInnerElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [currentPage, accountTransactionList.length, searchTerm, itemsPerPage]);
  const downloadAllTransactionOfContactPDF = async () => {
    await runWithTemplatePicker("accountStatement", (templateId) =>
      contactAllTransactionDownloadPDf(
        contactData?.id,
        setIsAllPDFDownloadLoading,
        filterParams.startSearchDate,
        filterParams.endSearchDate,
        filterParams.initialCheckedShowCreditData,
        filterParams.initialCheckedShowDebitData,
        templateId,
      ),
    );
  };

  // Same ContactAllAccountTransactionPDF endpoint contactAllTransactionDownloadPDf
  // (download) already calls — already flag-aware server-side. Opens the
  // result in a popup and auto-prints instead of downloading.
  const [isStatementPrintLoading, setIsStatementPrintLoading] = useState(false);
  const doStatementPrint = async (documentTemplateId?: number) => {
    setIsStatementPrintLoading(true);
    try {
      const getUUID = localStorage.getItem("UUID");
      const { data } = await axiosInstance.post("ContactAllAccountTransactionPDF", {
        a_application_login_id: Number(getUUID),
        contact_master_id: contactData?.id,
        startDate: filterParams.startSearchDate,
        endDate: filterParams.endSearchDate,
        creaditFilter: filterParams.initialCheckedShowCreditData,
        debitFilter: filterParams.initialCheckedShowDebitData,
        ...(documentTemplateId ? { document_template_id: documentTemplateId } : {}),
      });
      if (data.code !== 200 || data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      const response = await axios.get(data.data.fileLinkPath, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const pdfWindow = window.open(url, "_blank");
      if (pdfWindow) {
        pdfWindow.onload = () => setTimeout(() => pdfWindow.print(), 500);
      }
    } catch (error) {
      console.error(error);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setIsStatementPrintLoading(false);
    }
  };
  const printAllTransactionStatement = () => {
    runWithTemplatePicker("accountStatement", (templateId) => doStatementPrint(templateId));
  };
  const sendAllToWhatsApp = async () => {
    try {
      setIsAllSendingToWhatsApp(true);
      const getUUID = localStorage.getItem("UUID");
      const { data } = await axiosInstance.post(
        "send-contact-all-account-pdf-whatsapp",
        {
          a_application_login_id: Number(getUUID),
          contact_master_id: contactData?.id,
          startDate: filterParams.startSearchDate,
          endDate: filterParams.endSearchDate,
          creaditData: filterParams.initialCheckedShowCreditData,
          debitData: filterParams.initialCheckedShowDebitData,
        },
      );
      if (data && data.code == 200) {
        toast.success("WhatsApp message sent successfully.");
      }
    } catch (error) {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setIsAllSendingToWhatsApp(false);
    }
  };
  useEffect(() => {
    if (contactData?.id) {
      setClosingBalance(0);
      setAccountTransactionList([]);
      closeListAccountTransaction();
    } else {
      return undefined;
    }
  }, [contactData?.id]);

  const handleModalClose = () => {
    if (isModalVisible) {
      setIsModalVisible(false);
    } else {
      setIsModalFilterVisible(false);
    }
  };

  const handleClickOutside = (event: { target: any }) => {
    const target = event.target as Node;

    const isDropdownButton = (target as HTMLElement).closest(".icon-more");
    if (isDropdownButton) {
      return;
    }

    const clickedInDropdown = Object.values(dropdownRef.current).some(
      (ref) => ref && ref.contains(target),
    );

    if (!clickedInDropdown) {
      setDebitDropdownOpen(null);
    }
  };

  useEffect(() => {
    if (debitDropdownOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [debitDropdownOpen]);

  const handleClickOutside1 = (event: { target: any }) => {
    const target = event.target as Node;

    const isDropdownButton = (target as HTMLElement).closest(".icon-more");
    if (isDropdownButton) {
      return;
    }
    // const clickedInsideActionDropdown =
    //   actionDropdownRef.current?.contains(target) ||
    //   event.target.closest('.selected-btn');

    // if (!isDropdownButton && !clickedInsideActionDropdown) {
    //   setDebitDropdownOpen(null);
    //   setCreditDropdownOpen(null);
    //   setDebitDropdownOpenId(undefined);
    //   setCreditDropdownOpenId(undefined);
    //   setHasIdAvail(undefined);
    // }

    // if (!clickedInsideActionDropdown) {
    //   setIsActionDropdownOpen(false);
    // }
    const clickedInDropdown = Object.values(dropdownContactRef.current).some(
      (ref) => ref && ref.contains(target),
    );

    if (!clickedInDropdown) {
      setCreditDropdownOpen(null);
    }
  };

  useEffect(() => {
    if (creditDropdownOpen !== null) {
      document.addEventListener("mousedown", handleClickOutside1);
    } else {
      document.removeEventListener("mousedown", handleClickOutside1);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside1);
    };
  }, [creditDropdownOpen]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionDropdownOpen(false);
        setDebitDropdownOpen(null);
        setCreditDropdownOpen(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  useEffect(() => {
    setDebitDropdownOpen(null);
    setCreditDropdownOpen(null);
    setDebitDropdownOpenId(undefined);
    setCreditDropdownOpenId(undefined);
  }, [contactData?.id]);

  const handleDeleteAccountTransaction = async () => {
    try {
      const idsMain =
        selectedIds.length > 0 ? selectedIds : [accountTransactionDeleteId];

      const whereCondition =
        idsMain.length === 1
          ? JSON.stringify({ id: idsMain[0] })
          : JSON.stringify({ id: idsMain });

      const requestData = {
        table: "account_transactions",
        where: whereCondition,
        data: JSON.stringify({ isDelete: "1" }),
      };

      const getUUID = localStorage.getItem("UUID");

      const { data } = await axiosInstance.post("commonUpdate", requestData);

      if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success("Deleted successfully");
        setIsDeleteConfirmation(false);
        setIsAllSelected(false);
        setSelectedIds([]);

        fetchApiAccountTransitions(
          0,
          "",
          setAccountTransactionList,
          itemsPerPage,
          setLoading,
          contactData.id,
          setClosingBalance,
          filterParams.startSearchDate,
          filterParams.endSearchDate,
          filterParams.initialCheckedShowCreditData,
          filterParams.initialCheckedShowDebitData,
        );
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const updated = prev.filter((itemId) => itemId !== id);
        setIsAllSelected(updated.length === accountTransactionList.length);
        return updated;
      } else {
        const updated = [...prev, id];
        setIsAllSelected(updated.length === accountTransactionList.length);
        return updated;
      }
    });
  };

  const handleApproveAccountTransaction = async () => {
    try {
      const currentDateTime = new Date();
      const formattedDateTime = formatDateTimeSendDataBase(currentDateTime);
      const getUUID = await localStorage.getItem("UUID");
      const token = await localStorage.getItem("token");

      const requestData = {
        approveId: selectedIds.length > 0 ? selectedIds : [approveId],
        a_application_login_id: getUUID,
        created_date_time: formattedDateTime,
        approve_by_a_application_login_id: Number(getUUID),
      };

      const { data } = await axiosInstance.post(
        "accountTransactionUpdate",
        requestData,
      );

      if (data.code === 200 && data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setIsApproveConfirmation(false);
        setIsAllSelected(false);
        setSelectedIds([]);
        fetchApiAccountTransitions(
          0,
          "",
          setAccountTransactionList,
          itemsPerPage,
          setLoading,
          contactData.id,
          setClosingBalance,
          filterParams.startSearchDate,
          filterParams.endSearchDate,
          filterParams.initialCheckedShowCreditData,
          filterParams.initialCheckedShowDebitData,
        );
        setRefreshAccount && setRefreshAccount(true);
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      console.error("Transaction approval error:", error);
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handelRefreshAccountTransition = async () => {
    fetchApiAccountTransitions(
      0,
      "",
      setAccountTransactionList,
      itemsPerPage,
      setLoading,
      contactData.id,
      setClosingBalance,
      filterParams.startSearchDate,
      filterParams.endSearchDate,
      filterParams.initialCheckedShowCreditData,
      filterParams.initialCheckedShowDebitData,
    );
  };

  const handleConfirmFilter = async (filterPayload: IFilterPayload) => {
    const {
      startSearchDate,
      endSearchDate,
      initialCheckedShowCreditData,
      initialCheckedShowDebitData,
    } = filterPayload;
    setFilterParams({
      startSearchDate:
        startSearchDate instanceof DateObject
          ? startSearchDate.format("YYYY-MM-DD")
          : startSearchDate,
      endSearchDate:
        endSearchDate instanceof DateObject
          ? endSearchDate.format("YYYY-MM-DD")
          : endSearchDate,
      initialCheckedShowCreditData: initialCheckedShowCreditData,
      initialCheckedShowDebitData: initialCheckedShowDebitData,
    });

    setHasData(startSearchDate !== "" || endSearchDate !== "");
    await fetchApiAccountTransitions(
      0,
      "",
      setAccountTransactionList,
      itemsPerPage,
      setLoading,
      contactData.id,
      setClosingBalance,
      startSearchDate,
      endSearchDate,
      initialCheckedShowCreditData,
      initialCheckedShowDebitData,
    );

    setIsModalFilterVisible(false);
  };

  const handelChangeAccountTractionApprove = (id?: number) => {
    if (canApprove) {
      setApproveId(id);
      setIsApproveConfirmation(true);
    } else {
      setIsApproveConfirmation(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeAccountTractionEdit = (itemId: IAccountTransaction) => {
    if (canEdit) {
      setAccountTransactionItemId(itemId);
      setIsEditAccountTransaction(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };
  const handelChangeAccountTractionDelete = (id?: number) => {
    if (canDelete) {
      setAccountTransactionDeleteId(id);
      setIsDeleteConfirmation(true);
    } else {
      setIsDeleteConfirmation(false);

      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  };

  // Picker state shared by all 4 actions (print/download x per-record/
  // statement) — same §7 rule as quotation's picker: only shown when
  // document_designer is on AND the company has 2+ templates for that
  // doc_type, otherwise the action just runs directly.
  const [templateChoices, setTemplateChoices] = useState<
    { id: number; template_name: string; is_default: number }[]
  >([]);
  const pendingActionRef = useRef<((templateId?: number) => void) | null>(null);
  const runWithTemplatePicker = async (
    docType: "accountStatement" | "accountTransaction",
    action: (templateId?: number) => void,
  ) => {
    const choices = await fetchAccountPdfmeTemplatesForPicker(docType);
    if (choices.length > 1) {
      setTemplateChoices(choices);
      pendingActionRef.current = action;
    } else {
      action(undefined);
    }
  };
  const chooseTemplate = (templateId: number) => {
    const action = pendingActionRef.current;
    setTemplateChoices([]);
    pendingActionRef.current = null;
    if (action) action(templateId);
  };

  // accountPDFv1 (backend) already switches between pdfme and the legacy
  // EJS renderer based on the document_designer feature flag — same
  // endpoint PDFaccountv1 (download) already calls. This opens the result
  // in a popup and auto-prints instead of downloading, same UX as
  // quotation print.
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const doOpenPrint = async (id: number, documentTemplateId?: number) => {
    setIsPrintLoading(true);
    try {
      const getUUID = localStorage.getItem("UUID");
      const { data } = await axiosInstance.post("accountPDFv1", {
        a_application_login_id: Number(getUUID),
        accountTransactionId: id,
        ...(documentTemplateId ? { document_template_id: documentTemplateId } : {}),
      });
      if (data.code !== 200 || data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      const response = await axios.get(data.data.fileLinkPath, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const pdfWindow = window.open(url, "_blank");
      if (pdfWindow) {
        pdfWindow.onload = () => setTimeout(() => pdfWindow.print(), 500);
      }
    } catch (error) {
      console.error(error);
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setIsPrintLoading(false);
    }
  };
  const openPrint = (id: number) => {
    runWithTemplatePicker("accountTransaction", (templateId) => doOpenPrint(id, templateId));
  };
  const downloadPDF = (id: number) => {
    runWithTemplatePicker("accountTransaction", (templateId) =>
      PDFaccountv1(id, setIsPDFDownloadLoading, templateId),
    );
  };
  const sendSingleToWhatsApp = async (id: number) => {
    try {
      setIsSingleSendingToWhatsApp(true);
      const getUUID = localStorage.getItem("UUID");
      const { data } = await axiosInstance.post(
        "send-single-account-pdf-whatsapp",
        {
          a_application_login_id: Number(getUUID),
          accountTransactionId: id,
        },
      );
      if (data && data.code == 200) {
        toast.success("WhatsApp message sent successfully.");
      }
    } catch (error) {
      toast.error(MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setIsSingleSendingToWhatsApp(false);
    }
  };
  const toggleDropdownDebit = (id: number) => {
    setDebitDropdownOpenId(id);
    setDebitDropdownOpen((prevId: any) => (prevId === id ? null : id));
    setCreditDropdownOpen(null);
    setCreditDropdownOpenId(undefined);
  };

  const toggleDropdownCredit = (id: number) => {
    setCreditDropdownOpenId(id);
    setCreditDropdownOpen((prevId: any) => (prevId === id ? null : id));
    setDebitDropdownOpen(null);
    setDebitDropdownOpenId(undefined);
  };

  useEffect(() => {
    if (isListAccountTransaction && contactData.id) {
      fetchApiAccountTransitions(
        0,
        "",
        setAccountTransactionList,
        itemsPerPage,
        setLoading,
        contactData.id,
        setClosingBalance,
        filterParams.startSearchDate,
        filterParams.endSearchDate,
        filterParams.initialCheckedShowCreditData,
        filterParams.initialCheckedShowDebitData,
      );
      setClosingBalance(0);
      setAccountTransactionList([]);
      setRefreshAccount && setRefreshAccount(true);
    }
  }, [isListAccountTransaction]);
  useEffect(() => {
    if (refreshTransactions) {
      fetchApiAccountTransitions(
        0,
        "",
        setAccountTransactionList,
        itemsPerPage,
        setLoading,
        contactData.id,
        setClosingBalance,
        filterParams.startSearchDate,
        filterParams.endSearchDate,
        filterParams.initialCheckedShowCreditData,
        filterParams.initialCheckedShowDebitData,
      );

      setRefreshAccount && setRefreshAccount(true);
      setRefreshTransactions(false);
    }
  }, [refreshTransactions, setRefreshAccount]);

  useEffect(() => {
    if (!isPDFDownloadLoading) {
      setDebitDropdownOpen(null);
      setCreditDropdownOpen(null);
    }
  }, [isPDFDownloadLoading]);

  function openSearch() {
    setSearchOpen(!searchOpen);
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
          fetchApiAccountTransitions(
            0,
            value,
            setAccountTransactionList,
            itemsPerPage,
            setLoading,
            contactData.id,
            setClosingBalance,
            filterParams.startSearchDate,
            filterParams.endSearchDate,
            filterParams.initialCheckedShowCreditData,
            filterParams.initialCheckedShowDebitData,
          );
          setCurrentPage(0);
        }, 1000),
      );
    }
  };

  const handleSearchClear = () => {
    setSearchTerm("");
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setSearchOpen(!searchOpen);
    setSearchTimeout(
      setTimeout(() => {
        fetchApiAccountTransitions(
          0,
          "",
          setAccountTransactionList,
          itemsPerPage,
          setLoading,
          contactData.id,
          setClosingBalance,
          filterParams.startSearchDate,
          filterParams.endSearchDate,
          filterParams.initialCheckedShowCreditData,
          filterParams.initialCheckedShowDebitData,
        );
        setCurrentPage(0);
      }, 1000),
    );
  };
  function openModelAdd() {
    if (canAdd) {
      setIsCreateAccountTransaction(true);
    } else {
      toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
    }
  }
  function closingBalancedate() {
    const rawDate = filterParams.endSearchDate ?? new Date();
    const date =
      rawDate instanceof Date
        ? rawDate
        : typeof rawDate === "string" || typeof rawDate === "number"
          ? new Date(rawDate)
          : new Date(rawDate.format("YYYY-MM-DD"));

    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${date.getFullYear()}`;
  }
  useEffect(() => {
    // console.log("selectedIds:", selectedIds, "isAllSelected:", isAllSelected);
  }, [selectedIds, isAllSelected]);

  const handelGenerateMiracleLedgerReport = () => {
    generateMiracleLedger(contactData.id, setMiracleLedgerLoading);
  };
  const handelGenerateMiracleOutstandingReport = () => {
    generateMiracleOutstanding(contactData.id, setMiracleOutstandingLoading);
  };

  const handelSyncMiracleAccountEntry = (item: any) => {
    syncMiracleAccountEntry(item, setSyncLoading);
  };

  return (
    <>
      {isListAccountTransaction ? (
        <>
          <div className="leftSide " id="search-message">
            <div className="header-Chat">
              <div className="ICON">
                <button
                  className="icons"
                  onClick={() => closeListAccountTransaction()}
                >
                  <span className="text-white" title="Close">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className=""
                    >
                      <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path>
                    </svg>
                  </span>
                </button>
              </div>

              <div className="newText " style={{ width: "90%" }}>
                <h2>Account History</h2>
              </div>
              <div className="w-100 text-end">
                <button
                  className="icons text-white"
                  onClick={openSearch}
                  title="Search"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" className="">
                    <path
                      fill="currentColor"
                      d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"
                    ></path>
                  </svg>
                </button>
                <button className="icons text-white" onClick={openModelAdd}>
                  <span title="Create Account Transaction">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="26px"
                      viewBox="0 -960 960 960"
                      width="26px"
                      fill="currentColor"
                    >
                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                    </svg>
                  </span>
                </button>
                <button
                  className="icons pP"
                  style={{ marginBottom: "50px" }}
                  onClick={() => setIsModalFilterVisible(true)}
                >
                  <span className="text-white" title="Filter">
                    <svg
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill={hasData ? "red" : "currentColor"}
                    >
                      <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                    </svg>
                  </span>
                </button>
                {/* <button
                  className="icons pP"
                  style={{ marginBottom: "50px" }}
                  // onClick={() => setIsModalFilterVisible(true)}
                >
                  <span className="text-white" title="Download">
                    <svg
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="currentColor"
                    >
                      <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                    </svg>
                  </span>
                </button> */}

                <button
                  className="icons pP"
                  style={{ marginBottom: "50px" }}
                  onClick={handelRefreshAccountTransition}
                >
                  <span className="text-white" title="Refresh">
                    <svg width="30" height="30" viewBox="0 0 50 50">
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
                  </span>
                </button>
                <button
                  id="dropDown2"
                  className="icons pP text-white"
                  onClick={toggleDropdown}
                  style={{ marginBottom: "50px" }}
                  ref={moredropdownRef}
                >
                  <span>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path
                        fill="currentColor"
                        d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"
                      ></path>
                    </svg>
                  </span>
                </button>
                {/* <button className="icons" onClick={openPrintSetting} style={{ paddingInline: "2px" }}>
                  <span className="text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="currentColor"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>

                  </span>
                </button> */}
                <div
                  className="text-left"
                  style={{
                    position: "absolute",
                    right: "2%",
                    top: "-60%",
                    zIndex: "1000",
                  }}
                >
                  <ul
                    className={`dropLeft ${dropdownOpen ? "isVisible" : "isHidden"
                      } `}
                    id="dropLeft"
                    style={{ height: "230px", width: "170px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <li
                      className="listItem text-left"
                      role="button"
                      onClick={() => {
                        !isAllPDFDownloadLoading &&
                          downloadAllTransactionOfContactPDF();
                      }}
                      style={{ textDecoration: "none", textAlign: "left" }}
                    >
                      <span>
                        {isAllPDFDownloadLoading
                          ? "Downloading..."
                          : "Download PDF"}
                      </span>
                    </li>

                    <li
                      className="listItem text-left"
                      role="button"
                      onClick={() => {
                        if (!isStatementPrintLoading) printAllTransactionStatement();
                      }}
                      style={{ textDecoration: "none", textAlign: "left" }}
                    >
                      <span>{isStatementPrintLoading ? "Preparing..." : "Print Statement"}</span>
                    </li>
                    <li
                      className="listItem text-left"
                      role="button"
                      onClick={() => {
                        if (!isAllSendingToWhatsApp)
                          if (platformType == 1) {
                            sendAllToWhatsApp();
                          } else if (platformType == 2) {
                            whatsappTemplateCloudeSend(
                              {
                                customerId: contactData.id,
                                appId: localStorage.getItem("UUID"),
                              },
                              "customer_acc_transaction",
                              {
                                customer_id: contactData.id,
                              },
                            );
                          }
                      }}
                      style={{ textDecoration: "none", textAlign: "left" }}
                    >
                      <span style={{ color: "green" }}>
                        {isAllSendingToWhatsApp
                          ? "Sending..."
                          : "Send to WhatsApp"}
                      </span>
                    </li>
                    {isFeatureEnabled ? (
                      <li
                        style={{
                          textDecoration: "none",
                          textAlign: "left",
                          color: miracleLedgerLoading ? "#E21F26" : "",
                        }}
                        className="listItem text-left"
                        role="button"
                        onClick={() => handelGenerateMiracleLedgerReport()}
                      >
                        {miracleLedgerLoading
                          ? "Generating.."
                          : "Miracle Ledger"}
                      </li>
                    ) : (
                      <span></span>
                    )}
                    {isFeatureEnabled ? (
                      <li
                        style={{
                          textDecoration: "none",
                          textAlign: "left",
                          color: miracleOutstandingLoading ? "#E21F26" : "",
                        }}
                        className="listItem text-left"
                        role="button"
                        onClick={() => handelGenerateMiracleOutstandingReport()}
                      >
                        {miracleOutstandingLoading
                          ? "Generating.."
                          : "Miracle Outstanding"}
                      </li>
                    ) : (
                      <span></span>
                    )}
                    <li
                      className="listItem text-left"
                      role="button"
                      onClick={openPrintSetting}
                      style={{ textDecoration: "none", textAlign: "left" }}
                    >
                      <span>Print Setting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {searchOpen && (
              <div className="header-search" style={{ zIndex: "1" }}>
                <div className="search-bar">
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
                      title="Search "
                      aria-label="Search or start new chat"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="search-message-input"
                    />

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
              </div>
            )}

            <div
              className="chats"
              style={{ overflowY: "scroll" }}
              ref={listInnerRef}
            >
              <div className="row p-2">
                {loading && isListAccountTransaction && contactData.id ? (
                  Array.from({ length: 12 }).map((_, index) => (
                    <button key={index} className="block chat-list ">
                      <div className="h-text">
                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </h4>
                          <h4 className="text-end">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={30}
                              height={10}
                            />
                          </h4>
                        </div>

                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              width={100}
                              style={{
                                opacity: darkMode ? "" : 0.5,
                                marginLeft: "10px",
                              }}
                            />
                          </h4>
                          <p className="time">
                            <Skeleton
                              width={80}
                              style={{ opacity: darkMode ? "" : 0.5 }}
                              height={10}
                            />
                          </p>
                        </div>
                        <button className="icon-more float-end">
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={30}
                          />
                        </button>
                        <div className="head">
                          <h4 className="inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </h4>
                        </div>
                        <div className="head">
                          <Skeleton
                            style={{
                              marginLeft: "10px",
                              opacity: darkMode ? "" : 0.5,
                            }}
                            width={100}
                          />
                        </div>

                        <div className="">
                          <label className="float-start inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                          </label>
                          <br />
                          <p className=" d-flex justify-content-between text-break text-start inquiry-front">
                            <Skeleton
                              style={{
                                marginLeft: "10px",
                                opacity: darkMode ? "" : 0.5,
                              }}
                              width={100}
                            />
                            <div className="">
                              <span className="badge rounded-pill">
                                <Skeleton
                                  style={{
                                    marginLeft: "10px",
                                    opacity: darkMode ? "" : 0.5,
                                  }}
                                  width={40}
                                />
                              </span>
                            </div>
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <>
                    <button className="block chat-list">
                      <div className="h-text">
                        <div className="text-start">
                          {selectedIds.length > 0 && (
                            <span
                              className="selected-btn rounded-5"
                              style={{
                                width: "fit-content",
                                height: "fit-content",
                                paddingTop: "0.375rem",
                                paddingBottom: "0.375rem",
                                paddingLeft: "0.75rem",
                                paddingRight: "0.75rem",
                                // marginLeft: "10px",
                              }}
                            >
                              <input
                                type="checkbox"
                                style={{}}
                                className="custom-checkbox mx-1"
                                checked={isAllSelected}
                                title="Select All Transaction"
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newSelected = isAllSelected
                                    ? []
                                    : accountTransactionList.map((u) => u.id);
                                  setSelectedIds(newSelected);
                                  setIsAllSelected(!isAllSelected);
                                }}
                              />
                              <div
                                className="position-relative d-inline-block ms-1 dropdown-end"
                                ref={actionDropdownWrapperRef}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  ref={actionDropdownButtonRef}
                                  className="border-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHasIdAvail(undefined);
                                    setIsActionDropdownOpen((prev) => !prev);
                                  }}
                                  disabled={selectedIds.length === 0}
                                >
                                  <span className="contact-btn-search-text">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 19 20"
                                      width="22px"
                                      height="22px"
                                      className="hide animate__animated animate__fadeInUp"
                                    >
                                      <path
                                        fill="currentColor"
                                        d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                      ></path>
                                    </svg>
                                  </span>
                                </button>
                                {isActionDropdownOpen && (
                                  <ul
                                    className="labelDropLeft isVisible"
                                    ref={actionDropdownRef}
                                    style={{
                                      position: "absolute",
                                      left: -40,
                                      minWidth: "254px",
                                      background: "#fff",
                                      border: "1px solid #ddd",
                                      borderRadius: "5px",
                                      zIndex: "1000",
                                      overflowY: "auto",
                                      height: "15vh",
                                    }}
                                  >
                                    <li
                                      className="listItem"
                                      // className="listItem-contact-tabs mb-2"
                                      role="button"
                                      onClick={() => {
                                        handelChangeAccountTractionDelete();
                                        setIsActionDropdownOpen(false);
                                      }}
                                    >
                                      <span>
                                        <svg
                                          width="15"
                                          height="15"
                                          viewBox="0 0 24 24"
                                          fill="currentColor"
                                        >
                                          <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z"></path>
                                        </svg>
                                      </span>{" "}
                                      Delete Selected Transaction
                                    </li>

                                    <li
                                      className="listItem"
                                      role="button"
                                      onClick={() => {
                                        handelChangeAccountTractionApprove();
                                        setIsActionDropdownOpen(false);
                                      }}
                                    >
                                      <span>
                                        <svg
                                          height="15"
                                          viewBox="0 -960 960 960"
                                          width="15"
                                          fill="currentColor"
                                        >
                                          <path d="M160-120q-33 0-56.5-23.5T80-200v-560q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v560q0 33-23.5 56.5T800-120H160Zm0-80h640v-560H160v560Zm40-80h200v-80H200v80Zm382-80 198-198-57-57-141 142-57-57-56 57 113 113Zm-382-80h200v-80H200v80Zm0-160h200v-80H200v80Zm-40 400v-560 560Z"></path>
                                        </svg>
                                      </span>{" "}
                                      Approve Selected Transaction
                                    </li>
                                  </ul>
                                )}
                              </div>
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <b>
                            Closing Balance on&nbsp;
                            {filterParams.endSearchDate
                              ? formatDate(filterParams.endSearchDate)
                              : formatDate(new Date().toDateString())}
                          </b>
                          <h4
                            className={`account-transaction-front-amount ${closingBalance !== undefined && closingBalance < 0
                              ? "text-danger"
                              : "text-success"
                              } `}
                          >
                            <b>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="22px"
                                viewBox="0 -960 960 960"
                                width="22px"
                                fill="currentColor"
                                style={{ fontWeight: "bold" }}
                              >
                                <path d="M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z" />
                              </svg>
                            </b>
                            <b> {Math.abs(closingBalance)}</b>
                          </h4>
                        </div>
                      </div>
                    </button>
                    {accountTransactionList &&
                      accountTransactionList.map((item, index) => (
                        <>
                          {Number(item.type) === 2 ? (
                            <>
                              {/* Debit Transaction Dropdown (Type 2) */}
                              <div>
                                <ul
                                  className={`labelDropLeft ${item.id === debitDropdownOpenId && debitDropdownOpen ? "isVisible" : "isHidden"}`}
                                  ref={(el) =>
                                    (dropdownRef.current[item.id] = el)
                                  }
                                  style={{ width: "150px" }}
                                >
                                  {/* Always show Edit & Delete if not approved */}
                                  {item.approve_by_a_application_login_id ===
                                    0 ? (
                                    <>
                                      {canEdit && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDebitDropdownOpen(null);
                                            handelChangeAccountTractionEdit(
                                              item,
                                            );
                                          }}
                                        >
                                          Edit
                                        </li>
                                      )}
                                      {canDelete && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDebitDropdownOpen(null);
                                            handelChangeAccountTractionDelete(
                                              item.id,
                                            );
                                          }}
                                          style={{
                                            color: "red",
                                            fontWeight: "600",
                                          }}
                                        >
                                          Delete
                                        </li>
                                      )}
                                    </>
                                  ) : (
                                    /* Already Approved → Show Edit/Delete only if user has Approve rights */
                                    <>
                                      {canApprove && canEdit && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDebitDropdownOpen(null);
                                            handelChangeAccountTractionEdit(
                                              item,
                                            );
                                          }}
                                        >
                                          Edit
                                        </li>
                                      )}
                                      {canApprove && canDelete && (
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDebitDropdownOpen(null);
                                            handelChangeAccountTractionDelete(
                                              item.id,
                                            );
                                          }}
                                          style={{
                                            color: "red",
                                            fontWeight: "600",
                                          }}
                                        >
                                          Delete
                                        </li>
                                      )}
                                    </>
                                  )}

                                  {/* Always show Print & Download PDF for approved transactions */}
                                  {item.approve_by_a_application_login_id !==
                                    0 && (
                                      <>
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDebitDropdownOpen(null);
                                            openPrint(item.id);
                                          }}
                                        >
                                          Print
                                        </li>
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDebitDropdownOpen(null);
                                            if (!isPDFDownloadLoading)
                                              downloadPDF(item.id);
                                          }}
                                        >
                                          {isPDFDownloadLoading
                                            ? "Downloading..."
                                            : "Download PDF"}
                                        </li>
                                        <li
                                          className="listItem"
                                          role="button"
                                          onClick={() => {
                                            if (!isSingleSendingToWhatsApp)
                                              if (platformType == 1) {
                                                sendSingleToWhatsApp(item.id);
                                              } else if (platformType == 2) {
                                                whatsappTemplateCloudeSend(
                                                  {
                                                    acc_id: item.id,
                                                    appId:
                                                      localStorage.getItem(
                                                        "UUID",
                                                      ),
                                                  },
                                                  "account_transaction",
                                                  {
                                                    customer_id:
                                                      item.contact_masters_id,
                                                  },
                                                );
                                              }
                                          }}
                                        >
                                          <button
                                            style={{ color: "green" }}
                                            disabled={isSingleSendingToWhatsApp}
                                          >
                                            {isSingleSendingToWhatsApp
                                              ? "Sending..."
                                              : "Send to WhatsApp"}
                                          </button>
                                        </li>
                                        {isFeatureEnabled ? (
                                          <li
                                            style={{
                                              height: "auto",
                                              color: syncLoading ? "#E21F26" : "",
                                            }}
                                            className="listItem"
                                            role="button"
                                            onClick={() =>
                                              handelSyncMiracleAccountEntry(
                                                item.id,
                                              )
                                            }
                                          >
                                            {syncLoading
                                              ? "Syncing.."
                                              : "Sync Miracle"}
                                          </li>
                                        ) : (
                                          <span></span>
                                        )}
                                      </>
                                    )}
                                </ul>
                              </div>
                              <button
                                key={index}
                                className={`block chat-list ${activeIndex === index ? "active" : ""}`}
                                style={{ padding: "6" }}
                                onClick={(e) => {
                                  setActiveIndex(index);
                                }}
                                onMouseEnter={(e) => {
                                  if (
                                    selectedIds.length === 0 &&
                                    !isAllSelected
                                  ) {
                                    const checkbox: any =
                                      e.currentTarget.querySelector(
                                        ".checkbox-wrapper",
                                      );
                                    if (checkbox) {
                                      checkbox.style.visibility = "visible";
                                      setIsCheckboxesVisible(true);
                                    }
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (
                                    selectedIds.length === 0 &&
                                    !isAllSelected
                                  ) {
                                    const checkbox: any =
                                      e.currentTarget.querySelector(
                                        ".checkbox-wrapper",
                                      );
                                    if (checkbox) {
                                      // checkbox.style.visibility = "hidden";
                                      setIsCheckboxesVisible(false);
                                    }
                                  }
                                }}
                              >
                                <div
                                  className="checkbox-wrapper"
                                  style={{
                                    position: "absolute",
                                    left: 10,
                                    top: 5,
                                    visibility: checkboxesVisible
                                      ? "visible"
                                      : "hidden",
                                    padding: "0px 25px 25px 10px",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    className="custom-checkbox mb-1 first"
                                    checked={selectedIds.includes(item.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleCheckboxChange(item.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="h-text">
                                  <div className="text-start">
                                    <h4 className="account-transaction-front-id ">
                                      <span
                                        className={`${checkboxesVisible ? "ms-4" : ""}`}
                                      >
                                        {"#" + item.id}
                                      </span>
                                      <br />
                                    </h4>
                                  </div>
                                  <div className="text-start">
                                    <h4 className="account-transaction-front-amount text-danger ">
                                      <b>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="22px"
                                          viewBox="0 -960 960 960"
                                          width="22px"
                                          fill="currentColor"
                                          style={{ fontWeight: "bold" }}
                                        >
                                          <path d="M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z" />
                                        </svg>
                                      </b>
                                      <b>{item.amount || ""}</b>
                                    </h4>
                                  </div>

                                  <div className="text-start">
                                    <h4 className="account-transaction-front">
                                      {item.payment_type_name}
                                    </h4>
                                  </div>
                                  <div className="text-start">
                                    <h4
                                      className="account-transaction-front"
                                      style={{
                                        width: "100%",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {item.remark && (
                                        <b style={{ color: " #000066" }}>
                                          <SafeHtml htmlContent={item.remark} />
                                        </b>
                                      )}
                                    </h4>
                                  </div>
                                </div>
                                <div className="col-5">
                                  <div className="text-end">
                                    <button
                                      className="icon-more"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDropdownDebit(item.id);
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 19 20"
                                        width="19"
                                        height="20"
                                        className="hide animate__animated animate__fadeInUp"
                                      >
                                        <path
                                          fill="currentColor"
                                          d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                        ></path>
                                      </svg>
                                    </button>
                                  </div>

                                  <div className="head">
                                    <div className="text-end">
                                      <p className="contact-text">
                                        {item.payment_date_time
                                          ? convertDateTimeFormat(
                                            item.payment_date_time,
                                          ).date
                                          : ""}
                                      </p>
                                      <p className="contact-text">
                                        {item.payment_date_time
                                          ? convertDateTimeFormat(
                                            item.payment_date_time,
                                          ).time
                                          : ""}
                                      </p>
                                      <p className="contact-text">
                                        {item.a_application_login_name && (
                                          <>
                                            Created By:{" "}
                                            {item.a_application_login_name}
                                            <br />
                                          </>
                                        )}
                                        {item.approve_by_a_application_login_name && (
                                          <>
                                            Approved By:{" "}
                                            {
                                              item.approve_by_a_application_login_name
                                            }
                                          </>
                                        )}
                                      </p>

                                      <div>
                                        {item.approve_by_a_application_login_id ===
                                          0 ? (
                                          <div
                                            // className="text-end"
                                            onClick={() =>
                                              handelChangeAccountTractionApprove(
                                                item.id,
                                              )
                                            }
                                          >
                                            <span
                                              style={{
                                                backgroundColor: "#f58634",
                                              }}
                                              className="badge rounded-pill "
                                            >
                                              Click Here To Approve
                                            </span>
                                          </div>
                                        ) : (
                                          <span></span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                key={index}
                                className={`block chat-list ${activeIndex === index ? "active" : ""}`}
                                style={{ padding: "6" }}
                                onClick={(e) => {
                                  setActiveIndex(index);
                                }}
                                onMouseEnter={(e) => {
                                  if (
                                    selectedIds.length === 0 &&
                                    !isAllSelected
                                  ) {
                                    const checkbox: any =
                                      e.currentTarget.querySelector(
                                        ".checkbox-wrapper",
                                      );
                                    if (checkbox) {
                                      checkbox.style.visibility = "visible";
                                      setIsCheckboxesVisible(true);
                                    }
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (
                                    selectedIds.length === 0 &&
                                    !isAllSelected
                                  ) {
                                    const checkbox: any =
                                      e.currentTarget.querySelector(
                                        ".checkbox-wrapper",
                                      );
                                    if (checkbox) {
                                      // checkbox.style.visibility = "hidden";
                                      setIsCheckboxesVisible(false);
                                    }
                                  }
                                }}
                              >
                                <div className="col-6">
                                  <div
                                    className="checkbox-wrapper"
                                    style={{
                                      position: "absolute",
                                      left: 15,
                                      top: 5,
                                      visibility: checkboxesVisible
                                        ? "visible"
                                        : "hidden",
                                      display: "inline-block",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="custom-checkbox mb-1"
                                      checked={selectedIds.includes(item.id)}
                                      onChange={() =>
                                        handleCheckboxChange(item.id)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>

                                  <div className="head">
                                    <div className="text-start">
                                      <p className="contact-text">
                                        {item.payment_date_time
                                          ? convertDateTimeFormat(
                                            item.payment_date_time,
                                          ).date
                                          : ""}
                                      </p>
                                      <p className="contact-text">
                                        {item.payment_date_time
                                          ? convertDateTimeFormat(
                                            item.payment_date_time,
                                          ).time
                                          : ""}
                                      </p>
                                      <p className="contact-text">
                                        {item.a_application_login_name && (
                                          <>
                                            Created By:{" "}
                                            {item.a_application_login_name}
                                            <br />
                                          </>
                                        )}
                                        {item.approve_by_a_application_login_name && (
                                          <>
                                            Approved By:{" "}
                                            {
                                              item.approve_by_a_application_login_name
                                            }
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="h-text">
                                  <div>
                                    {/* Credit Transaction Dropdown */}
                                    <ul
                                      style={{
                                        width: "150px",
                                        textAlign: "left",
                                      }}
                                      className={`credit-drop ${creditDropdownOpenId === item.id && creditDropdownOpen ? "isVisible" : "isHidden"}`}
                                      ref={(el) =>
                                      (dropdownContactRef.current[item.id] =
                                        el)
                                      }
                                    >
                                      {item.approve_by_a_application_login_id ===
                                        0 ? (
                                        <>
                                          {canEdit && (
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCreditDropdownOpen(null);
                                                handelChangeAccountTractionEdit(
                                                  item,
                                                );
                                              }}
                                            >
                                              Edit
                                            </li>
                                          )}
                                          {canDelete && (
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCreditDropdownOpen(null);
                                                handelChangeAccountTractionDelete(
                                                  item.id,
                                                );
                                              }}
                                            >
                                              Delete
                                            </li>
                                          )}
                                        </>
                                      ) : (
                                        /* Already Approved → Only users with canApprove can Edit/Delete */
                                        <>
                                          {canApprove && canEdit && (
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCreditDropdownOpen(null);
                                                handelChangeAccountTractionEdit(
                                                  item,
                                                );
                                              }}
                                            >
                                              Edit
                                            </li>
                                          )}
                                          {canApprove && canDelete && (
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCreditDropdownOpen(null);
                                                handelChangeAccountTractionDelete(
                                                  item.id,
                                                );
                                              }}
                                            >
                                              Delete
                                            </li>
                                          )}
                                        </>
                                      )}

                                      {/* Print and WhatsApp options for approved transactions */}
                                      {item.approve_by_a_application_login_id !==
                                        0 && (
                                          <>
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setCreditDropdownOpen(null);
                                                openPrint(item.id);
                                              }}
                                            >
                                              Print
                                            </li>
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={() => {
                                                if (!isPDFDownloadLoading)
                                                  downloadPDF(item.id);
                                              }}
                                            >
                                              {isPDFDownloadLoading
                                                ? "Downloading..."
                                                : "Download PDF"}
                                            </li>
                                            <li
                                              className="listItem"
                                              role="button"
                                              onClick={() => {
                                                if (!isSingleSendingToWhatsApp)
                                                  if (platformType == 1) {
                                                    sendSingleToWhatsApp(item.id);
                                                  } else if (platformType == 2) {
                                                    whatsappTemplateCloudeSend(
                                                      {
                                                        acc_id: item.id,
                                                        appId:
                                                          localStorage.getItem(
                                                            "UUID",
                                                          ),
                                                      },
                                                      "account_transaction",
                                                      {
                                                        customer_id:
                                                          item.contact_masters_id,
                                                      },
                                                    );
                                                  }
                                              }}
                                            >
                                              <button
                                                style={{ color: "green" }}
                                                disabled={
                                                  isSingleSendingToWhatsApp
                                                }
                                              >
                                                {isSingleSendingToWhatsApp
                                                  ? "Sending..."
                                                  : "Send to WhatsApp"}
                                              </button>
                                            </li>

                                            {isFeatureEnabled ? (
                                              <li
                                                style={{
                                                  height: "auto",
                                                  color: syncLoading
                                                    ? "#E21F26"
                                                    : "",
                                                }}
                                                className="listItem"
                                                role="button"
                                                onClick={() =>
                                                  handelSyncMiracleAccountEntry(
                                                    item.id,
                                                  )
                                                }
                                              >
                                                {syncLoading
                                                  ? "Syncing.."
                                                  : "Sync Miracle"}
                                              </li>
                                            ) : (
                                              <span></span>
                                            )}
                                          </>
                                        )}
                                    </ul>
                                  </div>
                                  <div className="text-end">
                                    <div className="text-end">
                                      <button
                                        className="icon-more"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDropdownCredit(item.id);
                                        }}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 19 20"
                                          width="19"
                                          height="20"
                                          className="hide animate__animated animate__fadeInUp"
                                        >
                                          <path
                                            fill="currentColor"
                                            d="M3.8 6.7l5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"
                                          ></path>
                                        </svg>
                                      </button>
                                    </div>
                                    <h4 className="account-transaction-front-id ">
                                      <span
                                        className={`${checkboxesVisible ? "ms-3" : ""}`}
                                      >
                                        {"#" + item.id}
                                      </span>
                                      <br />
                                    </h4>
                                  </div>
                                  <div className="text-end">
                                    <h4 className="account-transaction-front-amount text-success ">
                                      <b>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="22px"
                                          viewBox="0 -960 960 960"
                                          width="22px"
                                          fill="currentColor"
                                          style={{ fontWeight: "bold" }}
                                        >
                                          <path d="M549-120 280-400v-80h140q53 0 91.5-34.5T558-600H240v-80h306q-17-35-50.5-57.5T420-760H240v-80h480v80H590q14 17 25 37t17 43h88v80h-81q-8 85-70 142.5T420-400h-29l269 280H549Z" />
                                        </svg>
                                      </b>
                                      <b>{item.amount || ""}</b>
                                    </h4>
                                  </div>

                                  <div
                                    className=""
                                    style={{ textAlign: "end" }}
                                  >
                                    <h4 className="account-transaction-front">
                                      {item.payment_type_name}
                                    </h4>
                                  </div>
                                  <div
                                    className=""
                                    style={{ textAlign: "end" }}
                                  >
                                    {item.approve_by_a_application_login_id ===
                                      0 ? (
                                      <span
                                        style={{
                                          backgroundColor: "#f58634",
                                        }}
                                        onClick={() =>
                                          handelChangeAccountTractionApprove(
                                            item.id,
                                          )
                                        }
                                        className="badge rounded-pill "
                                      >
                                        Click Here To Approve
                                      </span>
                                    ) : (
                                      <span></span>
                                    )}
                                  </div>
                                  <div
                                    className=""
                                    style={{ textAlign: "end" }}
                                  >
                                    <h4
                                      className="account-transaction-front"
                                      style={{
                                        width: "100%",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {item.remark && (
                                        <b style={{ color: " #000066" }}>
                                          <SafeHtml htmlContent={item.remark} />
                                        </b>
                                      )}
                                    </h4>
                                  </div>
                                </div>
                              </button>
                            </>
                          )}
                        </>
                      ))}
                  </>
                )}
              </div>

              {(searchTerm || hasData) && noDataFound && (
                <p className="no_found">No data found</p>
              )}
            </div>
          </div>
        </>
      ) : null}

      <CreateAccountTransactionView
        show={isCreateAccountTransaction}
        onHide={() => setIsCreateAccountTransaction(false)}
        accountTransactionItem={undefined}
        contact_id={contactData.id}
        headerName="Create Account Transaction"
        setRefreshTransactions={setRefreshTransactions}
      />
      <CreateAccountTransactionView
        show={isEditAccountTransaction}
        onHide={() => setIsEditAccountTransaction(false)}
        accountTransactionItem={accountTransactionItemId}
        contact_id={contactData.id}
        headerName="Edit Account Transaction"
        setRefreshTransactions={setRefreshTransactions}
      />
      {/* {
          isDeleteConfirmation && (
            <ConfirmationModal
              show={isDeleteConfirmation}
              onHide={() => setIsDeleteConfirmation(false)}
              handleSubmit={handleDeleteAccountTransaction}
              title={"Delete this Account Transaction"}
              message={"Are You Sure You Want To Delete This Account Transaction?"}
              btn1="CANCEL"
              btn2="DELETE"
            />
          )
        } */}

      {isDeleteConfirmation && (
        <ConfirmationModal
          show={isDeleteConfirmation}
          onHide={() => setIsDeleteConfirmation(false)}
          handleSubmit={() => handleDeleteAccountTransaction()}
          title={
            selectedIds.length > 0
              ? `Delete ${selectedIds.length} Account Transactions`
              : "Delete This Account Transactions"
          }
          message={
            selectedIds.length > 0
              ? `Are you sure you want Delete ${selectedIds.length} Account Transaction?`
              : "Are you sure you want Delete this Account Transaction?"
          }
          btn1="CANCEL"
          btn2="DELETE"
        />
      )}

      {isApproveConfirmation && (
        <ConfirmationModal
          show={isApproveConfirmation}
          onHide={() => setIsApproveConfirmation(false)}
          handleSubmit={() => handleApproveAccountTransaction()}
          title={
            selectedIds.length > 0
              ? `Approve ${selectedIds.length} Account Transactions`
              : "Approve This Account Transactions"
          }
          message={
            selectedIds.length > 0
              ? `Are you sure you want Approve ${selectedIds.length} Account Transaction?`
              : "Are you sure you want Approve this Account Transaction?"
          }
          btn1="CANCEL"
          btn2="Approve"
        />
      )}

      {isPrintSettingShow && (
        <PrintSettingModal
          show={isPrintSettingShow}
          setShow={setIsPrintSettingShow}
          onHide={() => setIsPrintSettingShow(false)}
          handleSubmit={() => {
            if (true) {
              fetchprintSetting(setPrintSetting, Number(PRINT_SETTING_TYPE_OBJ[String(-12) as keyof typeof PRINT_SETTING_TYPE_OBJ]), 1);
            } else {
              setIsPrintSettingShow(false);
            }
          }}
          orderType={-12}
          viewFormate={1}
          orderById={printSetting?.setting_details}
          titles={"Create"}
          message={"Please Enter Your Order Details"}
          btn1={"CANCEL"}
          btn2={"Approve"}
        />
      )}

      {/* {
        isApproveConfirmation && (
          <ConfirmationModal
            show={isApproveConfirmation}
            onHide={() => setIsApproveConfirmation(false)}
            handleSubmit={handleApproveAccountTransaction}
            title={"Approve this Account Transaction"}
            message={"Are You Sure You Want To Approve This Account Transaction?"}
            btn1="CANCEL"
            btn2="Approve"
          />
        )
      } */}

      <CheckBoxFilterModal
        show={isModalFilterVisible}
        onHide={handleModalClose}
        handleSubmit={handleConfirmFilter}
        title="Filter your Account Transactions"
        message="Please select the Date for the Account Transactions."
        btn1="Clear"
        btn2="Apply"
        filtersToShow={[1, 13, 14]}
        pageId={0}
        initialCheckedShowCreditData={1}
        initialCheckedShowDebitData={2}
      />

      {templateChoices.length > 0 && (
        <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-content1" style={{ width: 360, marginTop: "10%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5>Choose Template</h5>
              <span
                className="close"
                onClick={() => {
                  setTemplateChoices([]);
                  pendingActionRef.current = null;
                }}
              >
                &times;
              </span>
            </div>
            {templateChoices.map((t) => (
              <div
                key={t.id}
                className="d-flex justify-content-between align-items-center border-bottom py-2"
              >
                <div>{t.template_name}{t.is_default ? " ★" : ""}</div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => chooseTemplate(t.id)}
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ListAccountTransactionView;
