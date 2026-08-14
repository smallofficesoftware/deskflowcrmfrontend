import { useState } from "react";
import { useEscapeKey } from "../../../common/SharedFunction";
import { TReactSetState } from "../../../helpers/AppType";
import CRMDashboardView from "./crm-dashboard/CRMDashboardView";
import HRMDashboardView from "./hrm-dashboard/HRMDashboardView";
import ProductionDashboardView from "./production-dashboard/ProductionDashboardView";

interface Props {
  onClose: () => void;
  insightsSideView?: boolean;
  setActiveView?: TReactSetState<string>;
  setAppliedReportType?: TReactSetState<string>;
}

const NewDashboardView = ({
  onClose,
  insightsSideView = false,
  setActiveView,
  setAppliedReportType,
}: Props) => {
  const [activeModule, setActiveModule] = useState<
    "CRM" | "HRM" | "PRODUCTION"
  >("CRM");

  useEscapeKey(() => onClose());

  return (
    <div
      style={{
        width: "98%",
        height: "100vh",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px",
          // background: "rgb(240 242 245)",
          width: "100%",
        }}
      >
        <h2 className="modal-title1 form_header_text mb-0">My Insights</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "flex-end",
            gap: "10px",
            // padding: "10px",
            // background: "rgb(240 242 245)",
            marginLeft: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label className="fw-bold mb-1">Dashboard:</label>
            <select
              className="form-select"
              style={{ width: "200px" }}
              value={activeModule}
              onChange={(e) => setActiveModule(e.target.value as any)}
            >
              <option value="CRM">CRM</option>
              <option value="HRM">HRMS</option>
              <option value="PRODUCTION">Production & Inventory</option>
            </select>
          </div>
        </div>

        {!insightsSideView && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              fontSize: "18px",
              cursor: "pointer",
              flexShrink: 0,
              marginLeft: "20px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#5f6368"
            >
              <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
            </svg>
          </button>
        )}
      </div>

      <hr />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
        }}
      >
        {activeModule === "CRM" && <CRMDashboardView />}
        {activeModule === "HRM" && (
          <HRMDashboardView
            setActiveView={setActiveView}
            setAppliedReportType={setAppliedReportType}
          />
        )}
        {activeModule === "PRODUCTION" && <ProductionDashboardView />}
      </div>
    </div>
  );
};

export default NewDashboardView;
