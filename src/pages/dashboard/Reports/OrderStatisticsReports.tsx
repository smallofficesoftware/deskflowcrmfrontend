import React, { useState, useEffect, useRef } from "react";
import {
  DataTable,
  type DataTableFilterEvent,
  type DataTableFilterMeta,
  type DataTablePageEvent,
  type DataTableSortEvent,
  type SortOrder,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as xlsx from "xlsx";
import 'primereact/resources/themes/lara-light-indigo/theme.css'; // Or any other theme
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface IPropDataTableView {
  showReportTable: boolean;
  closeReportTable: () => void;
}


interface Country {
  name: string;
  code: string;
}

interface Representative {
  name: string;
  code: string;
  image: string;
}

interface Customer {
  id: number;
  name: string;
  country: Country;
  company: string;
  date: string;
  status: string;
  verified: boolean;
  activity: number;
  representative: Representative;
  balance: number;
}

interface LazyTableState {
  first: number;
  rows: number;
  page: number;
  sortField?: string | null;
  sortOrder?: SortOrder | null;
  filters: DataTableFilterMeta;
}

const getNestedValue = (obj: any, path: string): any =>
  path.split(".").reduce((acc, part) => acc?.[part], obj);

const OrderStatisticsReports = ({}) => {
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [lazyState, setLazyState] = useState<LazyTableState>({
    first: 0,
    rows: 500,
    page: 1,
    sortField: null,
    sortOrder: null,
    filters: {
      name: { value: null, matchMode: "contains" },
      "country.name": { value: null, matchMode: "contains" },
      company: { value: null, matchMode: "contains" },
      "representative.name": { value: null, matchMode: "contains" },
    },
  });

  const dataArray: Customer[] = [
    {
      id: 1000,
      name: "James Butt",
      country: { name: "Algeria", code: "dz" },
      company: "Benton, John B Jr",
      date: "2015-09-13",
      status: "unqualified",
      verified: true,
      activity: 17,
      representative: {
        name: "Ioni Bowcher",
        code: "ib",
        image: "ionibowcher.png",
      },
      balance: 70663,
    },
    {
      id: 1001,
      name: "Josephine Darakjy",
      country: { name: "Egypt", code: "eg" },
      company: "Chanay, Jeffrey A Esq",
      date: "2019-02-09",
      status: "proposal",
      verified: true,
      activity: 0,
      representative: {
        name: "Amy Elsner",
        code: "ae",
        image: "amyelsner.png",
      },
      balance: 82429,
    },
    {
      id: 1002,
      name: "Art Venere",
      country: { name: "Panama", code: "pa" },
      company: "Chemel, James L Cpa",
      date: "2017-05-13",
      status: "qualified",
      verified: false,
      activity: 63,
      representative: {
        name: "Asiya Javayant",
        code: "aj",
        image: "asiyajavayant.png",
      },
      balance: 28334,
    },
    
  ];

  const dt = useRef<DataTable<Customer[]>>(null);
  const networkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadLazyData();
    return () => {
      if (networkTimeout.current) clearTimeout(networkTimeout.current);
    };
  }, [lazyState]);

  const loadLazyData = () => {
    setLoading(true);
    if (networkTimeout.current) clearTimeout(networkTimeout.current);

    networkTimeout.current = setTimeout(() => {
      let filteredData = [...dataArray];
      Object.entries(lazyState.filters).forEach(([field, meta]) => {
        if ("value" in meta && meta.value && typeof meta.value === "string") {
          const filterValue = meta.value.toLowerCase();
          const matchMode = meta.matchMode;

          filteredData = filteredData.filter((item) => {
            const fieldValue = getNestedValue(item, field);
            if (fieldValue == null) return false;

            const fieldStr = fieldValue.toString().toLowerCase();

            switch (matchMode) {
              case "contains":
                return fieldStr.includes(filterValue);
              case "notContains":
                return !fieldStr.includes(filterValue);
              case "startsWith":
                return fieldStr.startsWith(filterValue);
              case "endsWith":
                return fieldStr.endsWith(filterValue);
              case "equals":
                return fieldStr === filterValue;
              case "notEquals":
                return fieldStr !== filterValue;
              default:
                return true; // if matchMode is not recognized, don't filter
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

      // Apply pagination
      const start = lazyState.first;
      const end = start + lazyState.rows;
      setCustomers(filteredData.slice(start, end));
      setTotalRecords(filteredData.length);
      setLoading(false);
    }, 250);
  };

  const onPage = (event: DataTablePageEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: event.first,
      rows: event.rows,
      page: event.page ?? 0,
    }));
  };

  const onSort = (event: DataTableSortEvent) => {
    setLazyState((prev) => ({
      ...prev,
      sortField: event.sortField,
      sortOrder: event.sortOrder as SortOrder,
    }));
  };

  const onFilter = (event: DataTableFilterEvent) => {
    setLazyState((prev) => ({
      ...prev,
      first: 0, // Reset to first page on filter
      filters: event.filters,
    }));
  };

  const onSelectionChange = (event: { value: Customer[] }) => {
    const value = event.value;
    setSelectedCustomers(value);
    setSelectAll(value.length === totalRecords);
  };

  const onSelectAllChange = (event: { checked: boolean }) => {
    if (event.checked) {
      setSelectAll(true);
      setSelectedCustomers([...dataArray]);
    } else {
      setSelectAll(false);
      setSelectedCustomers([]);
    }
  };

  // Export functions remain unchanged
  const exportColumns = [
    { title: "Name", dataKey: "name" },
    { title: "Country", dataKey: "country" },
    { title: "Company", dataKey: "company" },
    { title: "Representative", dataKey: "representative" },
  ];

  const exportPdf = () => {
    const doc = new jsPDF();
        const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) => "value" in filter && filter.value !== null && filter.value !== ""
    );

    // Use customers if filters are applied, otherwise use dataArray
    const tableData = (isFilterApplied ? customers : dataArray).map((customer) => ({
      name: customer.name,
      country: customer.country.name,
      company: customer.company,
      representative: customer.representative.name,
    }));

    if (tableData.length === 0) {
      doc.text("No data available to export", 10, 10);
      doc.save(`customers_${new Date().getTime()}.pdf`);
      return;
    }

    autoTable(doc, {
      columns: exportColumns,
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: (data: any) => {
        doc.text("Customer Data", data.settings.margin.left, 10);
      },
    });

    doc.save(`customers_${new Date().getTime()}.pdf`);
  };

  const exportExcel = () => {
  const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) => "value" in filter && filter.value !== null && filter.value !== ""
    );
    const exportData = (isFilterApplied ? customers : dataArray).map((customer) => ({
      Name: customer.name,
      Country: customer.country.name,
      Company: customer.company,
      Representative: customer.representative.name,
    }));
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAsExcelFile(excelBuffer, "customers");
  };

  const saveAsExcelFile = (buffer: BlobPart, fileName: string) => {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const EXCEL_EXTENSION = ".xlsx";
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(
      data,
      fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
    );
  };

  const printTable = () => {
        const isFilterApplied = Object.values(lazyState.filters).some(
      (filter) => "value" in filter && filter.value !== null && filter.value !== ""
    );
    const printContent = `
      <html>
        <head>
          <title>Print Customer Data</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Customer Data</h1>
          <table>
            <thead>
              <tr>
                ${exportColumns.map((col) => `<th>${col.title}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${ (isFilterApplied ? customers : dataArray)
                .map(
                  (customer) => `
                <tr>
                  <td>${customer.name}</td>
                  <td>${customer.country.name}</td>
                  <td>${customer.company}</td>
                  <td>${customer.representative.name}</td>
                </tr>
              `
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

  return (
    <div>
        <h1>Order Statistics Reports</h1>
      <div className="d-flex align-items-center justify-content-end gap-2 mb-3">
        <Button
          icon="pi pi-file-excel"
          className= "report_button"
          style={{ backgroundColor: "green" }}
          severity="success"
          rounded
          onClick={exportExcel}
          tooltip="Export Excel"
        />
        <Button
          icon="pi pi-file-pdf"
          className= "report_button"
          style={{ backgroundColor: "green" }}
          severity="danger"
          rounded
          onClick={exportPdf}
          tooltip="Export PDF"
        />
        <Button
          icon="pi pi-print"
          className= "report_button"
          style={{ backgroundColor: "green" }}
          severity="secondary"
          rounded
          onClick={printTable}
          tooltip="Print"
        />
      </div>

      <div className="report_card">
        <DataTable
          ref={dt}
          value={customers}
          lazy
          filterDisplay="row"
          dataKey="id"
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          onSort={onSort}
          sortField={lazyState.sortField ?? undefined}
          sortOrder={lazyState.sortOrder ?? undefined}
          sortMode="single"
          onFilter={onFilter}
          filters={lazyState.filters}
          loading={loading}
          tableStyle={{ minWidth: "75rem" }}
          selection={selectedCustomers}
          onSelectionChange={onSelectionChange}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
        >
          {/* <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} /> */}
          <Column
            field="name"
            header="Name"
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
          />
          <Column
            field="country.name"
            header="Country"
            sortable
            filter
            filterField="country.name"
            filterPlaceholder="Search"
            filterMatchMode="contains"
          />
          <Column
            field="company"
            header="Company"
            sortable
            filter
            filterPlaceholder="Search"
            filterMatchMode="contains"
          />
          <Column
            field="representative.name"
            header="Representative"
            sortable
            filter
            filterField="representative.name"
            filterPlaceholder="Search"
            filterMatchMode="contains"
          />
        </DataTable>
      </div>
    </div>
  );
};

export default OrderStatisticsReports;