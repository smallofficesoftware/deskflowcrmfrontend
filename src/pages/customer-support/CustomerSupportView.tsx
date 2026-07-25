import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AutoTabRefresh from "../../helpers/AutoTabRefresh";
import CustomerSupportFormView from "./customer-support-form/CustomerSupportFormView";
import {
  getSupportTickets,
  Ticket,
} from "./customer-support-view-list/CustomerSupportListController";
import CustomerSupportListView from "./customer-support-view-list/CustomerSupportListView";
import CustomerSupportNote from "./CustomerSupportNote";

const CustomerSupportView = () => {
  // AutoTabRefresh();

  const navigate = useNavigate();

  const UUID = localStorage.getItem("UUID");
  if (!UUID) {
    navigate("/");
  }

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [noDataFound, setNoDataFound] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const itemsPerPage = 50;

  const fetchTickets = async (page: number) => {
    try {
      setLoading(true);

      const data = await getSupportTickets(page, itemsPerPage);

      if (page === 0) {
        setTickets(data);
      } else {
        setTickets((prev) => [...prev, ...data]);
      }

      if (data.length < itemsPerPage) {
        setHasMore(false);
      }

      setNoDataFound(data.length === 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(0);
  }, []);

  return (
    <div
      style={{ display: "flex", height: "100vh", backgroundColor: "#D9DBD5" }}
    >
      {/* LEFT SIDE */}
      <div style={{ width: "30vw", overflowY: "auto" }}>
        <CustomerSupportFormView
          onSuccess={() => {
            setCurrentPage(0);
            setHasMore(true);
            fetchTickets(0);
          }}
        />

        <div style={{ marginTop: "10px" }}>
          <CustomerSupportNote />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ width: "70vw" }}>
        <CustomerSupportListView
          tickets={tickets}
          loading={loading}
          fetchTickets={fetchTickets}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
};

export default CustomerSupportView;
