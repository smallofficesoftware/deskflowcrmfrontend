import "primeicons/primeicons.css";
import { Column } from "primereact/column";
import {
    DataTable,
    type DataTableFilterEvent,
    type DataTableFilterMeta
} from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useState } from "react";
import { useEscapeKey } from "../../../../common/SharedFunction";
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

    useEscapeKey(() => {
    if (onHide) {
      onHide?.();
    }
  });

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">

                <h3
                    style={{ fontSize: "20px", paddingLeft: "12px" }}
                    className="dash-board-text-count"
                >
                    {reportType === "IN" ? "GST In" : "GST Out"}
                </h3>
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
                    <Column
                        field="cart_number"
                        header={<span>Cart Number</span>}
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "200px",
                            background: "#f8f9fa",
                            fontSize: "14px !important",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: IGSTInOUT) => rowData.cart_number}
                    />
                    <Column
                        field="to_customer_name"
                        header={<span>Customer Name</span>}
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "200px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px" }}
                        body={(rowData: IGSTInOUT) => rowData.to_customer_name}
                    />
                    <Column
                        field="gst_amt"
                        header={<span>GST Amount</span>}
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "200px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px", textAlign: "end" }}
                        body={(rowData: IGSTInOUT) => rowData.gst_amt}
                    />
                    <Column
                        field="gst_number"
                        header={<span>GST Number</span>}
                        sortable
                        filter
                        filterPlaceholder="Search"
                        filterMatchMode="contains"
                        headerStyle={{
                            width: "200px",
                            background: "#f8f9fa",
                            fontSize: "14px",
                        }}
                        bodyStyle={{ fontSize: "14px", textAlign: "end" }}
                        body={(rowData: IGSTInOUT) => rowData.gst_number}
                    />
                </DataTable>
            </div>
        </div>
    );
};

export default GSTInAndOutReport;