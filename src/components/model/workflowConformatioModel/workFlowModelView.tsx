import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import CustomSearchDropdown from "../../CustomSearchDropdown";
import { useTheme } from "../../ThemeContext";
import {
  checkIsExistWorkflow,
  gettemplate,
  startWorkflow,
  stopWorkFlow,
} from "./workFlowModelController";
import { TReactSetState } from "../../../helpers/AppType";
import { axiosInstance } from "../../../services/axiosInstance";
import {
  DEFAULT_STATUS_CODE_SUCCESS,
  MESSAGE_UNKNOWN_ERROR_OCCURRED,
} from "../../../helpers/AppConstants";

const WorkFlowModel = ({
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
  showTaskTemplateFor,
  showOrderId,
  setWorkFlowFor,
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
  showPermission?: boolean;
  permissionText?: string;
  showTaskTemplateFor?: number;
  showOrderId?: number;
  setWorkFlowFor?: string;
}) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const modalThemeClass1 = darkMode ? "modal-dark" : "modal-light-1";
  const [permissionChecked, setPermissionChecked] = React.useState(false);
  const [dropdownData, setDropdownData] = useState<any[]>([]);
  const [selectedDropdown, setSelectedDropdown] = useState<any>(null);
  const [isStartWorkFlowStop, setIsStartWorkFlowStop] = useState(false);
  const [isStopWorkFlowLoading, setIsStopWorkFlowLoading] = useState(false);

  const selectDropdown = dropdownData.map((WeeklyDays: any) => ({
    value: WeeklyDays.id,
    label: WeeklyDays.name,
  }));

  const renderMessage = (msg?: string) => {
    if (!msg) return null;

    const lines = msg.split("<br>");
    return lines.map((line, index) => {
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

  useEffect(() => {
    gettemplate(showTaskTemplateFor && showTaskTemplateFor, setDropdownData);
    setIsStartWorkFlowStop(false);
  }, [showTaskTemplateFor]);

  useEffect(() => {
    if (selectedDropdown) {
      checkIsExistWorkflow(
        selectedDropdown.value,
        setWorkFlowFor,
        showOrderId,
        setIsStartWorkFlowStop,
      );
    }
  }, [selectedDropdown]);

  const stopWorkFlowbtn = async () => {
    await stopWorkFlow(
      selectedDropdown.value,
      setWorkFlowFor,
      showOrderId,
      setIsStopWorkFlowLoading,
    );
    await checkIsExistWorkflow(
      selectedDropdown.value,
      setWorkFlowFor,
      showOrderId,
      setIsStartWorkFlowStop,
    );
  };

  const handleSubmits = () => {
    if (selectedDropdown != null) {
      startWorkflow(
        selectedDropdown,
        showOrderId,
        setWorkFlowFor,
        handleSubmit,
      );
    } else {
      toast.error("Please Select Template");
    }
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

          <CustomSearchDropdown
            options={selectDropdown}
            value={selectedDropdown}
            onChange={(value: any) => setSelectedDropdown(value)}
          />

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
          <div className="d-flex justify-content-start modal-buttons">
            {!isStopWorkFlowLoading && (
              <button
                disabled={!isStartWorkFlowStop}
                className="btn btn-danger"
                onClick={stopWorkFlowbtn}
              >
                STOP WORKFLOW
              </button>
            )}
            {isStopWorkFlowLoading && (
              <button disabled={true} className="btn btn-danger">
                ...
              </button>
            )}
          </div>
          <div className="d-flex justify-content-end modal-buttons">
            <Button className="modal-button1" onClick={onHide}>
              {btn1}
            </Button>
            {handleReject ? (
              <Button className="modal-button2" onClick={handleReject}>
                {btn2}
              </Button>
            ) : (
              <Button
                className="modal-button2"
                onClick={handleSubmits}
                disabled={showPermission && !permissionChecked}
              >
                {btn2}
              </Button>
            )}
            {btn3 && (
              <Button className="modal-button2" onClick={handleSubmits}>
                {btn3}
              </Button>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

export default WorkFlowModel;
