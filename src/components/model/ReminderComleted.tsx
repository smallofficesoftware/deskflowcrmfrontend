import React from "react";
import { Button, Modal } from "react-bootstrap";
import { useTheme } from "../ThemeContext";
const ConfirmationModal = ({
  show,
  onHide,
  handleSubmit,
  handleNewSubmit,
  title,
  message,
  message1,
  btn1 = "yes",
  btn2 = "no",
  btn3 = "cancel",
  checkBox,
  isoption,
  opt1,
  opt2,
  opt3,
}: {
  show: boolean;
  onHide: () => void;
  handleSubmit: () => void;
  handleNewSubmit: () => void;
  title: string;
  message?: string;
  message1?: string;
  btn1: string;
  btn2: string;
  btn3: string;
  checkBox?: boolean;
  isoption?: boolean;
  opt1?: string;
  opt2?: string;
  opt3?: string;
}) => {
  // alert(handleNewSubmit);
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";

  const renderMessage = (msg: any) => {
    const isHtml = /<\/?[a-z][\s\S]*>/i.test(msg);

    return isHtml ? (
      <span dangerouslySetInnerHTML={{ __html: msg }} />
    ) : (
      <span>{msg}</span>
    );
  };

  return (
    <React.Fragment>
      <Modal show={show} onHide={onHide} centered className={modalThemeClass1}>
        <div className={` p-10 m-title ${modalThemeClass}`} style={{ width: "600px" }}>{title}</div>
        <Modal.Body className={`${modalThemeClass}`} style={{ width: "600px" }}>
          {message ? (
            <>
              <p
                className={`m-title-2 ${modalThemeClass}`}
              >
                {renderMessage(message)}
                <p>
                  {renderMessage(message1)}
                </p>
              </p>
            </>
          ) : (
            <span></span>
          )}
          {checkBox ? (
            <div className={`m-list checkbox `}>
              <input
                className="form-check-input-custom"
                type="checkbox"
                name="groupsRadios"
                value=""
                id="keep-starred-message"
              />
              <label
                className="form-check-label p-1"
                htmlFor="keep-starred-message"
              >
                <h4 className={`${modalThemeClass}`}> Keep Starred Message </h4>
              </label>
            </div>
          ) : (
            <span></span>
          )}
          {isoption ? (
            <div className={`${modalThemeClass}`}>
              <ul>
                <li>
                  <div className="m-list">
                    <label className="form-check-label" htmlFor="8-hours">
                      <input
                        className="form-check-input-custom"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="8-hours"
                        checked
                      />
                      <h4>{opt1}</h4>
                    </label>
                  </div>
                </li>
                <li>
                  <div className="m-list">
                    <label className="form-check-label" htmlFor="week">
                      <input
                        className="form-check-input-custom"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="week"
                      />
                      <h4>{opt2}</h4>
                    </label>
                  </div>
                </li>
                <li>
                  <div className="m-list">
                    <label className="form-check-label" htmlFor="always">
                      <input
                        className="form-check-input-custom"
                        type="radio"
                        name="groupsRadios"
                        value=""
                        id="always"
                      />
                      <h4>{opt3}</h4>
                    </label>
                  </div>
                </li>
              </ul>
            </div>
          ) : (
            " "
          )}
          <div className="d-flex justify-content-end  m-btn w-100">
            <Button className="mr-2 px-4 btn1" onClick={onHide}>
              {btn1}
            </Button>
            <Button className="px-4 ms-2 btn2 w-100" onClick={handleSubmit}>
              {btn2}
            </Button>
            <Button className="px-4 ms-2 btn2 w-100" onClick={handleNewSubmit}>
              {btn3}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

export default ConfirmationModal;
