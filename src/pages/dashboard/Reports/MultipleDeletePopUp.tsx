// DeleteConfirmationModal.tsx

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";

interface DeleteItem {
    id: number;
    cart_number: string;
    to_customer_name: string;
    grand_total: number | string;
}

interface DeleteCheckData {
    blockedList: DeleteItem[];
    deletableList: DeleteItem[];
    canProceed: boolean;
}

interface IDeleteConfirmationModalProps {
    show: boolean;
    onHide: () => void;
    onSuccess: () => void;
    selectedIds: number[];
    cartType: number;
    title?: string;
}

const MultipleDeletePopUp = ({
    show,
    onHide,
    onSuccess,
    selectedIds,
    cartType,
    title
}: IDeleteConfirmationModalProps) => {
    const [checkData, setCheckData] = useState<DeleteCheckData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [phase, setPhase] = useState<"check" | "confirm">("check");

    useEffect(() => {
        if (show && selectedIds.length > 0) {
            handleCheck();
        }
    }, [show]);

    async function handleCheck() {
        setIsLoading(true);
        try {
            const getUUID = localStorage.getItem("UUID");
            const { data } = await axiosInstance.post("multiple-delete-order", {
                cart_id: selectedIds,
                a_application_login_id: getUUID,
                cart_type: cartType,
                action: "check",
            });
            if (data.ack === 1) {
                setCheckData(data.data);
                setPhase("confirm");
            } else {
                toast.error(data.ack_msg);
                onHide();
            }
        } catch (e: any) {
            toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
            onHide();
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete() {
        if (!checkData?.deletableList?.length) return;
        setIsLoading(true);
        try {
            const getUUID = localStorage.getItem("UUID");
            const { data } = await axiosInstance.post("multiple-delete-order", {
                cart_id: checkData.deletableList.map((i) => i.id),
                a_application_login_id: getUUID,
                cart_type: cartType,
                action: "delete",
            });
            if (data.ack === 1) {
                toast.success(data.ack_msg);
                onSuccess();
                onHide();
                setCheckData(null);
                setPhase("check");
            } else {
                toast.error(data.ack_msg);
            }
        } catch (e: any) {
            toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        } finally {
            setIsLoading(false);
        }
    }

    if (!show) return null;

    return (
        <div
            style={{
                position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
            }}
        >
            <div
                style={{
                    background: "#fff", borderRadius: "10px", padding: "24px",
                    width: "480px", maxHeight: "80vh", overflowY: "auto",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                }}
            >
                <h5 style={{ marginBottom: "16px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Delete {title} Confirmation
                    <button
                        onClick={onHide}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "20px", lineHeight: 1, color: "#666", padding: "0 4px",
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                    </button>
                </h5>

                {/* Loading state */}
                {isLoading && (
                    <div style={{ textAlign: "center", padding: "20px" }}>
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />
                        <p style={{ marginTop: "10px", color: "#6b7280" }}>
                            {phase === "check" ? "Checking..." : "Deleting..."}
                        </p>
                    </div>
                )}

                {/* Check data ready */}
                {!isLoading && checkData && (
                    <>
                        {/* BLOCKED — upar */}
                        {checkData.blockedList.length > 0 && (
                            <div style={{ marginBottom: "16px" }}>
                                <div style={{
                                    background: "#fef2f2", border: "1px solid #fca5a5",
                                    borderRadius: "8px", padding: "10px 14px", marginBottom: "8px",
                                }}>
                                    <b style={{ color: "#dc2626" }}>
                                        Cannot Delete {checkData.blockedList.length} items
                                    </b>
                                    <p style={{ fontSize: "12px", color: "#7f1d1d", margin: "4px 0 0" }}>
                                        This action was not performed for this entry. Because the next step has been approved.
                                    </p>
                                </div>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ background: "#fee2e2" }}>
                                            <th style={thStyle("#fca5a5")}>#</th>
                                            <th style={thStyle("#fca5a5")}>Number</th>
                                            <th style={thStyle("#fca5a5")}>Customer</th>
                                            <th style={{ ...thStyle("#fca5a5"), textAlign: "right" }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {checkData.blockedList.map((item, i) => (
                                            <tr key={item.id}>
                                                <td style={tdStyle("#fca5a5")}>{i + 1}</td>
                                                <td style={tdStyle("#fca5a5")}>{item.cart_number}</td>
                                                <td style={tdStyle("#fca5a5")}>{item.to_customer_name}</td>
                                                <td style={{ ...tdStyle("#fca5a5"), textAlign: "right" }}>{item.grand_total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* DELETABLE — niche */}
                        {checkData.deletableList.length > 0 && (
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{
                                    border: "1px solid",
                                    borderRadius: "8px", padding: "10px 14px", marginBottom: "8px",
                                }}>
                                    <b>
                                        Will be Deleted {checkData.deletableList.length} items
                                    </b>
                                </div>
                                {/* <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ background: "#dcfce7" }}>
                                            <th style={thStyle("#86efac")}>#</th>
                                            <th style={thStyle("#86efac")}>Number</th>
                                            <th style={thStyle("#86efac")}>Customer</th>
                                            <th style={{ ...thStyle("#86efac"), textAlign: "right" }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {checkData.deletableList.map((item, i) => (
                                            <tr key={item.id}>
                                                <td style={tdStyle("#86efac")}>{i + 1}</td>
                                                <td style={tdStyle("#86efac")}>{item.cart_number}</td>
                                                <td style={tdStyle("#86efac")}>{item.to_customer_name}</td>
                                                <td style={{ ...tdStyle("#86efac"), textAlign: "right" }}>{item.grand_total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table> */}
                            </div>
                        )}

                        {/* Buttons */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button onClick={onHide} style={cancelBtnStyle}>Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={!checkData.canProceed}
                                style={{
                                    ...confirmBtnStyle,
                                    cursor: checkData.canProceed ? "pointer" : "not-allowed",
                                }}
                            >
                                Delete {checkData.deletableList.length} items
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const thStyle = (borderColor: string): React.CSSProperties => ({
    padding: "6px 8px", textAlign: "left", border: `1px solid ${borderColor}`,
});
const tdStyle = (borderColor: string): React.CSSProperties => ({
    padding: "5px 8px", border: `1px solid ${borderColor}`,
});
const cancelBtnStyle: React.CSSProperties = {
    padding: "8px 20px", borderRadius: "6px",
    border: "1px solid #d1d5db", background: "#fff",
    cursor: "pointer"
};
const confirmBtnStyle: React.CSSProperties = {
    padding: "8px 20px", borderRadius: "6px",
    border: "none", color: "#fff", backgroundColor: "#F58634"
};

export default MultipleDeletePopUp;