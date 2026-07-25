import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  DataTableFilterMetaData,
  DataTableOperatorFilterMetaData,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
  type DataTableSortEvent,
  type SortOrder,
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import { useEscapeKey } from "../../../../common/SharedFunction";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  exportInquiryAllData,
  fetchInquiry,
  IInquiryReport,
} from "./inquiryController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IPropinquiryReportReports {
  selectedDates?: Date[];
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  selectedLabels?: string[] | null;
  selectedSourceTypes?: string[] | null;
  selectedStageStatus?: string[] | null;
  selectedTeamMembers?: string[] | null;
  selectedDemography?: string[] | null;
  selectedProduct?: string | null;
  selectedCategory?: string | null;
  selectedContactId?: string | null;
  globalSearch?: string;
  referenceWiseContact?: number;
  onHide?: () => void;
}

const getNestedValue = (obj: any, path: string): any => {
  try {
    return (
      path.split(".").reduce((acc, part) => {
        if (acc == null) return undefined;
        return acc[part];
      }, obj) ?? ""
    );
  } catch {
    return "";
  }
};

const getMatchedCustomFields = (cartItem: any, customForm: any[]) => {
  return customForm
    .filter(
      (formField) =>
        formField.report_print_or_not === 1 &&
        formField.reference_column_name in cartItem,
    )
    .map((formField) => ({
      fieldName: formField.reference_column_name,
      fieldLabel: formField.title || formField.reference_column_name,
      dataType: formField.data_type,
    }));
};

