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
        {/* Clickable icon grid — matches the approved wizard mock's own
            icon-grid design, over this app's real REPORT_ICON_PATHS set
            (every icon the old <select> offered, none dropped) rather than
            the mock's own smaller placeholder set. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 8, maxWidth: 420 }}>
          <button
            type="button"
            title="Default"
            aria-label="Default icon"
            onClick={() => store.setIcon("")}
            style={{
              aspectRatio: "1",
              borderRadius: 9,
              border: `1.5px solid ${!store.icon ? "#F58634" : "#e5e7eb"}`,
              background: !store.icon ? "#fff3eb" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ReportIcon name="report" size={15} color={!store.icon ? "#F58634" : "#6b7280"} />
          </button>
          {Object.keys(REPORT_ICON_PATHS).map((iconName) => {
            const selected = store.icon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                title={iconName}
                aria-label={iconName}
                onClick={() => store.setIcon(iconName)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 9,
                  border: `1.5px solid ${selected ? "#F58634" : "#e5e7eb"}`,
                  background: selected ? "#fff3eb" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ReportIcon name={iconName} size={15} color={selected ? "#F58634" : "#6b7280"} />
              </button>
            );
          })}
        </div>
      </div>

      <ManageGroupsModal show={showManageGroups} onClose={() => setShowManageGroups(false)} onChanged={loadReportGroups} />
    </div>
  );
};

export default StepOrganize;
