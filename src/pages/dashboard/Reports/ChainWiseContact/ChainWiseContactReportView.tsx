import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
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
import {
  formatDateAndTime,
  useEscapeKey,
} from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import AppliedFilterBar from "../../../../components/report/AppliedFilterBar";
import { DEFAULT_MESSAGE_ERROR_PERMISSION } from "../../../../helpers/AppConstants";
import { PAGE_ID, PERMISSION_TYPE } from "../../../../helpers/AppEnum";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import useCheckUserPermission from "../../../../hooks/useCheckUserPermission";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchAllcontact,
  fetchAllContactsForExport,
  IChainContact,
} from "./ChainWiseContactController";

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

interface IPropallcontactReports {
  selectedDates?: Date[];
  setActive?: string | undefined;
  setActiveDay?: number | undefined;
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  selectedLabels?: string[] | null;
  selectedSourceTypes?: string[] | null;
  selectedStageStatus?: string[] | null;
  selectedTeamMembers?: string[] | null;
  selectedDemography?: string[] | null;
  globalSearch?: string;
  selectedContactId?: string | null;
  referenceWiseContact?: number;
  onHide?: () => void;
}
interface ChildColumnDef extends ColumnDef {
  header: React.ReactNode;
  width?: string;
  filterMatchMode?: string;
  body?: (rowData: IChainContact) => React.ReactNode;
}

interface ChildContactTableProps {
  chainContact: IChainContact[];
  columns: ChildColumnDef[];
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

const ChainWiseContactReportView = ({
  selectedDates,
  setActive,
  setActiveDay,
  MobileToken,
  getID,
  MobileFlag,
  selectedLabels,
  selectedSourceTypes,
  selectedStageStatus,
  selectedTeamMembers,
  selectedDemography,
  globalSearch,
  selectedContactId,
  referenceWiseContact = 1,
  onHide,
}: IPropallcontactReports) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<IChainContact[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<IChainContact[]>(
    [],
  );
  const [hasMore, setHasMore] = useState(true);

  const currentOffset = useRef(0);
  const isLoadingMore = useRef(false);

  const [globalSearchText, setGlobalSearchText] = useState<string>("");
  const [selectReportType, setSelectReportType] = useState("");
  const [hasData, setHasData] = useState<boolean>(false);
  const [debouncedSearchText, setDebouncedSearchText] = useState<string>("");
  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("all_contact_chainwise_report");
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      dropdownRef.current.contains(event.target as Node)
    ) {
      return;
    }

