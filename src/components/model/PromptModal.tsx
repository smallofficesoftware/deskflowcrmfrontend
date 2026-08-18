import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTheme } from "../ThemeContext";

// Themed replacement for window.prompt() — single text-input confirm dialog,
// same modal-light-1/modal-dark theme classes as ConfirmationModal so it
// always matches the app's current theme instead of the native browser popup.
const PromptModal = ({
  show,
  onHide,
  onSubmit,
  title,
  message,
  defaultValue = "",
  placeholder,
  submitLabel = "OK",
  cancelLabel = "Cancel",
}: {
  show: boolean;
  onHide: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
}) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (show) setValue(defaultValue);
  }, [show, defaultValue]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Modal show={show} onHide={onHide} centered className={modalThemeClass1}>
      <div className={`p-10 m-title ${modalThemeClass}`}>{title}</div>
      <Modal.Body className={`${modalThemeClass}`}>
        {message && <p className={`m-title-2 ${modalThemeClass}`}>{message}</p>}
        <input
          className="form-control form-control-sm"
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <div className="d-flex justify-content-end modal-buttons mt-3">
          <Button className="modal-button1" onClick={onHide}>
            {cancelLabel}
          </Button>
          <Button className="modal-button2" onClick={submit} disabled={!value.trim()}>
            {submitLabel}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default PromptModal;
