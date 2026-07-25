import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { IReminderList } from "../../pages/left-side/header/list-reminder/ListReminderController";
import { useTheme } from "../ThemeContext";

const ConfirmationModal = ({
  show,
  onHide,
  handleSubmit,
  handleReject,
  title,
  message,
  message1,
  btn1 = "yes",
  btn2 = "no",
  btn3,
  checkBox,
  isoption,
  opt1,
  opt2,
  opt3,
  showPermission,
  permissionText,
  flag_to_action
}: {
  show: boolean;
  onHide: () => void;
  handleSubmit: () => void;
  title: string;
  message?: string;
  message1?: string;
  handleReject?: () => void;
  btn1: string;
  btn2: string;
  btn3?: string;
  checkBox?: boolean;
  isoption?: boolean;
  opt1?: string;
  opt2?: string;
  opt3?: string;
  showPermission?: boolean,
  permissionText?: string,
  flag_to_action?: string,

}) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
  const [permissionChecked, setPermissionChecked] = React.useState(false);
  const [isSubmitButtonDesabled, setIsSubmitButtonDesabled] = React.useState(false);
  const [count, setCount] = React.useState(3);
  const [isReminderConfirmation, setIsReminderConfirmation] = useState(false);
  const [reminderRescheduleData, setReminderRescheduleData] =
    useState<IReminderList>();

  useEffect(() => {
    if (show && flag_to_action == 'delete_flag') {
      setIsSubmitButtonDesabled(true);
      setCount(3);

      let timer = 3;
      const interval = setInterval(() => {
        timer--;
        setCount(timer);

        if (timer === 0) {
          clearInterval(interval);
          setIsSubmitButtonDesabled(false);   // enable button
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [show]);

  // Process message to handle <br> and <a> tags
  const renderMessage = (msg?: string) => {
    if (!msg) return null;

    // Split on <br> tags
    const lines = msg.split("<br>");
    return lines.map((line, index) => {
      // Handle <a> tags (e.g., <a href="url">text</a>)
      const linkMatch = line.match(/<a href="([^"]+)">([^<]+)<\/a>/);
      if (linkMatch) {
        return (
          <div
            key={index}
            className={`m-title-2 ${modalThemeClass}`}
            style={{ marginBottom: "8px" }}
          >
            <a href={linkMatch[1]} target="_blank" rel="noopener noreferrer">
              {linkMatch[2]}
            </a>
          </div>
        );
      }

      // Render non-empty lines or <br /> for empty lines
      if (line.trim() === "") {
        return <br key={index} />;
      }
      return (
        <div
          key={index}
          className={`m-title-2 ${modalThemeClass}`}
          style={{ marginBottom: "8px" }}
        >
          {line.trim()}
        </div>
      );
    });
  };

  return (
    <React.Fragment>
      <Modal show={show} onHide={onHide} centered className={modalThemeClass1}>
        <div className={`p-10 m-title ${modalThemeClass}`}>{title}</div>
        <Modal.Body className={`${modalThemeClass}`}>
          {message ? (
            <>
              <div>{renderMessage(message)}</div>
              {message1 && (
                <p className={`m-title-2 ${modalThemeClass}`}>{message1}</p>
              )}
            </>
          ) : (
            <span></span>
          )}
          {checkBox ? (
            <div className={`m-list checkbox`}>
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
          {showPermission ? (
            <div className={`m-list checkbox`}>
              <input
                className="form-check-input-custom"
                type="checkbox"
                name="groupsRadios"
                value=""
                id="keep-starred-message"
                checked={permissionChecked}
                onChange={(e) => setPermissionChecked(e.target.checked)}
              />
              <label
                className="form-check-label p-1"
                htmlFor="keep-starred-message"
              >
                <h4 className={`${modalThemeClass}`}>{permissionText} </h4>
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
          <div className="d-flex justify-content-end modal-buttons">
            <Button className="modal-button1" onClick={onHide}>
              {btn1}
            </Button>
            {handleReject ? (
              <Button disabled={isSubmitButtonDesabled} className="modal-button2" onClick={handleReject}>
                {isSubmitButtonDesabled ? `Wait ${count}` : btn2}
              </Button>
            ) : (
              <Button
                className="modal-button2"
                onClick={handleSubmit}
                disabled={(showPermission && !permissionChecked) || isSubmitButtonDesabled}
              >
                {isSubmitButtonDesabled ? `Wait ${count}` : btn2}
              </Button>
            )}
            {btn3 && (
              <Button className="modal-button2" onClick={handleSubmit}>
                {btn3}
              </Button>
            )}
          </div>
        </Modal.Body>
        {/* {isReminderConfirmation && (
            <ReminderModal
              show={isReminderConfirmation}
              onHide={() => setIsReminderConfirmation(false)}
              handleSubmit={handleReminder}
              title={"Reminder Reschedule"}
              message={"Are you sure you want to reschedule this reminder?"}
              btn1="CANCEL"
              btn2="Set Reminder"
              remarkMsg={reminderRescheduleData?.remark}
              selectedMember={reminderRescheduleData?.assigned_to_name}
              selectedMemberId={reminderRescheduleData?.assigned_to}
              request_flag="1"
            />
          )} */}
      </Modal>
    </React.Fragment>
  );
};

export default ConfirmationModal;
