import React, { useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { SingleValue } from "react-select";
import { toast } from "react-toastify";
import {
  formatDate,
  formatDateYMD,
  openInNewTab,
  useEscapeKey,
} from "../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../helpers/AppConstants";
import {
  IFilterData,
  IFilterPayload,
  IOption,
  TFilterDate,
} from "../../helpers/AppInterface";
import { IExpenseTypeView } from "../../pages/left-side/header/Setting/expense-type/ExpenseTypeController";
import { ILabelView } from "../../pages/left-side/header/Setting/label/LabelController";
import { IPaymentTypeView } from "../../pages/left-side/header/Setting/payment-type/PaymentTypeController";
import { ISourceOfTypes } from "../../pages/left-side/header/Setting/source-of-types/SourceOfTypesController";
import { IStageStatusView } from "../../pages/left-side/header/Setting/stage-status/StageStatusController";
import {
  ITaskTypeView,
  taskTypesList,
} from "../../pages/right-side/create-task/CreateTaskController";
import { orderTypesList } from "../../pages/right-side/list-order/ListOrderController";
import { axiosInstance } from "../../services/axiosInstance";
import { useFeatureFlagStore } from "../../store/supportTicket/useSupportTicketFlag";
import CustomSearchDropdown from "../CustomSearchDropdown";
import MultiSelect from "../MultiSelect";
import "./ConfirmationModal.css";

// Fixed Options for Month
export const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

// Define interface for filterData

interface CheckBoxModalProps {
  show: boolean;
  onHide: () => void;
  handleSubmit: (filterPayload: IFilterPayload) => void;
  title: string;
  message: string;
  btn1: string;
  btn2: string;
  filtersToShow: number[];
  pageId: number;
  initialFilterData?: IFilterData | null;
  initialCheckedOptions?: any[] | null;
  initialCheckedSourceTypes?: any[] | null;
  initialCheckedExpenseTypes?: any[] | null;
  initialcheckedPaymentBy?: any[] | null;
  initialCheckedGSTTypes?: any[] | null;
  initialCheckedTrasactionMode?: number | null;
  initialCheckedPaymentType?: number | null;
  initialStartSearchDate?: TFilterDate;
  initialEndSearchDate?: TFilterDate;
  initialCheckedOptionsStageStatus?: any[] | null;
  initialCheckedOptionsExpenseStatus?: any[] | null;
  initialCheckedOptionsSeries?: any[] | null;
  initialCheckedOptionsTaskType?: any[] | null;
  initialCheckedOptionsUser?: any[] | null;
  initialSelectedActiveId?: any | null;
  initialSelectedDays?: string | number | null;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  stageandStatusOrderType?: number;
  initialSelectedStockTypeId?: number;
  filtershowSeriesOrderType?: string;
  initialCheckedAssignedByMultiTeamMember?: any[] | null;
  initialCheckedCreatedByMultiTeamMember?: any[] | null;
  initialCheckedOptionsTaskAssignOrnot?: any[] | null;
  initialCheckedOptionsShowTaskTemplate?: any[] | null;
  labelFilderApplyAndOr?: number;
  initialCheckedShowCreditData?: number;
  initialCheckedShowDebitData?: number;
  selectedWarehouseIds?: string;
  initialselectedOrderListId?: any | null;
  initialCheckedOptionsContactAssignOrnot?: any[] | null;
  initialReferenceWiseContact?: number;
  isApplyReport?: number;
}

const CheckBoxFilterModal: React.FC<CheckBoxModalProps> = ({
  show,
  onHide,
  handleSubmit,
  title,
  message,
  btn1,
  btn2,
  filtersToShow,
  initialFilterData,
  initialCheckedOptions,
  initialCheckedSourceTypes,
  initialCheckedExpenseTypes,
  initialcheckedPaymentBy,
  initialCheckedGSTTypes,
  initialCheckedTrasactionMode,
  initialCheckedPaymentType,
  initialStartSearchDate,
  initialEndSearchDate,
  initialCheckedOptionsStageStatus,
  initialCheckedOptionsExpenseStatus,
  initialCheckedOptionsSeries,
  initialCheckedOptionsTaskType,
  initialCheckedOptionsUser,
  initialSelectedStockTypeId,
  initialSelectedActiveId,
  initialSelectedDays,
  MobileToken,
  getID,
  MobileFlag,
  stageandStatusOrderType = 1,
  filtershowSeriesOrderType = "",
  initialCheckedAssignedByMultiTeamMember,
  initialCheckedCreatedByMultiTeamMember,
  initialCheckedOptionsTaskAssignOrnot,
  initialCheckedOptionsShowTaskTemplate,
  labelFilderApplyAndOr,
  initialCheckedShowCreditData,
  initialCheckedShowDebitData,
  selectedWarehouseIds,
  initialselectedOrderListId,
  initialCheckedOptionsContactAssignOrnot,
  initialReferenceWiseContact = 1,
  isApplyReport,
}) => {
  const convertToDateObject = (date: any) => {
    if (!date) return null;

    try {
      return new DateObject(date);
    } catch (err) {
      console.error("Invalid date:", date);
      return null;
    }
  };

  const [startSearchDate, setStartSearchDate] = useState<DateObject | null>(
    initialStartSearchDate
      ? convertToDateObject(initialStartSearchDate)
      : // : new DateObject().subtract(7, "days")
        null,
  );
  const getCurrentMonthDateRange = () => {
    const now = new Date();

    const previousMonthLastDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
    );

    const currentMonthLastDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    );

    return [
      new DateObject(previousMonthLastDate),
      new DateObject(currentMonthLastDate),
    ];
  };
  const { flags } = useFeatureFlagStore();
  const [endSearchDate, setEndSearchDate] = useState<DateObject | null>(
    initialEndSearchDate ? convertToDateObject(initialEndSearchDate) : null,
  );

  const [checkedOptions, setCheckedOptions] = useState<any[]>(
    initialCheckedOptions || [],
  );
  const [checkedOptionsSourceType, setCheckedOptionsSourceType] = useState<
    any[]
  >(initialCheckedSourceTypes || []);

  const [checkedOptionsExpenseType, setCheckedOptionsExpenseType] = useState<
    any[]
  >(initialCheckedExpenseTypes || []);

  const [checkedOptionsPaymentBy, setCheckedOptionsPaymentBy] = useState<any[]>(
    initialcheckedPaymentBy || [],
  );
  const [checkedGstOptions, setCheckedGstOptions] = useState<any[]>(
    initialCheckedGSTTypes || [],
  );

  const [checkedTrasactionMode, setCheckedTrasactionMode] = useState<
    number | null
  >(initialCheckedTrasactionMode ?? null);

  const [checkedPaymentType, setCheckedPaymentType] = useState<number | null>(
    initialCheckedPaymentType ?? null,
  );

  const [checkedOptionsStageStatus, setCheckedOptionsStageStatus] = useState<
    any[]
  >(initialCheckedOptionsStageStatus || []);

  const [checkedOptionsExpenseStatus, setCheckedOptionsExpenseStatus] =
    useState<any[]>(initialCheckedOptionsExpenseStatus || []);

  const [checkedOptionsSeries, setCheckedOptionsSeries] = useState<any[]>(
    initialCheckedOptionsSeries || [],
  );

  const [checkedOptionsTaskType, setCheckedOptionsTaskType] = useState<any[]>(
    initialCheckedOptionsTaskType || [],
  );

  const [checkedOptionsUser, setCheckedOptionsUser] = useState<any[]>(
    initialCheckedOptionsUser || [],
  );
  const [sourceOfTypesLists, setSourceOfTypesLists] = useState<
    ISourceOfTypes[]
  >([]);
  const [expenseOfTypesLists, setExpenseOfTypesLists] = useState<
    IExpenseTypeView[]
  >([]);
  const [stageStatusList, setStageStatusList] = useState<IStageStatusView[]>(
    [],
  );
  const [seriesList, setseriesList] = useState<any[]>([]);

  const [taskTypeList, setTaskTypeList] = useState<ITaskTypeView[]>([]);

  const [checkedOptionsTaskassignOrNot, setCheckedOptionsTaskassignOrNot] =
    useState<any[]>(initialCheckedOptionsTaskAssignOrnot || []);

  const [
    checkedOptionsContactassignOrNot,
    setCheckedOptionsContactassignOrNot,
  ] = useState<any[]>(initialCheckedOptionsContactAssignOrnot || []);

  const [checkedOptionsShowTemplateTask, setCheckedOptionsShowTemplateTask] =
    useState<any[]>(initialCheckedOptionsShowTaskTemplate || []);

  const [labelAndOr, setLabelAndOr] = useState<number>(
    labelFilderApplyAndOr || 1,
  );
  const [checkCreditDataForAccount, setCheckCreditDataForAccount] =
    useState<number>(initialCheckedShowCreditData || 0);
  const [checkDebitDataForAccount, setCheckDebitDataForAccount] =
    useState<number>(initialCheckedShowDebitData || 0);

  const [labelLists, setLabelList] = useState<ILabelView[]>([]);
  const [paymentByList, setPaymentByList] = useState<IPaymentTypeView[]>([]);
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [areaList, setAreaList] = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] =
    useState<SingleValue<IOption>>(null);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<SingleValue<IOption>>(null);
  const [selectedReqList, setSelectedReqList] =
    useState<SingleValue<IOption> | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<any>();
  const [selectedStockTypeId, setSelectedStockTypeId] =
    useState<SingleValue<IOption>>(null);
  const [selectedActiveId, setSelectedActiveId] =
    useState<SingleValue<IOption>>(null);
  const [selectedReqListProduct, setSelectedReqListProduct] =
    useState<SingleValue<IOption> | null>(null);
  const [selectedProductSearchId, setSelectedProductSearchId] =
    useState<any>(null);

  const [selectedProductId, setSelectedProductId] =
    useState<SingleValue<IOption>>(null);
  const [filteredProductOptions, setFilteredProductOptions] = useState<
    Array<{ value: number; label: string }>
  >([]);
  const [selectedAreaId, setSelectedAreaId] =
    useState<SingleValue<IOption>>(null);
  const [stateList, setStateList] = useState<any[]>([]);
  const [selectedStateId, setSelectedStateId] =
    useState<SingleValue<IOption>>(null);
  const [cityList, setCityList] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] =
    useState<SingleValue<IOption>>(null);
  const [selectedDays, setSelectedDays] = useState<string | undefined>(
    initialSelectedDays ? String(initialSelectedDays) : undefined,
  );
  const [optionJoinCompany, setOptionJoinCompany] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [warehouseLoading, setWarehouseLoading] = useState<boolean>(false);
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<any[]>([]);
  const [isFilterModified, setIsFilterModified] = useState(false);
  const [selectedOrderListId, setSelectedOrderListId] =
    useState<SingleValue<IOption>>(null);
  const [selectedProductSearchOption, setSelectedProductSearchOption] =
    useState<SingleValue<IOption>>(null);

  const [referenceWiseContact, setReferenceWiseContact] = useState<number>(
    initialReferenceWiseContact || 1,
  );

  const [sourceSearch, setSourceSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [stageSearch, setStageSearch] = useState("");
  const [stageStatusExtnalSearch, setStageStatusExtnalSearch] = useState("");
  const [expenseStatusSearch, setExpenseStatusSearch] = useState("");
  const [labelSearch, setLabelSearch] = useState("");
  const [multiuserSearch, setMultiUserSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [gstSearch, setGstSearch] = useState("");
  const [trasactionModeSearch, setTrasactionModeSearch] = useState("");
  const [paymentBySearch, setPaymentBySearch] = useState("");

  const [debouncedSource, setDebouncedSource] = useState("");
  const [debouncedExpense, setDebouncedExpense] = useState("");
  const [debouncedStage, setDebouncedStage] = useState("");
  const [debouncedStageStatusExternal, setDebouncedStageStatusExternal] =
    useState("");
  const [debouncedExpenseStatus, setDebouncedExpenseStatus] = useState("");
  const [debouncedLabel, setDebouncedLabel] = useState("");
  const [debouncedMultiUser, setDebouncedMultiUser] = useState("");
  const [debouncedUser, setDebouncedUser] = useState("");
  const [debouncedGst, setDebouncedGst] = useState("");
  const [debouncedTrasactionMode, setDebouncedTrasactionMode] = useState("");
  const [debouncedPaymentBy, setDebouncedPaymentBy] = useState("");

  // States for Date, Month & Year Filter
  const [selectedMonth, setSelectedMonth] =
    useState<SingleValue<IOption>>(null);
  const [selectedYear, setSelectedYear] = useState<SingleValue<IOption>>(null);
  const [selectedDay, setSelectedDay] = useState<SingleValue<IOption>>(null);

  // Dynamic Options for Year (Current Year down to 1970)
  const currentYear = new Date().getFullYear();
  const startYear = 1970;

  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => {
      // Subtracting the index from the current year gives us a descending list
      const year = currentYear - i;
      return { value: year, label: year.toString() };
    },
  );

  // Dynamic Options for Days
  // This recalculates automatically whenever selectedMonth or selectedYear changes
  const dayOptions = useMemo(() => {
    if (!selectedMonth || !selectedYear) return [];

    const daysInMonth = new Date(
      Number(selectedYear.value),
      Number(selectedMonth.value),
      0,
    ).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => ({
      value: i + 1,
      label: (i + 1).toString(),
    }));
  }, [selectedMonth, selectedYear]);

  const handleMonthChange = (e: SingleValue<IOption>) => {
    setSelectedMonth(e);
    setSelectedDay(null);
  };

  const handleYearChange = (e: SingleValue<IOption>) => {
    setSelectedYear(e);
    setSelectedDay(null);
  };

  const handleDayChange = (e: SingleValue<IOption>) => setSelectedDay(e);

  const activeData = [
    { id: "1", value: "Active" },
    { id: "2", value: "Deactivate" },
  ];

  const expenseStatusOptions = [
    { id: "1", name: "Pending", color: "#ccc" },
    { id: "2", name: "Approved", color: "#06923E" },
    { id: "3", name: "Rejected", color: "#FF0000" },
  ];

  const handleChangeWarehouse = (selected: any) => {
    setSelectedWarehouses(selected || []);
  };

  useEffect(() => {
    if (!show || !initialFilterData) return;

    if (countriesList.length > 0 && initialFilterData.country) {
      const country = countriesList.find(
        (c) => c.id === initialFilterData.country,
      );
      setSelectedCountryId(
        country ? { value: country.id, label: country.country_name } : null,
      );
    }
    if (stateList.length > 0 && initialFilterData.state) {
      const state = stateList.find((s) => s.id === initialFilterData.state);
      setSelectedStateId(
        state ? { value: state.id, label: state.state_name } : null,
      );
    }
    if (cityList.length > 0 && initialFilterData.city) {
      const city = cityList.find((c) => c.id === initialFilterData.city);
      setSelectedCityId(
        city ? { value: city.id, label: city.city_name } : null,
      );
    }
    if (areaList.length > 0 && initialFilterData.area) {
      const area = areaList.find((a) => a.id === initialFilterData.area);
      setSelectedAreaId(
        area ? { value: area.id, label: area.area_name } : null,
      );
    }
    if (initialFilterData.year) {
      const year = yearOptions.find((y) => y.value === initialFilterData.year);
      setSelectedYear(year ? { value: year.value, label: year.label } : null);
    }
    if (initialFilterData.month) {
      const month = monthOptions.find(
        (m) => m.value === initialFilterData.month,
      );
      setSelectedMonth(
        month ? { value: month.value, label: month.label } : null,
      );
    }
    if (initialFilterData.day) {
      const day = dayOptions.find((m) => m.value === initialFilterData.day);
      setSelectedDay(day ? { value: day.value, label: day.label } : null);
    }
    if (categoryList.length > 0 && initialFilterData.category) {
      const category = categoryList.find(
        (c) => c.id === initialFilterData.category,
      );
      setSelectedCategoryId(
        category ? { value: category.id, label: category.category_name } : null,
      );
    }
    if (
      productList.length > 0 &&
      initialFilterData.product &&
      initialFilterData.category
    ) {
      const category = categoryList.find(
        (c) => c.id === initialFilterData.category,
      );
      if (category) {
        setSelectedCategoryId({
          value: category.id,
          label: category.category_name,
        });
        const filteredProducts = productList.filter(
          (p) => p.category_id === category.id,
        );
        const product = filteredProducts.find(
          (p) => p.id === initialFilterData.product,
        );
        setSelectedProductId(
          product ? { value: product.id, label: product.product_name } : null,
        );
      }
    }
    if (initialFilterData.active) {
      const active = activeData.find(
        (a) => a.value === initialFilterData.active,
      );
      setSelectedActiveId(
        active ? { value: active.id, label: active.value } : null,
      );
    }
    if (initialFilterData.orderlistselect) {
      const orderlistselect = orderTypesList.find(
        (a) => a.type === initialFilterData.orderlistselect,
      );
      setSelectedOrderListId(
        orderlistselect
          ? { value: orderlistselect.id, label: orderlistselect.type }
          : null,
      );
    }

    if (initialSelectedStockTypeId) {
      const e = stockTypeOptions.find(
        (a) => a.value === initialSelectedStockTypeId,
      );
      e && handleStockTypeChange({ value: e.value, label: e.label });
    }
    setSelectedDays(
      initialFilterData.daysCount
        ? String(initialFilterData.daysCount)
        : undefined,
    );
    if (initialFilterData?.productId) {
      fetchProductById(initialFilterData.productId);
    }
    if (initialFilterData.orderlistselect) {
      const order = orderTypesList.find(
        (o) =>
          o.id === initialFilterData.orderlistselect ||
          o.type === initialFilterData.orderlistselect,
      );

      setSelectedOrderListId(
        order ? { value: order.id, label: order.type } : null,
      );
    }
  }, [
    show,
    initialFilterData,
    countriesList,
    stateList,
    cityList,
    areaList,
    categoryList,
    productList,
  ]);
  useEffect(() => {
    if (show) {
      setReferenceWiseContact(initialReferenceWiseContact || 1);
    }
  }, [show, initialReferenceWiseContact]);

  /* Multi team member checked filter */
  const [assignedByMultiTeamMember, setAssignedByMultiTeamMember] = useState<
    any[]
  >(initialCheckedAssignedByMultiTeamMember || []);

  const handleMultiTeamMemberCheckboxChangeOne = (optionId: any) => {
    setAssignedByMultiTeamMember((prevbbb: any[]) =>
      prevbbb?.includes(optionId)
        ? prevbbb.filter((id) => id !== optionId)
        : [...(prevbbb || []), optionId],
    );
  };

  const [createdByMultiTeamMember, setCreatedByMultiTeamMember] = useState<
    any[]
  >(initialCheckedCreatedByMultiTeamMember || []);

  const handleMultiTeamMemberCheckboxChangeTwo = (optionId: any) => {
    setCreatedByMultiTeamMember((prevccc: any[]) =>
      prevccc?.includes(optionId)
        ? prevccc.filter((id) => id !== optionId)
        : [...(prevccc || []), optionId],
    );
  };
  /* Multi team member checked filter */

  // Escape handle
  useEscapeKey(onHide);
  const warehouseIds = selectedWarehouses
    ?.map((item: any) => item.value)
    .join(",");

  useEffect(() => {
    const hasAnyFilter =
      checkedOptions.length > 0 ||
      checkedOptionsSourceType.length > 0 ||
      checkedOptionsExpenseType.length > 0 ||
      checkedOptionsPaymentBy.length > 0 ||
      checkedGstOptions.length > 0 ||
      checkedTrasactionMode !== null ||
      checkedPaymentType !== null ||
      checkedOptionsStageStatus.length > 0 ||
      checkedOptionsExpenseStatus.length > 0 ||
      checkedOptionsSeries.length > 0 ||
      checkedOptionsTaskType.length > 0 ||
      checkedOptionsUser.length > 0 ||
      assignedByMultiTeamMember.length > 0 ||
      createdByMultiTeamMember.length > 0 ||
      checkedOptionsTaskassignOrNot.length > 0 ||
      checkedOptionsContactassignOrNot.length > 0 ||
      checkedOptionsShowTemplateTask.length > 0 ||
      selectedCountryId ||
      selectedStateId ||
      selectedCityId ||
      selectedAreaId ||
      selectedDay ||
      selectedMonth ||
      selectedYear ||
      selectedCategoryId ||
      selectedContactId ||
      selectedProductSearchId ||
      selectedStockTypeId ||
      selectedProductId ||
      selectedActiveId ||
      selectedDays ||
      startSearchDate ||
      endSearchDate ||
      warehouseIds ||
      selectedOrderListId ||
      referenceWiseContact;
    setIsFilterModified(!!hasAnyFilter);
  }, [
    checkedOptions,
    checkedOptionsSourceType,
    checkedOptionsExpenseType,
    checkedOptionsPaymentBy,
    checkedGstOptions,
    checkedTrasactionMode,
    checkedPaymentType,
    checkedOptionsStageStatus,
    checkedOptionsExpenseStatus,
    checkedOptionsSeries,
    checkedOptionsTaskType,
    checkedOptionsUser,
    assignedByMultiTeamMember,
    createdByMultiTeamMember,
    checkedOptionsTaskassignOrNot,
    checkedOptionsContactassignOrNot,
    checkedOptionsShowTemplateTask,
    selectedCountryId,
    selectedStateId,
    selectedCityId,
    selectedAreaId,
    selectedDay,
    selectedMonth,
    selectedYear,
    selectedCategoryId,
    selectedContactId,
    selectedProductSearchId,
    selectedStockTypeId,
    selectedProductId,
    selectedActiveId,
    selectedDays,
    startSearchDate,
    endSearchDate,
    warehouseIds,
    selectedOrderListId,
    referenceWiseContact,
  ]);
  const onSubmit = async () => {
    if (isLoading) {
      toast.warn("Data is still loading, please wait...");
      return;
    }
    const filterData: IFilterData = {
      country: selectedCountryId?.value,
      state: selectedStateId?.value,
      city: selectedCityId?.value,
      area: selectedAreaId?.value,
      day: selectedDay?.value,
      month: selectedMonth?.value,
      year: selectedYear?.value,
      active: selectedActiveId?.label,
      daysCount: selectedDays,
      contactId: selectedContactId?.value,
      productId: selectedProductSearchId?.value,
      orderlistselect: selectedOrderListId?.label,
    };
    const [defaultStartDate, defaultEndDate] = getCurrentMonthDateRange();

    const now = new Date();
    const newStartDate =
      startSearchDate instanceof DateObject
        ? startSearchDate.format("YYYY-MM-DD")
        : startSearchDate;
    const newEndDate =
      endSearchDate instanceof DateObject
        ? endSearchDate.format("YYYY-MM-DD")
        : endSearchDate;

    const finalStartDate =
      isApplyReport == 1
        ? newStartDate || formatDate(defaultStartDate)
        : newStartDate;

    const finalEndDate =
      isApplyReport == 1
        ? newEndDate || formatDate(defaultEndDate)
        : newEndDate;

    const appliedLabelValues = checkedOptions.map((id) => id).filter(Boolean);
    const appliedSourceTypeValues = checkedOptionsSourceType
      .map((id) => id)
      .filter(Boolean);
    const appliedExpenseTypeValues = checkedOptionsExpenseType
      .map((id) => id)
      .filter(Boolean);
    const appliedPaymentByValues = checkedOptionsPaymentBy
      .map((id) => id)
      .filter(Boolean);
    const appliedGSTTypeValues = checkedGstOptions
      .map((id) => id)
      .filter(Boolean);
    const appliedTrasactionModeValues = checkedTrasactionMode
      ? checkedTrasactionMode
      : null;
    const appliedPaymentTypeValues = checkedPaymentType
      ? checkedPaymentType
      : null;
    const appliedStageStatusValues = checkedOptionsStageStatus
      .map((id) => id)
      .filter(Boolean);
    const appliedExpenseStatusValues = checkedOptionsExpenseStatus
      .map((id) => id)
      .filter(Boolean);
    const appliedSeriesValues = checkedOptionsSeries
      .map((id) => id)
      .filter(Boolean);
    handleSubmit({
      filterData,
      checkedOptionsLabel: appliedLabelValues ?? [],
      checkedOptionsSourceType: appliedSourceTypeValues ?? [],
      checkedOptionsExpenseType: appliedExpenseTypeValues ?? [],
      checkedOptionsPaymentBy: appliedPaymentByValues ?? [],
      checkedGstOptions: appliedGSTTypeValues ?? [],
      checkedTrasactionMode: appliedTrasactionModeValues,
      checkedPaymentType: appliedPaymentTypeValues,
      startSearchDate: finalStartDate,
      endSearchDate: finalEndDate,
      checkedOptionsStageStatus: appliedStageStatusValues ?? [],
      checkedOptionsExpenseStatus: appliedExpenseStatusValues ?? [],
      checkedOptionsSeries: appliedSeriesValues ?? [],
      checkedOptionsUser,
      selectedCategoryId,
      selectedStockTypeId,
      selectedProductId,
      selectedActiveId: selectedActiveId?.label,
      selectedDays,
      assignedByMultiTeamMember: assignedByMultiTeamMember ?? [],
      createdByMultiTeamMember: createdByMultiTeamMember ?? [],
      checkedOptionsTaskassignOrNot: checkedOptionsTaskassignOrNot ?? [],
      checkedOptionsContactassignOrNot: checkedOptionsContactassignOrNot ?? [],
      checkedOptionsTaskType: checkedOptionsTaskType ?? [],
      checkedOptionsShowTemplateTask: checkedOptionsShowTemplateTask ?? [],
      labelAndOr,
      initialCheckedShowCreditData: checkCreditDataForAccount,
      initialCheckedShowDebitData: checkDebitDataForAccount,
      selectedWarehouseIds: warehouseIds || "",
      selectedContactId,
      selectedProductSearchId,
      selectedOrderListId,
      referenceWiseContact,
    });
  };

  const handleHide = () => {
    const [defaultStartDate, defaultEndDate] = getCurrentMonthDateRange();

    setCheckedOptions([]);
    setCheckedOptionsSourceType([]);
    setCheckedOptionsExpenseType([]);
    setCheckedOptionsPaymentBy([]);
    setCheckedGstOptions([]);
    setCheckedTrasactionMode(null);
    setCheckedPaymentType(null);
    setCheckedOptionsStageStatus([]);
    setCheckedOptionsExpenseStatus([]);
    setCheckedOptionsSeries([]);
    setCheckedOptionsTaskType([]);
    setCheckedOptionsUser([]);
    setSelectedCountryId(null);
    setSelectedStateId(null);
    setSelectedCityId(null);
    setSelectedAreaId(null);
    // setSelectedYear(null);
    // setSelectedMonth(null);
    // setSelectedDay(null);
    setSelectedCategoryId(null);
    setSelectedContactId(null);
    setSelectedProductSearchId(null);
    setSelectedStockTypeId(null);
    setSelectedActiveId(null);
    setSelectedOrderListId(null);
    setSelectedDays(undefined);
    if (isApplyReport == 1) {
      setStartSearchDate(null);
      setEndSearchDate(null);
    } else {
      setStartSearchDate(null);
      setEndSearchDate(null);
    }
    setEndSearchDate(null);
    setAssignedByMultiTeamMember([]);
    setCreatedByMultiTeamMember([]);
    setCheckedOptionsTaskassignOrNot([]);
    setCheckedOptionsContactassignOrNot([]);
    setCheckedOptionsShowTemplateTask([]);
    setReferenceWiseContact(1);
    handleSubmit({
      filterData: null,
      checkedOptionsLabel: [],
      checkedOptionsSourceType: [],
      checkedOptionsExpenseType: [],
      checkedOptionsPaymentBy: [],
      checkedGstOptions: [],
      checkedTrasactionMode: null,
      checkedPaymentType: null,
      startSearchDate:
        isApplyReport == 1 ? formatDateYMD(defaultStartDate) : null,

      endSearchDate: isApplyReport == 1 ? formatDateYMD(defaultEndDate) : null,

      checkedOptionsStageStatus: [],
      checkedOptionsExpenseStatus: [],
      checkedOptionsSeries: [],
      checkedOptionsUser: [],
      selectedCategoryId: null,
      selectedStockTypeId: null,
      selectedProductId: null,
      selectedActiveId: null,
      selectedDays: null,
      assignedByMultiTeamMember: [],
      createdByMultiTeamMember: [],
      selectedWarehouseIds: undefined,
      selectedContactId: null,
      selectedProductSearchId: null,
      selectedOrderListId: null,
      referenceWiseContact: 1,
    });
    onHide();
    setLabelAndOr(0);
    setCheckCreditDataForAccount(0);
    setCheckDebitDataForAccount(0);
  };

  const handleCountryChange = (selectedOption: SingleValue<IOption>) => {
    console.log("selectedOption", selectedOption);
    setSelectedCountryId(selectedOption);
    setSelectedStateId(null);
    setSelectedCityId(null);
    setSelectedAreaId(null);
  };

  const handleCategoryChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedCategoryId(selectedOption);
    setSelectedProductId(null);
  };

  const handleStockTypeChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedStockTypeId(selectedOption);
  };

  const handleActiveChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedActiveId(selectedOption);
  };

  const handledays = (selectedOption: string) => {
    setSelectedDays(selectedOption);
  };

  const handleProductChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedProductId(selectedOption);
  };

  const handleAreaChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedAreaId(selectedOption);
  };

  const handleStateChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedStateId(selectedOption);
    setSelectedCityId(null);
    setSelectedAreaId(null);
  };

  const handleCityChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedCityId(selectedOption);
    setSelectedAreaId(null);
  };
  const handleOrderListChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedOrderListId(selectedOption);
  };

  // const fetchStageStatusApi = async () => {
  //   const getUUID = getID || localStorage.getItem("UUID");
  //   const requestData = {
  //     table: "stage_status_masters",
  //     columns: "id,name,color,order_type,display_order_type",
  //     // where: `{"order_type": "${stageandStatusOrderType}","isDelete":"0"}`,
  //     where: `{"isDelete":"0","order_type":"${stageandStatusOrderType}"}`,

  //     // where: [`isDelete=0", "order_type=${stageandStatusOrderType}`],
  //     // request_flag: 0,
  //     order: `{"id":"DESC"}`,
  //   };
  //   try {
  //     const data = await axiosInstance.post("commonGet", requestData);
  //     if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
  //       setStageStatusList([]);
  //     }
  //     setStageStatusList(data.data.data);
  //   } catch (error: any) {
  //     toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  //   }
  // };

  const BLANK_STAGE_STATUS_ID = -7777;

  const blankStageStatus: IStageStatusView = {
    id: BLANK_STAGE_STATUS_ID,
    name: "Blank Status",
    color: "#000000",
    order_type: stageandStatusOrderType,
    display_order_type: 0,
    change_status_team_ids: "",
    show_status_data_team_ids: "",
    status_type: "",
    change_status_usernames: "",
    show_status_data_usernames: "",
  };

  const fetchStageStatusApi = async () => {
    const requestData = {
      table: "stage_status_masters",
      columns: "id,name,color,order_type,display_order_type,visibility",
      where: [`order_type=${stageandStatusOrderType}`, `isDelete=0`],
      order: JSON.stringify({ id: "DESC" }),
      request_flag: 0,
    };

    try {
      const data = await axiosInstance.post("commonGet", requestData);

      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setStageStatusList([blankStageStatus]);
        return;
      }

      // 👇 Blank sabse upar
      setStageStatusList([blankStageStatus, ...(data.data.data || [])]);
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const fetchWarehouseApi = async () => {
    const getUUID = getID || localStorage.getItem("UUID");

    const requestData = {
      a_application_login_id: getUUID,
    };

    try {
      setWarehouseLoading(true);
      const response = await axiosInstance.post("getwarehouse", requestData);

      const options = (response.data.data.item || []).map((item: any) => ({
        value: item.id,
        label: item.warehouse_name,
      }));

      setWarehouseOptions(options);
    } catch (error) {
      setWarehouseOptions([]);
    } finally {
      setWarehouseLoading(false);
    }
  };

  const fetchSeriesApi = async () => {
    if (!filtershowSeriesOrderType) {
      return;
    }
    const uuid = localStorage.getItem("UUID");
    const requestData = {
      table: "company_masters",
      columns: `id,${filtershowSeriesOrderType}`,
      where: JSON.stringify({ a_application_login_id: uuid, isDelete: 0 }),
      request_flag: 2,
    };

    try {
      const data = await axiosInstance.post("mainCommonGet", requestData);

      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setseriesList([]);
        return;
      }

      const series = data.data.data;
      const series_arr: string[] =
        series[0][filtershowSeriesOrderType].split(",");

      const series_final_arr = series_arr.filter(Boolean).map((e: string) => ({
        id: e,
        name: e,
      }));
      setseriesList([...(series_final_arr || [])]);
    } catch (error: any) {
      toast.error(error.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const fetchTaskTypeList = async () => {
    const taskTypesOptions = taskTypesList.map((itemType) => ({
      id: Number(itemType.id),
      type_name: itemType.type_name,
    }));
    setTaskTypeList(taskTypesOptions);
  };

  const fetchCountryApiForPriceList = async () => {
    const requestData = {
      table: "a_countries",
      columns: "id,country_name,country_code",
      where: `{"isDelete": "0"}`,
    };
    const getUUID = getID || localStorage.getItem("UUID");
    try {
      const response = await axiosInstance.post("commonGet", requestData);
      setCountriesList(response.data.data);
    } catch (error) {
      setCountriesList([]);
    }
  };

  const fetchAllCompanyApi = async () => {
    const token = MobileToken || localStorage.getItem("token");
    const getUUID = getID || localStorage.getItem("UUID");

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
        setOptionJoinCompany([]);
      }
      setOptionJoinCompany(data.data.data.item);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const fetchStateApiForFilter = async () => {
    if (!selectedCountryId?.value && selectedCountryId?.value !== null) return;
    const requestData = {
      table: "a_states",
      columns: "id,state_name",
      where: `{"country_id": "${selectedCountryId.value}"}`,
    };
    const getUUID = getID || localStorage.getItem("UUID");
    try {
      const response = await axiosInstance.post("commonGet", requestData);
      setStateList(response.data.data);
    } catch (error) {
      setStateList([]);
    }
  };

  const fetchCategoryApiForFilter = async () => {
    const getUUID = getID || localStorage.getItem("UUID");
    const requestData = {
      table: "categories",
      columns: "id,category_name",
      where: `{"isDelete":"0"}`,
    };
    try {
      const response = await axiosInstance.post("commonGet", requestData);
      setCategoryList(response.data.data);
    } catch (error) {
      setCategoryList([]);
    }
  };

  const fetchProductApiForFilter = async () => {
    const getUUID = getID || localStorage.getItem("UUID");
    const requestData = {
      table: "products",
      columns: "id,product_name,category_id",
      where: `{"isDelete":"0"}`,
    };
    try {
      const response = await axiosInstance.post("commonGet", requestData);
      setProductList(response.data.data);
    } catch (error) {
      setProductList([]);
    }
  };

  const fetchCityApiForFilter = async () => {
    if (!selectedStateId?.value) return;
    const requestData = {
      table: "a_cities",
      columns: "id,city_name",
      where: `{"state_id": ${selectedStateId.value}}`,
    };
    const getUUID = getID || localStorage.getItem("UUID");
    try {
      const response = await axiosInstance.post("commonGet", requestData);
      setCityList(response.data.data);
    } catch (error) {
      setCityList([]);
    }
  };

  const fetchAreaApiForFilter = async () => {
    if (!selectedCityId?.value) return;
    const requestData = {
      table: "a_areas",
      columns: "id,area_name",
      where: `{"city_id": "${selectedCityId.value}"}`,
    };
    const getUUID = getID || localStorage.getItem("UUID");
    try {
      const response = await axiosInstance.post("commonGet", requestData);
      setAreaList(response.data.data);
    } catch (error) {
      setAreaList([]);
    }
  };

  const BLANK_LABEL_ID = -9999;

  const blankLabel: ILabelView = {
    id: BLANK_LABEL_ID,
    lable_name: "Blank Label",
    color: "#000000",
  };

  const fetchLabelApi = async () => {
    const requestData = {
      table: "lable_masters",
      columns: "id,lable_name,color",
      where: ["isDelete=0"],
      request_flag: 0,
      order: `{"id":"DESC"}`,
    };

    try {
      const data = await axiosInstance.post("commonGet", requestData);

      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setLabelList([blankLabel]);
        return;
      }

      // 👇 Blank label ko sabse upar add karo
      setLabelList([blankLabel, ...data.data.data]);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const BLANK_PAYMENT_ID = -6666;
  const BLANK_TYPE_ID = -22;

  const blankPayment: IPaymentTypeView = {
    id: BLANK_PAYMENT_ID,
    payment_type_name: "Blank Label",
    payment_color: "#000000",
    transaction_type: BLANK_TYPE_ID,
  };

  const fetchPaymentTypeApi = async () => {
    const requestData = {
      table: "payment_types",
      columns: "id,payment_type_name,payment_color",
      where: ["isDelete=0"],
      request_flag: 0,
      order: `{"id":"DESC"}`,
    };

    try {
      const data = await axiosInstance.post("commonGet", requestData);

      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setPaymentByList([blankPayment]);
        return;
      }

      // 👇 Blank ko sabse upar add karo
      setPaymentByList([blankPayment, ...data.data.data]);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const handleCheckboxChange = (id: number) => {
    setCheckedOptions((prev) => {
      setIsFilterModified(true);
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSourceTypeCheckboxChange = (optionId: any) => {
    setCheckedOptionsSourceType((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleExpenseTypeCheckboxChange = (optionId: any) => {
    setCheckedOptionsExpenseType((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handlePaymentByCheckboxChange = (optionId: any) => {
    setCheckedOptionsPaymentBy((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };
  const handleGstCheckboxChange = (optionId: any) => {
    setCheckedGstOptions((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleTrasactionModeCheckboxChange = (optionId: any) => {
    setCheckedTrasactionMode((prev) => (prev === optionId ? null : optionId));
  };

  const handlePaymentTypeCheckboxChange = (optionId: any) => {
    setCheckedPaymentType((prev) => (prev === optionId ? null : optionId));
  };

  const handleStageStatusTypeCheckboxChange = (optionId: any) => {
    setCheckedOptionsStageStatus((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleExpenseStatusTypeCheckboxChange = (optionId: any) => {
    setCheckedOptionsExpenseStatus((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleSeriesCheckboxChange = (optionId: any) => {
    setCheckedOptionsSeries((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleTaskTypeCheckboxChange = (optionId: any) => {
    setCheckedOptionsTaskType((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleUsersTypeCheckboxChange = (optionId: any) => {
    setCheckedOptionsUser((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const BLANK_SOURCE_ID = -8888;

  const blankSourceType: ISourceOfTypes = {
    id: BLANK_SOURCE_ID,
    source_name: "Blank Source",
    color: "#000000",
  };

  const fetchSourceOfTypesApi = async () => {
    const getUUID = getID || localStorage.getItem("UUID");

    try {
      const data = await axiosInstance.post("sourceOfTypes", {
        a_application_login_id: getUUID,
      });

      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setSourceOfTypesLists([blankSourceType]);
        return;
      }

      // 👇 Blank source sabse upar
      setSourceOfTypesLists([blankSourceType, ...(data.data.data.item || [])]);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const BLANK_EXPENSE_ID = -8888;

  const blankExpenseType: IExpenseTypeView = {
    id: BLANK_EXPENSE_ID,
    expense_name: "Blank Expense",
    color: "#000000",
    expense_subtype: 1, // 1=general, 2=kilometer
    compulsory_image: 2,
    min_time: "",
    max_time: "",
    min_amount: 0,
    max_amount: 1,
    fix_amount: 0,
    amount_per_km: 10,
    created_date_time: "",
  };

  const fetchExpenseTypeApi = async () => {
    const getUUID = getID || localStorage.getItem("UUID");

    try {
      const data = await axiosInstance.post("get-expense-type", {
        a_application_login_id: getUUID,
        request_flag: 0,
      });

      if (data.data.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        setExpenseOfTypesLists([blankExpenseType]);
        return;
      }

      setExpenseOfTypesLists([blankExpenseType, ...(data.data.data || [])]);
    } catch (error: any) {
      toast.error(error || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  useEffect(() => {
    if (selectedCategoryId) {
      const filteredProducts = productList
        .filter(
          (product: any) => product.category_id === selectedCategoryId.value,
        )
        .map((product: any) => ({
          value: product.id,
          label: product.product_name,
        }));
      setFilteredProductOptions(filteredProducts);
    } else {
      setFilteredProductOptions(productOptions);
    }
  }, [selectedCategoryId, productList]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchSourceOfTypesApi(),
          fetchExpenseTypeApi(),
          fetchLabelApi(),
          fetchCountryApiForPriceList(),
          fetchStageStatusApi(),
          fetchSeriesApi(),
          fetchTaskTypeList(),
          fetchAllCompanyApi(),
          fetchCategoryApiForFilter(),
          fetchProductApiForFilter(),
          fetchWarehouseApi(),
          fetchPaymentTypeApi(),
        ]);
      } catch (error) {
        toast.error("Failed to load filter data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (show) {
      fetchData();
    }
  }, [show]);

  useEffect(() => {
    if (show && filtersToShow.includes(27)) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          await fetchExpenseTypeApi();
        } catch (error) {
          toast.error("Failed to load expense data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [show]);

  useEffect(() => {
    if (selectedCountryId?.value && selectedCountryId?.value !== null) {
      fetchStateApiForFilter();
    } else {
      setStateList([]);
      setSelectedStateId(null);
      setCityList([]);
      setSelectedCityId(null);
      setAreaList([]);
      setSelectedAreaId(null);
    }
  }, [selectedCountryId?.value]);

  useEffect(() => {
    if (selectedStateId?.value) {
      fetchCityApiForFilter();
    } else {
      setCityList([]);
      setSelectedCityId(null);
      setAreaList([]);
      setSelectedAreaId(null);
    }
  }, [selectedStateId?.value]);

  useEffect(() => {
    if (selectedCityId?.value) {
      fetchAreaApiForFilter();
    } else {
      setAreaList([]);
      setSelectedAreaId(null);
    }
  }, [selectedCityId?.value]);

  useEffect(() => {
    setStartSearchDate(
      initialStartSearchDate
        ? convertToDateObject(initialStartSearchDate)
        : // : new DateObject().subtract(7, "days")
          null,
    );
    setEndSearchDate(
      initialEndSearchDate ? convertToDateObject(initialEndSearchDate) : null,
    );
  }, [initialStartSearchDate, initialEndSearchDate]);

  const countryOptions = countriesList.map((country: any) => ({
    value: country.id,
    label: country.country_name,
  }));

  const categoryOptions = categoryList.map((category: any) => ({
    value: category.id,
    label: category.category_name,
  }));

  const loadCategoryOptions = async (inputValue: string) => {
    return categoryOptions.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase()),
    );
  };

  const productOptions = productList.map((product: any) => ({
    value: product.id,
    label: product.product_name,
  }));

  const stateOptions = stateList.map((state: any) => ({
    value: state.id,
    label: state.state_name,
  }));

  const cityOptions = cityList.map((city: any) => ({
    value: city.id,
    label: city.city_name,
  }));

  const areaOptions = areaList.map((area: any) => ({
    value: area.id,
    label: area.area_name,
  }));

  const activeOptions = activeData.map((option: any) => ({
    value: option.id,
    label: option.value,
  }));

  const orderListOptions = orderTypesList.map((option: any) => ({
    value: option.id,
    label: option.type,
  }));

  const stockTypeOptions = [
    { value: 1, label: "Zero stock" },
    { value: 2, label: "Less than zero" },
    { value: 3, label: "Greater than zero" },
    { value: 4, label: "More then max qty" },
    { value: 5, label: "Less then min qty" },
  ];

  const gstOptions = [
    { id: 1, name: "With GST" },
    { id: 2, name: "Without GST" },
  ];

  const trasactionModeOptions = [
    { id: 1, name: "Cash Memo" },
    { id: 2, name: "Debit Memo" },
  ];

  const paymentTypaOptions = [
    { id: 1, name: "Credit" },
    { id: 2, name: "Debit" },
  ];

  const handleStartDateChange = (date: DateObject | null) => {
    setStartSearchDate(date);
  };

  const handleEndDateChange = (date: DateObject | null) => {
    const startDate =
      startSearchDate instanceof DateObject
        ? startSearchDate.format("YYYY-MM-DD")
        : "";
    const newDate = date instanceof DateObject ? date.format("YYYY-MM-DD") : "";
    if (newDate && startDate && newDate < startDate) {
      toast.error("End date must be greater than or equal to start date");
      return;
    }
    setEndSearchDate(date);
  };

  // useEffect(() => {
  //   setEndSearchDate(startSearchDate);
  // }, [startSearchDate]);
  const handleUnassignCheckboxChange = (optionId: number) => {
    setCheckedOptionsTaskassignOrNot((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleUnassignCheckboxChangeForContact = (optionId: number) => {
    setCheckedOptionsContactassignOrNot((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };

  const handleShowTemplateTaskCheckboxChange = (optionId: number) => {
    setCheckedOptionsShowTemplateTask((prev: any[]) =>
      prev?.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...(prev || []), optionId],
    );
  };
  /* Contact Search Filter */

  const handleReqDisplayChange = (selectedOption: SingleValue<IOption>) => {
    setSelectedReqList(selectedOption || null);
    setSelectedContactId(selectedOption ? selectedOption.value : 0);
  };
  const loadContactOptions = async (inputValue: string): Promise<IOption[]> => {
    if (!inputValue || inputValue.trim().length < 3) {
      return [];
    }

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

  /* Product Serach Filter */
  const handleReqDisplayChangeProduct = (
    selectedOption: SingleValue<IOption>,
  ) => {
    setSelectedProductSearchOption(selectedOption);
    setSelectedProductSearchId(selectedOption ? selectedOption.value : null);
  };
  const loadProductOptions = async (inputValue: string): Promise<IOption[]> => {
    if (!inputValue || inputValue.trim().length < 3) {
      return [];
    }

    try {
      const getUUID = localStorage.getItem("UUID");

      const { data } = await axiosInstance.post(`product`, {
        searchTerm: inputValue,
        a_application_login_id: getUUID,
      });

      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        return data.data.item.map((item: any) => ({
          value: item.id,
          label: `${item.product_name} - ${item.product_code}`,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error loading product options:", error);
      return [];
    }
  };

  const fetchProductById = async (id: number) => {
    try {
      const getUUID = localStorage.getItem("UUID");

      const { data } = await axiosInstance.post(`product`, {
        id,
        a_application_login_id: getUUID,
      });

      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const item = data.data.item?.[0];

        if (item) {
          const option = {
            value: item.id,
            label: `${item.product_name} - ${item.product_code}`,
          };

          setSelectedProductSearchOption(option);
          setSelectedProductSearchId(option.value);
        }
      }
    } catch (error) {
      console.error("Error fetching product by id:", error);
    }
  };

  const filterList = (list: any[], search: string, key: string) => {
    if (!Array.isArray(list)) return [];

    if (!search || search.length < 3) return list;

    return list.filter((item) =>
      item[key]?.toLowerCase().includes(search.toLowerCase()),
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceSearch.length >= 3) {
        setDebouncedSource(sourceSearch.toLowerCase());
      } else {
        setDebouncedSource("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [sourceSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (expenseSearch.length >= 3) {
        setDebouncedExpense(expenseSearch.toLowerCase());
      } else {
        setDebouncedExpense("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [expenseSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (paymentBySearch.length >= 3) {
        setDebouncedPaymentBy(paymentBySearch.toLowerCase());
      } else {
        setDebouncedPaymentBy("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [paymentBySearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (gstSearch.length >= 2) {
        setDebouncedGst(gstSearch.toLowerCase());
      } else {
        setDebouncedGst("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [gstSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (trasactionModeSearch.length >= 2) {
        setDebouncedTrasactionMode(trasactionModeSearch.toLowerCase());
      } else {
        setDebouncedTrasactionMode("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [trasactionModeSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stageSearch.length >= 3) {
        setDebouncedStage(stageSearch.toLowerCase());
      } else {
        setDebouncedStage("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [stageSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (stageStatusExtnalSearch.length >= 3) {
        setDebouncedStageStatusExternal(stageStatusExtnalSearch.toLowerCase());
      } else {
        setDebouncedStageStatusExternal("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [stageStatusExtnalSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (expenseStatusSearch.length >= 3) {
        setDebouncedExpenseStatus(expenseStatusSearch.toLowerCase());
      } else {
        setDebouncedExpenseStatus("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [expenseStatusSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (multiuserSearch.length >= 3) {
        setDebouncedMultiUser(multiuserSearch.toLowerCase());
      } else {
        setDebouncedMultiUser("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [multiuserSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (labelSearch.length >= 3) {
        setDebouncedLabel(labelSearch.toLowerCase());
      } else {
        setDebouncedLabel("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [labelSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch.length >= 3) {
        setDebouncedUser(userSearch.toLowerCase());
      } else {
        setDebouncedUser("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch]);

  useEffect(() => {
    if (initialStartSearchDate) {
      const parsedDate =
        initialStartSearchDate instanceof Date
          ? initialStartSearchDate
          : typeof initialStartSearchDate === "string" ||
              typeof initialStartSearchDate === "number"
            ? new Date(initialStartSearchDate)
            : initialStartSearchDate.toDate();

      setStartSearchDate(convertToDateObject(parsedDate));
    } else {
      setStartSearchDate(null);
    }
  }, [initialStartSearchDate]);

  useEffect(() => {
    if (initialEndSearchDate) {
      const parsedDate =
        initialEndSearchDate instanceof Date
          ? initialEndSearchDate
          : typeof initialEndSearchDate === "string" ||
              typeof initialEndSearchDate === "number"
            ? new Date(initialEndSearchDate)
            : initialEndSearchDate.toDate();

      setEndSearchDate(convertToDateObject(parsedDate));
    } else {
      setEndSearchDate(null);
    }
  }, [initialEndSearchDate]);

  return (
    <div>
      <style>
        {`
      .search-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 10px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
  transition: all 0.25s ease;
  background-color: #fafafa;
}

/* Focus effect */
.search-input:focus {
  border-color: #f97316; /* orange theme */
  background-color: #fff;
  // box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}

/* Placeholder styling */
.search-input::placeholder {
  color: #9ca3af;
  font-size: 13px;
}

.clear-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 14px;
  color: #9ca3af;
}

.clear-icon:hover {
  color: #111827;
}
      `}
      </style>
      {show && (
        <div className="modal1" style={{ zIndex: "99999" }}>
          <div className="modal-content1" style={{ width: "92%" }}>
            <div className="d-flex align-items-center justify-content-end">
              <div className="col-8">
                <h2 className="modal-title1 form_header_text">{title}</h2>
              </div>
              <div className="col-4">
                <span className="close ms-3 pb-3" onClick={onHide}>
                  &times;
                </span>
                <span>
                  <p
                    className="landing-page-text text-end"
                    style={{
                      cursor: "pointer",
                      color: "blue",
                      float: "right",
                      fontSize: "13px",
                    }}
                    onClick={() => openInNewTab("/videoTutorial", 3)}
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
              </div>
            </div>

            <div className="m-title-2">
              {filtersToShow.includes(1) && (
                <div className="row mb-2">
                  <div className="px-2 col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                    <label className="ms-2 fw-bold">Start Date</label>
                    <DatePicker
                      value={startSearchDate}
                      onChange={handleStartDateChange}
                      format="DD-MM-YYYY"
                      calendarPosition="bottom-left"
                      style={{ width: "100%" }}
                      placeholder="DD-MM-YYYY"
                      className="form-control font-size-15 rounded-1"
                    />
                  </div>
                  <div
                    className="col-xxl-3 col-xl-3 col-lg-6 col-md-6 col-sm-12 col-xs-12"
                    style={{ paddingLeft: "0px", paddingRight: "20px" }}
                  >
                    <label className="ms-2 fw-bold">End Date</label>
                    <DatePicker
                      value={endSearchDate}
                      onChange={handleEndDateChange}
                      format="DD-MM-YYYY"
                      minDate={startSearchDate ?? ""}
                      calendarPosition="bottom-left"
                      style={{ width: "100%" }}
                      placeholder="DD-MM-YYYY"
                      className="form-control font-size-15 rounded-1"
                    />
                  </div>
                </div>
              )}
              <div className="row">
                {filtersToShow.includes(2) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card ">
                    <div className="">
                      <div className="text-center">{/* Switch below */}</div>
                      {/* Label */}
                      <div className="d-flex justify-content-between align-items-center ms-2 mt-1">
                        {/* Left: Label */}
                        <label className="fw-bold mb-0">Label</label>

                        {/* Right: OR - Switch - AND */}
                        <div className="d-flex align-items-center gap-1">
                          {/* OR */}
                          <span
                            className={`fw-bold badge ${labelAndOr === 1 ? "bg-danger" : "bg-light text-dark"}`}
                          >
                            OR
                          </span>

                          {/* Switch (SMALL) */}
                          <div className="form-check form-switch m-0">
                            <input
                              type="checkbox"
                              id="label_and_or"
                              className="form-check-input small-switch"
                              checked={labelAndOr === 2}
                              onChange={(e) =>
                                setLabelAndOr(e.target.checked ? 2 : 1)
                              }
                            />
                          </div>

                          {/* AND */}
                          <span
                            className={`fw-bold badge ${labelAndOr === 2 ? "bg-danger" : "bg-light text-dark"}`}
                          >
                            AND
                          </span>
                        </div>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search Team Member..."
                          className="search-input"
                          value={labelSearch}
                          onChange={(e) => setLabelSearch(e.target.value)}
                        />
                        {labelSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setLabelSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {filterList(
                              labelLists,
                              debouncedLabel,
                              "lable_name",
                            ).map((option) => {
                              const checkboxId = `checkbox-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <span
                                        style={{
                                          backgroundColor: option.color
                                            ? option.color
                                            : "#808080",
                                          wordWrap: "break-word",
                                          width: MobileFlag
                                            ? "fit-content"
                                            : "9vw",
                                          maxWidth: MobileFlag
                                            ? "150px"
                                            : "9vw",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          display: "inline-block",
                                          textAlign: "start",
                                        }}
                                        className="badge rounded-pill"
                                      >
                                        {option.lable_name}
                                      </span>
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        id={checkboxId}
                                        checked={checkedOptions?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handleCheckboxChange(option.id)
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Source */}
                {filtersToShow.includes(3) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Source type</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search source type..."
                          className="search-input"
                          value={sourceSearch}
                          onChange={(e) => setSourceSearch(e.target.value)}
                        />
                        {sourceSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setSourceSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{
                          maxHeight: MobileFlag ? "unset" : "300px",
                        }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {filterList(
                              sourceOfTypesLists,
                              debouncedSource,
                              "source_name",
                            ).map((option) => {
                              const checkboxId = `checkbox-source-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <span
                                        style={{
                                          backgroundColor: option.color
                                            ? option.color
                                            : "#808080",
                                          wordWrap: "break-word",
                                          width: MobileFlag
                                            ? "fit-content"
                                            : "9vw",
                                          maxWidth: MobileFlag
                                            ? "150px"
                                            : "9vw",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          display: "inline-block",
                                          textAlign: "start",
                                        }}
                                        className="badge rounded-pill"
                                      >
                                        {option.source_name}
                                      </span>
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        id={checkboxId}
                                        checked={checkedOptionsSourceType?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handleSourceTypeCheckboxChange(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Internal statge and status */}
                {filtersToShow.includes(4) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card ">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Stage and Status</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search statge & status..."
                          className="search-input"
                          value={stageSearch}
                          onChange={(e) => setStageSearch(e.target.value)}
                        />
                        {stageSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setStageSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {filterList(stageStatusList, debouncedStage, "name")
                              .filter(
                                (option) =>
                                  option.visibility === 0 || option.id === 0,
                              )
                              .map((option) => {
                                const checkboxId = `checkbox-stage-${option.id}`;
                                return (
                                  <tr
                                    key={option.id}
                                    className="text-left"
                                    style={{
                                      border: "1px solid white",
                                      borderCollapse: "collapse",
                                      height: "10px",
                                    }}
                                  >
                                    <td
                                      className="text-start"
                                      style={{ padding: 1.5 }}
                                    >
                                      <label
                                        htmlFor={checkboxId}
                                        style={{
                                          cursor: "pointer",
                                          width: "100%",
                                          marginTop: "1px !important",
                                          marginBottom: "1px !important",
                                        }}
                                      >
                                        <span
                                          style={{
                                            backgroundColor: option.color
                                              ? option.color
                                              : "#808080",
                                            wordWrap: "break-word",
                                            width: MobileFlag
                                              ? "fit-content"
                                              : "9vw",
                                            maxWidth: MobileFlag
                                              ? "150px"
                                              : "9vw",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            display: "inline-block",
                                            textAlign: "start",
                                          }}
                                          className="badge rounded-pill"
                                        >
                                          {option.name}
                                        </span>
                                      </label>
                                    </td>
                                    <td
                                      className="text-end"
                                      style={{ padding: 1.5 }}
                                    >
                                      <label
                                        htmlFor={checkboxId}
                                        style={{
                                          cursor: "pointer",
                                          width: "100%",
                                          marginTop: "1px !important",
                                          marginBottom: "1px !important",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          id={checkboxId}
                                          checked={checkedOptionsStageStatus?.includes(
                                            option.id,
                                          )}
                                          onChange={() =>
                                            handleStageStatusTypeCheckboxChange(
                                              option.id,
                                            )
                                          }
                                          className="custom-checkbox"
                                        />
                                      </label>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/*extrnal statge and status*/}
                {filtersToShow.includes(21) &&
                  flags.CUSTOMER_SUPPORT_TICKET_ASSING_ID && (
                    <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card ">
                      <div className="">
                        <div className="ms-2 mt-1">
                          <label className="fw-bold">
                            External Stage and Status
                          </label>
                        </div>
                        <hr />
                        <div className="search-wrapper">
                          <input
                            type="text"
                            placeholder="Search statge & status..."
                            className="search-input"
                            value={stageStatusExtnalSearch}
                            onChange={(e) =>
                              setStageStatusExtnalSearch(e.target.value)
                            }
                          />
                          {stageStatusExtnalSearch && (
                            <span
                              className="clear-icon"
                              onClick={() => setStageStatusExtnalSearch("")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#5f6368"
                              >
                                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div
                          className="overflow-auto"
                          style={{ maxHeight: "300px" }}
                        >
                          <table className="table table-hover" border={0}>
                            <tbody className="text-center">
                              {filterList(
                                stageStatusList,
                                debouncedStageStatusExternal,
                                "name",
                              )
                                .filter(
                                  (option) =>
                                    option.visibility === 1 || option.id === 0,
                                )
                                .map((option) => {
                                  const checkboxId = `checkbox-stage-${option.id}`;
                                  return (
                                    <tr
                                      key={option.id}
                                      className="text-left"
                                      style={{
                                        border: "1px solid white",
                                        borderCollapse: "collapse",
                                        height: "10px",
                                      }}
                                    >
                                      <td
                                        className="text-start"
                                        style={{ padding: 1.5 }}
                                      >
                                        <label
                                          htmlFor={checkboxId}
                                          style={{
                                            cursor: "pointer",
                                            width: "100%",
                                            marginTop: "1px !important",
                                            marginBottom: "1px !important",
                                          }}
                                        >
                                          <span
                                            style={{
                                              backgroundColor: option.color
                                                ? option.color
                                                : "#808080",
                                              wordWrap: "break-word",
                                              width: MobileFlag
                                                ? "fit-content"
                                                : "9vw",
                                              maxWidth: MobileFlag
                                                ? "150px"
                                                : "9vw",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              display: "inline-block",
                                              textAlign: "start",
                                            }}
                                            className="badge rounded-pill"
                                          >
                                            {option.name}
                                          </span>
                                        </label>
                                      </td>
                                      <td
                                        className="text-end"
                                        style={{ padding: 1.5 }}
                                      >
                                        <label
                                          htmlFor={checkboxId}
                                          style={{
                                            cursor: "pointer",
                                            width: "100%",
                                            marginTop: "1px !important",
                                            marginBottom: "1px !important",
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            id={checkboxId}
                                            checked={checkedOptionsStageStatus?.includes(
                                              option.id,
                                            )}
                                            onChange={() =>
                                              handleStageStatusTypeCheckboxChange(
                                                option.id,
                                              )
                                            }
                                            className="custom-checkbox"
                                          />
                                        </label>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                {/*Team Mamber */}
                {filtersToShow.includes(5) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Team Member</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search Team Mamber..."
                          className="search-input"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                        {userSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setUserSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {(
                              filterList(
                                optionJoinCompany,
                                debouncedUser,
                                "username",
                              ) || []
                            ).map((option) => {
                              const checkboxId = `checkbox-team-member-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5, width: "80%" }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: "block",
                                          whiteSpace: "normal",
                                          wordBreak: "break-word",
                                          fontSize: MobileFlag
                                            ? "14px"
                                            : "inherit",
                                        }}
                                      >
                                        {option.username}
                                      </span>
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        id={checkboxId}
                                        checked={checkedOptionsUser?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handleUsersTypeCheckboxChange(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Multi Team Mamber */}
                {filtersToShow.includes(9) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Multi team Member</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search Team Mamber..."
                          className="search-input"
                          value={multiuserSearch}
                          onChange={(e) => setMultiUserSearch(e.target.value)}
                        />
                        {multiuserSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setMultiUserSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <thead className="text-center">
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <th
                                className="text-start"
                                style={{ padding: 1.5 }}
                              ></th>
                              <th
                                className="text-center"
                                style={{ padding: 1.5, fontSize: "10px" }}
                              >
                                Assigned
                                <br />
                                to
                              </th>
                              <th style={{ padding: "0", margin: "0" }}></th>
                              <th
                                className="text-center"
                                style={{ padding: 1.5, fontSize: "10px" }}
                              >
                                Created
                                <br />
                                by
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-center">
                            {(
                              filterList(
                                optionJoinCompany,
                                debouncedMultiUser,
                                "username",
                              ) || []
                            ).map((option) => {
                              const checkboxId = `checkbox-team-member-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      // htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: "block",
                                          whiteSpace: "normal",
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {option.username}
                                      </span>
                                    </label>
                                  </td>

                                  <td
                                    className="text-center"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      // htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        // id={checkboxId}
                                        checked={assignedByMultiTeamMember?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handleMultiTeamMemberCheckboxChangeOne(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                  <td style={{ padding: "0", margin: "0" }}>
                                    OR
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      // htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        // id={checkboxId}
                                        checked={createdByMultiTeamMember?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handleMultiTeamMemberCheckboxChangeTwo(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Demography Section */}
                {filtersToShow.includes(6) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card p-2">
                    <div className="ms-2 mt-1">
                      <label className="fw-bold">Demography</label>
                    </div>
                    <hr className="my-2" />
                    <div
                      className="d-flex flex-column gap-2 p-1"
                      style={{ overflow: "visible" }}
                    >
                      {/* Select Country */}
                      <div>
                        <label className="form-label mb-1 font-size-13">
                          Select Country
                        </label>
                        <CustomSearchDropdown
                          options={countryOptions}
                          value={selectedCountryId}
                          onChange={handleCountryChange}
                          className="w-100"
                          isDisabled={isLoading}
                        />
                      </div>

                      {/* Select State */}
                      <div>
                        <label className="form-label mb-1 font-size-13">
                          Select State
                        </label>
                        <CustomSearchDropdown
                          options={stateOptions}
                          value={selectedStateId}
                          onChange={handleStateChange}
                          className="w-100"
                          isDisabled={isLoading || !selectedCountryId}
                        />
                      </div>

                      {/* Select City */}
                      <div>
                        <label className="form-label mb-1 font-size-13">
                          Select City
                        </label>
                        <CustomSearchDropdown
                          options={cityOptions}
                          value={selectedCityId}
                          onChange={handleCityChange}
                          className="w-100"
                          isDisabled={isLoading || !selectedStateId}
                        />
                      </div>

                      {/* Select Area */}
                      <div>
                        <label className="form-label mb-1 font-size-13">
                          Select Area
                        </label>
                        <CustomSearchDropdown
                          options={areaOptions}
                          value={selectedAreaId}
                          onChange={handleAreaChange}
                          className="w-100"
                          isDisabled={isLoading || !selectedCityId}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(7) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label>Category / Product</label>
                      </div>
                      <hr />
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <td className="text-start">
                                <div className="col-12">
                                  <label
                                    className="form-check-label"
                                    htmlFor="flexCheckDefault"
                                  >
                                    Select Category
                                  </label>
                                  <div className="add-source-of-type-section">
                                    <CustomSearchDropdown
                                      options={categoryOptions}
                                      isAsync={true}
                                      // loadOptions={loadCategoryOptions}
                                      value={selectedCategoryId}
                                      onChange={handleCategoryChange}
                                      className="w-100"
                                      isDisabled={isLoading}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <td className="text-start">
                                <div className="col-12">
                                  <label
                                    className="form-check-label"
                                    htmlFor="flexCheckDefault"
                                  >
                                    Select Product
                                  </label>
                                  <div className="add-source-of-type-section">
                                    <CustomSearchDropdown
                                      options={filteredProductOptions}
                                      value={selectedProductId}
                                      onChange={handleProductChange}
                                      className="w-100"
                                      isDisabled={
                                        isLoading || !selectedCategoryId
                                      }
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(8) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Active / Deactivate</label>
                      </div>
                      <hr />
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px", minHeight: "150px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <td className="text-start">
                                <div className="col-12">
                                  <div className="add-source-of-type-section">
                                    <CustomSearchDropdown
                                      options={activeOptions}
                                      value={selectedActiveId}
                                      onChange={handleActiveChange}
                                      className="w-100"
                                      isDisabled={isLoading}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <td className="text-start">
                                <div className="col-12">
                                  <label
                                    className="form-check-label"
                                    htmlFor="flexCheckDefault"
                                  >
                                    Enter Day(s)
                                  </label>
                                  <div className="add-source-of-type-section">
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={selectedDays || ""}
                                      onChange={(e) =>
                                        handledays(e.target.value)
                                      }
                                      onInput={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                      ) => {
                                        e.target.value = e.target.value.replace(
                                          /[^0-9]/g,
                                          "",
                                        );
                                      }}
                                      disabled={isLoading}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(10) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="p-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="unassignTaskCheck"
                          checked={checkedOptionsTaskassignOrNot.includes(1)} // 1 = Unassign
                          onChange={() => handleUnassignCheckboxChange(1)}
                          disabled={isLoading}
                        />
                        <label
                          className="form-check-label fw_500"
                          htmlFor="unassignTaskCheck"
                        >
                          UnAssign Task
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(11) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card ">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Task type</label>
                      </div>
                      <hr />
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {(Array.isArray(taskTypeList)
                              ? taskTypeList
                              : []
                            ).map((option) => {
                              const checkboxId = `checkbox-task-type-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px!important",
                                        marginBottom: "1px!important",
                                      }}
                                    >
                                      <span>{option.type_name}</span>
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px!important",
                                        marginBottom: "1px!important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        id={checkboxId}
                                        checked={checkedOptionsTaskType?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handleTaskTypeCheckboxChange(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(12) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="p-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="showTemplatTask"
                          checked={checkedOptionsShowTemplateTask.includes(1)}
                          onChange={() =>
                            handleShowTemplateTaskCheckboxChange(1)
                          }
                          disabled={isLoading}
                        />
                        <label
                          className="form-check-label fw_500"
                          htmlFor="showTemplatTask"
                        >
                          Show Only Template Task
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(13) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="p-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="showCredit"
                          checked={checkCreditDataForAccount == 1}
                          onChange={(e) =>
                            setCheckCreditDataForAccount(
                              e.target.checked ? 1 : 0,
                            )
                          }
                          disabled={isLoading}
                        />
                        <label
                          className="form-check-label fw_500"
                          htmlFor="showTemplatTask"
                        >
                          Credit
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(14) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="p-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="showDebit"
                          checked={checkDebitDataForAccount == 2}
                          onChange={(e) =>
                            setCheckDebitDataForAccount(
                              e.target.checked ? 2 : 0,
                            )
                          }
                          disabled={isLoading}
                        />
                        <label
                          className="form-check-label fw_500"
                          htmlFor="showTemplatTask"
                        >
                          Debit
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(15) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card ">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Series</label>
                      </div>
                      <hr />
                      <div
                        className="overflow-auto"
                        style={{
                          maxHeight: MobileFlag ? "fit-content" : "300px",
                        }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {(Array.isArray(seriesList) ? seriesList : []).map(
                              (option) => {
                                const checkboxId = `checkbox-stage-${option.id}`;
                                return (
                                  <tr
                                    key={option.id}
                                    className="text-left"
                                    style={{
                                      border: "1px solid white",
                                      borderCollapse: "collapse",
                                      height: "10px",
                                    }}
                                  >
                                    <td
                                      className="text-start"
                                      style={{ padding: 1.5 }}
                                    >
                                      <label
                                        htmlFor={checkboxId}
                                        style={{
                                          cursor: "pointer",
                                          width: "100%",
                                          marginTop: "1px !important",
                                          marginBottom: "1px !important",
                                        }}
                                      >
                                        <span
                                          style={{
                                            backgroundColor: "#808080",
                                            wordWrap: "break-word",
                                            width: MobileFlag
                                              ? "fit-content"
                                              : "9vw",
                                            maxWidth: MobileFlag
                                              ? "150px"
                                              : "9vw",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            display: "inline-block",
                                            textAlign: "start",
                                          }}
                                          className="badge rounded-pill"
                                        >
                                          {option.name}
                                        </span>
                                      </label>
                                    </td>
                                    <td
                                      className="text-end"
                                      style={{ padding: 1.5 }}
                                    >
                                      <label
                                        htmlFor={checkboxId}
                                        style={{
                                          cursor: "pointer",
                                          width: "100%",
                                          marginTop: "1px !important",
                                          marginBottom: "1px !important",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          id={checkboxId}
                                          checked={checkedOptionsSeries?.includes(
                                            option.id,
                                          )}
                                          onChange={() =>
                                            handleSeriesCheckboxChange(
                                              option.id,
                                            )
                                          }
                                          className="custom-checkbox"
                                        />
                                      </label>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(16) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="p-3">
                      <div className="w-100">
                        {warehouseLoading ? (
                          <Skeleton width="100%" height={42} />
                        ) : (
                          <MultiSelect
                            options={warehouseOptions}
                            value={selectedWarehouses}
                            onChange={handleChangeWarehouse}
                            isSelectAll={true}
                            menuPlacement="bottom"
                            isMulti
                            isClearable={selectedWarehouses.length > 0}
                            placeholder="Select warehouses..."
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(17) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        {/* <label>Stock Type</label> */}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{ height: "215px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <td className="text-start">
                                <div className="col-12">
                                  <label
                                    className="form-check-label"
                                    htmlFor="flexCheckDefault"
                                  >
                                    Stock Type
                                  </label>
                                  <div className="add-source-of-type-section">
                                    <CustomSearchDropdown
                                      options={stockTypeOptions}
                                      value={selectedStockTypeId}
                                      onChange={handleStockTypeChange}
                                      className="w-100"
                                      isDisabled={isLoading}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {filtersToShow.includes(18) && (
                  <div
                    className={`${
                      MobileFlag
                        ? "col-12"
                        : "col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6"
                    } card`}
                  >
                    <div className="form-group autosuggest-container">
                      <label
                        className="pb-2 form_label"
                        style={{ fontSize: "14px", fontWeight: "500" }}
                      >
                        Search Contact (Mobile no., Contact name, Company name){" "}
                        <span className="text-danger">*</span>
                      </label>

                      <CustomSearchDropdown
                        isAsync={true}
                        loadOptions={loadContactOptions}
                        value={selectedReqList}
                        onChange={(selected: any) => {
                          handleReqDisplayChange(selected);
                          const id = selected ? selected.value : "";
                          setSelectedContactId(id);
                        }}
                        className="w-100"
                        placeholder="search place..."
                      />

                      {/* New Switch - Reference wise Contact Search */}
                      <div className="d-flex align-items-center gap-2 mt-3">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`fw-bold badge ${referenceWiseContact === 1 ? "bg-danger" : "bg-light text-dark"}`}
                          >
                            Normal
                          </span>

                          <div className="form-check form-switch m-0">
                            <input
                              type="checkbox"
                              id="reference_wise_contact"
                              className="form-check-input small-switch"
                              checked={referenceWiseContact === 2}
                              onChange={(e) =>
                                setReferenceWiseContact(
                                  e.target.checked ? 2 : 1,
                                )
                              }
                            />
                          </div>

                          <span
                            className={`fw-bold badge ${referenceWiseContact === 2 ? "bg-danger" : "bg-light text-dark"}`}
                          >
                            Reference Wise
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {filtersToShow.includes(19) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <tr>
                      <td className="text-start">
                        <div className="d-flex flex-column gap-2">
                          {/* Product Search */}
                          <div className="form-group autosuggest-container">
                            <label
                              className="pb-2 form_label"
                              style={{ fontSize: "14px", fontWeight: "500" }}
                            >
                              Search Product (Name / Code)
                              <span className="text-danger">*</span>
                            </label>

                            <CustomSearchDropdown
                              isAsync={true}
                              loadOptions={loadProductOptions}
                              value={selectedProductSearchOption} // ✅ FIXED
                              onChange={(selected: any) => {
                                handleReqDisplayChangeProduct(selected);
                              }}
                              className="w-100"
                              placeholder="Search product..."
                            />
                          </div>

                          {/* Order List Dropdown */}
                          <div className="add-source-of-type-section">
                            <CustomSearchDropdown
                              options={orderListOptions}
                              value={selectedOrderListId}
                              onChange={handleOrderListChange}
                              className="w-100"
                              isDisabled={isLoading}
                              // filterOption={orderListOptions}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </div>
                )}
                {filtersToShow.includes(20) && (
                  <div className="col-6 col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-6 card">
                    <div className="p-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="unassignContactCheck"
                          checked={checkedOptionsContactassignOrNot.includes(1)} // 1 = Unassign
                          onChange={() =>
                            handleUnassignCheckboxChangeForContact(1)
                          }
                          disabled={isLoading}
                        />
                        <label
                          className="form-check-label fw_500"
                          htmlFor="unassignContactCheck"
                        >
                          UnAssign Contacts
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {/* GST */}
                {filtersToShow.includes(22) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">GST</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search GST type..."
                          className="search-input"
                          value={gstSearch}
                          onChange={(e) => setGstSearch(e.target.value)}
                        />
                        {gstSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setGstSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {(Array.isArray(gstOptions) ? gstOptions : []).map(
                              (option) => {
                                const checkboxId = `checkbox-gst-${option.id}`;
                                return (
                                  <tr
                                    key={option.id}
                                    className="text-left"
                                    style={{
                                      border: "1px solid white",
                                      borderCollapse: "collapse",
                                      height: "10px",
                                    }}
                                  >
                                    <td
                                      className="text-start"
                                      style={{ padding: 1.5 }}
                                    >
                                      <label
                                        htmlFor={checkboxId}
                                        style={{
                                          cursor: "pointer",
                                          width: "100%",
                                          marginTop: "1px !important",
                                          marginBottom: "1px !important",
                                        }}
                                      >
                                        {option.name}
                                      </label>
                                    </td>
                                    <td
                                      className="text-end"
                                      style={{ padding: 1.5 }}
                                    >
                                      <label
                                        htmlFor={checkboxId}
                                        style={{
                                          cursor: "pointer",
                                          width: "100%",
                                          marginTop: "1px !important",
                                          marginBottom: "1px !important",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          id={checkboxId}
                                          checked={checkedGstOptions?.includes(
                                            option.id,
                                          )}
                                          onChange={() =>
                                            handleGstCheckboxChange(option.id)
                                          }
                                          className="custom-checkbox"
                                        />
                                      </label>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Day, Month & Year */}
                {filtersToShow.includes(23) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card ">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Date Selection</label>
                      </div>
                      <hr />
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {/* Month Row */}
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <td
                                className="text-start"
                                style={{ padding: 1.5 }}
                              >
                                <div
                                  className="col-12"
                                  style={{
                                    cursor: "pointer",
                                    width: "100%",
                                    marginTop: "0px !important",
                                    marginBottom: "0px !important",
                                  }}
                                >
                                  <label className="form-check-label">
                                    Month
                                  </label>
                                  <div className="add-source-of-type-section">
                                    <CustomSearchDropdown
                                      options={monthOptions}
                                      value={selectedMonth}
                                      onChange={handleMonthChange}
                                      className="w-100"
                                      maxMenuHeight={160} // Automatically adds a scrollbar inside the dropdown after 160px
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* Year Row */}
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <td
                                className="text-start"
                                style={{ padding: 1.5 }}
                              >
                                <div
                                  className="col-12"
                                  style={{
                                    cursor: "pointer",
                                    width: "100%",
                                    marginTop: "0px !important",
                                    marginBottom: "0px !important",
                                  }}
                                >
                                  <label className="form-check-label">
                                    Year
                                  </label>
                                  <div className="add-source-of-type-section">
                                    <CustomSearchDropdown
                                      options={yearOptions}
                                      value={selectedYear}
                                      onChange={handleYearChange}
                                      className="w-100"
                                      maxMenuHeight={160} // Automatically adds a scrollbar inside the dropdown after 160px
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* Days Row */}
                            <tr
                              className="text-left"
                              style={{
                                border: "1px solid white",
                                borderCollapse: "collapse",
                                height: "10px",
                              }}
                            >
                              <td
                                className="text-start"
                                style={{ padding: 1.5 }}
                              >
                                <div
                                  className="col-12"
                                  style={{
                                    cursor: "pointer",
                                    width: "100%",
                                    marginTop: "0px !important",
                                    marginBottom: "0px !important",
                                  }}
                                >
                                  <label className="form-check-label">
                                    Days
                                  </label>
                                  <div className="add-source-of-type-section">
                                    <CustomSearchDropdown
                                      options={dayOptions}
                                      value={selectedDay}
                                      onChange={handleDayChange}
                                      className="w-100"
                                      // Keep the dropdown disabled until both Month and Year are chosen
                                      isDisabled={
                                        !selectedMonth || !selectedYear
                                      }
                                      maxMenuHeight={160} // Automatically adds a scrollbar inside the dropdown after 160px
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Cash Memo , Debit Memo */}
                {filtersToShow.includes(24) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Trasaction Mode</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search Trasaction Mode..."
                          className="search-input"
                          value={trasactionModeSearch}
                          onChange={(e) =>
                            setTrasactionModeSearch(e.target.value)
                          }
                        />
                        {trasactionModeSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setTrasactionModeSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {(Array.isArray(trasactionModeOptions)
                              ? trasactionModeOptions
                              : []
                            ).map((option) => {
                              const checkboxId = `checkbox-transaction-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      {option.name}
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="radio"
                                        id={checkboxId}
                                        name="trasaction_mode_group"
                                        checked={
                                          checkedTrasactionMode === option.id
                                        }
                                        onChange={() =>
                                          handleTrasactionModeCheckboxChange(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Credit , Debit */}
                {filtersToShow.includes(25) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Payment Type</label>
                      </div>
                      <hr />
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {(Array.isArray(paymentTypaOptions)
                              ? paymentTypaOptions
                              : []
                            ).map((option) => {
                              const checkboxId = `checkbox-payment-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      {option.name}
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="radio"
                                        id={checkboxId}
                                        name="trasaction_mode_group"
                                        checked={
                                          checkedPaymentType === option.id
                                        }
                                        onChange={() =>
                                          handlePaymentTypeCheckboxChange(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Payment By */}
                {filtersToShow.includes(26) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Payment By</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search Payment type..."
                          className="search-input"
                          value={paymentBySearch}
                          onChange={(e) => setPaymentBySearch(e.target.value)}
                        />
                        {paymentBySearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setPaymentBySearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{
                          maxHeight: MobileFlag ? "unset" : "300px",
                        }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {filterList(
                              paymentByList,
                              debouncedPaymentBy,
                              "payment_type_name",
                            ).map((option) => {
                              const checkboxId = `checkbox-payment-by-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <span
                                        style={{
                                          backgroundColor: option.payment_color
                                            ? option.payment_color
                                            : "#808080",
                                          wordWrap: "break-word",
                                          width: MobileFlag
                                            ? "fit-content"
                                            : "9vw",
                                          maxWidth: MobileFlag
                                            ? "150px"
                                            : "9vw",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          display: "inline-block",
                                          textAlign: "start",
                                        }}
                                        className="badge rounded-pill"
                                      >
                                        {option.payment_type_name}
                                      </span>
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        id={checkboxId}
                                        checked={checkedOptionsPaymentBy?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handlePaymentByCheckboxChange(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Expense */}
                {filtersToShow.includes(27) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Expense type</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search expense type..."
                          className="search-input"
                          value={expenseSearch}
                          onChange={(e) => setExpenseSearch(e.target.value)}
                        />
                        {expenseSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setExpenseSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{
                          maxHeight: MobileFlag ? "unset" : "300px",
                        }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {filterList(
                              expenseOfTypesLists,
                              debouncedExpense,
                              "expense_name",
                            ).map((option) => {
                              const checkboxId = `checkbox-expense-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <span
                                        style={{
                                          backgroundColor: option.color
                                            ? option.color
                                            : "#808080",
                                          wordWrap: "break-word",
                                          width: MobileFlag
                                            ? "fit-content"
                                            : "9vw",
                                          maxWidth: MobileFlag
                                            ? "150px"
                                            : "9vw",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          display: "inline-block",
                                          textAlign: "start",
                                        }}
                                        className="badge rounded-pill"
                                      >
                                        {option.expense_name}
                                      </span>
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        id={checkboxId}
                                        checked={checkedOptionsExpenseType?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handleExpenseTypeCheckboxChange(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
                {/* Expense status */}
                {filtersToShow.includes(28) && (
                  <div className="col-xxl-2 col-xl-2 col-lg-6 col-md-6 col-sm-12 col-xs-12 card ">
                    <div className="">
                      <div className="ms-2 mt-1">
                        <label className="fw-bold">Expense Status</label>
                      </div>
                      <hr />
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="Search statge & status..."
                          className="search-input"
                          value={expenseStatusSearch}
                          onChange={(e) =>
                            setExpenseStatusSearch(e.target.value)
                          }
                        />
                        {expenseStatusSearch && (
                          <span
                            className="clear-icon"
                            onClick={() => setExpenseStatusSearch("")}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              height="24px"
                              viewBox="0 -960 960 960"
                              width="24px"
                              fill="#5f6368"
                            >
                              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "300px" }}
                      >
                        <table className="table table-hover" border={0}>
                          <tbody className="text-center">
                            {filterList(
                              expenseStatusOptions,
                              debouncedExpenseStatus,
                              "name",
                            ).map((option) => {
                              const checkboxId = `checkbox-expense-${option.id}`;
                              return (
                                <tr
                                  key={option.id}
                                  className="text-left"
                                  style={{
                                    border: "1px solid white",
                                    borderCollapse: "collapse",
                                    height: "10px",
                                  }}
                                >
                                  <td
                                    className="text-start"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <span
                                        style={{
                                          backgroundColor: option.color
                                            ? option.color
                                            : "#808080",
                                          wordWrap: "break-word",
                                          width: MobileFlag
                                            ? "fit-content"
                                            : "9vw",
                                          maxWidth: MobileFlag
                                            ? "150px"
                                            : "9vw",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                          display: "inline-block",
                                          textAlign: "start",
                                        }}
                                        className="badge rounded-pill"
                                      >
                                        {option.name}
                                      </span>
                                    </label>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: 1.5 }}
                                  >
                                    <label
                                      htmlFor={checkboxId}
                                      style={{
                                        cursor: "pointer",
                                        width: "100%",
                                        marginTop: "1px !important",
                                        marginBottom: "1px !important",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        id={checkboxId}
                                        checked={checkedOptionsExpenseStatus?.includes(
                                          option.id,
                                        )}
                                        onChange={() =>
                                          handleExpenseStatusTypeCheckboxChange(
                                            option.id,
                                          )
                                        }
                                        className="custom-checkbox"
                                      />
                                    </label>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-buttons">
              <button
                className="modal-button1"
                onClick={() => {
                  if (isFilterModified) {
                    handleHide(); // reset + submit empty
                  } else {
                    onHide(); // just close
                  }
                }}
              >
                {btn1}
              </button>
              <button
                className="modal-button2"
                onClick={onSubmit}
                style={{ color: "white" }}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : btn2}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckBoxFilterModal;
