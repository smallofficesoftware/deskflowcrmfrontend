import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SupportTicketFormView from "./SupportTicketFormView";
import SupportTicketListView, { getSupportTickets, Ticket } from "./SupportTicketListView";


const SupportTicket = () => {

    const { id: qrCode, contactID } = useParams<{
        id: string;
        contactID: string;
    }>();
    // AutoTabRefresh();

    // const navigate = useNavigate()

    // const UUID = localStorage.getItem("UUID");
    // if (!UUID) {
    //     navigate("/");
    // }

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [noDataFound, setNoDataFound] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const itemsPerPage = 50;

    const fetchTickets = async (page: number, qrCode: string, contactID: string) => {
        try {
            setLoading(true);

            const data = await getSupportTickets(page, qrCode, contactID , itemsPerPage)|| [];

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
        fetchTickets(0, qrCode ?? "" ,contactID ?? "");
    }, [qrCode ,contactID]);

    const fetchTicketsWrapper = (page: number) => {
        fetchTickets(page, qrCode ?? "",contactID ?? "");
    };

    return (
        <div style={{ display: "flex", height: "100vh", backgroundColor: "#D9DBD5" }}>

            {/* LEFT SIDE */}
            <div style={{ width: "30vw", overflowY: "auto" }}>
                <SupportTicketFormView
                    qrCode={qrCode ?? ""}
                    contactID={contactID ?? ""}
                    onSuccess={() => {
                        setCurrentPage(0);
                        setHasMore(true);
                        fetchTickets(0, qrCode ?? "",contactID ?? "");
                    }}
                />
            </div>

            {/* RIGHT SIDE */}
            <div style={{ width: "70vw" }}>
                <SupportTicketListView
                    qrCode={qrCode ?? ""}
                    contactID={contactID ?? ""}
                    tickets={tickets}
                    loading={loading}
                    fetchTickets={fetchTicketsWrapper}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    hasMore={hasMore}
                />
            </div>

        </div>
    );
};

export default SupportTicket;