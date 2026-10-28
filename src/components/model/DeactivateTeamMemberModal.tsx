import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";

interface IMember {
  id: number;
  username: string;
}

interface IProps {
  show: boolean;
  onHide: () => void;
  memberId?: number;
  // Runs the actual deactivation once any reassignment has been done.
  onDeactivate: () => void;
}

// Deactivate confirmation with an optional "move their work to someone else"
// step: tasks/tickets, contacts, inquiries, open reminders and reporting
// member links are handed to the chosen person before the member is switched off.
const DeactivateTeamMemberModal = ({ show, onHide, memberId, onDeactivate }: IProps) => {
  const [members, setMembers] = useState<IMember[]>([]);
  const [toId, setToId] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    setToId("");
    // /my-team already leaves out deactivated members
    axiosInstance
      .post("my-team", { a_application_login_id: localStorage.getItem("UUID") })
      .then(({ data }) => {
        if (data?.ack !== DEFAULT_STATUS_CODE_SUCCESS) return;
        setMembers(
          (data.data?.item || [])
            .filter((m: any) => Number(m.id) !== Number(memberId))
            .map((m: any) => ({ id: Number(m.id), username: String(m.username || `User ${m.id}`) })),
        );
      })
      .catch(() => setMembers([]));
  }, [show, memberId]);

  const handleConfirm = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      if (toId !== "") {
        const { data } = await axiosInstance.post("my-team-reassign", { from_id: memberId, to_id: toId });
        if (data?.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
          toast.error(data?.ack_msg || "Failed to move assignments");
          return;
        }
      }
      onDeactivate();
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Deactivate this Team member</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are You Sure You Want To deactivate This Team member?</p>
        <Form.Group>
          <Form.Label>Assign their work to a different person (optional)</Form.Label>
          <Form.Select
            value={toId === "" ? "" : String(toId)}
            onChange={(e) => setToId(e.target.value === "" ? "" : Number(e.target.value))}
            disabled={isSaving}
          >
            <option value="">Don't reassign</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.username}
              </option>
            ))}
          </Form.Select>
          <Form.Text muted>
            Moves their tasks, tickets, contacts, inquiries, open reminders and reporting links.
          </Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>
          CANCEL
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={isSaving}
          style={{ backgroundColor: "#f58634", borderColor: "#f58634" }}
        >
          {isSaving ? "Saving..." : "Deactivate"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeactivateTeamMemberModal;
