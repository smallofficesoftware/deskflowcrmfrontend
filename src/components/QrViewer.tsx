import React, { useEffect, useRef, useState } from "react";
import { axiosInstanceForWpWeb } from "../services/axiosInstance";

interface IQrViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QrViewer: React.FC<IQrViewerProps> = ({ isOpen, onClose }) => {
  const [showQr, setShowQr] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Store interval reference
  const [statusMessages, setStatusMessages] = useState<{
    type: string;
    message: string;
  }>(); // Store status messages

  const fetchQr = async () => {
    const response = await axiosInstanceForWpWeb.get("/show-qr");
    setShowQr(response.data.data.qr);
    const latestStatus = response?.data?.data?.latestStatusMessage;
    if (Array.isArray(latestStatus) && latestStatus.length > 0) {
      setStatusMessages(latestStatus[0]); // Ensure it's a valid object
    } else {
      setStatusMessages({ type: "", message: "" }); // Default empty object
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQr(); // Fetch QR code when modal opens

      // Start auto-refresh every 1 minute
      intervalRef.current = setInterval(fetchQr, 70000);
    } else {
      // Stop API calls when modal is closed
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="image-viewer-overlay h-100">
          <div className="image-viewer-content">
            <button className="close-btn" onClick={onClose}>
              ✖
            </button>
            <br />
            <br />
            <p>QR</p>

            {showQr && (
              <img
                src={showQr}
                style={{ height: "600px", width: "600px" }}
                alt=""
              />
            )}
            <br />
            <br />

            {statusMessages && <p>{statusMessages.message}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default QrViewer;
