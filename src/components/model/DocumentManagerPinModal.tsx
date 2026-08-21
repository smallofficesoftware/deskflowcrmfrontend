import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTheme } from "../ThemeContext";
import { verifyDocumentManagerPin } from "../../pages/left-side/header/Setting/document-designer/DocumentDesignerController";

interface IDocumentManagerPinModalProps {
  show: boolean;
  onHide: () => void;
  onVerified: () => void;
}

const DocumentManagerPinModal: React.FC<IDocumentManagerPinModalProps> = ({
  show,
  onHide,
  onVerified,
}) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleClose = () => {
    setPin("");
    setError("");
    onHide();
  };

  const handleVerify = async () => {
    if (!pin) {
      setError("Please enter PIN");
      return;
    }
    setIsVerifying(true);
    const isValid = await verifyDocumentManagerPin(pin);
    setIsVerifying(false);
    if (isValid) {
      setPin("");
      setError("");
      onVerified();
    } else {
      setError("Incorrect PIN");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered className={modalThemeClass1}>
      <div className={`p-10 m-title ${modalThemeClass}`}>Enter PIN</div>
      <Modal.Body className={`${modalThemeClass}`}>
        <p className={`m-title-2 ${modalThemeClass}`}>
          Enter PIN to open Document Manager.
        </p>
        <input
          type="password"
          className="form-control"
          placeholder="Enter PIN"
          value={pin}
          autoFocus
          onChange={(e) => {
            setPin(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
        />
        {error && (
          <div style={{ color: "red", marginTop: "6px" }}>{error}</div>
        )}
        <div className="d-flex justify-content-end modal-buttons">
          <Button className="modal-button1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="modal-button2"
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying..." : "Submit"}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DocumentManagerPinModal;
