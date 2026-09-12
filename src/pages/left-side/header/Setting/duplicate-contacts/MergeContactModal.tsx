import { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { formatDateAndTime } from "../../../../../common/SharedFunction";
import { useTheme } from "../../../../../components/ThemeContext";
import {
  fetchContactMergePreview,
  IContactMergePreview,
  mergeDuplicateContact,
} from "./DuplicateContactsController";

interface IPropsMergeContactModal {
  show: boolean;
  onHide: () => void;
  contactIds: number[];
  onMerged: () => void;
}

const TABLE_LABELS: Record<string, string> = {
  inquiries: "Inquiry",
  contact_message_histories: "Message",
  task_managements: "Task",
  reminder_messages: "Reminder",
  account_transactions: "Transaction",
  cart_items: "Cart Item",
  carts: "Cart",
  call_histories: "Call",
  route_plan_vs_contacts: "Route Plan",
  visits: "Visit",
  job_cards: "Job Card",
};

const summarizeActivity = (preview: IContactMergePreview | undefined, contactId: number) => {
  if (!preview) return { total: 0, newest: null as string | null, byTable: [] as string[] };
  let total = 0;
  let newest: string | null = null;
  const byTable: string[] = [];
  Object.entries(preview.activity).forEach(([label, rows]) => {
    const row = rows.find((r) => Number(r.contact_id) === Number(contactId));
    if (row && row.cnt > 0) {
      const cnt = Number(row.cnt);
      total += cnt;
      const name = TABLE_LABELS[label] || label;
      byTable.push(`${cnt} ${name}${cnt > 1 ? "s" : ""}`);
      if (row.newest && (!newest || row.newest > newest)) {
        newest = row.newest;
      }
    }
  });
  return { total, newest, byTable };
};

const MergeContactModal = ({ show, onHide, contactIds, onMerged }: IPropsMergeContactModal) => {
  const { darkMode } = useTheme();
  const modalThemeClass = darkMode ? "modal-light-1" : "modal-light-1";
  const [preview, setPreview] = useState<IContactMergePreview>();
  const [loading, setLoading] = useState(false);
  const [keepId, setKeepId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (show && contactIds.length >= 2) {
      setPreview(undefined);
      setKeepId(undefined);
      fetchContactMergePreview(contactIds, setPreview, setLoading);
    }
  }, [show, contactIds.join(",")]);

  const handleMerge = async () => {
    if (!keepId) return;
    const mergeIds = contactIds.filter((id) => id !== keepId);
    setLoading(true);
    for (const mergeId of mergeIds) {
      const ok = await mergeDuplicateContact(keepId, mergeId, () => { }, () => { });
      if (!ok) {
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    onMerged();
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className={modalThemeClass}>
      <div className={`p-10 m-title ${modalThemeClass}`}>Merge Duplicate Contacts</div>
      <Modal.Body className={`${modalThemeClass}`}>
        {loading && !preview ? (
          <p className="text-center py-3">Loading contact activity...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {preview && new Set(preview.contacts.map((c) => c.mobile_number)).size > 1 && (
              <div className="alert alert-warning py-2" style={{ fontSize: "0.85rem" }}>
                These contacts have <strong>different mobile numbers</strong>. Merging is still
                allowed (e.g. the same person contacted from two numbers), but double-check this
                is intentional before confirming - it cannot be undone.
              </div>
            )}
            <table className="table table-sm" style={{ minWidth: "560px" }}>
              <thead>
                <tr>
                  <th>Keep</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Created</th>
                  <th>Linked records</th>
                </tr>
              </thead>
              <tbody>
                {(preview?.contacts || []).map((contact) => {
                  const summary = summarizeActivity(preview, contact.id);
                  return (
                    <tr key={contact.id}>
                      <td>
                        <input
                          type="radio"
                          name="keepContact"
                          checked={keepId === contact.id}
                          onChange={() => setKeepId(contact.id)}
                        />
                      </td>
                      <td>{contact.person_name || "-"}</td>
                      <td>{contact.mobile_number}</td>
                      <td>{formatDateAndTime(contact.created_date_time)}</td>
                      <td>
                        {summary.total === 0 ? (
                          "No linked records"
                        ) : (
                          <>
                            {summary.byTable.join(", ")}
                            {summary.newest ? (
                              <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                                newest {formatDateAndTime(summary.newest)}
                              </div>
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-muted" style={{ fontSize: "0.85rem" }}>
              Pick the contact to keep. Every linked record (inquiries, messages, tasks, carts, etc.)
              from the other contact(s) will be moved onto the kept contact, then the duplicate(s)
              will be removed. This cannot be undone.
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className={`${modalThemeClass}`}>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleMerge} disabled={!keepId || loading}>
          {loading ? "Merging..." : "Merge"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MergeContactModal;
