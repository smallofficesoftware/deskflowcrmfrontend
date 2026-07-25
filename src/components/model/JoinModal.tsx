import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useTheme } from "../ThemeContext";
const JoinModal = ({
  show,
  onHide,
  handleSubmit,
  title,
  message,
  btn1 = "yes",
  btn2 = "no",
}: {
  show: boolean;
  onHide: () => void;
  handleSubmit: (data: { remark: string }) => void;
  title: string;
  message?: string;
  btn1: string;
  btn2: string;
}) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
  const [remark, setRemark] = useState<string>("");

  const handleRemarkChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setRemark(event.target.value);
  };

  const handleSave = () => {
    const data = { remark };
    handleSubmit(data);
  };

  return (
    <React.Fragment>
      <Modal show={show} onHide={onHide} centered className={modalThemeClass1}>
        <div className={` p-10 m-title ${modalThemeClass}`}>{title}</div>
        <Modal.Body className={`${modalThemeClass}`}>
          {message ? (
            <div
              className={`m-title-2 col-12 ${modalThemeClass}`}
            >
              <br />

              <label className="col-12">
                Enter invitation key
                <textarea
                  rows={1}
                  cols={30}
                  value={remark}
                  onChange={handleRemarkChange}
                  className="form-control font-size-15 rounded-1"
                />
                <p>How to Get Invitation Link ? - Contact Company owner</p>
              </label>
            </div>
          ) : (
            <span></span>
          )}
          <div className="d-flex justify-content-end  m-btn">
            <Button className="mr-2 px-4 btn1" onClick={onHide}>
              {btn1}
            </Button>
            <Button className="px-4 ms-2 btn2" onClick={handleSave}>
              {btn2}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

export default JoinModal;
