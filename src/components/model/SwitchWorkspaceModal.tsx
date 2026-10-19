import React, { useEffect, useState } from "react";
import { ListGroup, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { switchWorkspace } from "../../helpers/switchWorkspace";
import {
  fetchCompanyApi,
  ICompany,
} from "../../pages/left-side/list-company/ListCompanyController";

interface ISwitchWorkspaceModalProps {
  show: boolean;
  onHide: () => void;
}

const isMainCompany = (company: ICompany) =>
  company.parent_company_id === null || company.parent_company_id === undefined;

/**
 * Quick workspace switcher opened from the company badge on the home screen:
 * every company/workspace of this login with a Switch button, the active one
 * marked Current. Switching reloads the app in the chosen workspace.
 */
const SwitchWorkspaceModal = ({ show, onHide }: ISwitchWorkspaceModalProps) => {
  const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  const activeCompanyId = localStorage.getItem("COMPANY_ID");

  // Without a stored id, the main company (no parent) is the active one.
  const isActive = (company: ICompany) =>
    activeCompanyId
      ? company.id === Number(activeCompanyId)
      : isMainCompany(company);

  useEffect(() => {
    if (!show) return;
    fetchCompanyApi(setCompanyLists, "", () => {}, () => {}, setIsLoading);
  }, [show]);

  const handleSwitch = async (company: ICompany) => {
    setSwitchingId(company.id);
    const result = await switchWorkspace(company.id);
    setSwitchingId(null);
    if (result.ok) {
      toast.success(result.message);
      onHide();
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="fw-bold font-size-20">
          Switch Workspace
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : (
          <ListGroup variant="flush">
            {companyLists.map((company) => (
              <ListGroup.Item
                key={company.id}
                className="d-flex align-items-center justify-content-between px-0"
              >
                <div>
                  <div className="fw-bold">{company.company_name}</div>
                  <span
                    className="badge rounded-pill"
                    style={{
                      backgroundColor: isMainCompany(company)
                        ? "#f58634"
                        : "#64748b",
                      color: "#ffffff",
                      fontSize: "10px",
                    }}
                  >
                    {isMainCompany(company) ? "Main Company" : "Workspace"}
                  </span>
                </div>
                {isActive(company) ? (
                  <span
                    className="badge rounded-pill"
                    style={{
                      backgroundColor: "#e2e8f0",
                      color: "#475569",
                      fontSize: "11px",
                    }}
                  >
                    Current
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={switchingId !== null}
                    onClick={() => handleSwitch(company)}
                    style={{
                      border: "1px solid #f58634",
                      color: "#f58634",
                      fontWeight: 600,
                    }}
                  >
                    {switchingId === company.id ? "Switching..." : "Switch"}
                  </button>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SwitchWorkspaceModal;
