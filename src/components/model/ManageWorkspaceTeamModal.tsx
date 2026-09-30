import { useEffect, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";

interface IWorkspaceEmployee {
  id: number;
  username: string;
  recovery_mobile: string;
  in_workspace: boolean;
}

interface IManageWorkspaceTeamModalProps {
  show: boolean;
  onHide: () => void;
  workspaceId?: number;
  workspaceName?: string;
}

const ManageWorkspaceTeamModal = ({
  show,
  onHide,
  workspaceId,
  workspaceName,
}: IManageWorkspaceTeamModalProps) => {
  const [employees, setEmployees] = useState<IWorkspaceEmployee[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!show || !workspaceId) return;
    setIsLoading(true);
    axiosInstance
      .post("workspaceTeamGet", { workspace_id: workspaceId })
      .then((response) => {
        if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          const list: IWorkspaceEmployee[] =
            response.data?.data?.item?.employees || [];
          setEmployees(list);
          setSelectedIds(list.filter((e) => e.in_workspace).map((e) => e.id));
        } else {
          toast.error(response.data?.ack_msg || "Failed to load team");
        }
      })
      .catch((error: any) =>
        toast.error(error?.response?.data?.ack_msg || "An error occurred"),
      )
      .finally(() => setIsLoading(false));
  }, [show, workspaceId]);

  const toggle = (id: number, checked: boolean) =>
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

  const addIds = employees
    .filter((e) => selectedIds.includes(e.id) && !e.in_workspace)
    .map((e) => e.id);
  const removeIds = employees
    .filter((e) => !selectedIds.includes(e.id) && e.in_workspace)
    .map((e) => e.id);
  const hasChanges = addIds.length > 0 || removeIds.length > 0;

  const handleSave = async () => {
    if (!workspaceId || !hasChanges || isSaving) return;
    try {
      setIsSaving(true);
      const response = await axiosInstance.post("workspaceTeamUpdate", {
        workspace_id: workspaceId,
        add_ids: addIds,
        remove_ids: removeIds,
      });
      if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const item = response.data?.data?.item;
        toast.success(response.data?.ack_msg || "Workspace team updated");
        if (item?.rights_failed > 0) {
          toast.warning(
            "Some members were added but their permissions could not be copied. Please check their rights in the workspace.",
          );
        }
        onHide();
      } else {
        toast.error(response.data?.ack_msg || "Failed to update team");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="fw-bold font-size-18">
          Manage Team{workspaceName ? ` - ${workspaceName}` : ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted font-size-13 mb-3">
          Tick the employees of your Main Company who should have access to this
          workspace. Added employees get the same permissions they have in the
          Main Company. Unticking only removes their access to this workspace.
        </p>
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center text-muted py-3">
            No employees found in the Main Company.
          </div>
        ) : (
          <div
            className="border rounded p-3 bg-light"
            style={{ maxHeight: "320px", overflowY: "auto" }}
          >
            {employees.map((member) => (
              <Form.Check
                key={member.id}
                type="checkbox"
                id={`ws-team-${member.id}`}
                label={`${member.username} (${member.recovery_mobile})`}
                checked={selectedIds.includes(member.id)}
                onChange={(e) => toggle(member.id, e.target.checked)}
                disabled={isSaving}
                className="mb-2"
              />
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0">
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          style={{ backgroundColor: "#f58634", borderColor: "#f58634" }}
        >
          {isSaving ? <Spinner size="sm" animation="border" /> : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ManageWorkspaceTeamModal;
