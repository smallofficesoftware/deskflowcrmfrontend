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

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string | number;
}) =>
  value != null && value !== "" ? (
    <div className="d-flex gap-2 mb-2" style={{ fontSize: "0.82rem" }}>
      <span style={{ minWidth: 20 }}>{icon}</span>
      <span className="text-muted" style={{ minWidth: 90 }}>
        {label}
      </span>
      <span className="fw-semibold">{value}</span>
    </div>
  ) : null;

const Card = ({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) => (
  <div
    className="h-100 rounded-3 p-3"
    style={{ border: `1.5px solid ${color}20`, background: `${color}06` }}
  >
    <div
      className="fw-bold mb-3 pb-2"
      style={{
        fontSize: "0.82rem",
        color,
        borderBottom: `1.5px solid ${color}20`,
        letterSpacing: "0.04em",
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const ItemDetailSection = ({
  contactDetail,
  itemDetail,
  loading,
  printing,
  onPrintBom,
}: IProps) => {
  if (loading) {
    return (
      <div className="row g-3">
        <div className="col-md-6">
          <Skeleton height={220} borderRadius={10} />
        </div>
        <div className="col-md-6">
          <Skeleton height={220} borderRadius={10} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row g-3 mb-3">
        {/* Contact Card — hidden for direct-product job cards (no customer) */}
        {contactDetail?.name ? (
          <div className="col-md-6">
            <Card title="👤 CUSTOMER DETAILS" color="#f58634">
              <DetailRow icon="🏢" label="Name" value={contactDetail?.name} />
              <DetailRow icon="📞" label="Phone" value={contactDetail?.phone} />
              <DetailRow icon="📧" label="Email" value={contactDetail?.email} />
              <DetailRow icon="🏙️" label="City" value={contactDetail?.city} />
              <DetailRow
                icon="📍"
                label="Address"
                value={contactDetail?.address}
              />
              <DetailRow
                icon="🧾"
                label="GST No"
                value={contactDetail?.gst_no}
              />
            </Card>
          </div>
        ) : null}

        {/* Item Card */}
        <div className="col-md-6">
          <Card title="📦 ITEM DETAILS" color="#198754">
            <DetailRow icon="🏷️" label="Item" value={itemDetail?.item_name} />
            <DetailRow
              icon="🔢"
              label="Item Code"
              value={itemDetail?.item_code}
            />
            <DetailRow
              icon="📋"
              label="Order No"
              value={itemDetail?.order_no}
            />
            <DetailRow
              icon="📊"
              label="Order Qty"
              value={
                itemDetail && itemDetail.order_qty > 0
                  ? `${itemDetail.order_qty} ${itemDetail.unit}`
                  : undefined
              }
            />
            <DetailRow
              icon="⏳"
              label="Pending Qty"
              value={
                itemDetail?.pending_qty
                  ? `${itemDetail.pending_qty} ${itemDetail?.unit}`
                  : undefined
              }
            />
            <DetailRow
              icon="📅"
              label="Delivery Date"
              value={itemDetail?.delivery_date}
            />
          </Card>
        </div>
      </div>

      {/* Print BOM Button */}
      <div className="d-flex justify-content-end">
        <button
          className="btn btn-sm"
          style={{
            background: printing
              ? "#adb5bd"
              : "linear-gradient(135deg,#374151,#1f2937)",
            color: "#fff",
            minWidth: 150,
            fontSize: "0.82rem",
          }}
          onClick={onPrintBom}
          disabled={printing}
        >
          {printing ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
                style={{ width: 12, height: 12, borderWidth: 2 }}
              />
              Printing…
            </>
          ) : (
            "🖨️ Print BOM Detail"
          )}
        </button>
      </div>
    </div>
  );
};

export default ItemDetailSection;
