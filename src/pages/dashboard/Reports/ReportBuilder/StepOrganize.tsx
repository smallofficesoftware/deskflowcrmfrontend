import React, { useEffect, useState } from "react";
import { REPORT_ICON_PATHS, ReportIcon } from "../../../side-view/reportIcons";
import ManageGroupsModal from "./ManageGroupsModal";
import { IReportGroup, listReportGroups } from "./ReportBuilderController";
import { useReportBuilderStore } from "./useReportBuilderStore";

// Step 4 of the wizard — ported field-for-field from ReportBuilderView.tsx's
// existing group-select + icon-picker row. Fetches its own report_groups
// list (small, per-company, same "list is already scoped and small"
// reasoning the Saved Reports search box relies on) rather than threading
// it down from ReportBuilderWizardView.tsx, so ManageGroupsModal's own
// create/rename/delete only has to refresh state that lives right here.
const StepOrganize: React.FC = () => {
  const store = useReportBuilderStore();
  const [reportGroups, setReportGroups] = useState<IReportGroup[]>([]);
  const [showManageGroups, setShowManageGroups] = useState(false);

  const loadReportGroups = async () => setReportGroups(await listReportGroups());
  useEffect(() => {
    loadReportGroups();
  }, []);

  return (
    <div>
      <div className="mb-3">
        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
          Group
        </label>
        <div className="d-flex gap-1">
          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 260 }}
            value={store.reportGroupId ?? ""}
            onChange={(e) => store.setReportGroupId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Ungrouped</option>
            {reportGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowManageGroups(true)}>
            Groups
          </button>
        </div>
      </div>

      <div className="mb-2">
        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
          Icon
        </label>
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#fff3eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ReportIcon name={store.icon || "report"} size={14} color="#F58634" />
          </div>
          <select
            className="form-select form-select-sm"
            style={{ width: 200 }}
            value={store.icon}
            onChange={(e) => store.setIcon(e.target.value)}
          >
            <option value="">Default icon</option>
            {Object.keys(REPORT_ICON_PATHS).map((iconName) => (
              <option key={iconName} value={iconName}>
                {iconName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ManageGroupsModal show={showManageGroups} onClose={() => setShowManageGroups(false)} onChanged={loadReportGroups} />
    </div>
  );
};

export default StepOrganize;
