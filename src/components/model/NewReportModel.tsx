import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { DateObject } from "react-multi-date-picker";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { PAGE_ID } from "../../helpers/AppEnum";
import {
  IFilterData,
  IFilterPayload,
  TFilterDate,
} from "../../helpers/AppInterface";
import { TReactSetState } from "../../helpers/AppType";
import { ITitle } from "../../pages/dashboard/DashoardController";
import AccountCreaditReport from "../../pages/dashboard/Reports/Account Credit Report/AccountCreaditReport";
import AccountDebitReport from "../../pages/dashboard/Reports/Account Debit Report/AccountDebitReport";
import AccountOutstandingReportsVIew from "../../pages/dashboard/Reports/Account Outstanding/AccountOutstandingReportsVIew";
import AllAccountReports from "../../pages/dashboard/Reports/All Account Report/AllAccountReportsVIew";
import AllCallReportsView from "../../pages/dashboard/Reports/All Call Report/AllCallReportView";
import AllcontactReport from "../../pages/dashboard/Reports/All Contact Report/allContactReportView";
import AllDeletedcontactReport from "../../pages/dashboard/Reports/All Deleted Contact Report/allDeletedContactReportView";
import AllInqueryReport from "../../pages/dashboard/Reports/All Inquiry Report/inquiryView";
import AllReminderReport from "../../pages/dashboard/Reports/All Reminder Report/AllReminderReport";
import AllTaskReportsView from "../../pages/dashboard/Reports/All Task Report/allTaskReportView";
import AllVisitReportsView from "../../pages/dashboard/Reports/All Visit Report/allVisitReportView";
import TeamAttendanceReportsView from "../../pages/dashboard/Reports/Attendance & Salary Report/AttendanceReportView";
import CategoryPendingReport from "../../pages/dashboard/Reports/Category Pending/categoryPendingView";
import CategorySalesPurchaseReport from "../../pages/dashboard/Reports/Category Sales & Purchase/categorySalesPurchaseView";
import ChainWiseContactReportView from "../../pages/dashboard/Reports/ChainWiseContact/ChainWiseContactReportView";
import DailyInvoiceReportView from "../../pages/dashboard/Reports/Daily Invoice Report/DailyInvoiceReportView";
import TeamDispatchDataReportsView from "../../pages/dashboard/Reports/Dispatch/DispatchReport";
import EmployeeAccountOutstandingReport from "../../pages/dashboard/Reports/Employee Account Outstanding/EmployeeAccountOutstandingReport";
import ExpenseDetailedReport from "../../pages/dashboard/Reports/Expense Datailed Report/ExpenseDetailedReportView";
import TeamInwardDataReportsView from "../../pages/dashboard/Reports/Inward/inwardView";
import AlllableReport from "../../pages/dashboard/Reports/Lable Wise Report/lableReportView";
import PaymentWiseAccountReport from "../../pages/dashboard/Reports/Payment WIse Account Report/PaymentWiseAccountReport";
import PendingOrderReportsView from "../../pages/dashboard/Reports/Pending Order/pendingOrderView";
import PendingPurchaseReportsView from "../../pages/dashboard/Reports/Pending Purchase/pendingPurchaseView";
import ProcessAttendanceReportView from "../../pages/dashboard/Reports/Process Attendance Report/ProcessAttendanceReportView";
import ProductInventoryReport from "../../pages/dashboard/Reports/Product Inventory/ProductInventory";
import ProductPendingView from "../../pages/dashboard/Reports/Product Pending/productPendingView";
import ProductSalesPurchaseReport from "../../pages/dashboard/Reports/Product Sales & Purchase/productSalesPurchaseView";
import TeamPurchaseInvoiceDataReportsView from "../../pages/dashboard/Reports/Purchase Invoice/purchaseInvoiceView";
import TeamPurchaseOrderDataReportsView from "../../pages/dashboard/Reports/Purchase Order/purchaseOrderView";
import TeamQuotationDataReportsView from "../../pages/dashboard/Reports/Quotations/QuotationView";
import TeamReturnPurchaseDataReportsView from "../../pages/dashboard/Reports/Return Purchase Invoice/ReturnPurchaseInvoiceView";
import TeamReturnSalesDataReportsView from "../../pages/dashboard/Reports/Return Sales Invoice/ReturnSalesInvoiceView";
import SalaryRegisterReport from "../../pages/dashboard/Reports/Salary Register/SalaryRegisterReport";
import TeamSalesInvoiceDataReportsView from "../../pages/dashboard/Reports/Sales Invoice/salesInvoiceView";
import TeamSalesOrderDataReportsView from "../../pages/dashboard/Reports/Sales Order/salesOrderView";
import AllSourceReport from "../../pages/dashboard/Reports/Source Wise Report/sourceReportView";
import StatusWiseReport from "../../pages/dashboard/Reports/Status Wise Report/StatusWiseReport";
import AllTeamExpense from "../../pages/dashboard/Reports/Team Day Wise Expense/teamDayExpenseView";
import TeamPendingWorkReportsView from "../../pages/dashboard/Reports/Team Pending Work/TeamPendingWokReportsVIew";
import TeamPerformanceReports from "../../pages/dashboard/Reports/Team Performance/TeamPerformanceReports";
import {
  fetchCompanyTeamApi,
  ICompanyTeam,
} from "../../pages/left-side/LeftSideController";
import { axiosInstance, setUrlParams } from "../../services/axiosInstance";
import { useCommonFilterStore } from "../../store/report/useCommonFilterStore";
import CheckBoxFilterModal from "./CheckBoxFilterModal";

export interface IAuth {
  ack: number;
  ack_msg: string;
  developer_msg: string;
}

