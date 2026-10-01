import "primeicons/primeicons.css";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useEscapeKey } from "../../../../common/SharedFunction";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../services/axiosInstance";

interface ICartPaymentRow {
  cart_id: number;
  cart_type: number;
  cart_type_name: string;
  cart_number: string;
  cart_date: string;
  contact_name: string;
  grand_total: number;
  paid_amount: number;
  pending_amount: number;
}

interface ITotals {
  grand_total: number;
  paid_amount: number;
  pending_amount: number;
}

const CART_TYPE_OPTIONS = [
  { value: 3, label: "Sales Invoice" },
  { value: 2, label: "Sales Order" },
  { value: 12, label: "Proforma Invoice" },
  { value: 7, label: "Purchase Return" },
  { value: 4, label: "Purchase Invoice" },
  { value: 5, label: "Purchase Order" },
  { value: 6, label: "Sales Return" },
];

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const money = (n: number) =>
  (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

// Cart-wise payment report: billed vs received/paid (via transactions linked
// to the cart on Create Account Transaction) vs pending.
const CartPaymentReportView = ({
  MobileFlag,
  onHide,
}: {
  MobileFlag?: string;
  onHide?: () => void;
}) => {
  const now = new Date();
  const [startDate, setStartDate] = useState(toYMD(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  const [cartType, setCartType] = useState<string>("");
  const [status, setStatus] = useState<string>("all");
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<ICartPaymentRow[]>([]);
  const [totals, setTotals] = useState<ITotals>({ grand_total: 0, paid_amount: 0, pending_amount: 0 });
  const [loading, setLoading] = useState(false);

  useEscapeKey(() => onHide?.());

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("cartPaymentReport", {
        a_application_login_id: localStorage.getItem("UUID"),
        startDate,
        endDate,
        cart_types: cartType ? [Number(cartType)] : [],
        status,
        linkedOnly: linkedOnly ? 1 : 0,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setRows(data.data.item);
        setTotals(data.data.totals);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        setRows([]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, cartType, status, linkedOnly]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.cart_number, r.contact_name, r.cart_type_name].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const exportCsv = () => {
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Cart Type", "Cart No", "Date", "Contact", "Total", "Paid", "Pending"];
    const lines = visibleRows.map((r) =>
      [r.cart_type_name, r.cart_number, r.cart_date, r.contact_name, r.grand_total, r.paid_amount, r.pending_amount]
        .map(esc)
        .join(","),
    );
    const blob = new Blob([[header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cart_payment_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div
        className={`d-flex ${MobileFlag ? "flex-column align-items-start" : "align-items-center justify-content-between"} gap-2 mb-3`}
      >
        <h3 style={{ fontSize: "20px" }} className="dash-board-text-count">
          Cart Payment Report
        </h3>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <select className="form-select" value={cartType} onChange={(e) => setCartType(e.target.value)}>
            <option value="">All cart types</option>
            {CART_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Fully paid</option>
          </select>
          <label className="d-flex align-items-center gap-1 mb-0">
            <input type="checkbox" checked={linkedOnly} onChange={(e) => setLinkedOnly(e.target.checked)} />
            Linked only
          </label>
          <input
            className="form-control"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 180 }}
          />
          <button type="button" className="btn btn-outline-secondary" onClick={exportCsv} disabled={!visibleRows.length}>
            Export CSV
          </button>
          {onHide && (
            <button type="button" className="btn btn-outline-secondary" onClick={onHide}>
              Close
            </button>
          )}
        </div>
      </div>

      <DataTable value={visibleRows} loading={loading} paginator rows={50} rowsPerPageOptions={[25, 50, 100]} size="small" emptyMessage="No carts found">
        <Column field="cart_type_name" header="Cart Type" sortable />
        <Column field="cart_number" header="Cart No" sortable />
        <Column field="cart_date" header="Date" sortable />
        <Column field="contact_name" header="Contact" sortable />
        <Column field="grand_total" header="Total" sortable body={(r: ICartPaymentRow) => money(r.grand_total)} />
        <Column field="paid_amount" header="Paid" sortable body={(r: ICartPaymentRow) => money(r.paid_amount)} />
        <Column
          field="pending_amount"
          header="Pending"
          sortable
          body={(r: ICartPaymentRow) => (
            <span style={{ color: r.pending_amount > 0 ? "red" : "green", fontWeight: "bold" }}>
              {money(r.pending_amount)}
            </span>
          )}
        />
      </DataTable>

      <div className="d-flex justify-content-end gap-4 mt-2 fw-bold">
        <span>Total: {money(totals.grand_total)}</span>
        <span>Paid: {money(totals.paid_amount)}</span>
        <span>Pending: {money(totals.pending_amount)}</span>
      </div>
    </div>
  );
};

export default CartPaymentReportView;
