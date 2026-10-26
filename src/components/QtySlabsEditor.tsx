import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../helpers/AppConstants";
import { axiosInstance } from "../services/axiosInstance";

interface ISlabRow {
  min_qty: string;
  rate: string;
}

interface IProps {
  productId: number | string;
  /** 0 = the product's own base slabs; otherwise a price list id. */
  pricelistId: number;
  title?: string;
}

/** Quantity-based pricing: "from N units the unit rate is X". One editor for both
 * the product (pricelistId 0) and a price-list item; the storefront picks the
 * highest slab at or below the quantity ordered. */
const QtySlabsEditor = ({ productId, pricelistId, title = "Quantity pricing" }: IProps) => {
  const [rows, setRows] = useState<ISlabRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axiosInstance.post("qty-slabs/get", {
          product_id: productId,
          pricelist_masters_id: pricelistId,
        });
        if (cancelled) return;
        const items = data.ack === DEFAULT_STATUS_CODE_SUCCESS ? data.data?.items || [] : [];
        setRows(items.map((i: any) => ({ min_qty: String(i.min_qty), rate: String(i.rate) })));
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, pricelistId]);

  const update = (index: number, patch: Partial<ISlabRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.post("qty-slabs/save", {
        a_application_login_id: Number(localStorage.getItem("UUID")),
        product_id: productId,
        pricelist_masters_id: pricelistId,
        slabs: rows.map((r) => ({ min_qty: Number(r.min_qty), rate: Number(r.rate) })),
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) toast.success(data.ack_msg || "Saved");
      else toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded p-3 mb-3">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <b>{title}</b>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setRows([...rows, { min_qty: "", rate: "" }])}>
          + Add slab
        </button>
      </div>
      <div className="text-muted small mb-2">
        From this quantity the unit rate (excluding GST) is the rate below. The normal rate applies under the lowest slab.
      </div>
      {rows.length === 0 ? (
        <div className="text-muted small">No quantity slabs.</div>
      ) : (
        rows.map((row, index) => (
          <div key={index} className="d-flex align-items-center mb-2" style={{ gap: "0.5rem" }}>
            <input
              type="number"
              min={2}
              className="form-control"
              style={{ maxWidth: 140 }}
              placeholder="From qty"
              value={row.min_qty}
              onChange={(e) => update(index, { min_qty: e.target.value })}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              className="form-control"
              style={{ maxWidth: 160 }}
              placeholder="Rate"
              value={row.rate}
              onChange={(e) => update(index, { rate: e.target.value })}
            />
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setRows(rows.filter((_, i) => i !== index))}>
              Remove
            </button>
          </div>
        ))
      )}
      <button type="button" className="btn btn-sm btn-primary mt-1" disabled={saving} onClick={save}>
        {saving ? "Saving..." : "Save quantity pricing"}
      </button>
    </div>
  );
};

export default QtySlabsEditor;
