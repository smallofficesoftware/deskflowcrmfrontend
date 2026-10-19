import React, { useState } from "react";
import { toast } from "react-toastify";
import { formatDate } from "../../../../../common/SharedFunction";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";
import { productProductTypesList } from "./ProductController";

interface ILinkedDocument {
  cart_type: number;
  cart_number: string;
}

interface ITraceEvent {
  source: "document" | "task" | "support_ticket" | "visit";
  id: number;
  date: string | null;
  cart_type?: number;
  reference: string;
  title?: string;
  contact_name: string;
  qty?: number;
  amount?: number;
  stock_effect?: "in" | "out" | "none";
  linked_from?: ILinkedDocument[];
  linked_to?: ILinkedDocument[];
  completed_date?: string | null;
}

interface ITrace {
  serial_number: string;
  product_name: string;
  stock_balance: number;
  last_stock_effect: "in" | "out" | "none";
  last_party: string;
  event_count: number;
  events: ITraceEvent[];
}

const typeName = (cartType?: number) =>
  productProductTypesList.find((t) => Number(t.id) === Number(cartType))
    ?.order_type || "Document";

const eventLabel = (event: ITraceEvent) => {
  if (event.source === "document") return typeName(event.cart_type);
  if (event.source === "support_ticket") return "Support Ticket";
  if (event.source === "task") return "Task";
  return "Visit";
};

const linkText = (docs?: ILinkedDocument[]) =>
  (docs || []).map((d) => `${typeName(d.cart_type)}: ${d.cart_number}`).join(", ");

const stockText = (effect?: string) =>
  effect === "in" ? "In" : effect === "out" ? "Out" : "";

const currentStatus = (trace: ITrace) => {
  if (trace.last_stock_effect === "in") return "In stock";
  if (trace.last_stock_effect === "out") return "Out of stock";
  return "No stock movement";
};

const SerialNumberTrace = ({
  show,
  onHide,
}: {
  show: boolean;
  onHide: () => void;
}) => {
  const [serialNumber, setSerialNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [trace, setTrace] = useState<ITrace | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const serial = serialNumber.trim();
    if (!serial) {
      toast.warning("Please enter Serial Number");
      return;
    }
    setIsSearching(true);
    setSearched(true);
    try {
      const response = await axiosInstance.post("get-serial-number-trace", {
        a_application_login_id: localStorage.getItem("UUID"),
        serial_number: serial,
      });
      if (response.data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        setTrace(response.data.data);
      } else {
        setTrace(null);
        toast.error(response.data.ack_msg || "Serial number not found");
      }
    } catch (error: any) {
      setTrace(null);
      toast.error(error.response?.data?.ack_msg || "Serial number not found");
    } finally {
      setIsSearching(false);
    }
  };

  if (!show) return null;

  return (
    <React.Fragment>
      <div>
        <div
          className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2"
          style={{ paddingLeft: "12px", paddingRight: "12px" }}
        >
          <h3 className="dash-board-text-count" style={{ fontSize: "20px" }}>
            Serial Number Trace
          </h3>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Enter Serial Number"
              style={{ width: "220px" }}
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={isSearching || !serialNumber.trim()}
              style={{
                whiteSpace: "nowrap",
                height: "40px",
                backgroundColor: "#f58634",
              }}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {trace && (
          <div
            className="d-flex flex-wrap gap-4 mb-3"
            style={{ paddingLeft: "12px", paddingRight: "12px" }}
          >
            <div>
              <small className="text-muted d-block">Serial Number</small>
              <b>{trace.serial_number}</b>
            </div>
            <div>
              <small className="text-muted d-block">Product</small>
              <b>{trace.product_name || "-"}</b>
            </div>
            <div>
              <small className="text-muted d-block">Current Status</small>
              <b>{currentStatus(trace)}</b>
            </div>
            <div>
              <small className="text-muted d-block">Stock Balance</small>
              <b>{trace.stock_balance}</b>
            </div>
            <div>
              <small className="text-muted d-block">Last Party</small>
              <b>{trace.last_party || "-"}</b>
            </div>
            <div>
              <small className="text-muted d-block">Events</small>
              <b>{trace.event_count}</b>
            </div>
          </div>
        )}

        <div className="m-title-2 col-12">
          <div className="head">
            <div className="source-of-type-list-grid-block">
              <div
                className="source-of-type-list-grid-main"
                style={{ maxHeight: "60vh", overflowX: "auto" }}
              >
                <table className="table table-hover" border={0}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "white",
                    }}
                  >
                    <tr style={{ backgroundColor: "#dee2e6" }}>
                      <th>Date</th>
                      <th className="text-start">Event</th>
                      <th className="text-start">Reference</th>
                      <th className="text-start">Contact Name</th>
                      <th className="text-start">Details</th>
                      <th className="text-end">Qty</th>
                      <th className="text-center">Stock</th>
                      <th className="text-end">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trace && trace.events.length > 0 ? (
                      trace.events.map((event) => (
                        <tr key={`${event.source}-${event.id}`}>
                          <td className="text-start">
                            {event.date ? formatDate(event.date) : ""}
                          </td>
                          <td className="text-start">{eventLabel(event)}</td>
                          <td className="text-start">{event.reference}</td>
                          <td className="text-start">{event.contact_name}</td>
                          <td className="text-start">
                            {event.source === "document" ? (
                              <>
                                {event.linked_from &&
                                  event.linked_from.length > 0 && (
                                    <div>
                                      <small className="text-muted">
                                        From {linkText(event.linked_from)}
                                      </small>
                                    </div>
                                  )}
                                {event.linked_to &&
                                  event.linked_to.length > 0 && (
                                    <div>
                                      <small className="text-muted">
                                        To {linkText(event.linked_to)}
                                      </small>
                                    </div>
                                  )}
                              </>
                            ) : (
                              <>
                                {event.title}
                                {event.completed_date && (
                                  <div>
                                    <small className="text-muted">
                                      Completed{" "}
                                      {formatDate(event.completed_date)}
                                    </small>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                          <td className="text-end">
                            {event.source === "document" ? event.qty : ""}
                          </td>
                          <td className="text-center">
                            {stockText(event.stock_effect)}
                          </td>
                          <td className="text-end">
                            {event.source === "document"
                              ? Number(event.amount || 0).toFixed(2)
                              : ""}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          {searched && !isSearching
                            ? "No Records Found."
                            : "Enter Serial Number and click Search"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SerialNumberTrace;
