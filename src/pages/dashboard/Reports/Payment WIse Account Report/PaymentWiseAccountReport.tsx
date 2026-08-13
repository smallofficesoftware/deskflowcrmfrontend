import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useMemo, useState } from "react";
import ColumnsButton from "../../../../components/ColumnsButton";
import CheckBoxFilterModal from "../../../../components/model/CheckBoxFilterModal";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import { useCommonFilterStore } from "../../../../store/report/useCommonFilterStore";
import {
  fetchPaymentTypeAccountList,
  IPaymentTypeWiseAccount,
} from "./PaymentWiseAccountReportController";

type PaymentColumnDef = ColumnDef & {
  header: React.ReactNode;
  filterMatchMode?: string;
  width?: string;
  body: (rowData: IPaymentTypeWiseAccount) => React.ReactNode;
};

interface IPropsPaymentTypeWiseAccount {
  selectedDates?: Date[];
  MobileToken?: string;
  getID?: string;
  MobileFlag?: string;
  onHide?: () => void;
}

const getCurrentMonthDateRange = () => {
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return [startOfMonth, endOfMonth];
};

const PaymentWiseAccountReport = ({
  selectedDates,
  MobileToken,
  getID,
  MobileFlag,
  onHide,
}: IPropsPaymentTypeWiseAccount) => {
  const [loading, setLoading] = useState(false);
  const [paymentTypeAcccountLists, setPaymentTypeAccountList] = useState<
    IPaymentTypeWiseAccount[]
  >([]);

  const [hasData, setHasData] = useState<boolean>(false);
  const [isModalFilterVisible, setIsModalFilterVisible] =
    useState<boolean>(false);

  const { getFilter, setFilter, setFilters, clearFilters } =
    useCommonFilterStore();

  const filters = getFilter("Payment_wise_account_Report");

  useEffect(() => {
    if (!filters.startSearchDate || !filters.endSearchDate || !filters.selectedDateArray) {
      const [startDate, endDate] = getCurrentMonthDateRange();

      setFilters("Payment_wise_account_Report", {
        ...filters,
        startSearchDate: startDate,
        endSearchDate: endDate,
        selectedDateArray: [startDate, endDate],
      });
    }
  }, []);

  const handleApplyFilters = (data: any) => {
    const [startDate, endDate] = getCurrentMonthDateRange();

    const updatedFilters = {
      ...data,
      startSearchDate: data?.startSearchDate || startDate,
      endSearchDate: data?.endSearchDate || endDate,
      selectedDateArray: [
        data?.startSearchDate || startDate,
        data?.endSearchDate || endDate,
      ],
    };

    setFilters("Payment_wise_account_Report", updatedFilters);

    setHasData(Object.keys(updatedFilters || {}).length > 0);

    setIsModalFilterVisible(false);
  };

  useEffect(() => {
    const dateArrayToUse =
      filters.selectedDateArray && filters.selectedDateArray.length === 2
        ? filters.selectedDateArray
        : getCurrentMonthDateRange();

    fetchPaymentTypeAccountList(
      setPaymentTypeAccountList,
      setLoading,
      dateArrayToUse,
    );
  }, [filters.selectedDateArray]);

  // const handleClickOutside = (event: MouseEvent) => {
  //     const target = event.target as HTMLElement;

  //     const clickedOnButton = target.closest('.source-of-type-list-grid-options');
  //     if (clickedOnButton) return;
  // };

  // useEffect(() => {
  //     document.addEventListener("mousedown", handleClickOutside);
  //     return () => {
  //         document.removeEventListener("mousedown", handleClickOutside);
  //     };
  // }, []);

  // const actionBodyTemplate = useCallback((rowData: any) => {
  //     return (
  //         <div className="gap-2" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
  //             <>
  //                 <Button
  //                     icon="pi pi-cog"
  //                     className="p-button-text source-of-type-list-grid-options"
  //                     style={{ color: "green", width: "2rem" }}
  //                     onClick={(e) => {
  //                         e.stopPropagation();
  //                         setIsActionDropdownOpen(false);
  //                         setOpenDropdownId((prev) => prev === rowData.id ? null : rowData.id);
  //                     }}
  //                 />

  //                 <ul
  //                     ref={(el) => (dropdownTaskTemplateRef.current[rowData.id] = el)}
  //                     style={{
  //                         width: "150px",
  //                         marginLeft: "15%",
  //                         height: "auto",
  //                         display: openDropdownId === rowData.id ? "block" : "none",  // ✅ inline style
  //                         position: "absolute",
  //                         zIndex: 9999,
  //                         background: "#fff",
  //                         boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
  //                         borderRadius: "6px",
  //                         padding: "5px 0",
  //                         listStyle: "none",
  //                     }}
  //                 >
  //                     <li
  //                         className="listItem"
  //                         role="button"
  //                         onClick={(e) => {
  //                             e.stopPropagation();
  //                             setOpenDropdownId(null);
  //                             handleEdit(rowData);
  //                         }}
  //                         style={{ marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
  //                     >
  //                         Edit
  //                     </li>
  //                     <li
  //                         className="listItem"
  //                         role="button"
  //                         onClick={() => {
  //                             setOpenDropdownId(null);
  //                             dataSource(rowData)
  //                         }}
  //                         style={{ marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
  //                     >
  //                         View Data sources
  //                     </li>
  //                     {rowData.id > 0 && <li
  //                         style={{ color: "red", fontWeight: "600", marginLeft: "10px", height: "25px", display: "flex", alignItems: "center" }}
  //                         className="listItem"
  //                         role="button"
  //                         onClick={(e) => {
  //                             e.stopPropagation();
  //                             setOpenDropdownId(null);
  //                             handleDelete(rowData.id);
  //                         }}
  //                     >
  //                         Delete
  //                     </li>}
  //                 </ul>
  //             </>
  //         </div>
  //     );
  // }, [openDropdownId, canEdit, canDelete]);

  const baseColumnDefs: PaymentColumnDef[] = useMemo(
    () => [
      {
        key: "payment_type_name",
        label: "Payment Type",
        header: <span>Payment Type</span>,
        width: "200px",
        body: (rowData: IPaymentTypeWiseAccount) => (
          <span
            style={{ backgroundColor: rowData.payment_color || "#eeeeee" }}
            className="badge rounded-pill"
          >
            {rowData.payment_type_name}
          </span>
        ),
      },
      {
        key: "credit_amount",
        label: "Credit Amount",
        header: <span>Credit Amount</span>,
        width: "200px",
        body: (rowData: IPaymentTypeWiseAccount) => (
          <span>{rowData.credit_amount}</span>
        ),
      },
      {
        key: "debit_amount",
        label: "Debit Amount",
        header: <span>Debit Amount</span>,
        width: "200px",
        body: (rowData: IPaymentTypeWiseAccount) => (
          <span>{rowData.debit_amount}</span>
        ),
      },
    ],
    [],
  );

  const {
    visibleColumns,
    orderedColumns,
    hiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
  } = useColumnPreferences("payment_wise_account_report", baseColumnDefs);

  return (
    <div>
      <div className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between gap-2"} mb-3`}>
        <h3
          style={{ fontSize: "20px", paddingLeft: MobileFlag ? "10px" : "" }}
          className="dash-board-text-count"
        >
          Payment Type Wise Account
        </h3>

        <div
          className={`d-flex gap-2 ${MobileFlag ? "flex-column align-items-start" : "align-items-center"}`}
          style={{
            position: "relative",
            paddingLeft: MobileFlag ? "10px" : "",
          }}
        >
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
            <ColumnsButton
              columns={orderedColumns}
              hiddenKeys={hiddenKeys}
              onToggle={toggleColumn}
              onReorder={reorderColumns}
              onReset={resetColumns}
            />
          </div>
        </div>
      </div>
      <div
        className="report_card"
        style={{
          height: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DataTable
          value={paymentTypeAcccountLists}
          loading={loading}
          resizableColumns
          columnResizeMode="fit"
          scrollable
          scrollHeight="flex"
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          emptyMessage="No data found"
          filterDisplay="row"
        // filters={filters}
        // onFilter={onFilter}
        >
          {/* <Column
                        field="actions"
                        headerClassName="center-header"
                        headerStyle={{
                            width: "30px",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                        }}
                        body={actionBodyTemplate}
                    /> */}

          {visibleColumns.map((col) => (
            <Column
              key={col.key}
              field={col.key}
              header={col.header}
              sortable
              filter
              filterField={col.key}
              filterPlaceholder="Search"
              filterMatchMode={col.filterMatchMode || "contains"}
              headerStyle={{
                width: col.width || "150px",
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "#f8f9fa",
                fontSize: "14px",
              }}
              bodyStyle={{ fontSize: "14px" }}
              body={col.body}
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
          filtersToShow={[1]}
          pageId={1}
          initialFilterData={{
            ...filters.filterData,
          }}
          initialStartSearchDate={filters.startSearchDate}
          initialEndSearchDate={filters.endSearchDate}
          isApplyReport={1}
        />
      )}
    </div>
  );
};

export default PaymentWiseAccountReport;