const AllInqueryReport = ({
  selectedDates,
  MobileToken,
  getID,
  MobileFlag,
  selectedLabels,
  selectedSourceTypes,
  selectedStageStatus,
  selectedTeamMembers,
  selectedDemography,
  selectedProduct,
  selectedCategory,
  globalSearch,
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: IPropinquiryReportReports) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<IInquiryReport[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<IInquiryReport[]>(
    [],
  );
  const isPaginationCall = useRef(false);
  const [apiParams, setApiParams] = useState({ ul: 0, ll: 50 });
  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);
  const [hasMore, setHasMore] = useState(true);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("all_inquiry_report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // const handleClickOutside = (event: MouseEvent) => {
  //   const target = event.target as HTMLElement;

  //   const clickedOnButton = target.closest('.source-of-type-list-grid-options');
  //   if (clickedOnButton) return;

  //   setIsExportDropdownOpen(false);
  // };

  // useEffect(() => {
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  useEscapeKey(() => {
    if (!isModalFilterVisible && !isExportDropdownOpen) {
      onHide?.();
    } else {
      setIsModalFilterVisible(false);
      setIsExportDropdownOpen(false);
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(globalSearchText?.trim() ?? "");
    }, 400);

    return () => clearTimeout(timer);
  }, [globalSearchText]);

  const handleApplyFilters = (data: any) => {
    const [startDate, endDate] = getCurrentMonthDateRange();

    const updatedFilters = {
      ...data,
      checkedOptions: data.checkedOptionsLabel || [],
      checkedSourceTypes: data.checkedOptionsSourceType || [],
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };

    setFilters("all_inquiry_report", updatedFilters);

    setHasData(Object.keys(updatedFilters || {}).length > 0);

    setIsModalFilterVisible(false);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleGlobalSearch = () => {
    const value = searchInputRef.current?.value || "";

    setGlobalSearchText(value);
  };

  const getCurrentMonthDateRange = () => {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return [startOfMonth, endOfMonth];
  };

  useEffect(() => {
    if (!filters.startSearchDate || !filters.endSearchDate) {
      const [startDate, endDate] = getCurrentMonthDateRange();

      setFilters("all_inquiry_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.ALLINQUIRY_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLINQUIRY_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 50,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      inquiryId: { value: null, matchMode: "custom" },
      customerName: { value: null, matchMode: "custom" },
      customerNumber: { value: null, matchMode: "custom" },
      categoryName: { value: null, matchMode: "contains" },
      productName: { value: null, matchMode: "contains" },
      sourceType: { value: null, matchMode: "contains" },
      qty: { value: null, matchMode: "contains" },
      description: { value: null, matchMode: "contains" },
      created_by_name: { value: null, matchMode: "contains" },
      assined_team_person: { value: null, matchMode: "contains" },
    },
  });
  const [inquiryReport, setInquiryReport] = useState<IInquiryReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dt = useRef<DataTable<IInquiryReport[]>>(null);

  const searchDependencies = JSON.stringify({
    selectedDates: filters.selectedDateArray,
    selectedLabels: filters.checkedOptions,
    selectedSourceTypes: filters.checkedSourceTypes,
    selectedStageStatus: filters.checkedOptionsStageStatus,
    selectedTeamMembers: filters.checkedOptionsUser,
    selectedDemography: selectedDemography
      ? Object.values(selectedDemography).filter(Boolean)
      : null,
    debouncedSearchText,
    selectedContactId: filters.selectedContactId,
  });

  useEffect(() => {
    setCustomers([]);
    setSelectedCustomers([]);
    currentOffset.current = 0;
    setHasMore(true);
    loadTasks(0, 50, true);
  }, [searchDependencies, filters.referenceWiseContact]);

  const loadTasks = async (
    offset: number,
    limit: number,
    reset: boolean = false,
  ) => {
    if (isLoadingMore.current && !reset) return;
    if (!hasMore && !reset) return;

    setLoading(true);
    isLoadingMore.current = true;

    try {
      const newData = await fetchInquiry(
        filters.selectedDateArray,
        MobileToken,
        getID,
        MobileFlag,
        filters.checkedOptions,
        filters.checkedSourceTypes,
        filters.checkedOptionsStageStatus,
        filters.checkedOptionsUser,
        selectedDemography
          ? Object.values(selectedDemography).filter(Boolean)
          : null,
        filters.selectedProductId,
        filters.selectedCategoryId,
        filters.selectedContactId,
        offset,
        limit,
        debouncedSearchText,
        filters.referenceWiseContact,
      );

      if (newData.length < limit) {
        setHasMore(false);
      }

      if (reset) {
        setCustomers(newData);
      } else {
        setCustomers((prev) => {
          const updated = [...prev];
          updated.splice(prev.length, 0, ...newData); // Append via splice on copy
          return updated;
        });
      }

      currentOffset.current = offset + newData.length;
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  };

  const dataArray: IInquiryReport[] = useMemo(() => {
    return customers.map((item) => ({
      inquiry_id: item.inquiry_id || "-",
      category_name: item.category_name || "-",
      product_id: item.product_id || "-",
      source_type_id: item.source_type_id || "-",
      qty: item.qty || "-",
      description: item.description || "-",
      created_by_name: item.created_by_name || "-",
      assined_team_person: item.assined_team_person || "-",
      source_colour: item.source_colour || "",
      status_name: item.status_name || "",
      status_colour: item.status_colour || "",
      label_name: item.label_name,
      person_name: item.person_name || "-",
      mobile_number: item.mobile_number || "-",
      column_number_1: item.column_number_1,
      column_number_2: item.column_number_2,
      column_number_3: item.column_number_3,
      column_number_4: item.column_number_4,
      column_number_5: item.column_number_5,
      column_text_1: item.column_text_1,
      column_text_2: item.column_text_2,
      column_text_3: item.column_text_3,
      column_text_4: item.column_text_4,
      column_text_5: item.column_text_5,
      column_text_area_1: item.column_text_area_1,
      column_text_area_2: item.column_text_area_2,
      column_text_area_3: item.column_text_area_3,
      column_text_area_4: item.column_text_area_4,
      column_text_area_5: item.column_text_area_5,
      column_date_1: item.column_date_1,
      column_date_2: item.column_date_2,
      column_date_3: item.column_date_3,
      column_date_4: item.column_date_4,
      column_date_5: item.column_date_5,
      column_date_and_time_1: item.column_date_and_time_1,
      column_date_and_time_2: item.column_date_and_time_2,
      column_date_and_time_3: item.column_date_and_time_3,
      column_date_and_time_4: item.column_date_and_time_4,
      column_date_and_time_5: item.column_date_and_time_5,
      column_time_1: item.column_time_1,
      column_time_2: item.column_time_2,
      column_time_3: item.column_time_3,
      column_time_4: item.column_time_4,
      column_time_5: item.column_time_5,
      column_switch_1: item.column_switch_1,
      column_switch_2: item.column_switch_2,
      column_switch_3: item.column_switch_3,
      column_switch_4: item.column_switch_4,
      column_switch_5: item.column_switch_5,
      column_decimal_1: item.column_decimal_1,
      column_decimal_2: item.column_decimal_2,
      column_decimal_3: item.column_decimal_3,
      column_decimal_4: item.column_decimal_4,
      column_decimal_5: item.column_decimal_5,
      column_dropdown_1: item.column_dropdown_1,
      column_dropdown_2: item.column_dropdown_2,
      column_dropdown_3: item.column_dropdown_3,
      column_dropdown_4: item.column_dropdown_4,
      column_dropdown_5: item.column_dropdown_5,
      column_radio_1: item.column_radio_1,
      column_radio_2: item.column_radio_2,
      column_radio_3: item.column_radio_3,
      column_radio_4: item.column_radio_4,
      column_radio_5: item.column_radio_5,
      customForm: item.customForm,
    }));
  }, [customers]);

  // const dataArray: IInquiryReport[] = useMemo(() => {
  //   return inquiryReport.map((item) => {
  //     // Safe label_name handling with type assertion
  //     const labelNameArray: Array<{ name: string; color: string }> = (() => {
  //       if (!item.label_name) return [];

  //       const labelData = item.label_name as any;

  //       if (Array.isArray(labelData)) {
  //         // Filter and map the array
  //         return labelData
  //           .filter((label: any) => label && typeof label === 'object')
  //           .map((label: any) => ({
  //             name: typeof label.name === 'string' ? label.name : '',
  //             color: typeof label.color === 'string' ? label.color : '#eeeeee'
  //           }));
  //       } else if (typeof labelData === 'object' && labelData !== null) {
  //         // Single label object
  //         return [{
  //           name: typeof labelData.name === 'string' ? labelData.name : '',
  //           color: typeof labelData.color === 'string' ? labelData.color : '#eeeeee'
  //         }];
  //       }

  //       return [];
  //     })();

  //     return {
  //       inquiry_id: item.inquiry_id || "-",
  //       category_name: item.category_name || "-",
  //       product_id: item.product_id || "-",
  //       source_type_id: item.source_type_id || "-",
  //       qty: item.qty || "-",
  //       description: item.description || "-",
  //       source_colour: item.source_colour || "",
  //       status_name: item.status_name || "",
  //       status_colour: item.status_colour || "",
  //       label_name: labelNameArray,
  //       person_name: item.person_name || "-",
  //       mobile_number: item.mobile_number || "-",
  //       column_number_1: item.column_number_1,
  //       column_number_2: item.column_number_2,
  //       column_number_3: item.column_number_3,
  //       column_number_4: item.column_number_4,
  //       column_number_5: item.column_number_5,
  //       column_text_1: item.column_text_1,
  //       column_text_2: item.column_text_2,
  //       column_text_3: item.column_text_3,
  //       column_text_4: item.column_text_4,
  //       column_text_5: item.column_text_5,
  //       column_text_area_1: item.column_text_area_1,
  //       column_text_area_2: item.column_text_area_2,
  //       column_text_area_3: item.column_text_area_3,
  //       column_text_area_4: item.column_text_area_4,
  //       column_text_area_5: item.column_text_area_5,
  //       column_date_1: item.column_date_1,
  //       column_date_2: item.column_date_2,
  //       column_date_3: item.column_date_3,
  //       column_date_4: item.column_date_4,
  //       column_date_5: item.column_date_5,
  //       column_date_and_time_1: item.column_date_and_time_1,
  //       column_date_and_time_2: item.column_date_and_time_2,
  //       column_date_and_time_3: item.column_date_and_time_3,
  //       column_date_and_time_4: item.column_date_and_time_4,
  //       column_date_and_time_5: item.column_date_and_time_5,
  //       column_time_1: item.column_time_1,
  //       column_time_2: item.column_time_2,
  //       column_time_3: item.column_time_3,
  //       column_time_4: item.column_time_4,
  //       column_time_5: item.column_time_5,
  //       column_switch_1: item.column_switch_1,
  //       column_switch_2: item.column_switch_2,
  //       column_switch_3: item.column_switch_3,
  //       column_switch_4: item.column_switch_4,
  //       column_switch_5: item.column_switch_5,
  //       column_decimal_1: item.column_decimal_1,
  //       column_decimal_2: item.column_decimal_2,
  //       column_decimal_3: item.column_decimal_3,
  //       column_decimal_4: item.column_decimal_4,
  //       column_decimal_5: item.column_decimal_5,
  //       column_dropdown_1: item.column_dropdown_1,
  //       column_dropdown_2: item.column_dropdown_2,
  //       column_dropdown_3: item.column_dropdown_3,
  //       column_dropdown_4: item.column_dropdown_4,
  //       column_dropdown_5: item.column_dropdown_5,
  //       column_radio_1: item.column_radio_1,
  //       column_radio_2: item.column_radio_2,
  //       column_radio_3: item.column_radio_3,
  //       column_radio_4: item.column_radio_4,
  //       column_radio_5: item.column_radio_5,
  //       customForm: item.customForm,
  //     };
  //   });
  // }, [inquiryReport]);
  const uniqueCustomFields = useMemo(() => {
    const allFields = dataArray.flatMap((item) =>
      getMatchedCustomFields(item, item.customForm || []),
    );
    return Array.from(
      new Set(allFields.map((field) => JSON.stringify(field))),
      (str) => JSON.parse(str),
    );
  }, [dataArray]);

  // Dynamically update filters to include custom fields
  useEffect(() => {
    setLazyState((prev) => {
      const newFilters = { ...prev.filters };
      uniqueCustomFields.forEach((field) => {
        if (!(field.fieldName in newFilters)) {
          newFilters[field.fieldName] = {
            value: null,
            matchMode:
              field.dataType === 1 || field.dataType === 7
                ? "equals"
                : "contains",
          };
        }
      });
      return { ...prev, filters: newFilters };
    });
  }, [uniqueCustomFields]);

  const getFilteredData = () => {
    let filteredData = [...customers];

    Object.entries(lazyState.filters).forEach(([field, meta]) => {
      if ("value" in meta && meta.value !== null && meta.value !== "") {
        const filterValue = meta.value.toString().toLowerCase();
        const matchMode = meta.matchMode;

        filteredData = filteredData.filter((item) => {
          const fieldValue = getNestedValue(item, field);
          if (fieldValue === undefined || fieldValue === null) return false;
          if (field === "lable_name" && typeof fieldValue === "string") {
            const labels = fieldValue
              .split(",")
              .map((l) => l.trim().toLowerCase());
            return labels.some((label) =>
              matchMode === "contains"
                ? label.includes(filterValue)
                : matchMode === "equals"
                  ? label === filterValue
                  : true,
            );
          }

          const fieldStr = fieldValue.toString().toLowerCase();

          switch (matchMode) {
            case "equals":
              return fieldValue.toString() === meta.value.toString();
            case "contains":
              return fieldStr.includes(filterValue);
            case "notContains":
              return !fieldStr.includes(filterValue);
            case "startsWith":
              return fieldStr.startsWith(filterValue);
            case "endsWith":
              return fieldStr.endsWith(filterValue);
            case "notEquals":
              return fieldStr !== filterValue;
            default:
              return true;
          }
        });
      }
    });

    if (lazyState.sortField) {
      filteredData.sort((a, b) => {
        const aValue = getNestedValue(a, lazyState.sortField!);
        const bValue = getNestedValue(b, lazyState.sortField!);
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
      if (lazyState.sortOrder === -1) filteredData.reverse();
    }

    return filteredData;
  };

  const onSort = (event: DataTableSortEvent) => {
    setLazyState((prev) => ({
      ...prev,
      sortField: event.sortField,
      sortOrder: event.sortOrder as SortOrder,
    }));
  };

  function isSimpleFilter(
    filter: DataTableFilterMetaData | DataTableOperatorFilterMetaData,
  ): filter is DataTableFilterMetaData {
    return (filter as DataTableFilterMetaData).value !== undefined;
  }

  function isOperatorFilter(
    filter: DataTableFilterMetaData | DataTableOperatorFilterMetaData,
  ): filter is DataTableOperatorFilterMetaData {
    return (
      (filter as DataTableOperatorFilterMetaData).constraints !== undefined
    );
  }

  const onFilter = (event: DataTableFilterEvent) => {
    const activeField = Object.keys(event.filters).find((key) => {
      const filter = event.filters[key];

      if (isSimpleFilter(filter)) {
        return filter.value !== null && filter.value !== "";
      }

      if (isOperatorFilter(filter)) {
        return (
          filter.constraints?.some((c) => c.value !== null && c.value !== "") ??
          false
        );
      }

      return false;
    });

    const newFilters: DataTableFilterMeta = { ...event.filters };
    Object.keys(newFilters).forEach((key) => {
      const filter = newFilters[key];

      if (key !== activeField) {
        if (isSimpleFilter(filter)) {
          filter.value = null;
        }

        if (isOperatorFilter(filter)) {
          filter.constraints.forEach((c) => (c.value = null));
        }
      }
    });

    setLazyState((prev) => ({
      ...prev,
      first: 0,
      filters: newFilters,
    }));
  };

  const onSelectionChange = (event: { value: IInquiryReport[] }) => {
    setSelectedCustomers(event.value);
    setSelectAll(event.value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      const filteredData = getFilteredData();
      setSelectAll(true);
      setSelectedCustomers([...filteredData]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  const exportColumns = [
    { title: "Inquiry Id", dataKey: "inquiry_id" },
    { title: "Customer Name", dataKey: "customerName" },
    { title: "Customer Mobile Number", dataKey: "customerNumber" },
    { title: "Category Name", dataKey: "category_name" },
    { title: "Product Name", dataKey: "product_id" },
    { title: "Source Type", dataKey: "source_type_id" },
    { title: "Stages And Status", dataKey: "status_name" },
    { title: "Labels", dataKey: "label_names_text" },
    { title: "Qty.", dataKey: "qty" },
    { title: "Description", dataKey: "description" },
    { title: "Created By", dataKey: "created_by_name" },
    { title: "Assign To", dataKey: "assined_team_person" },
    ...uniqueCustomFields.map((field: any) => ({
      title: field.fieldLabel,
      dataKey: field.fieldName,
    })),
  ];
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a3" });
    const filteredData = getFilteredData();
    const tableData = (
      selectedCustomers.length > 0 ? selectedCustomers : filteredData
    ).map((customer) => {
      // Helper function to get labels as comma-separated text
      const getLabelsText = (
        labels: Array<{ name: string; color: string }>,
      ) => {
        return labels && labels.length > 0
          ? labels.map((label) => label.name).join(", ")
          : "-";
      };

      const rowData: any = {
        inquiry_id: customer.inquiry_id || "-",
        customerName: `${customer.person_name || "-"}`,
        customerNumber: `${customer.mobile_number || "-"}`,
        category_name: customer.category_name || "-",
        product_id: customer.product_id || "-",
        source_type_id: customer.source_type_id || "-",
        status_name: customer.status_name || "-", // Just the text
        label_names_text: getLabelsText(customer.label_name), // Comma-separated labels
        qty: customer.qty || "-",
        description: customer.description || "-",
        created_by_name: customer.created_by_name || "-",
        assined_team_person: customer.assined_team_person || "-",
      };
      uniqueCustomFields.forEach((field: any) => {
        rowData[field.fieldName] = customer[field.fieldName] || "-";
      });
      return rowData;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`all_inquiry_report_${new Date().getTime()}.pdf`);
      return;
    }

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      margin: { top: 20, left: 10, right: 10, bottom: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(14);
        doc.text("All Inquiry Report", data.settings.margin.left, 10);
      },
    });

    doc.save(`all_inquiry_report_${new Date().getTime()}.pdf`);
  };
  // const exportExcel = () => {
  //   const filteredData = getFilteredData();
  //   const exportData = (selectedCustomers.length > 0 ? selectedCustomers : filteredData).map((customer) => {
  //     // Helper function to get labels as comma-separated text
  //     const getLabelsText = (labels: Array<{ name: string; color: string }>) => {
  //       return labels && labels.length > 0
  //         ? labels.map(label => label.name).join(', ')
  //         : '-';
  //     };

  //     const rowData: any = {
  //       Inquiry_Id: customer.inquiry_id || "-",
  //       Customer_Details: `${customer.person_name || "-"} (${customer.mobile_number || "-"})`,
  //       Category_Name: customer.category_name || "-",
  //       Product_Name: customer.product_id || "-",
  //       Source_Type: customer.source_type_id || "-",
  //       "Stages_And_Status": customer.status_name || "-", // Just the text
  //       Labels: getLabelsText(customer.label_name), // Comma-separated labels
  //       Qty: customer.qty || "-",
  //       Description: customer.description || "-",
  //     };
  //     uniqueCustomFields.forEach((field: any) => {
  //       rowData[field.fieldLabel] = customer[field.fieldName] || "-";
  //     });
  //     return rowData;
  //   });
  //   const worksheet = xlsx.utils.json_to_sheet(exportData);
  //   worksheet["!cols"] = [
  //     { wch: 20 },
  //     { wch: 30 },
  //     { wch: 20 },
  //     { wch: 20 },
  //     { wch: 20 },
  //     { wch: 20 }, // Status
  //     { wch: 25 }, // Labels
  //     { wch: 15 },
  //     { wch: 30 },
  //     ...uniqueCustomFields.map(() => ({ wch: 20 })),
  //   ];

  //   const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
  //   const excelBuffer = xlsx.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //   });
  //   saveAsExcelFile(excelBuffer, "inquiries");
  // };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allInquiries = await exportInquiryAllData<IInquiryReport>(
        (offset, limit) =>
          fetchInquiry(
            filters.selectedDateArray,
            MobileToken,
            getID,
            MobileFlag,
            filters.checkedOptions,
            filters.checkedSourceTypes,
            filters.checkedOptionsStageStatus,
            filters.checkedOptionsUser,
            selectedDemography
              ? Object.values(selectedDemography).filter(Boolean)
              : null,
            filters.selectedProductId,
            filters.selectedCategoryId,
            filters.selectedContactId,
            offset,
            limit,
            debouncedSearchText,
          ),
        500,
      );

      if (!allInquiries.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = (
        selectedCustomers.length > 0 ? selectedCustomers : allInquiries
      ).map((customer) => {
        const getLabelsText = (
          labels: Array<{ name: string; color: string }>,
        ) =>
          labels && labels.length > 0
            ? labels.map((l) => l.name).join(", ")
            : "-";

        const rowData: any = {
          "Inquiry ID": customer.inquiry_id || "-",
          "Customer Name": `${customer.person_name || "-"}`,
          "Customer Mobile Number": `${customer.mobile_number || "-"}`,
          "Category Name": customer.category_name || "-",
          "Product Name": customer.product_id || "-",
          "Source Type": customer.source_type_id || "-",
          "Stages And Status": customer.status_name || "-",
          Labels: getLabelsText(customer.label_name),
          Qty: customer.qty || "-",
          Description: customer.description || "-",
          "Created By": customer.created_by_name || "-",
          "Assign To": customer.assined_team_person || "-",
        };

        uniqueCustomFields.forEach((field: any) => {
          rowData[field.fieldLabel] = customer[field.fieldName] ?? "-";
        });

        return rowData;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 20 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 30 },
        ...uniqueCustomFields.map(() => ({ wch: 20 })),
      ];

      const workbook = {
        Sheets: { Inquiries: worksheet },
        SheetNames: ["Inquiries"],
      };

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "inquiries_full");
    } catch (error) {
      toast.error("Excel export failed");
    } finally {
      setLoading(false);
    }
  };

  const saveAsExcelFile = (buffer: BlobPart, fileName: string) => {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const EXCEL_EXTENSION = ".xlsx";
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(
      data,
      fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION,
    );
  };

  const printTable = () => {
    const filteredData = getFilteredData();
    const tableData =
      selectedCustomers.length > 0 ? selectedCustomers : filteredData;

    const getLabelsText = (labels: Array<{ name: string; color: string }>) => {
      return labels && labels.length > 0
        ? labels.map((label) => label.name).join(", ")
        : "-";
    };
    const printContent = `
    <html>
      <head>
        <title>All Inquiry Report</title>
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          h1 { text-align: center; }
        </style>
      </head>
      <body>
        <h1>All Inquiry Report</h1>
        <table>
          <thead>
            <tr>
              ${exportColumns.map((col) => `<th>${col.title}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableData
              .map(
                (customer) => `
                  <tr>
                    <td>${customer.inquiry_id || "-"}</td>
                    <td>${customer.person_name || "-"}</td>
                    <td> ${customer.mobile_number || "-"}</td>
                    <td>${customer.category_name || "-"}</td>
                    <td>${customer.product_id || "-"}</td>
                    <td>${customer.source_type_id || "-"}</td>
                    <td>${customer.status_name || "-"}</td>
                    <td>${getLabelsText(customer.label_name)}</td>
                    <td>${customer.qty || "-"}</td>
                    <td>${customer.description || "-"}</td>
                    <td>${customer.created_by_name || "-"}</td>
                    <td>${customer.assined_team_person || "-"}</td>
                    ${uniqueCustomFields
                      .map(
                        (field: any) =>
                          `<td>${customer[field.fieldName] || "-"}</td>`,
                      )
                      .join("")}
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };
  if (error) {
    return (
      <div>
        <h3
          style={{ fontSize: "20px", paddingLeft: "12px" }}
          className="dash-board-text-count"
        >
          All Inquiry
        </h3>
        <div className="report_card" style={{ width: "59vw" }}>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}
      >
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          All Inquiry
        </h3>
        {/* {MobileFlag || MobileFlag != undefined || MobileFlag != null ? (
          ""
        ) : ( */}
        <div
          className={`d-flex gap-2 ${MobileFlag ? "flex-column align-items-start" : "align-items-center"}`}
          style={{
            position: "relative",
            paddingLeft: MobileFlag ? "10px" : "",
          }}
        >
          <div
            className="d-flex gap-2 align-items-center"
            style={{
              width: MobileFlag ? "285px" : "355px",
              zIndex: "999",
              position: "relative",
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              className="form-control"
              placeholder={
                MobileFlag
                  ? "Search in This Report"
                  : "Search Anything in This Report"
              }
              style={{
                width: MobileFlag ? "220px" : "300px",
                marginTop: "10px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGlobalSearch();
                }
              }}
            />
            {globalSearchText && (
              <span
                className="clear-icon"
                onClick={() => {
                  setGlobalSearchText("");
                  if (searchInputRef.current) {
                    searchInputRef.current.value = "";
                  }
                }}
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
            <Button
              icon="pi pi-search"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={handleGlobalSearch}
              tooltip="Search"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Button
              icon={hasData ? "pi pi-filter-slash" : "pi pi-filter"}
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={() => setIsModalFilterVisible(true)}
              tooltip="Filter Report"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />
            <Button
              icon="pi pi-ellipsis-v"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={(e) => {
                e.stopPropagation();
                setIsExportDropdownOpen((prev) => !prev);
              }}
              tooltip="More Option"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />

            <ul
              className={`labelDropLeft ${
                isExportDropdownOpen ? "isVisible" : "isHidden"
              }`}
              style={{
                width: "170px",
                position: "absolute",
                right: "0",
                top: "0",
                zIndex: 1000,
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                scrollbarWidth: "none",
              }}
            >
              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (customers.length === 0) return;

                  canShare
                    ? exportExcel()
                    : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }}
              >
                <i
                  className="pi pi-file-excel"
                  style={{ marginRight: "4px" }}
                />
                Export Excel
              </li>

              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (customers.length === 0) return;

                  canShare
                    ? exportPdf()
                    : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }}
              >
                <i className="pi pi-file-pdf" style={{ marginRight: "4px" }} />
                Export PDF
              </li>

              <li
                className="listItem text-start"
                role="button"
                onClick={() => {
                  setIsExportDropdownOpen(false);

                  if (customers.length === 0) return;

                  canPrint
                    ? printTable()
                    : toast.error(DEFAULT_MESSAGE_ERROR_PERMISSION);
                }}
              >
                <i className="pi pi-print" style={{ marginRight: "4px" }} />
                Print
              </li>
            </ul>
          </div>
        </div>
        {/* )} */}
      </div>

      <div
        className="report_card"
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
      >
        <DataTable
          ref={dt}
          value={customers}
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollable
          scrollHeight="90vh"
          virtualScrollerOptions={{
            itemSize: 52, // Adjust to your actual row height (inspect in dev tools)
            lazy: true,
            onLazyLoad: (event: { first: number; last: number }) => {
              if (event.last >= customers.length - 1 && hasMore && !loading) {
                loadTasks(currentOffset.current, 50);
              }
            },
            appendOnly: true, // Key fix: prevents DOM reset and scroll jump
            showLoader: true,
            delay: 0,
          }}
          filterDisplay="row"
          // dataKey="inquiry_id"
          // first={lazyState.first}
          // rows={lazyState.rows}
          totalRecords={totalRecords}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          loading={loading}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          emptyMessage="No data found"
        >
          {(!MobileFlag || MobileFlag === undefined || MobileFlag === null) && (
            <Column
              selectionMode="multiple"
              headerStyle={{
                width: "3rem",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
              bodyStyle={{ textAlign: "center" }}
            />
          )}
          <Column
            field="inquiry_id"
            header={
              <span>
                Inquiry <br /> Id
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="custom"
            headerStyle={{
              width: "100px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => rowData.inquiry_id || "-"}
          />
          <Column
            field="customerName"
            header={
              <span>
                Customer <br /> Name
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="custom"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => rowData.person_name || "-"}
          />
          <Column
            field="customerNumber"
            header={
              <span>
                Customer <br />
                Mobile Number
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="custom"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => rowData.mobile_number || "-"}
          />
          <Column
            field="category_name"
            header={
              <span>
                Category <br /> Name
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => rowData.category_name || "-"}
          />
          <Column
            field="product_id"
            header={
              <span>
                Product <br /> Name
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "190px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => rowData.product_id || "-"}
          />
          <Column
            field="source_type_id"
            header={
              <span>
                Source <br /> Type
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => (
              <span
                style={{
                  backgroundColor: rowData.source_colour
                    ? rowData.source_colour
                    : "#eeeeee",
                }}
                className="badge rounded-pill"
              >
                {rowData.source_type_id}
              </span>
            )}
          />
          <Column
            field="source_type_id"
            header={
              <span>
                Stages And <br /> Status
              </span>
            }
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => (
              <span
                style={{
                  backgroundColor: rowData.status_colour
                    ? rowData.status_colour
                    : "#eeeeee",
                }}
                className="badge rounded-pill"
              >
                {rowData.status_name}
              </span>
            )}
          />
          <Column
            field="lable"
            header="Labels"
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => {
              const labels = rowData.label_name || [];

              return (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {labels.map((label, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: label.color || "#eeeeee",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                      }}
                      className="badge rounded-pill"
                    >
                      {label.name || "Unknown"}
                    </span>
                  ))}
                </div>
              );
            }}
          />
          <Column
            field="qty"
            header="Qty."
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "100px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => rowData.qty ?? "-"}
          />
          <Column
            field="description"
            header="Description"
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => rowData.description || "-"}
          />
          <Column
            field="assined_team_person"
            header="Assign To"
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) =>
              rowData.assined_team_person || "-"
            }
          />
          <Column
            field="created_by_name"
            header="Created By"
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
            headerStyle={{
              width: "150px",
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "#f8f9fa",
              fontSize: "14px",
            }}
            bodyStyle={{ fontSize: "14px" }}
            body={(rowData: IInquiryReport) => rowData.created_by_name || "-"}
          />

          {uniqueCustomFields.map((field: any) => (
            <Column
              key={field.fieldName}
              field={field.fieldName}
              header={field.fieldLabel.replace(/ /g, "\n")}
              sortable
              filter
              filterField={field.fieldName}
              filterPlaceholder="Search"
              filterMatchMode={
                field.dataType === 1 || field.dataType === 7
                  ? "equals"
                  : "contains"
              }
              headerStyle={{
                width: "150px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8f9fa",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={(rowData: IInquiryReport) =>
                rowData[field.fieldName]
                  .replace(/<br\s*\/?>/gi, "\n")
                  .replace(/<[^>]+>/g, "") || "-"
              }
            />
          ))}
        </DataTable>
      </div>
      {isModalFilterVisible && (
        <CheckBoxFilterModal
          show={isModalFilterVisible}
          onHide={() => setIsModalFilterVisible(false)}
          handleSubmit={handleApplyFilters}
          title="Filter Reports"
          message="Please select the Dates and Team Members for the Report."
          btn1="Clear"
          btn2="Apply"
          filtersToShow={[1, 2, 3, 4, 5, 6, 18]}
          pageId={1}
          stageandStatusOrderType={2}
          initialFilterData={{
            ...filters.filterData,
            category: filters.selectedCategoryId,
            product: filters.selectedProductId,
            contactId: filters.selectedContactId,
            productId: filters.selectedProductSearchId,
            orderlistselect: filters.selectedOrderListId,
          }}
          initialCheckedOptions={filters.checkedOptions}
          initialCheckedSourceTypes={filters.checkedSourceTypes}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          initialCheckedOptionsStageStatus={filters.checkedOptionsStageStatus}
          initialCheckedOptionsSeries={filters.checkedOptionsSeries}
          initialSelectedStockTypeId={filters.selectedStockTypeId}
          initialCheckedOptionsUser={filters.checkedOptionsUser}
          initialSelectedActiveId={filters.selectedActiveId}
          initialselectedOrderListId={filters.selectedOrderListId}
          initialSelectedDays={filters.selectedDays}
          selectedWarehouseIds={filters.selectedWarehouseIds}
          initialReferenceWiseContact={filters.referenceWiseContact}
          isApplyReport={1}
        />
      )}
    </div>
  );
};

export default AllInqueryReport;
