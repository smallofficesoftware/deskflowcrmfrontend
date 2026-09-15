import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  fetchDuplicateContactGroups,
  IDuplicateContactGroup,
} from "./DuplicateContactsController";
import MergeContactModal from "./MergeContactModal";

interface IPropsFindDuplicateContactsModal {
  show: boolean;
  onHide: () => void;
  onMerged: () => void;
}

const FindDuplicateContactsModal = ({
  show,
  onHide,
  onMerged,
}: IPropsFindDuplicateContactsModal) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const [groups, setGroups] = useState<IDuplicateContactGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergeContactIds, setMergeContactIds] = useState<number[]>([]);

  const loadGroups = () => {
    fetchDuplicateContactGroups(setGroups, setLoading);
  };

  useEffect(() => {
    if (show) {
      loadGroups();
    }
  }, [show]);

  const handleMerged = () => {
    setMergeContactIds([]);
    loadGroups();
    onMerged();
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" className={modalThemeClass}>
        <div className={`p-10 m-title ${modalThemeClass}`}>Duplicate Contacts</div>
        <Modal.Body className={`${modalThemeClass}`}>
          {loading ? (
            <p className="text-center py-3">Checking for duplicate contacts...</p>
          ) : groups.length === 0 ? (
            <p className="text-center py-3">No duplicate contacts found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table table-sm" style={{ minWidth: "560px" }}>
                <thead>
                  <tr>
                    <th>Mobile</th>
                    <th>Contacts</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.mobile_number}>
                      <td>{group.mobile_number}</td>
                      <td>
                        {group.contacts.map((c) => c.person_name || "-").join(", ")}
                        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                          {group.contacts.length} contacts
                        </div>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() =>
                            setMergeContactIds(group.contacts.map((c) => c.id))
                          }
                        >
                          Review &amp; Merge
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className={`${modalThemeClass}`}>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {mergeContactIds.length >= 2 && (
        <MergeContactModal
          show={mergeContactIds.length >= 2}
          onHide={() => setMergeContactIds([])}
          contactIds={mergeContactIds}
          onMerged={handleMerged}
        />
      )}
    </>
  );
};

export default FindDuplicateContactsModal;
