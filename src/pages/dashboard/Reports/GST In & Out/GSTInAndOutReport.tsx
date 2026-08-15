import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
    DataTable,
    type DataTableFilterEvent,
    type DataTableFilterMeta
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useState } from "react";
import { useEscapeKey } from "../../../../common/SharedFunction";
import ColumnsButton from "../../../../components/ColumnsButton";
import { ColumnDef, useColumnPreferences } from "../../../../hooks/useColumnPreferences";
import { fetchGSTInOutApi, IGSTInOUT } from "./GSTInAndOutReportController";

interface GSTInAndOutReportProps {
    reportType: "IN" | "OUT";
    onHide?: () => void;
}

const GSTInAndOutReport = ({
    reportType,
    onHide
}: GSTInAndOutReportProps) => {
    const [loading, setLoading] = useState(false);
    const [gstLists, setGstLists] = useState<IGSTInOUT[]>([]);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        source_name: {
            value: null,
            matchMode: "contains",
        },
    });

    const onFilter = (event: DataTableFilterEvent) => {
        setFilters(event.filters);
    };

    // 2. useEffect mein backend ko reportType (flag) pass kar diya
    useEffect(() => {
        fetchGSTInOutApi(
            setGstLists,
            setLoading,
            reportType
        );
    }, [reportType]);

    const handleRefresh = async () => {
        fetchGSTInOutApi(
            setGstLists,
            setLoading,
            reportType
        );
    };

    useEscapeKey(() => {
    if (onHide) {
      onHide?.();
    }
  });

    type GSTColumnDef = ColumnDef & {
        header: React.ReactNode;
        filterMatchMode?: string;
        width?: string;
        bodyAlign?: "end";
        body: (rowData: IGSTInOUT) => React.ReactNode;
    };

    const baseColumnDefs: GSTColumnDef[] = useMemo(
        () => [
            {
                key: "cart_number",
                label: "Cart Number",
                header: <span>Cart Number</span>,
                width: "200px",
                body: (rowData: IGSTInOUT) => rowData.cart_number,
            },
            {
                key: "to_customer_name",
                label: "Customer Name",
                header: <span>Customer Name</span>,
                width: "200px",
                body: (rowData: IGSTInOUT) => rowData.to_customer_name,
            },
            {
                key: "gst_amt",
                label: "GST Amount",
                header: <span>GST Amount</span>,
                width: "200px",
                bodyAlign: "end",
                body: (rowData: IGSTInOUT) => rowData.gst_amt,
            },
            {
                key: "gst_number",
                label: "GST Number",
                header: <span>GST Number</span>,
                width: "200px",
                bodyAlign: "end",
                body: (rowData: IGSTInOUT) => rowData.gst_number,
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
    } = useColumnPreferences("gst_in_out_report", baseColumnDefs);

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">

                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    {reportType === "IN" ? "GST In" : "GST Out"}
                </h3>
                <div className="d-flex align-items-center gap-2">
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

            <div
                className="report_card"
                style={{
                    height: "90vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <DataTable
                    value={gstLists}
                    loading={loading}
                    resizableColumns
                    columnResizeMode="fit"
                    scrollable
                    scrollHeight="flex"
                    className="custom-centered-table"
                    tableStyle={{ tableLayout: "fixed", width: "100%" }}
                    emptyMessage="No data found"
                    filterDisplay="row"
                    filters={filters}
                    onFilter={onFilter}
                >
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
                            bodyStyle={{
                                fontSize: "14px",
                                textAlign: col.bodyAlign,
                            }}
                            body={col.body}
                        />
                    ))}
                </DataTable>
            </div>
        </div>
    );
};

export default GSTInAndOutReport;