const NewReportModel = (): JSX.Element => {
  const [isCloseConfirmation, setIsCloseConfirmation] = useState(false);
  const [isDeleteConfirmation, setIsDeleteConfirmation] = useState(false);
  const [appliedReportType, setAppliedReportType] = useState("");
  const [selectReportType, setSelectReportType] = useState("");
  const [reportKey, setReportKey] = useState(0);

  const [refreshReport, setRefreshReport] = useState(false);
  const [title, setTitle] = useState<ITitle[]>([]);
  const [rights, setRights] = useState<any[]>([]);
  const { MobileToken, getID, MobileFlag } = useParams();
  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const [isCartModelOpen, setIsCartModelOpen] = useState(false);

  // const { filters, setFilters, setFilter } = useCommonFilterStore();

  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();
  const filters = getFilter(selectReportType || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText);
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchText]);

  const selectedDemography: {
    country?: string;
    state?: string;
    city?: string;
    area?: string;
  } | null = {
    country: filters.filterData?.country?.toString() || undefined,
    state: filters.filterData?.state?.toString() || undefined,
    city: filters.filterData?.city?.toString() || undefined,
    area: filters.filterData?.area?.toString() || undefined,
  };

  const selectedDayMonthYear: {
    day?: number;
    month?: number;
    year?: number;
  } | null = {
    day: Number(filters.filterData?.day) || undefined,
    month: Number(filters.filterData?.month) || undefined,
    year: Number(filters.filterData?.year) || undefined,
  };

  useEffect(() => {
    setUrlParams({ MobileToken, getID });

    return () => {
      setUrlParams({});
    };
  }, [MobileToken, getID]);

  // if (MobileToken && getID) {
  //   localStorage.setItem("token", MobileToken);
  //   localStorage.setItem("UUID", getID);
  // }
  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [startOfMonth, endOfMonth];
  };
  const [selectedDates, setSelectedDates] = useState<Date[] | any | null>(
    getCurrentMonthDateRange(),
  );
  const [companyTeamLists, setCompanyTeamLists] = useState<ICompanyTeam[]>([]);
  // const [optionSelected, setOptionSelected] = useState<Option[] | null>(null);
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  interface IFilterParams {
    filterData: IFilterData | null;
    checkedOptions: any[] | null;
    checkedSourceTypes: any[] | null;
    startSearchDate: TFilterDate;
    endSearchDate: TFilterDate;
    checkedOptionsStageStatus: any[] | null;
    checkedOptionsSeries: any[] | null;
    selectedStockTypeId: any[] | null;
    checkedOptionsUser: any[];
    selectedActiveId: any;
    selectedDays: string | number | null;
    selectedWarehouseIds?: string;
    selectedContactId?: string;
  }

  // const [filterParams, setFilterParams] = useState<IFilterParams>({
  //   filterData: null,
  //   checkedOptions: null,
  //   checkedSourceTypes: null,
  //   startSearchDate: null as Date | null,
  //   endSearchDate: null as Date | null,
  //   checkedOptionsStageStatus: null,
  //   selectedStockTypeId: null,
  //   checkedOptionsSeries: null,
  //   checkedOptionsUser: [],
  //   selectedActiveId: null,
  //   selectedDays: null,
  //   selectedWarehouseIds: undefined,
  //   selectedContactId: undefined,
  // });

  const companyMasterId = title[0]?.id;
  const [hasData, setHasData] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  // const [activeOrDeactive, setActiveOrDeactive] = useState("");
  // const [activeDays, setActiveDays] = useState(0);
  const [authDetails, setAuthDetails] = useState<IAuth | null>(null);
  // const [selectedStageStatus, setSelectedStageStatus] = useState<
  //   string[] | null
  // >(null);
  // const [selectedSelectedSeries, setSelectedSeries] = useState<string[] | null>(
  //   null,
  // );
  // const [selectedProductCategory, setSelectedProductCategory] = useState<
  //   string[] | null
  // >(null);
  // const [selectedLabels, setSelectedLabels] = useState<string[] | null>(null);
  // const [selectedSourceTypes, setSelectedSourceTypes] = useState<
  //   string[] | null
  // >(null);

  // const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // const [selectedStockTypeId, setSelectedStockTypeId] = useState<string | null>(
  //   null,
  // );
  // const [selectedWahereHouse, setSelectedWahereHouse] = useState<string | null>(
  //   null,
  // );
  // const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const fetchCompany = async (setTitle: TReactSetState<ITitle[]>) => {
    const uuid = getID || localStorage.getItem("UUID");
    const requestData = {
      table: "company_masters",
      columns:
        "order_title,invoice_title,quotation_title,purchase_title,purchase_order_title,workorder_title,id,invoice_view_formate,order_view_formate,quotation_view_formate, purchase_view_formate,workorder_view_formate,purchase_order_view_formate",
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

  const fetchRights = async (setRights: TReactSetState<any[]>) => {
    const uuid = getID || localStorage.getItem("UUID");
    const token = MobileToken || localStorage.getItem("token");

    try {
      const response = await axiosInstance.post("getTeamRights", {
        a_application_login_id: uuid,
      });

      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setRights(response.data.data.item || []);
      } else {
        toast.error(response.data.ack_msg || "Failed to fetch rights data");
        setRights([]);
      }
    } catch (error: any) {
      console.error("Error fetching rights data: ", error);
      toast.error("Error fetching rights data");
    }
  };

  useEffect(() => {
    const fetchAuthToken = async (): Promise<IAuth | null> => {
      try {
        const uuid = getID || localStorage.getItem("UUID");
        const token = MobileToken || localStorage.getItem("token");

        const response = await axiosInstance.post("checkAuthToken", {});

        if (response.data.ack === 3) {
          setAuthDetails(response.data);
          return null;
        }

        setAuthDetails(response.data);
        return response.data;
      } catch (err) {
        // console.log("abc", err);
        return null;
      }
    };

    const init = async () => {
      const auth = await fetchAuthToken();
      if (auth && auth.ack !== 3) {
        await fetchCompany(setTitle);
        await fetchRights(setRights);
        if (title[0]?.id) {
          await fetchCompanyTeamApi(setCompanyTeamLists, title[0].id, "");
        }
      }
    };

    init();
  }, [setTitle, setAuthDetails]);

  useEffect(() => {
    if (title[0]?.id) {
      fetchCompanyTeamApi(setCompanyTeamLists, title[0]?.id, "");
    }
  }, [title]);

  let filterShowNumber: number[] = [];
  let filtershowStageandStatus;
  let filtershowSeries;
  // const reportOptions = [
  //   { value: "select", label: "Select" },
  //   { value: "team_performance", label: "1. Team Performance" },
  //   {
  //     value: "quotation",
  //     label: `2. ${title[0]?.quotation_title || "Quotation"}`,
  //   },
  //   { value: "order", label: `3. ${title[0]?.order_title || "Sales Order"}` },
  //   {
  //     value: "order_invoice",
  //     label: `4. ${title[0]?.invoice_title || "Sales Invoice"}`,
  //   },
  //   {
  //     value: "purchase_order",
  //     label: `5. ${title[0]?.purchase_order_title || "Purchase Order"}`,
  //   },
  //   {
  //     value: "purchase_invoice",
  //     label: `6. ${title[0]?.purchase_title || "Purchase"}`,
  //   },
  //   { value: "account", label: "7. Account Outstanding" },
  //   { value: "pending", label: "8. Pending Work" },
  //   { value: "product_inventory", label: "9. Product Inventory & Stock Alert" },
  //   { value: "attendance_salary", label: "10. Attendance & Salary" },
  //   { value: "product_report", label: "11. Product Wise Sales & Purchase" },
  //   { value: "product_wise_pending_report", label: "12. Product Wise Pending Report" },
  //   { value: "category_report", label: "13. Category Wise Sales & Purchase" },
  //   { value: "category_wise_pending_report", label: "14. Category Wise Pending Report" },
  //   { value: "all_contact_report", label: "15. All Contact Report" },
  //   { value: "source_wise_contact_statistic_report", label: "16. Source Wise Statistic Reports" },
  //   { value: "label_wise_contact_statistics_report", label: "17. Label Wise Statistics Reports" },
  //   { value: "all_inquiry_report", label: "18. All Inquiry Reports" },
  //   { value: "team_day_wise_expanse_report", label: "19. Team Wise Daily Expense Report" },
  //   { value: "all_visit_report", label: "20. All Visit Reports" },
  //   { value: "all_call_report", label: "21. All Call Report" },
  //   {
  //     value: "pending_order",
  //     label: `22. ${title[0]?.order_title ? "Pending " + title[0].order_title + " Report" : "Sales Order Pending Report"}`,
  //   },
  //   {
  //     value: "pending_purchase",
  //     label: `23. ${title[0]?.purchase_title ? "Pending " + title[0].purchase_order_title + " Report" : "Purchase Order Pending Report"}`,
  //   },
  // ];

  useEffect(() => {
    setHasData(filters.isFilterApplied);
  }, [filters]);

  const handleReportTypeChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    const selectedValue = e.target.value;
    setSelectReportType(selectedValue);
    setAppliedReportType("");
    setFilter(
      selectReportType,
      "selectedDateArray",
      getCurrentMonthDateRange(),
    );

    if (selectedValue && selectedValue !== "select") {
      if (!selectedDates || selectedDates.length !== 2) {
        toast.error("Please select a valid date range.");
        return;
      }

      setAppliedReportType(selectedValue);
      setFilter(selectReportType, "selectedDateArray", selectedDates);
      setReportKey((prev) => prev + 1);
    }
  };

  if (selectReportType == "team_performance") {
    filterShowNumber = [1];
  } else if (selectReportType == "quotation") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 3;
    filtershowSeries = "quotation_prefix";
  } else if (selectReportType == "order") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 4;
    filtershowSeries = "order_prefix";
  } else if (selectReportType == "inward_report") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 4;
    filtershowSeries = "inward_prefix";
  } else if (selectReportType == "dispatch_report") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 4;
    filtershowSeries = "dispatch_prefix";
  } else if (selectReportType == "order_invoice") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 5;
    filtershowSeries = "invoice_prefix";
  } else if (selectReportType == "purchase_order") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 7;
    filtershowSeries = "purchase_ord_prefix";
  } else if (selectReportType == "purchase_invoice") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 6;
    filtershowSeries = "purchase_prefix";
  } else if (selectReportType == "account") {
    filterShowNumber = [1, 18];
  } else if (selectReportType == "employee_account") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "pending") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "product_inventory") {
    filterShowNumber = [1, 7, 16, 17];
  } else if (selectReportType == "attendance_salary") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "process_attendance") {
    filterShowNumber = [5, 23];
  } else if (selectReportType == "salary_register") {
    filterShowNumber = [5, 23];
  } else if (selectReportType == "product_report") {
    filterShowNumber = [1, 7, 18];
  } else if (selectReportType == "product_wise_pending_report") {
    filterShowNumber = [1, 7, 18];
  } else if (selectReportType == "category_report") {
    filterShowNumber = [1, 7, 18];
  } else if (selectReportType == "category_wise_pending_report") {
    filterShowNumber = [1, 7, 18];
  } else if (selectReportType == "all_contact_report") {
    filterShowNumber = [1, 2, 3, 4, 5, 6, 8, 9];
    filtershowStageandStatus = 1;
  } else if (selectReportType == "all_deleted_contact_report") {
    filterShowNumber = [1, 2, 3, 4, 5, 6, 8, 9];
    filtershowStageandStatus = 1;
  } else if (selectReportType == "source_wise_contact_statistic_report") {
    filterShowNumber = [1, 3, 5];
  } else if (selectReportType == "label_wise_contact_statistics_report") {
    filterShowNumber = [1, 2, 5];
  } else if (selectReportType == "all_inquiry_report") {
    filterShowNumber = [1, 2, 3, 4, 5, 6, 7, 18];
    filtershowStageandStatus = 2;
  } else if (selectReportType == "team_day_wise_expanse_report") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "expanse_detailed_report") {
    filterShowNumber = [1, 5, 27];
  } else if (selectReportType == "all_visit_report") {
    filterShowNumber = [1, 5, 6, 18];
  } else if (selectReportType == "all_call_report") {
    filterShowNumber = [1, 5];
  } else if (selectReportType == "pending_order") {
    filterShowNumber = [1, 4, 5, 18];
    filtershowStageandStatus = 4;
  } else if (selectReportType == "pending_purchase") {
    filterShowNumber = [1, 4, 5, 18];
    filtershowStageandStatus = 7;
  } else if (selectReportType == "alltask_report") {
    filterShowNumber = [1, 4, 5, 18];
    filtershowStageandStatus = 8;
  } else if (selectReportType == "support_ticket_report") {
    filterShowNumber = [1, 4, 5, 18];
    filtershowStageandStatus = 9;
  } else if (selectReportType == "allaccount_report") {
    filterShowNumber = [1, 5, 18];
  } else if (selectReportType == "account_credit_report") {
    filterShowNumber = [1, 5, 18];
  } else if (selectReportType == "account_debit_report") {
    filterShowNumber = [1, 5, 18];
  } else if (selectReportType == "payment_type_wise_account") {
    filterShowNumber = [1];
  } else if (selectReportType == "all_contact_chainwise_report") {
    filterShowNumber = [1, 2, 3, 4, 5, 6, 8, 9, 18];
  } else if (selectReportType == "allreminder_report") {
    filterShowNumber = [1, 5, 18];
  } else if (selectReportType == "detailed_order_report") {
    filterShowNumber = [1, 4, 5, 15, 18];
  } else if (selectReportType == "daily_sales_invoice") {
    filterShowNumber = [1, 4, 5, 15, 18];
    filtershowStageandStatus = 5;
    filtershowSeries = "invoice_prefix";
  } else if (selectReportType == "status_wise_report") {
    filterShowNumber = [1, 4, 21, 5];
  }

  const options =
    companyTeamLists.length > 0 &&
    companyTeamLists.map((item) => ({
      value: item.id,
      label: item.username,
    }));

  const handelSearchDateChange = (selectedDates: Date[] | undefined) => {
    if (
      selectedDates &&
      selectedDates.length === 2 &&
      selectedDates[0] <= selectedDates[1]
    ) {
      setSelectedDates(selectedDates || []);
    }
  };

  // const handleChange = (selected: Option[]) => {
  //   setOptionSelected(selected);
  // };

  // const selectedTeamMemberId = optionSelected?.map((e) => e.value);

  const openFilterLabel = () => {
    setIsModalFilterVisible(true);
  };

  const openReport = () => {
    if (!selectReportType || selectReportType === "select") {
      toast.error("Please select a valid report type.");
      return;
    }
    if (!selectedDates || selectedDates.length !== 2) {
      toast.error("Please select a valid date range.");
      return;
    }
    setAppliedReportType(selectReportType);
    setFilter(selectReportType, "selectedDateArray", selectedDates);
    setReportKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (refreshReport) {
      setAppliedReportType(selectReportType);
      setFilter(selectReportType, "selectedDateArray", selectedDates);
      setReportKey((prev) => prev + 1);
    }
    setRefreshReport(false);
  }, [refreshReport]);

  const handleConfirmFilter = (filterPayload: IFilterPayload) => {
    const {
      filterData,
      checkedOptionsLabel: checkedOptions,
      checkedOptionsSourceType: checkedSourceTypes,
      startSearchDate,
      endSearchDate,
      checkedOptionsStageStatus,
      checkedOptionsSeries,
      checkedOptionsUser,
      selectedCategoryId,
      selectedStockTypeId,
      selectedProductId,
      selectedActiveId,
      selectedDays,
      selectedProductSearchId,
      referenceWiseContact,
      selectedOrderListId,
      selectedWarehouseIds,
      selectedContactId,
    } = filterPayload;
    const currentDate = new Date();
    const parsedStartDate = startSearchDate
      ? startSearchDate instanceof DateObject
        ? startSearchDate.format("YYYY-MM-DD")
        : startSearchDate
      : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const parsedEndDate = endSearchDate
      ? endSearchDate instanceof DateObject
        ? endSearchDate.format("YYYY-MM-DD")
        : endSearchDate
      : new DateObject()
          .set("month", currentDate.getMonth() + 1)
          .set("day", 7)
          .add(7, "days")
          .format("YYYY-MM-DD");

    const isFilterApplied =
      ((checkedOptions?.length ?? 0) > 0 ||
        (checkedSourceTypes?.length ?? 0) > 0 ||
        Boolean(filterData?.country) ||
        Boolean(filterData?.state) ||
        Boolean(filterData?.city) ||
        Boolean(filterData?.area) ||
        Boolean(filterData?.active) ||
        Boolean(startSearchDate) ||
        Boolean(endSearchDate) ||
        (checkedOptionsStageStatus?.length ?? 0) > 0 ||
        (checkedOptionsSeries?.length ?? 0) > 0 ||
        (checkedOptionsUser?.length ?? 0) > 0 ||
        Boolean(selectedActiveId) ||
        Boolean(selectedDays) ||
        Boolean(selectedCategoryId) ||
        Boolean(selectedStockTypeId) ||
        Boolean(selectedWarehouseIds) ||
        Boolean(selectedContactId) ||
        Boolean(selectedProductId)) &&
      (parsedStartDate !== null || parsedEndDate !== null);

    setFilters(selectReportType, {
      filterData,
      checkedOptions: checkedOptions || [],
      checkedSourceTypes: checkedSourceTypes || [],
      startSearchDate: startSearchDate ? new DateObject(startSearchDate) : null,

      endSearchDate: endSearchDate ? new DateObject(endSearchDate) : null,
      checkedOptionsStageStatus: checkedOptionsStageStatus || [],
      checkedOptionsSeries: checkedOptionsSeries || [],
      checkedOptionsUser: checkedOptionsUser || [],
      selectedCategoryId: selectedCategoryId ? selectedCategoryId.value : null,
      selectedContactId: selectedContactId || null,
      selectedProductSearchId: selectedProductSearchId || null,
      selectedStockTypeId: selectedStockTypeId
        ? selectedStockTypeId.value
        : null,
      selectedProductId: selectedProductId ? selectedProductId.value : null,
      selectedActiveId,
      selectedDays,
      selectedWarehouseIds,
      // selectedOrderListId,
      selectedOrderListId: selectedOrderListId
        ? selectedOrderListId.value
        : null,
      isFilterApplied,
      selectedDateArray: [parsedStartDate, parsedEndDate],
      referenceWiseContact: referenceWiseContact || 1,
    });

    setHasData(isFilterApplied);
    const toDate = (
      value: string | number | Date | null | undefined,
    ): Date | null => {
      if (!value) return null;
      if (value instanceof Date) return value;
      return new Date(value);
    };
    setTimeout(() => {
      setAppliedReportType(selectReportType);
      // setSelectedDates([parsedStartDate, parsedEndDate]);
      const start = toDate(parsedStartDate);
      const end = toDate(parsedEndDate);

      if (start && end) {
        setSelectedDates([start, end]);
      } else {
        setSelectedDates(null);
      }
      setReportKey((prev) => prev + 1);
    }, 100);
    setIsModalFilterVisible(false);
  };

  const handleModalClose = () => {
    if (isModalVisible) {
      setIsModalVisible(false);
    } else {
      setIsModalFilterVisible(false);
    }
  };

  const handlePrivacyPolicyClose = () => {
    window.close();
  };

  // if (!MobileToken) {
  //   toast.error("token");
  // }

  type ReportOption = { value: string; label: string };

  const hasViewRight = (pageId: number) => {
    const perm = rights?.find((p: any) => p.page_id === pageId);
    if (!perm) return false;
    try {
      const parsed = JSON.parse(perm.a_page_id_rights_jason);
      return parsed?.view === 1;
    } catch {
      return false;
    }
  };

  const reportOptionsRaw: ReportOption[] = [
    hasViewRight(PAGE_ID.TEAMPERFORMANCE_REPORT) && {
      value: "team_performance",
      label: "Team Performance",
    },
    hasViewRight(PAGE_ID.QUOTATION_REPORT) && {
      value: "quotation",
      label: title[0]?.quotation_title || "Quotation",
    },
    hasViewRight(PAGE_ID.SALESORDER_REPORT) && {
      value: "order",
      label: title[0]?.order_title || "Sales Order",
    },
    hasViewRight(PAGE_ID.DISPATCH_REPORT) && {
      value: "dispatch_report",
      label: title[0]?.dispatch_title || "Dispatch",
    },
    hasViewRight(PAGE_ID.SALESINVOICE_REPORT) && {
      value: "order_invoice",
      label: title[0]?.invoice_title || "Sales Invoice",
    },
    hasViewRight(PAGE_ID.RETURN_PURCHASE_INVOICE_REPORT) && {
      value: "return_sales_invoice",
      label: title[0]?.return_purchase_invoice_title || "Return Sales Invoice",
    },
    hasViewRight(PAGE_ID.PURCHASEORDER_REPORT) && {
      value: "purchase_order",
      label: title[0]?.purchase_order_title || "Purchase Order",
    },
    hasViewRight(PAGE_ID.INWARD_REPORT) && {
      value: "inward_report",
      label: title[0]?.inward_title || "Inward",
    },
    hasViewRight(PAGE_ID.PURCHASEINVOICE_REPORT) && {
      value: "purchase_invoice",
      label: title[0]?.purchase_title || "Purchase",
    },
    hasViewRight(PAGE_ID.RETURN_PURCHASE_INVOICE_REPORT) && {
      value: "return_purchase_invoice",
      label: title[0]?.return_purchase_invoice_title || "Return Purchase",
    },
    hasViewRight(PAGE_ID.ACCOUNTOUTSTANDING_REPORT) && {
      value: "account",
      label: "Account Outstanding",
    },
    hasViewRight(PAGE_ID.EMP_ACCOUNTOUTSTANDING_REPORT) && {
      value: "employee_account",
      label: "Employee Account Outstanding",
    },
    hasViewRight(PAGE_ID.PENDINGWORK_REPORT) && {
      value: "pending",
      label: "Pending Work",
    },
    hasViewRight(PAGE_ID.PRODUCTINVENTORY_REPORT) && {
      value: "product_inventory",
      label: "Product Inventory & Stock Alert",
    },
    hasViewRight(PAGE_ID.ATTEDANCESALARY_REPORT) && {
      value: "attendance_salary",
      label: "Attendance & Salary",
    },
    hasViewRight(PAGE_ID.PROCESS_ATTENDANCE) && {
      value: "process_attendance",
      label: "Attendance Register",
    },
    hasViewRight(PAGE_ID.TEAM_SALARY) && {
      value: "salary_register",
      label: "Salary Register",
    },
    hasViewRight(PAGE_ID.PRODUCTMOVEMENT_REPORT) && {
      value: "product_report",
      label: "Product Wise Movement Report",
    },
    hasViewRight(PAGE_ID.PRODUCTPENDING_REPORT) && {
      value: "product_wise_pending_report",
      label: "Product Wise Pending Report",
    },
    hasViewRight(PAGE_ID.CATEGORYMOVEMENT_REPORT) && {
      value: "category_report",
      label: "Category Wise Movement Report",
    },
    hasViewRight(PAGE_ID.CATEGORYPENDING_REPORT) && {
      value: "category_wise_pending_report",
      label: "Category Wise Pending Report",
    },
    hasViewRight(PAGE_ID.ALLCONTACT_REPORT) && {
      value: "all_contact_report",
      label: "All Contact Report",
    },
    hasViewRight(PAGE_ID.ALL_DELETED_CONTACT_REPORT) && {
      value: "all_deleted_contact_report",
      label: "All Deleted Contact Report",
    },
    hasViewRight(PAGE_ID.SOURCE_REPORT) && {
      value: "source_wise_contact_statistic_report",
      label: "Source Wise Statistic Reports",
    },
    hasViewRight(PAGE_ID.LABEL_REPORT) && {
      value: "label_wise_contact_statistics_report",
      label: "Label Wise Statistics Reports",
    },
    hasViewRight(PAGE_ID.ALLINQUIRY_REPORT) && {
      value: "all_inquiry_report",
      label: "All Inquiry Reports",
    },
    hasViewRight(PAGE_ID.TEAMEXPENSE_REPORT) && {
      value: "team_day_wise_expanse_report",
      label: "Team Wise Daily Expense Report",
    },
    hasViewRight(PAGE_ID.EXPENSE_DETAILED_REPORT) && {
      value: "expanse_detailed_report",
      label: "Expense Detailed Report",
    },
    hasViewRight(PAGE_ID.ALLVISIT_REPORT) && {
      value: "all_visit_report",
      label: "All Visit Reports",
    },
    hasViewRight(PAGE_ID.ALLCALL_REPORT) && {
      value: "all_call_report",
      label: "All Call Report",
    },
    hasViewRight(PAGE_ID.PENDINGSALESORDER_REPORT) && {
      value: "pending_order",
      label: title[0]?.order_title
        ? `Pending ${title[0].order_title} Report`
        : "Sales Order Pending Report",
    },
    hasViewRight(PAGE_ID.PENDINGPURCHASEORDER_REPORT) && {
      value: "pending_purchase",
      label: title[0]?.purchase_order_title
        ? `Pending ${title[0]?.purchase_order_title} Report`
        : "Purchase Order Pending Report",
    },
    hasViewRight(PAGE_ID.ALLTASK_REPORT) && {
      value: "alltask_report",
      label: "All Task Report",
    },
    hasViewRight(PAGE_ID.SUPPORT_TICKET_REPORT) && {
      value: "support_ticket_report",
      label: "AllSupport Ticket Report",
    },
    hasViewRight(PAGE_ID.ALLACCOUNTTRANSCTION_REPORT) && {
      value: "allaccount_report",
      label: "All Account Transtions Report",
    },
    hasViewRight(PAGE_ID.ALLACCOUNTTRANSCTION_REPORT) && {
      value: "account_credit_report",
      label: "Account Transtions Credit Report",
    },
    hasViewRight(PAGE_ID.ALLACCOUNTTRANSCTION_REPORT) && {
      value: "account_debit_report",
      label: "Account Transtions Debit Report",
    },
    hasViewRight(PAGE_ID.ALLACCOUNTTRANSCTION_REPORT) && {
      value: "payment_type_wise_account",
      label: "Payment Type Wise Account Report",
    },
    hasViewRight(PAGE_ID.CONTACT_CHAIN_WISE_REPORT) && {
      value: "all_contact_chainwise_report",
      label: "Chain Wise Contact Report",
    },
    hasViewRight(PAGE_ID.REMINDER_REPORT) && {
      value: "allreminder_report",
      label: "All Reminder Report",
    },
    // hasViewRight(PAGE_ID.SALESORDER_REPORT) && {
    //   value: "detailed_order_report",
    //   label: "Detailed Order Report",
    // },
    hasViewRight(PAGE_ID.SALESINVOICE_REPORT) && {
      value: "daily_sales_invoice",
      label: "Daily Sales Invoice",
    },

    hasViewRight(PAGE_ID.STATUS_REPORT) && {
      value: "status_wise_report",
      label: "Status Wise Task Or Supp. Ticket Report",
    },
  ].filter(Boolean) as ReportOption[];

  return (
    <div>
      {authDetails && authDetails.ack == 3 ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "100vh", backgroundColor: "rgb(240 242 245)" }}
        >
          <h2
            className="text-danger"
            style={{
              fontSize: "clamp(18px, 4vw, 24px)",
              fontWeight: "bold",
              letterSpacing: "0.4px",
            }}
          >
            You Are Unauthorized Please login First.
          </h2>
        </div>
      ) : (
        <>
          <div className="body body100">
            <div className="container-fluid px-2 px-md-3">
              <div className="row Intro-Left mx-0">
                <div
                  style={{
                    width: "100%",
                    minHeight: "100vh",
                    backgroundColor: "rgb(240 242 245)",
                    marginTop: "10px",
                  }}
                >
                  <div className="row mx-0 mb-3 pt-3">
                    <div className="row align-items-center justify-content-between">
                      <div
                        className="col-12 col-md-6 d-flex align-items-center mb-md-0"
                        style={{ padding: "0px" }}
                      >
                        <h2
                          className="modal-title1 mb-0"
                          style={{
                            fontSize: "clamp(18px, 4vw, 24px)",
                            fontWeight: "bold",
                            letterSpacing: "0.4px",
                            padding: "0px",
                            margin: "0px",
                          }}
                        >
                          Reports & Statistics
                        </h2>
                      </div>
                      {/* <div className="col-2">
                        <div className="d-flex align-items-center justify-content-end">
                          <span>
                            <p
                              className="landing-page-text text-end"
                              style={{
                                cursor: "pointer",
                                color: "blue",
                                float: "right",
                                fontSize: "13px",
                              }}
                              onClick={() => openInNewTab("/videoTutorial", 12)}
                            >
                              Learn More :{" "}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#0000FF"
                              >
                                <path d="M616-242q-27 1-51.5 1.5t-43.5.5h-41q-71 0-133-2-53-2-104.5-5.5T168-257q-26-7-45-26t-26-45q-6-23-9.5-56T82-447q-2-36-2-73t2-73q2-30 5.5-63t9.5-56q7-26 26-45t45-26q23-6 74.5-9.5T347-798q62-2 133-2t133 2q53 2 104.5 5.5T792-783q26 7 45 26t26 45q6 23 9.5 56t5.5 63q2 36 2 73v17q-19-8-39-12.5t-41-4.5q-83 0-141.5 58.5T600-320q0 21 4 40.5t12 37.5ZM400-400l208-120-208-120v240Zm360 200v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                              </svg>
                            </p>
                          </span>

                          <span
                            className="close ms-3 pb-3"
                            onClick={() => setIsCloseConfirmation(true)}
                          >
                            ×
                          </span>
                        </div>
                      </div> */}
                    </div>
                  </div>

                  <div className="row mx-0">
                    <div className="col-12 px-0 px-md-2">
                      <Card
                        className="text-center"
                        style={{ borderRadius: "0px" }}
                      >
                        <Card.Body className="p-2 p-md-3">
                          <div className="container-fluid px-0 mb-3">
                            <div className="row mx-0 g-2 g-md-3 ">
                              <div
                                className="col-7 col-xl-6 col-md-6 col-sm-6 px-0 px-md-1"
                                style={{ textAlign: "left", zIndex: "999" }}
                              >
                                <label
                                  htmlFor="reportType"
                                  className="form-label d-block mb-1 fw-bold text-start"
                                  style={{
                                    letterSpacing: "0.4px",
                                    fontSize: "clamp(13px, 2.5vw, 14px)",
                                  }}
                                >
                                  Select Report
                                </label>
                                <select
                                  style={{ width: "100%", fontSize: "14px" }}
                                  className="form-control"
                                  name="reportType"
                                  id="reportType"
                                  value={selectReportType}
                                  onChange={handleReportTypeChange}
                                >
                                  <option value="select">Select</option>
                                  {reportOptionsRaw.map(
                                    (opt: ReportOption, index: number) => (
                                      <option key={opt.value} value={opt.value}>
                                        {index + 1}. {opt.label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </div>
                              {/* <div className="col-5 col-xl-6 px-0 px-md-1 pt-3 d-flex flex-column flex-sm-row justify-content-start justify-content-xl-end align-items-stretch align-items-sm-center gap-2">
                                <div
                                  className="d-flex gap-2 flex-grow-1 justify-content-end align-item-center"
                                  style={{ alignItems: "center" }}
                                >
                                  {selectReportType && (
                                    <>
                                      <button
                                        className="flex-shrink-0"
                                        onClick={openFilterLabel}
                                        aria-label="Filter Report"
                                        style={{
                                          minHeight: "40px",
                                          minWidth: "40px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <span>
                                          {hasData ? (
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              height="20px"
                                              viewBox="0 -960 960 960"
                                              width="20px"
                                              fill="red"
                                            >
                                              <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                                            </svg>
                                          ) : (
                                            <svg
                                              height="20px"
                                              viewBox="0 -960 960 960"
                                              width="20px"
                                              fill="#54656f"
                                            >
                                              <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                                            </svg>
                                          )}
                                        </span>
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    className="btn btn-primary text-light rounded-1 flex-shrink-0"
                                    style={{
                                      backgroundColor: "#f58634",
                                      borderColor: "#f58634",
                                      minHeight: "40px",
                                      paddingLeft: "16px",
                                      paddingRight: "16px",
                                      fontSize: "clamp(12px, 2.5vw, 14px)",
                                      maxHeight: "40px",
                                    }}
                                    onClick={openReport}
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div> */}
                            </div>
                          </div>

                          <hr className="my-2" />

                          <div
                            className="container-fluid px-0"
                            style={{
                              minHeight: "50vh",
                              maxHeight: "80vh",
                              overflowY: "auto",
                            }}
                          >
                            <div className="w-100">
                              {appliedReportType === "" && (
                                <div className="text-center py-5">
                                  <p
                                    className="text-muted"
                                    style={{
                                      fontSize: "clamp(14px, 3vw, 16px)",
                                    }}
                                  >
                                    Please Select a Report Type and Date Range.
                                  </p>
                                </div>
                              )}
                              {appliedReportType === "team_performance" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamPerformanceReports
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      purchaseOrderTitle={
                                        title[0]?.purchase_order_title ||
                                        "Purchase Order"
                                      }
                                      purchaseTitle={
                                        title[0]?.purchase_title ||
                                        "Purchase Invoice"
                                      }
                                      quotationTitle={
                                        title[0]?.quotation_title || "Quotation"
                                      }
                                      orderTitle={
                                        title[0]?.order_title || "Sales Order"
                                      }
                                      invoiceTitle={
                                        title[0]?.invoice_title ||
                                        "Sales Invoice"
                                      }
                                      globalSearch={debouncedSearchText}
                                    />
                                  </div>
                                )}
                              {appliedReportType === "account" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AccountOutstandingReportsVIew
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "employee_account" &&
                                filters.selectedDateArray && (
                                  <EmployeeAccountOutstandingReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    globalSearch={debouncedSearchText}
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                  />
                                )}
                              {appliedReportType === "quotation" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamQuotationDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      title={
                                        title[0]?.quotation_title || "Quotation"
                                      }
                                      viewFormate={
                                        title[0]?.quotation_view_formate || 1
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      isCartModelOpen={isCartModelOpen}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "order" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamSalesOrderDataReportsView
                                      key={reportKey}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      title={
                                        title[0]?.order_title || "Sales Order"
                                      }
                                      viewFormate={
                                        title[0]?.order_view_formate || 3
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {/* {appliedReportType === "detailed_order_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamSalesOrderDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={filters.checkedOptionsUser}
                                      selectedStageStatus={filters.checkedOptionsStageStatus}
                                      selectedSeries={filters.checkedOptionsSeries}
                                      title={"Detailed Order Report"}
                                      viewFormate={
                                        title[0]?.order_view_formate || 3
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                    />
                                  </div>
                                )} */}
                              {appliedReportType === "inward_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamInwardDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      title={title[0]?.inward_title || "Inward"}
                                      viewFormate={
                                        title[0]?.inward_view_formate || 3
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      isCartModelOpen={isCartModelOpen}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}

                              {appliedReportType === "dispatch_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamDispatchDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      title={
                                        title[0]?.dispatch_title || "Dispatch"
                                      }
                                      viewFormate={
                                        title[0]?.dispatch_view_formate || 3
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      isCartModelOpen={isCartModelOpen}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}

                              {appliedReportType === "pending_order" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <PendingOrderReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      title={
                                        "Pending " + title[0]?.order_title ||
                                        "Sales Order Pending Report"
                                      }
                                      viewFormate={
                                        title[0]?.order_view_formate || 3
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "pending_purchase" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <PendingPurchaseReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      title={
                                        "Pending " +
                                          title[0]?.purchase_order_title ||
                                        "Pending Purchase Order Report"
                                      }
                                      viewFormate={
                                        title[0]?.purchase_order_view_formate ||
                                        3
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "order_invoice" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamSalesInvoiceDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      viewFormate={
                                        title[0]?.invoice_view_formate || 1
                                      }
                                      title={
                                        title[0]?.invoice_title ||
                                        "Sales Invoice"
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "return_sales_invoice" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamReturnSalesDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      viewFormate={
                                        title[0]
                                          ?.return_sales_invoice_view_formate ||
                                        1
                                      }
                                      title={
                                        title[0]?.return_sales_invoice_title ||
                                        "Return Sales Invoice"
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      isCartModelOpen={isCartModelOpen}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "purchase_invoice" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamPurchaseInvoiceDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      title={
                                        title[0]?.purchase_title ||
                                        "Purchase Invoice"
                                      }
                                      viewFormate={
                                        title[0]?.purchase_view_formate || 1
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "purchase_order" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamPurchaseOrderDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      title={
                                        title[0]?.purchase_order_title ||
                                        "Purchase Order"
                                      }
                                      viewFormate={
                                        title[0]?.purchase_order_view_formate ||
                                        1
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType ===
                                "return_purchase_invoice" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamReturnPurchaseDataReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedSeries={
                                        filters.checkedOptionsSeries
                                      }
                                      viewFormate={
                                        title[0]
                                          ?.return_purchase_invoice_view_formate ||
                                        1
                                      }
                                      title={
                                        title[0]
                                          ?.return_purchase_invoice_title ||
                                        "Return Purchase Invoice"
                                      }
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      isCartModelOpen={isCartModelOpen}
                                      onCartModelOpenChange={setIsCartModelOpen}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "pending" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamPendingWorkReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      purchaseOrderTitle={
                                        title[0]?.purchase_order_title ||
                                        "Purchase Order"
                                      }
                                      purchaseTitle={
                                        title[0]?.purchase_title ||
                                        "Purchase Invoice"
                                      }
                                      quotationTitle={
                                        title[0]?.quotation_title || "Quotation"
                                      }
                                      orderTitle={
                                        title[0]?.order_title || "Sales Order"
                                      }
                                      invoiceTitle={
                                        title[0]?.invoice_title ||
                                        "Sales Invoice"
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                    />
                                  </div>
                                )}
                              {appliedReportType === "product_inventory" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <ProductInventoryReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      inwardTitle={
                                        title[0]?.inward_title || "Inward"
                                      }
                                      purchaseTitle={
                                        title[0]?.purchase_title ||
                                        "Purchase Invoice"
                                      }
                                      returnPurchaseTitle={
                                        title[0]
                                          ?.return_purchase_invoice_title ||
                                        "Return Purchase Invoice"
                                      }
                                      returnSalesTitle={
                                        title[0]?.return_sales_invoice_title ||
                                        "Return Sales Invoice"
                                      }
                                      dispatchTitle={
                                        title[0]?.dispatch_title || "Dispatch"
                                      }
                                      invoiceTitle={
                                        title[0]?.invoice_title ||
                                        "Sales Invoice"
                                      }
                                      stockAdjustmentInwardTitle={
                                        "Stock Adjustment Inward"
                                      }
                                      stockAdjustmentOutwardTitle={
                                        "Stock Adjustment Outward"
                                      }
                                      selectedProduct={
                                        filters.selectedProductId
                                      }
                                      selectedCategory={
                                        filters.selectedCategoryId
                                      }
                                      selectedStockTypeId={
                                        filters.selectedStockTypeId
                                      }
                                      selectedWarehouseIds={
                                        filters.selectedWarehouseIds
                                      }
                                      globalSearch={debouncedSearchText}
                                    />
                                  </div>
                                )}
                              {appliedReportType === "attendance_salary" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <TeamAttendanceReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                    />
                                  </div>
                                )}
                              {appliedReportType === "process_attendance" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <ProcessAttendanceReportView
                                      key={reportKey}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      selectedDayMonthYear={
                                        selectedDayMonthYear
                                          ? Object.values(
                                              selectedDayMonthYear,
                                            ).filter(Boolean)
                                          : null
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "salary_register" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <SalaryRegisterReport
                                      key={reportKey}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      selectedDayMonthYear={
                                        selectedDayMonthYear
                                          ? Object.values(
                                              selectedDayMonthYear,
                                            ).filter(Boolean)
                                          : null
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "product_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <ProductSalesPurchaseReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedProduct={
                                        filters.selectedProductId
                                      }
                                      selectedCategory={
                                        filters.selectedCategoryId
                                      }
                                      purchaseOrderTitle={
                                        title[0]?.purchase_order_title ||
                                        "Purchase Order"
                                      }
                                      purchaseTitle={
                                        title[0]?.purchase_title ||
                                        "Purchase Invoice"
                                      }
                                      quotationTitle={
                                        title[0]?.quotation_title || "Quotation"
                                      }
                                      orderTitle={
                                        title[0]?.order_title || "Sales Order"
                                      }
                                      invoiceTitle={
                                        title[0]?.invoice_title ||
                                        "Sales Invoice"
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType ===
                                "product_wise_pending_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <ProductPendingView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedProduct={
                                        filters.selectedProductId
                                      }
                                      selectedCategory={
                                        filters.selectedCategoryId
                                      }
                                      purchaseOrderTitle={
                                        title[0]?.purchase_order_title ||
                                        "Purchase Order"
                                      }
                                      purchaseTitle={
                                        title[0]?.purchase_title ||
                                        "Purchase Invoice"
                                      }
                                      quotationTitle={
                                        title[0]?.quotation_title || "Quotation"
                                      }
                                      orderTitle={
                                        title[0]?.order_title || "Sales Order"
                                      }
                                      invoiceTitle={
                                        title[0]?.invoice_title ||
                                        "Sales Invoice"
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "category_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <CategorySalesPurchaseReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedProduct={
                                        filters.selectedProductId
                                      }
                                      selectedCategory={
                                        filters.selectedCategoryId
                                      }
                                      purchaseOrderTitle={
                                        title[0]?.purchase_order_title ||
                                        "Purchase Order"
                                      }
                                      purchaseTitle={
                                        title[0]?.purchase_title ||
                                        "Purchase Invoice"
                                      }
                                      quotationTitle={
                                        title[0]?.quotation_title || "Quotation"
                                      }
                                      orderTitle={
                                        title[0]?.order_title || "Sales Order"
                                      }
                                      invoiceTitle={
                                        title[0]?.invoice_title ||
                                        "Sales Invoice"
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType ===
                                "category_wise_pending_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <CategoryPendingReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedProduct={
                                        filters.selectedProductId
                                      }
                                      selectedCategory={
                                        filters.selectedCategoryId
                                      }
                                      purchaseOrderTitle={
                                        title[0]?.purchase_order_title ||
                                        "Purchase Order"
                                      }
                                      purchaseTitle={
                                        title[0]?.purchase_title ||
                                        "Purchase Invoice"
                                      }
                                      quotationTitle={
                                        title[0]?.quotation_title || "Quotation"
                                      }
                                      orderTitle={
                                        title[0]?.order_title || "Sales Order"
                                      }
                                      invoiceTitle={
                                        title[0]?.invoice_title ||
                                        "Sales Invoice"
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "all_contact_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AllcontactReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      setActive={
                                        filters.filterData?.active || ""
                                      }
                                      setActiveDay={Number(
                                        filters.filterData?.daysCount,
                                      )}
                                      selectedLabels={filters.checkedOptions}
                                      selectedSourceTypes={
                                        filters.checkedSourceTypes
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedDemography={
                                        selectedDemography
                                          ? Object.values(
                                              selectedDemography,
                                            ).filter(Boolean)
                                          : null
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedProductSearchId={
                                        filters.selectedProductSearchId
                                      }
                                      // setSelectOrderType={filters.filterData?.orderlistselect || ""}
                                      setSelectOrderType={
                                        filters.selectedOrderListId
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType ===
                                "all_deleted_contact_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AllDeletedcontactReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      setActive={
                                        filters.filterData?.active || ""
                                      }
                                      setActiveDay={Number(
                                        filters.filterData?.daysCount,
                                      )}
                                      selectedLabels={filters.checkedOptions}
                                      selectedSourceTypes={
                                        filters.checkedSourceTypes
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedDemography={
                                        selectedDemography
                                          ? Object.values(
                                              selectedDemography,
                                            ).filter(Boolean)
                                          : null
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                    />
                                  </div>
                                )}
                              {appliedReportType ===
                                "source_wise_contact_statistic_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AllSourceReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedSourceTypes={
                                        filters.checkedSourceTypes
                                      }
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                    />
                                  </div>
                                )}
                              {appliedReportType ===
                                "label_wise_contact_statistics_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AlllableReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedLabels={filters.checkedOptions}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                    />
                                  </div>
                                )}

                              {appliedReportType === "all_inquiry_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AllInqueryReport
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedLabels={filters.checkedOptions}
                                      selectedSourceTypes={
                                        filters.checkedSourceTypes
                                      }
                                      selectedStageStatus={
                                        filters.checkedOptionsStageStatus
                                      }
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedDemography={
                                        selectedDemography
                                          ? Object.values(
                                              selectedDemography,
                                            ).filter(Boolean)
                                          : null
                                      }
                                      selectedProduct={
                                        filters.selectedProductId
                                      }
                                      selectedCategory={
                                        filters.selectedCategoryId
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "alltask_report" &&
                                filters.selectedDateArray && (
                                  <AllTaskReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    selectedStageStatus={
                                      filters.checkedOptionsStageStatus
                                    }
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    globalSearch={debouncedSearchText}
                                    is_support_ticket_flag={0}
                                    selectedContactId={
                                      filters.selectedContactId
                                    }
                                    referenceWiseContact={
                                      filters.referenceWiseContact
                                    }
                                  />
                                )}
                              {appliedReportType === "support_ticket_report" &&
                                filters.selectedDateArray && (
                                  <AllTaskReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    selectedStageStatus={
                                      filters.checkedOptionsStageStatus
                                    }
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    globalSearch={debouncedSearchText}
                                    is_support_ticket_flag={1}
                                    selectedContactId={
                                      filters.selectedContactId
                                    }
                                    referenceWiseContact={
                                      filters.referenceWiseContact
                                    }
                                  />
                                )}
                              {appliedReportType ===
                                "team_day_wise_expanse_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AllTeamExpense
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      setRefreshReport1={() =>
                                        setRefreshReport(true)
                                      }
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                    />
                                  </div>
                                )}
                              {appliedReportType ===
                                "expanse_detailed_report" &&
                                filters.selectedDateArray && (
                                  <ExpenseDetailedReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    selectedExpenseTypes={
                                      filters.checkedExpenseTypes
                                    }
                                    selectedExpenseStatus={
                                      filters.checkedOptionsExpenseStatus
                                    }
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    globalSearch={debouncedSearchText}
                                  />
                                )}
                              {appliedReportType === "all_visit_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AllVisitReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      selectedDemography={
                                        selectedDemography
                                          ? Object.values(
                                              selectedDemography,
                                            ).filter(Boolean)
                                          : null
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                      referenceWiseContact={
                                        filters.referenceWiseContact
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType === "allaccount_report" &&
                                filters.selectedDateArray && (
                                  <AllAccountReports
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    globalSearch={debouncedSearchText}
                                    selectedContactId={
                                      filters.selectedContactId
                                    }
                                    referenceWiseContact={
                                      filters.referenceWiseContact
                                    }
                                  />
                                )}
                              {appliedReportType === "account_credit_report" &&
                                filters.selectedDateArray && (
                                  <AccountCreaditReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    globalSearch={debouncedSearchText}
                                    credit_debit_flag={1}
                                    selectedContactId={
                                      filters.selectedContactId
                                    }
                                    referenceWiseContact={
                                      filters.referenceWiseContact
                                    }
                                  />
                                )}
                              {appliedReportType === "account_debit_report" &&
                                filters.selectedDateArray && (
                                  <AccountDebitReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    globalSearch={debouncedSearchText}
                                    credit_debit_flag={2}
                                    selectedContactId={
                                      filters.selectedContactId
                                    }
                                    referenceWiseContact={
                                      filters.referenceWiseContact
                                    }
                                  />
                                )}
                              {appliedReportType ===
                                "payment_type_wise_account" &&
                                filters.selectedDateArray && (
                                  <PaymentWiseAccountReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                )}
                              {appliedReportType === "all_call_report" &&
                                filters.selectedDateArray && (
                                  <div className="w-100">
                                    <AllCallReportsView
                                      key={reportKey}
                                      selectedDates={filters.selectedDateArray}
                                      selectedTeamMembers={
                                        filters.checkedOptionsUser
                                      }
                                      MobileToken={MobileToken}
                                      getID={getID}
                                      MobileFlag={MobileFlag}
                                      globalSearch={debouncedSearchText}
                                      selectedContactId={
                                        filters.selectedContactId
                                      }
                                    />
                                  </div>
                                )}
                              {appliedReportType ===
                                "all_contact_chainwise_report" &&
                                filters.selectedDateArray && (
                                  <ChainWiseContactReportView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    setActive={filters.filterData?.active || ""}
                                    setActiveDay={Number(
                                      filters.filterData?.daysCount,
                                    )}
                                    selectedLabels={filters.checkedOptions}
                                    selectedSourceTypes={
                                      filters.checkedSourceTypes
                                    }
                                    selectedStageStatus={
                                      filters.checkedOptionsStageStatus
                                    }
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    selectedDemography={
                                      selectedDemography
                                        ? Object.values(
                                            selectedDemography,
                                          ).filter(Boolean)
                                        : null
                                    }
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    globalSearch={debouncedSearchText}
                                    selectedContactId={
                                      filters.selectedContactId
                                    }
                                    referenceWiseContact={
                                      filters.referenceWiseContact
                                    }
                                  />
                                )}
                              {appliedReportType === "allreminder_report" &&
                                filters.selectedDateArray && (
                                  <AllReminderReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedStageStatus={
                                      filters.checkedOptionsStageStatus
                                    }
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    globalSearch={debouncedSearchText}
                                    is_support_ticket_flag={0}
                                    selectedContactId={
                                      filters.selectedContactId
                                    }
                                    referenceWiseContact={
                                      filters.referenceWiseContact
                                    }
                                  />
                                )}
                              {appliedReportType === "daily_sales_invoice" &&
                                filters.selectedDateArray && (
                                  <DailyInvoiceReportView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    selectedStageStatus={
                                      filters.checkedOptionsStageStatus
                                    }
                                    selectedSeries={
                                      filters.checkedOptionsSeries
                                    }
                                    viewFormate={
                                      title[0]?.invoice_view_formate || 1
                                    }
                                    title={"Dayily Sales Invoice"}
                                    setRefreshReport1={() =>
                                      setRefreshReport(true)
                                    }
                                    // onCartModelOpenChange={setIsCartModelOpen}
                                    onCartModelOpenChange={setIsCartModelOpen}
                                    globalSearch={debouncedSearchText}
                                    selectedContactId={
                                      filters.selectedContactId
                                    }
                                    referenceWiseContact={
                                      filters.referenceWiseContact
                                    }
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                )}
                              {appliedReportType === "status_wise_report" &&
                                filters.selectedDateArray && (
                                  <StatusWiseReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedStageStatus={
                                      filters.checkedOptionsStageStatus
                                    }
                                    selectedTeamMembers={
                                      filters.checkedOptionsUser
                                    }
                                    globalSearch={debouncedSearchText}
                                  />
                                )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-responsive-wrapper">
              {isModalFilterVisible && (
                <CheckBoxFilterModal
                  show={isModalFilterVisible}
                  onHide={handleModalClose}
                  handleSubmit={handleConfirmFilter}
                  title="Filter Reports"
                  message="Please select the Dates and Team Members for the Report."
                  btn1="Clear"
                  btn2="Apply"
                  filtersToShow={filterShowNumber}
                  pageId={1}
                  stageandStatusOrderType={filtershowStageandStatus}
                  initialFilterData={filters.filterData}
                  initialCheckedOptions={filters.checkedOptions}
                  initialCheckedSourceTypes={filters.checkedSourceTypes}
                  initialStartSearchDate={filters.startSearchDate}
                  initialEndSearchDate={filters.endSearchDate}
                  initialCheckedOptionsStageStatus={
                    filters.checkedOptionsStageStatus
                  }
                  initialCheckedOptionsSeries={filters.checkedOptionsSeries}
                  initialCheckedOptionsUser={filters.checkedOptionsUser}
                  initialSelectedActiveId={filters.selectedActiveId}
                  initialSelectedDays={filters.selectedDays}
                  MobileToken={MobileToken}
                  getID={getID}
                  MobileFlag={MobileFlag}
                />
              )}
            </div>
          </div>
        </>
      )}
      {/* {authDetails && authDetails.ack !== 3 && (
        <>
          <div className="body body100">
            <div className="container-fluid px-2 px-md-3">
              <div className="row Intro-Left mx-0">
                <div
                  style={{
                    width: "100%",
                    minHeight: "100vh",
                    backgroundColor: "rgb(240 242 245)",
                    marginTop: "10px",
                  }}
                >
                  <div className="row mx-0 mb-3 pt-3">
                    <div className="row align-items-center justify-content-between">
                      <div className="col-12 col-md-6 d-flex align-items-center mb-md-0" style={{ padding: "0px" }}>
                        <h2
                          className="modal-title1 mb-0"
                          style={{
                            fontSize: "clamp(18px, 4vw, 24px)",
                            fontWeight: "bold",
                            letterSpacing: "0.4px",
                            padding: "0px",
                            margin: "0px"
                          }}
                        >
                          Reports & Statistics
                        </h2>
                      </div>


                    </div>
                  </div>

                  <div className="row mx-0">
                    <div className="col-12 px-0 px-md-2">
                      <Card className="text-center" style={{ borderRadius: "0px" }}>
                        <Card.Body className="p-2 p-md-3">
                          <div className="container-fluid px-0 mb-3">
                            <div className="row mx-0 g-2 g-md-3 ">
                              <div className="col-7 col-xl-6 col-md-6 col-sm-6 px-0 px-md-1" style={{ textAlign: "left", zIndex: "999" }}>
                                <label
                                  htmlFor="reportType"
                                  className="form-label d-block mb-1 fw-bold text-start"
                                  style={{
                                    letterSpacing: "0.4px",
                                    fontSize: "clamp(13px, 2.5vw, 14px)",
                                  }}
                                >
                                  Select Report
                                </label>
                                <select
                                  style={{
                                    width: "100%",
                                    fontSize: "14px",
                                  }}
                                  className="form-control"
                                  name="reportType"
                                  id="reportType"
                                  value={selectReportType}
                                  onChange={handleReportTypeChange}
                                >
                                  <option value="select">Select</option>
                                  <option value="team_performance">
                                    1. Team Performance
                                  </option>
                                  <option value="quotation">
                                    2. {title[0]?.quotation_title || "Quotation"}
                                  </option>
                                  <option value="order">
                                    3. {title[0]?.order_title || "Sales Order"}
                                  </option>
                                  <option value="order_invoice">
                                    4.
                                    {title[0]?.invoice_title || "Sales Invoice"}
                                  </option>
                                  <option value="purchase_order">
                                    5.{" "}
                                    {title[0]?.purchase_order_title ||
                                      "Purchase Order"}
                                  </option>
                                  <option value="purchase_invoice">
                                    6. {title[0]?.purchase_title || "Purchase"}
                                  </option>

                                  <option value="account">
                                    7. Account Outstanding
                                  </option>
                                  <option value="pending">8. Pending Work</option>
                                  <option value="product_inventory">
                                    9. Product Inventory & Stock Alert
                                  </option>
                                  <option value="attendance_salary">
                                    10. Attendance & Salary
                                  </option>
                                  <option value="product_report">
                                    11. Product Wise Movement Report
                                  </option>
                                  <option value="product_wise_pending_report">
                                    12. Product Wise Pending Report
                                  </option>
                                  <option value="category_report">
                                    13. Category Wise Movement Report
                                  </option>
                                  <option value="category_wise_pending_report">
                                    14. Category Wise Pending Report
                                  </option>
                                  <option value="all_contact_report">
                                    15. All Contact Report
                                  </option>
                                  <option value="source_wise_contact_statistic_report">
                                    16. Source Wise Statistic Reports
                                  </option>
                                  <option value="label_wise_contact_statistics_report">
                                    17. Label Wise Statistics Reports
                                  </option>
                                  <option value="all_inquiry_report">
                                    18. All Inquiry Reports
                                  </option>
                                  <option value="team_day_wise_expanse_report">
                                    19. Team Wise Daily Expense Report
                                  </option>
                                  <option value="all_visit_report">
                                    20. All Visit Reports
                                  </option>
                                  <option value="all_call_report">
                                    21. All Call Report
                                  </option>
                                  <option value="pending_order">
                                    22.{" "}
                                    {title[0]?.order_title
                                      ? "Pending " +
                                      title[0].order_title +
                                      " Report"
                                      : "Sales Order Pending Report"}
                                  </option>
                                  <option value="pending_purchase">
                                    23.{" "}
                                    {title[0]?.purchase_title
                                      ? "Pending " +
                                      title[0].purchase_order_title +
                                      " Report"
                                      : "Purchase Order Pending Report"}
                                  </option>
                                </select>
                              </div>
                              <div className="col-5 col-xl-6 px-0 px-md-1 pt-3 d-flex flex-column flex-sm-row justify-content-start justify-content-xl-end align-items-stretch align-items-sm-center gap-2">
                                <div className="d-flex gap-2 flex-grow-1 justify-content-end align-item-center" style={{ alignItems: "center" }}>
                                  <button
                                    className="flex-shrink-0"
                                    onClick={openFilterLabel}
                                    aria-label="Filter Report"
                                    style={{
                                      minHeight: "40px",
                                      minWidth: "40px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <span>
                                      {hasData ? (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          height="20px"
                                          viewBox="0 -960 960 960"
                                          width="20px"
                                          fill="red"
                                        >
                                          <path d="m592-481-57-57 143-182H353l-80-80h487q25 0 36 22t-4 42L592-481ZM791-56 560-287v87q0 17-11.5 28.5T520-160h-80q-17 0-28.5-11.5T400-200v-247L56-791l56-57 736 736-57 56ZM535-538Z" />
                                        </svg>
                                      ) : (
                                        <svg
                                          height="20px"
                                          viewBox="0 -960 960 960"
                                          width="20px"
                                          fill="#54656f"
                                        >
                                          <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
                                        </svg>
                                      )}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary text-light rounded-1 flex-shrink-0"
                                    style={{
                                      backgroundColor: "#f58634",
                                      borderColor: "#f58634",
                                      minHeight: "40px",
                                      paddingLeft: "16px",
                                      paddingRight: "16px",
                                      fontSize: "clamp(12px, 2.5vw, 14px)",
                                      maxHeight: "40px"
                                    }}
                                    onClick={openReport}
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <hr className="my-2" />

                          <div
                            className="container-fluid px-0"
                            style={{
                              minHeight: "50vh",
                              maxHeight: "80vh",
                              overflowY: "auto",
                            }}
                          >
                            <div className="w-100">
                              {appliedReportType === "" && (
                                <div className="text-center py-5">
                                  <p
                                    className="text-muted"
                                    style={{ fontSize: "clamp(14px, 3vw, 16px)" }}
                                  >
                                    Please Select a Report Type and Date Range.
                                  </p>
                                </div>
                              )}
                              {appliedReportType === "team_performance" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <TeamPerformanceReports
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    purchaseOrderTitle={
                                      title[0]?.purchase_order_title || "Purchase Order"
                                    }
                                    purchaseTitle={
                                      title[0]?.purchase_title || "Purchase Invoice"
                                    }
                                    quotationTitle={
                                      title[0]?.quotation_title || "Quotation"
                                    }
                                    orderTitle={title[0]?.order_title || "Sales Order"}
                                    invoiceTitle={
                                      title[0]?.invoice_title || "Sales Invoice"
                                    }
                                  />
                                </div>
                              )}
                              {appliedReportType === "account" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <AccountOutstandingReportsVIew
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "quotation" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <TeamQuotationDataReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    title={title[0]?.quotation_title || "Quotation"}
                                    viewFormate={title[0]?.quotation_view_formate || 1}
                                    setRefreshReport1={() => setRefreshReport(true)}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "order" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <TeamSalesOrderDataReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    title={title[0]?.order_title || "Sales Order"}
                                    viewFormate={title[0]?.order_view_formate || 3}
                                    setRefreshReport1={() => setRefreshReport(true)}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "pending_order" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <PendingOrderReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    title={
                                      "Pending " + title[0]?.order_title ||
                                      "Sales Order Pending Report"
                                    }
                                    viewFormate={title[0]?.order_view_formate || 3}
                                    setRefreshReport1={() => setRefreshReport(true)}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "pending_purchase" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <PendingPurchaseReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    title={
                                      "Pending " + title[0]?.purchase_order_title ||
                                      "Pending Purchase Order Report"
                                    }
                                    viewFormate={title[0]?.purchase_order_view_formate || 3}
                                    setRefreshReport1={() => setRefreshReport(true)}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "order_invoice" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <TeamSalesInvoiceDataReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    viewFormate={title[0]?.invoice_view_formate || 1}
                                    title={title[0]?.invoice_title || "Sales Invoice"}
                                    setRefreshReport1={() => setRefreshReport(true)}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "purchase_invoice" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <TeamPurchaseInvoiceDataReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    title={title[0]?.purchase_title || "Purchase Invoice"}
                                    viewFormate={title[0]?.purchase_view_formate || 1}
                                    setRefreshReport1={() => setRefreshReport(true)}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "purchase_order" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <TeamPurchaseOrderDataReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    title={title[0]?.purchase_order_title || "Purchase Order"}
                                    viewFormate={title[0]?.purchase_order_view_formate || 1}
                                    setRefreshReport1={() => setRefreshReport(true)}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "pending" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <TeamPendingWorkReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    purchaseOrderTitle={
                                      title[0]?.purchase_order_title || "Purchase Order"
                                    }
                                    purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
                                    quotationTitle={title[0]?.quotation_title || "Quotation"}
                                    orderTitle={title[0]?.order_title || "Sales Order"}
                                    invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "product_inventory" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <ProductInventoryReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                    purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
                                    invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
                                  />
                                </div>
                              )}
                              {appliedReportType === "attendance_salary" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <TeamAttendanceReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "product_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <ProductSalesPurchaseReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    purchaseOrderTitle={
                                      title[0]?.purchase_order_title || "Purchase Order"
                                    }
                                    purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
                                    quotationTitle={title[0]?.quotation_title || "Quotation"}
                                    orderTitle={title[0]?.order_title || "Sales Order"}
                                    invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "product_wise_pending_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <ProductPendingView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    purchaseOrderTitle={
                                      title[0]?.purchase_order_title || "Purchase Order"
                                    }
                                    purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
                                    quotationTitle={title[0]?.quotation_title || "Quotation"}
                                    orderTitle={title[0]?.order_title || "Sales Order"}
                                    invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "category_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <CategorySalesPurchaseReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    purchaseOrderTitle={
                                      title[0]?.purchase_order_title || "Purchase Order"
                                    }
                                    purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
                                    quotationTitle={title[0]?.quotation_title || "Quotation"}
                                    orderTitle={title[0]?.order_title || "Sales Order"}
                                    invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}

                                  />
                                </div>
                              )}
                              {appliedReportType === "category_wise_pending_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <CategoryPendingReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    purchaseOrderTitle={
                                      title[0]?.purchase_order_title || "Purchase Order"
                                    }
                                    purchaseTitle={title[0]?.purchase_title || "Purchase Invoice"}
                                    quotationTitle={title[0]?.quotation_title || "Quotation"}
                                    orderTitle={title[0]?.order_title || "Sales Order"}
                                    invoiceTitle={title[0]?.invoice_title || "Sales Invoice"}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "all_contact_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <AllcontactReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    setActive={activeOrDeactive}
                                    setActiveDay={activeDays}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "source_wise_contact_statistic_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <AllSourceReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "label_wise_contact_statistics_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <AlllableReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "all_inquiry_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <AllInqueryReport
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "team_day_wise_expanse_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <AllTeamExpense
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    setRefreshReport1={() => setRefreshReport(true)}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "all_visit_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <AllVisitReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                              {appliedReportType === "all_call_report" && filters.selectedDateArray && (
                                <div className="w-100">
                                  <AllCallReportsView
                                    key={reportKey}
                                    selectedDates={filters.selectedDateArray}
                                    selectedTeamMembers={filters.checkedOptionsUser}
                                    MobileToken={MobileToken}
                                    getID={getID}
                                    MobileFlag={MobileFlag}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-responsive-wrapper">
              {isModalFilterVisible && (
                <CheckBoxFilterModal
                  show={isModalFilterVisible}
                  onHide={handleModalClose}
                  handleSubmit={handleConfirmFilter}
                  title="Filter Reports"
                  message="Please select the Dates and Team Members for the Report."
                  btn1="Clear"
                  btn2="Apply"
                  filtersToShow={filterShowNumber}
                  pageId={1}
                  initialFilterData={filters.filterData}
                  initialCheckedOptions={filters.checkedOptions}
                  initialCheckedSourceTypes={filters.checkedSourceTypes}
                  initialStartSearchDate={filters.startSearchDate}
                  initialEndSearchDate={filters.endSearchDate}
                  initialCheckedOptionsStageStatus={filters.checkedOptionsStageStatus}
                  initialCheckedOptionsUser={filters.checkedOptionsUser}
                  initialSelectedActiveId={filters.selectedActiveId}
                  initialSelectedDays={filters.selectedDays}
                  MobileToken={MobileToken}
                  getID={getID}
                  MobileFlag={MobileFlag}
                />
              )}
            </div>
          </div>
        </>
      ) } */}
    </div>
  );
};

export default NewReportModel;
