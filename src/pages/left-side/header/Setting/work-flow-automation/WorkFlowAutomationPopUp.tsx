import React from "react";

interface IPropsWorkFlowAutomation {
  show: boolean;
  onHide: () => void;
}

const WorkFlowAutomationPopUp = ({
  show,
  onHide,
}: IPropsWorkFlowAutomation) => {
  return (
    <div>
      {show && (
        <div className="modal1 d-flex align-items-center">
          <div
            className="modal-content1"
            style={{ height: "300px", width: "50%" }}
          >
            <span className="close" onClick={onHide}>
              &times;
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkFlowAutomationPopUp;