    setIsExportDropdownOpen(false);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEscapeKey(() => {
    if (!isExportDropdownOpen) {
      onHide?.();
    } else {
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

    setFilters("all_contact_chainwise_report", updatedFilters);

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

      setFilters("all_contact_chainwise_report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
      });
    }
  }, []);

  const canShare = useCheckUserPermission(
    PAGE_ID.ALLCONTACT_REPORT,
    PERMISSION_TYPE.SHARE,
  );

  const canPrint = useCheckUserPermission(
    PAGE_ID.ALLCONTACT_REPORT,
    PERMISSION_TYPE.PRINT,
  );

  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 50,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {
      person_name: { value: null, matchMode: "contains" },
      mobile_number: { value: null, matchMode: "contains" },
      company_name: { value: null, matchMode: "contains" },
      source_name: { value: null, matchMode: "contains" },
      lable_name: { value: null, matchMode: "contains" },
      status_name: { value: null, matchMode: "contains" },
      cart_number: { value: null, matchMode: "contains" },
      created_date_time: { value: null, matchMode: "contains" },
      grand_total: { value: null, matchMode: "equals" },
      country_name: { value: null, matchMode: "contains" },
      state_name: { value: null, matchMode: "contains" },
      city_name: { value: null, matchMode: "contains" },
      area_name: { value: null, matchMode: "contains" },
      address: { value: null, matchMode: "contains" },
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [showCartColumns, setShowCartColumns] = useState({
    cart_number: false,
    created_date_time: false,
    grand_total: false,
  });

  const dt = useRef<DataTable<IChainContact[]>>(null);

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
      const newData = await fetchAllcontact(
        filters.selectedDateArray,
        setActive,
        setActiveDay,
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
        offset,
        limit,
        debouncedSearchText,
        filters.selectedContactId,
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

  const handleRefresh = async () => {
    currentOffset.current = 0;
    setHasMore(true);
    setCustomers([]);
    setSelectedCustomers([]);
    loadTasks(0, 50, true);
  };

  const dataArray: IChainContact[] = useMemo(() => {
    return customers.map((item) => ({
      person_name: item.person_name || "-",
      mobile_number: item.mobile_number || "-",
      company_name: item.company_name || "-",
      country_name: item.country_name || "-",
      state_name: item.state_name || "-",
      city_name: item.city_name || "-",
      area_name: item.area_name || "-",
      source_name: item.source_name || "-",
      source_colour: item.source_colour || "-",
      lable_name: item.lable_name || "-",
      lable_colour: item.lable_colour || "-",
      status_name: item.status_name || "-",
      status_colour: item.status_colour || "-",
      cart_number: item.cart_number || "-",
      grand_total: item.grand_total || "-",
      address: item.address,
      longitude: item.longitude,
      latitude: item.latitude,
      created_date_time: item.created_date_time || "-",
      cntc_column_number_1: item.cntc_column_number_1,
      cntc_column_number_2: item.cntc_column_number_2,
      cntc_column_number_3: item.cntc_column_number_3,
      cntc_column_number_4: item.cntc_column_number_4,
      cntc_column_number_5: item.cntc_column_number_5,
      cntc_column_text_1: item.cntc_column_text_1,
      cntc_column_text_2: item.cntc_column_text_2,
      cntc_column_text_3: item.cntc_column_text_3,
      cntc_column_text_4: item.cntc_column_text_4,
      cntc_column_text_5: item.cntc_column_text_5,
      cntc_column_text_area_1: item.cntc_column_text_area_1,
      cntc_column_text_area_2: item.cntc_column_text_area_2,
      cntc_column_text_area_3: item.cntc_column_text_area_3,
      cntc_column_text_area_4: item.cntc_column_text_area_4,
      cntc_column_text_area_5: item.cntc_column_text_area_5,
      cntc_column_date_1: item.cntc_column_date_1,
      cntc_column_date_2: item.cntc_column_date_2,
      cntc_column_date_3: item.cntc_column_date_3,
      cntc_column_date_4: item.cntc_column_date_4,
      cntc_column_date_5: item.cntc_column_date_5,
      cntc_column_date_and_time_1: item.cntc_column_date_and_time_1,
      cntc_column_date_and_time_2: item.cntc_column_date_and_time_2,
      cntc_column_date_and_time_3: item.cntc_column_date_and_time_3,
      cntc_column_date_and_time_4: item.cntc_column_date_and_time_4,
      cntc_column_date_and_time_5: item.cntc_column_date_and_time_5,
      cntc_column_time_1: item.cntc_column_time_1,
      cntc_column_time_2: item.cntc_column_time_2,
      cntc_column_time_3: item.cntc_column_time_3,
      cntc_column_time_4: item.cntc_column_time_4,
      cntc_column_time_5: item.cntc_column_time_5,
      cntc_column_switch_1: item.cntc_column_switch_1,
      cntc_column_switch_2: item.cntc_column_switch_2,
      cntc_column_switch_3: item.cntc_column_switch_3,
      cntc_column_switch_4: item.cntc_column_switch_4,
      cntc_column_switch_5: item.cntc_column_switch_5,
      cntc_column_decimal_1: item.cntc_column_decimal_1,
      cntc_column_decimal_2: item.cntc_column_decimal_2,
      cntc_column_decimal_3: item.cntc_column_decimal_3,
      cntc_column_decimal_4: item.cntc_column_decimal_4,
      cntc_column_decimal_5: item.cntc_column_decimal_5,
      cntc_column_dropdown_1: item.cntc_column_dropdown_1,
      cntc_column_dropdown_2: item.cntc_column_dropdown_2,
      cntc_column_dropdown_3: item.cntc_column_dropdown_3,
      cntc_column_dropdown_4: item.cntc_column_dropdown_4,
      cntc_column_dropdown_5: item.cntc_column_dropdown_5,
      cntc_column_radio_1: item.cntc_column_radio_1,
      cntc_column_radio_2: item.cntc_column_radio_2,
      cntc_column_radio_3: item.cntc_column_radio_3,
      cntc_column_radio_4: item.cntc_column_radio_4,
      cntc_column_radio_5: item.cntc_column_radio_5,
      customForm: item.customForm,
    }));
  }, [customers]);

  const ParentInfo = (rowData: IChainContact) => {
    return (
      <div>
        <div>
          <b>{rowData.person_name}</b>
        </div>
        <div>{rowData.mobile_number}</div>
        <div> {rowData.company_name || "-"}</div>
        <div>
          {rowData.country_name}, {rowData.state_name}
        </div>
      </div>
    );
  };

  const ChildContactTable = ({
    chainContact,
    columns,
  }: ChildContactTableProps) => {
    return (
      <div
        style={{
          border: "1px solid #dcdcdc",
          borderRadius: "6px",
          padding: "4px",
          background: "#ffffff",
        }}
      >
        <DataTable
          value={chainContact}
          size="small"
          showGridlines
          responsiveLayout="scroll"
          emptyMessage="No referred contacts"
          tableStyle={{
            borderCollapse: "collapse",
            width: "100%",
          }}
        >
          {columns.map((col) => (
            <Column
              key={col.key}
              field={col.key}
              header={col.header}
              headerStyle={{ border: "1px solid #ccc", width: col.width }}
              bodyStyle={{ border: "1px solid #eee" }}
              body={col.body}
            />
          ))}
        </DataTable>
      </div>
    );
  };

  const uniqueCustomFields = useMemo(() => {
    const allFields = dataArray.flatMap((item) =>
      getMatchedCustomFields(item, item.customForm || []),
    );
    return Array.from(
      new Set(allFields.map((field) => JSON.stringify(field))),
      (str) => JSON.parse(str),
    );
  }, [dataArray]);

  const baseColumnDefs: ChildColumnDef[] = useMemo(() => {
    const defs: ChildColumnDef[] = [
      { key: "person_name", label: "Person Name", header: "Person Name" },
      { key: "mobile_number", label: "Mobile", header: "Mobile" },
      { key: "company_name", label: "Company", header: "Company" },
      { key: "country_name", label: "Country", header: "Country" },
      { key: "state_name", label: "State", header: "State" },
      { key: "city_name", label: "City", header: "City" },
      { key: "area_name", label: "Area", header: "Area" },
      { key: "address", label: "Address", header: "Address" },
      { key: "source_name", label: "Source", header: "Source" },
      { key: "lable_name", label: "Label", header: "Label" },
      { key: "status_name", label: "Status", header: "Status" },
    ];

    if (showCartColumns.cart_number) {
      defs.push({
        key: "cart_number",
        label: "Last Cart Number",
        header: "Last Cart Number",
      });
    }

    if (showCartColumns.created_date_time) {
      defs.push({
        key: "created_date_time",
        label: "Created Date",
        header: "Created Date",
        body: (rowData) =>
          formatDateAndTime(rowData.created_date_time) || "-",
      });
    }

    if (showCartColumns.grand_total) {
      defs.push({
        key: "grand_total",
        label: "Grand Total",
        header: "Grand Total",
        body: (rowData) =>
          rowData.grand_total ? `₹${rowData.grand_total}` : "-",
      });
    }

    uniqueCustomFields.forEach((field: any) => {
      defs.push({
        key: field.fieldName,
        label: field.fieldLabel,
        header: field.fieldLabel,
        body: (rowData: any) => rowData[field.fieldName] || "-",
      });
    });

    return defs;
  }, [showCartColumns, uniqueCustomFields]);

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("chain_wise_contact_report", baseColumnDefs);

  const isAllSelected = useMemo(() => {
    const filteredData = getFilteredData();
    return (
      filteredData.length > 0 &&
      selectedCustomers.length === filteredData.length
    );
  }, [selectedCustomers, lazyState.filters, dataArray]);

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

  // Determine if cart-related columns should be shown
  useEffect(() => {
    const hasCartNumber = dataArray.some((item) => item.cart_number !== "-");
    const hasCreatedDateTime = dataArray.some(
      (item) => item.created_date_time !== "-",
    );
    const hasGrandTotal = dataArray.some(
      (item) => item.grand_total !== "-" && item.grand_total !== 0,
    );

    setShowCartColumns({
      cart_number: hasCartNumber,
      created_date_time: hasCreatedDateTime,
      grand_total: hasGrandTotal,
    });
  }, [dataArray]);

  const onSort = (event: DataTableSortEvent) => {
    setLazyState((prev) => ({
      ...prev,
      sortField: event.sortField,
      sortOrder: event.sortOrder as SortOrder,
    }));
  };

  const onFilter = (event: DataTableFilterEvent) => {
    const activeField = Object.keys(event.filters).find((key) => {
      const filter = event.filters[key];

      if ("value" in filter) {
        return filter.value !== null && filter.value !== "";
      }

      if ("constraints" in filter) {
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
        if ("value" in filter) {
          filter.value = null;
        }

        if ("constraints" in filter) {
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

  const onSelectionChange = (event: { value: IChainContact[] }) => {
    setSelectedCustomers(event.value);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      const filteredData = getFilteredData();
      setSelectedCustomers([...filteredData]);
    } else {
      setSelectedCustomers([]);
    }
  };

  const getExportCellValue = (
    col: ChildColumnDef,
    customer: any,
    moneyPrefix: string = "INR ",
  ): string => {
    if (col.key === "created_date_time") {
      return formatDateAndTime(customer.created_date_time) || "-";
    }
    if (col.key === "grand_total") {
      return customer.grand_total ? `${moneyPrefix}${customer.grand_total}` : "-";
    }
    return customer[col.key] ?? "-";
  };

  const exportColumns = visibleColumns.map((col) => ({
    title: col.label,
    dataKey: col.key,
  }));

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const filteredData = getFilteredData();
    const tableData = (
      selectedCustomers.length > 0 ? selectedCustomers : filteredData
    ).map((customer) => {
      const rowData: any = {};
      visibleColumns.forEach((col) => {
        rowData[col.key] = getExportCellValue(col, customer);
      });
      return rowData;
    });

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`all_contacts_report_${new Date().getTime()}.pdf`);
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
        doc.text("All Contact Report", data.settings.margin.left, 10);
      },
    });

    doc.save(`all_contacts_report_${new Date().getTime()}.pdf`);
  };

  const exportExcel = async () => {
    try {
      setLoading(true);

      const allContacts = await fetchAllContactsForExport({
        selectedDates: filters.selectedDateArray,
        setActive,
        setActiveDay,
        MobileToken,
        getID,
        MobileFlag,
        selectedLabels: filters.checkedOptions,
        selectedSourceTypes: filters.checkedSourceTypes,
        selectedStageStatus: filters.checkedOptionsStageStatus,
        selectedTeamMembers: filters.checkedOptionsUser,
        selectedDemography: selectedDemography
          ? Object.values(selectedDemography).filter(Boolean)
          : null,
        globalSearch: debouncedSearchText,
        selectedContactId: filters.selectedContactId,
      });

      if (!allContacts.length) {
        toast.warn("No data to export");
        return;
      }

      const exportData = (
        selectedCustomers.length > 0 ? selectedCustomers : allContacts
      ).map((customer) => {
        const row: any = {};
        visibleColumns.forEach((col) => {
          row[col.label] = getExportCellValue(col, customer);
        });
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportData);
      worksheet["!cols"] = Object.keys(exportData[0]).map(() => ({ wch: 25 }));

      const workbook = {
        Sheets: { Contacts: worksheet },
        SheetNames: ["Contacts"],
      };

      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "All_Contacts_Report");
    } catch (error) {
      toast.error("Failed to export full data");
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

    const printContent = `
      <html>
        <head>
          <title>All Contact Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>All Contact Report</h1>
          <table>
            <thead>
              <tr>
                ${visibleColumns.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableData
                .map(
                  (customer) => `
                  <tr>
                    ${visibleColumns
                      .map(
                        (col) =>
                          `<td>${getExportCellValue(col, customer, "₹")}</td>`,
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
          Chain Wise Contact
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
          Chain Wise Contact
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
            <div ref={dropdownRef} style={{ position: "relative" }}>
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
                  top: "100%",
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
                  <i
                    className="pi pi-file-pdf"
                    style={{ marginRight: "4px" }}
                  />
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

            <Button
              icon="pi pi-refresh"
              className="report_button"
              style={{ backgroundColor: "#4C4C4C" }}
              rounded
              onClick={handleRefresh}
              tooltip="Refresh"
              tooltipOptions={{
                position: "top",
                style: {
                  fontSize: "14px",
                },
              }}
            />

            <ColumnsButton
              columns={orderedColumns}
              hiddenKeys={hiddenKeys}
              onToggle={toggleColumn}
              onReorder={reorderColumns}
              onReset={resetColumns}
            />
          </div>
        </div>
        {/* )} */}
      </div>

      <AppliedFilterBar
        summary={filters.appliedFilterSummary}
        dateRange={filters.selectedDateArray}
        startDate={filters.startSearchDate}
        endDate={filters.endSearchDate}
      />

      <div
        className="report_card"
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
      >
        <DataTable
          value={customers.filter(
            (c) => c.chainContact && c.chainContact.length > 0,
          )}
          loading={loading}
          scrollable
          resizableColumns
          columnResizeMode="fit"
          className="custom-centered-table"
          scrollHeight="70vh"
          emptyMessage="No chain contacts found"
          dataKey="id"
          tableStyle={{ width: "100%" }}
        >
          {/* Parent Column */}
          <Column
            header="Referred Contacts"
            body={(rowData: IChainContact) => <ParentInfo {...rowData} />}
            style={{ width: "35%" }}
          />

          {/* Children Nested Table Column */}
          <Column
            header="Contacts"
            body={(rowData: IChainContact) =>
              rowData.chainContact?.length ? (
                <ChildContactTable
                  chainContact={rowData.chainContact}
                  columns={visibleColumns}
                />
              ) : (
                <span style={{ color: "#999" }}>No chainContact</span>
              )
            }
            style={{ width: "65%" }}
          />
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
          filtersToShow={[1, 2, 3, 4, 5, 6, 9, 18]}
          pageId={1}
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

export default ChainWiseContactReportView;
