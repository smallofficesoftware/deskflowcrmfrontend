import "primeicons/primeicons.css";
import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { IContactDetail, IItemDetail } from "../JobCardTypes";

interface IProps {
  contactDetail: IContactDetail | null;
  itemDetail: IItemDetail | null;
  loading: boolean;
  printing: boolean;
  onPrintBom: () => void;
}

// One labelled value in the summary grid; hidden when there is no value.
const Field = ({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: string;
  label: string;
  value?: string | number | null;
  wide?: boolean;
}) =>
  value != null && value !== "" ? (
    <div className={wide ? "col-12" : "col-6 col-md-4 col-lg-3"}>
      <div
        className="d-flex align-items-center gap-1 text-muted"
        style={{ fontSize: "0.7rem", letterSpacing: "0.02em" }}
      >
        <i className={`pi ${icon}`} style={{ fontSize: "0.7rem" }} />
        {label}
      </div>
      <div
        className="fw-semibold text-truncate"
        style={{ fontSize: "0.82rem", color: "#1f2937" }}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  ) : null;

const GroupTitle = ({ icon, title, color }: { icon: string; title: string; color: string }) => (
  <div
    className="d-flex align-items-center gap-2 mb-2"
    style={{ fontSize: "0.72rem", fontWeight: 700, color, letterSpacing: "0.05em" }}
  >
    <i className={`pi ${icon}`} style={{ fontSize: "0.75rem" }} />
    {title}
  </div>
);

// Compact job card summary shown above the required materials: item/order
// facts and (for order / customer job cards) the customer, in one card
// with the Print BOM action in its header.
const ItemDetailSection = ({
  contactDetail,
  itemDetail,
  loading,
  printing,
  onPrintBom,
}: IProps) => {
  if (loading) {
    return <Skeleton height={140} borderRadius={10} className="mb-3" />;
  }

  const unit = itemDetail?.unit ? ` ${itemDetail.unit}` : "";
  const itemLabel = itemDetail?.item_name
    ? `${itemDetail.item_name}${itemDetail.item_code ? ` (${itemDetail.item_code})` : ""}`
    : undefined;

  return (
    <div
      className="rounded-3 mb-3"
      style={{ border: "1px solid #e9ecef", background: "#fff", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
    >
      {/* Header: item name + Print BOM */}
      <div
        className="d-flex align-items-center justify-content-between gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid #f1f3f5", background: "#fffaf5", borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
      >
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <span
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 28, height: 28, borderRadius: 8, background: "#fdebd9", color: "#e0732a" }}
          >
            <i className="pi pi-box" style={{ fontSize: "0.85rem" }} />
          </span>
          <span className="fw-bold text-truncate" style={{ fontSize: "0.9rem", color: "#1f2937" }} title={itemLabel}>
            {itemLabel || "Job Card Item"}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-sm d-flex align-items-center gap-1 flex-shrink-0"
          style={{
            background: printing ? "#adb5bd" : "#374151",
            color: "#fff",
            fontSize: "0.76rem",
            borderRadius: 6,
          }}
          onClick={onPrintBom}
          disabled={printing}
        >
          {printing ? (
            <>
              <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }} />
              Printing…
            </>
          ) : (
            <>
              <i className="pi pi-print" style={{ fontSize: "0.75rem" }} />
              Print BOM
            </>
          )}
        </button>
      </div>

      <div className="px-3 py-3">
        <GroupTitle icon="pi-file" title="ORDER" color="#198754" />
        <div className="row g-3">
          <Field icon="pi-hashtag" label="Order No" value={itemDetail?.order_no} />
          <Field
            icon="pi-chart-bar"
            label="Order Qty"
            value={itemDetail && itemDetail.order_qty > 0 ? `${itemDetail.order_qty}${unit}` : undefined}
          />
          <Field
            icon="pi-hourglass"
            label="Pending Qty"
            value={itemDetail?.pending_qty ? `${itemDetail.pending_qty}${unit}` : undefined}
          />
          <Field icon="pi-calendar" label="Delivery Date" value={itemDetail?.delivery_date} />
        </div>

        {/* Customer - hidden for direct-product job cards (no customer) */}
        {contactDetail?.name ? (
          <>
            <hr className="my-3" style={{ borderColor: "#f1f3f5", opacity: 1 }} />
            <GroupTitle icon="pi-user" title="CUSTOMER" color="#e0732a" />
            <div className="row g-3">
              <Field icon="pi-building" label="Name" value={contactDetail.name} />
              <Field icon="pi-phone" label="Phone" value={contactDetail.phone} />
              <Field icon="pi-envelope" label="Email" value={contactDetail.email} />
              <Field icon="pi-map" label="City" value={contactDetail.city} />
              <Field icon="pi-receipt" label="GST No" value={contactDetail.gst_no} />
              <Field icon="pi-map-marker" label="Address" value={contactDetail.address} wide />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ItemDetailSection;
