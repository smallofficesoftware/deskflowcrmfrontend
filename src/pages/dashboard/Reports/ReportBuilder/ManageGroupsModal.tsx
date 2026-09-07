import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../../../components/model/ConfirmationModal";
import { createReportGroup, deleteReportGroup, IReportGroup, listReportGroups, updateReportGroup } from "./ReportBuilderController";

interface ManageGroupsModalProps {
  show: boolean;
  onClose: () => void;
  // Called after any create/rename/delete — the modal keeps its own list
  // for rendering, but the caller (Step 4's group <select>, and eventually
  // ReportBuilderListView.tsx too) has a separate copy it needs to refresh.
  onChanged: () => void;
}

// Self-contained (fetches/mutates its own report_groups list) so both the
// wizard's Step 4 and the eventual list-level screen (piece 6) can mount it
// without duplicating the rename/delete/add handlers ReportBuilderView.tsx
// currently has inline. Ported field-for-field from that existing modal.
const ManageGroupsModal: React.FC<ManageGroupsModalProps> = ({ show, onClose, onChanged }) => {
  const [reportGroups, setReportGroups] = useState<IReportGroup[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  // Themed replacement for window.confirm() — same pattern
  // ReportBuilderListView.tsx uses for its own delete buttons.
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const askConfirm = (message: string, onConfirm: () => void) => setConfirmDialog({ message, onConfirm });

  const load = async () => setReportGroups(await listReportGroups());

  useEffect(() => {
    if (show) load();
  }, [show]);

  if (!show) return null;

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    const created = await createReportGroup(newGroupName.trim(), reportGroups.length);
    if (created) {
      setNewGroupName("");
      load();
      onChanged();
    }
  };
  const handleStartRenameGroup = (group: IReportGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.group_name);
  };
  const handleSaveRenameGroup = async () => {
    if (editingGroupId === null || !editingGroupName.trim()) return;
    const ok = await updateReportGroup(editingGroupId, editingGroupName.trim());
    if (ok) {
      setEditingGroupId(null);
      load();
      onChanged();
    }
  };
  const handleDeleteGroup = async (id: number) => {
    const ok = await deleteReportGroup(id);
    if (ok) {
      load();
      onChanged();
    }
  };

  return (
    <div className="modal1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="modal-content1" style={{ width: 420, marginTop: "5%", maxHeight: "80vh", overflowY: "auto" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5>Manage Groups</h5>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        {reportGroups.length === 0 && <p className="text-muted">No groups yet.</p>}
        {reportGroups.map((g) => (
          <div key={g.id} className="d-flex justify-content-between align-items-center border-bottom py-2 gap-2">
            {editingGroupId === g.id ? (
              <input
                className="form-control form-control-sm"
                value={editingGroupName}
                onChange={(e) => setEditingGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveRenameGroup()}
                autoFocus
              />
            ) : (
              <span style={{ fontSize: 13 }}>{g.group_name}</span>
            )}
            <div className="d-flex gap-1">
              {editingGroupId === g.id ? (
                <button className="btn btn-sm rb-btn-outline-primary" onClick={handleSaveRenameGroup}>
                  Save
                </button>
              ) : (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleStartRenameGroup(g)}>
                  Rename
                </button>
              )}
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() =>
                  askConfirm(`Delete group "${g.group_name}"? Reports in it aren't deleted.`, () => handleDeleteGroup(g.id))
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        <div className="d-flex gap-2 mt-3">
          <input
            className="form-control form-control-sm"
            placeholder="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
          />
          <button className="btn btn-sm rb-btn-primary" onClick={handleAddGroup}>
            Add
          </button>
        </div>
      </div>

      <ConfirmationModal
        show={!!confirmDialog}
        onHide={() => setConfirmDialog(null)}
        handleSubmit={() => {
          confirmDialog?.onConfirm();
          setConfirmDialog(null);
        }}
        title="Please Confirm"
        message={confirmDialog?.message}
        btn1="Cancel"
        btn2="Delete"
      />
    </div>
  );
};

export default ManageGroupsModal;
