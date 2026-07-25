import { Button } from "primereact/button";
import { useEffect, useRef, useState } from "react";
import ImageViewer from "../../../components/ImageViewer";
import SafeHtml from "../../../components/SafeHtml";
import { axiosInstance } from "../../../services/axiosInstance";
import SupportTicketListStatusTable from "./SupportTicketListStatusTable";

export interface Ticket {
  id: number;
  task_title: string;
  task_remark: string;
  task_attechment?: string;
  category_name: string;
  category_color: string;
  status_name: string;
  status_color: string;
  ids: number;
  created_date_time: string;
  media_url: string;
}

interface Props {
  qrCode: string;
  contactID: string;
  tickets: Ticket[];
  loading: boolean;
  fetchTickets: (page: number) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  hasMore: boolean;
}

export const getSupportTickets = async (
  page: number,
  qrCode: string,
  contactID: string,
  itemsPerPage: number
): Promise<Ticket[]> => {

  const ul = page * itemsPerPage;
  const ll = itemsPerPage;

  const requestData = {
    qr_code: qrCode,
    contactID: contactID,
    ul,
    ll,
  };

  const response = await axiosInstance.post(
    "get-store-support-ticket",
    requestData
  );

  return response.data.data.item;
};

const SupportTicketListView = ({
  tickets,
  loading,
  fetchTickets,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  qrCode,
  contactID,
  hasMore, }: Props) => {

  const [imageViewData, setImageViewData] = useState<Ticket>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleChangeImgViewer = (item: Ticket) => {
    setImageViewData(item);
    setViewerOpen(true);
  };

  const listInnerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (listInnerRef.current) {
        const { scrollTop, clientHeight, scrollHeight } = listInnerRef.current;

        const isNearBottom =
          scrollTop + clientHeight >= scrollHeight - 5;

        if (isNearBottom && hasMore && !loading) {
          console.log("NEXT PAGE:", currentPage + 1);

          fetchTickets(currentPage + 1);
          setCurrentPage((prev) => prev + 1);
        }
      }
    };

    const el = listInnerRef.current;

    if (el) {
      el.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (el) {
        el.removeEventListener("scroll", handleScroll);
      }
    };
  }, [tickets.length, currentPage, loading, hasMore]);

  return (
    <div style={{ padding: "10px", width: "70vw", height: "100vh" }}>
      <div className="card w-100 h-100">

        <div
          ref={listInnerRef}
          style={{ height: "100vh", overflowY: "auto", borderRadius: "10px" }}
        >
          <table className="table table-bordered mb-0" style={{ borderRadius: "10px" }}>
            <thead className="position-sticky top-0 bg-white" style={{ zIndex: 1 }}>
              <tr>
                <th scope="col" style={{ whiteSpace: "nowrap", width: "1%" }}>Ticket No.</th>
                <th scope="col">Ticket Details</th>
                <th scope="col">Current Status</th>
                {/* <th scope="col">Action</th> */}
              </tr>
            </thead>

            <tbody>
              {tickets && tickets.length > 0 ? (
                tickets.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td style={{ whiteSpace: "nowrap" }}><b>{`#${ticket.ids}`}</b><br />
                      <span
                        className="inquiry-front badge rounded-pill"
                        style={{
                          backgroundColor: ticket.category_color || "#ccc",
                          padding: "4px 8px",
                          borderRadius: "5px",
                          color: "white"
                        }}
                      >
                        {ticket.category_name}
                      </span>
                      <br />{ticket.created_date_time}</td>
                    <td style={{
                      width: "35vw",
                      wordWrap: "break-word",
                      whiteSpace: "normal"
                    }}><div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span><b>Company Name: </b>{ticket.task_title}</span>
                        {ticket.media_url && (<Button
                          icon="pi pi-eye"
                          className="p-button-text"
                          style={{ color: "green", width: "2rem", cursor: "pointer", }}
                          onClick={() =>
                            handleChangeImgViewer(
                              ticket,
                            )
                          }
                          tooltip="View Attachment"
                        />)}</div><span>
                        <b>Describe Your Problem: </b>
                        <div
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          <SafeHtml htmlContent={ticket.task_remark} />
                        </div>
                      </span><br />
                      {/* <b>Name: </b><br/>
                          <b>Phone Number: </b> */}
                    </td>
                    {/* <td style={{
                      maxWidth: "200px",
                      wordWrap: "break-word",
                      whiteSpace: "normal"
                    }}>{ticket.task_remark}</td> */}
                    <td style={{ width: "12vw" }}>
                      <span
                        className="inquiry-front badge rounded-pill"
                        style={{
                          backgroundColor: ticket.status_color || "#ccc",
                          padding: "4px 8px",
                          borderRadius: "5px",
                          color: "white"
                        }}
                      >
                        {ticket.status_name}
                      </span><br />
                      <div
                        role="button"
                        style={{
                          width: "auto",
                          marginTop: "6px",
                          fontSize: "15px",
                          lineHeight: "1.2",
                          cursor: "pointer"
                        }}
                        onClick={() => {
                          setShowStatus(true);
                          setSelectedId(ticket.ids);
                        }
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = "none";
                        }}
                      >
                        Click Here To View Status Timeline
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center">
                    No Support Tickets Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {loading && (
            <p className="text-center mt-2">Loading more...</p>
          )}
        </div>
        {viewerOpen && (
          <ImageViewer
            image={imageViewData}
            onClose={() => setViewerOpen(false)}
          />
        )}
        {showStatus && (
          <SupportTicketListStatusTable
            qrCode={qrCode ?? ""}
            contactID={contactID ?? ""}
            show={showStatus}
            onClose={() => setShowStatus(false)}
            reference_id={selectedId}
          />
        )}
      </div>
    </div>
  );
};

export default SupportTicketListView;