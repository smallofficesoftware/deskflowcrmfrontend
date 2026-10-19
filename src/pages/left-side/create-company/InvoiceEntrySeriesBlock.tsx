import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";

interface IPropsInvoiceEntrySeriesBlock {
  companyId?: number;
}

const SERIES = [
  { prefix: "invoice_entry_prefix", pattern: "invoice_entry_series_pattern", title: "Sales Invoice (Debit entry)" },
  { prefix: "purchase_entry_prefix", pattern: "purchase_entry_series_pattern", title: "Purchase Invoice (Credit entry)" },
  { prefix: "return_sales_entry_prefix", pattern: "return_sales_entry_series_pattern", title: "Sales Return (Credit entry)" },
  { prefix: "return_purchase_entry_prefix", pattern: "return_purchase_entry_series_pattern", title: "Purchase Return (Debit entry)" },
];

// Default series of the debit / credit entry an invoice creates in Account
// Transaction: one prefix and one pattern per invoice type, saved on its own
// (not with the rest of the company prefixes). Blank prefix = no voucher number.
const InvoiceEntrySeriesBlock = ({ companyId }: IPropsInvoiceEntrySeriesBlock) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      try {
        const { data } = await axiosInstance.post("invoiceEntrySeriesGet", { company_id: companyId });
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) setValues(data.data.item || {});
      } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    };
    load();
  }, [companyId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.post("invoiceEntrySeriesSave", { company_id: companyId, ...values });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(data.ack_msg);
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setSaving(false);
    }
  };

  if (!companyId) return null;

  return (
    <div className="col-12 mt-4">
      <hr style={{ borderTop: "2px solid #f58634", opacity: 1, margin: "8px 0 16px" }} />
      <div
        className="d-flex align-items-center mb-3"
        style={{ gap: "10px", color: "#f58634", fontWeight: 600, letterSpacing: "0.5px" }}
      >
        <span style={{ flex: "0 0 auto" }}>ACCOUNT TRANSACTION</span>
        <span style={{ flex: "1 1 auto", borderTop: "1px solid #f5863466" }} />
      </div>
      <div style={{ padding: "15px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
        <h5>Invoice Account Entry Series</h5>
        <p className="mb-2">
          When an invoice is created it posts a debit or credit entry in Account Transaction. This series
          gives that entry its voucher number. One series for each invoice type; leave the prefix blank
          for no number.
        </p>
        <small className="text-muted d-block mb-3">
          Pattern: 1 = series, 2 = number, 3A = year 2026-2027, 3a = year 26-27. Example 1/2/3a gives
          SIE/01/26-27. The number restarts every financial year.
        </small>
        <div className="row">
          {SERIES.map((s) => (
            <div className="col-12 mb-3" key={s.prefix}>
              <label className="form-label mb-1">
                <strong>{s.title}</strong>
              </label>
              <div className="row">
                <div className="col-6 col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Series (e.g. SIE)"
                    maxLength={50}
                    value={values[s.prefix] ?? ""}
                    onChange={(e) => setValues({ ...values, [s.prefix]: e.target.value.replace(",", "") })}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pattern (e.g. 1/2/3A)"
                    maxLength={100}
                    value={values[s.pattern] ?? ""}
                    onChange={(e) => setValues({ ...values, [s.pattern]: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="btn btn-primary px-4 py-2 text-light form_label rounded-1"
          style={{ backgroundColor: "#f58634" }}
        >
          Save Invoice Entry Series
        </button>
      </div>
    </div>
  );
};

export default InvoiceEntrySeriesBlock;
