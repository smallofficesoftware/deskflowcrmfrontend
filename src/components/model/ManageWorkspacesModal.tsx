import React, { useEffect, useState } from "react";
import { Button, Form, ListGroup, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../helpers/AppConstants";
import { axiosInstance } from "../../services/axiosInstance";
import {
  fetchCompanyApi,
  fetchCompanyTeamApi,
  ICompany,
  ICompanyTeam,
} from "../../pages/left-side/list-company/ListCompanyController";

interface IManageWorkspacesModalProps {
  show: boolean;
  onHide: () => void;
}

const ManageWorkspacesModal = ({
  show,
  onHide,
}: IManageWorkspacesModalProps) => {
  const [companyLists, setCompanyLists] = useState<ICompany[]>([]);
  const [parentTeamList, setParentTeamList] = useState<ICompanyTeam[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [noDataFound, setNoDataFound] = useState<any>(false);
  const [companyJoinOrCreate, setCompanyJoinOrCreate] = useState<any>(false);
  const [isSwitching, setIsSwitching] = useState<number | null>(null);
  const isSubmittingRef = React.useRef(false);

  const activeCompanyId = localStorage.getItem("COMPANY_ID");

  const fetchWorkspaces = async () => {
    await fetchCompanyApi(
      setCompanyLists,
      "",
      setNoDataFound,
      setCompanyJoinOrCreate,
      setIsLoading,
    );
  };

  const handleSwitchWorkspace = async (workspaceId: number) => {
    try {
      setIsSwitching(workspaceId);
      const token = localStorage.getItem("token");
      const response = await axiosInstance.post(
        "selectWorkspace",
        { companyId: workspaceId },
        {
          headers: {
            Authorization: `${token}`,
          },
        },
      );

      if (
        response.data.code === 200 &&
        response.data.ack === DEFAULT_STATUS_CODE_SUCCESS
      ) {
        const storeToken = response.data?.data?.token;
        const storeId = response?.data?.data.item?.id;
        const storeUserName = response?.data?.data.item?.username;

        localStorage.setItem("token", storeToken);
        localStorage.setItem("UUID", storeId);
        localStorage.setItem("USERNAME", storeUserName);
        localStorage.setItem("COMPANY_ID", workspaceId.toString());

        toast.success("Switched workspace successfully!");
        onHide();

        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        toast.error(response.data.ack_msg || "Failed to switch workspace");
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.ack_msg || "An error occurred during switch",
      );
    } finally {
      setIsSwitching(null);
    }
  };

  useEffect(() => {
    if (show) {
      fetchWorkspaces();
    }
  }, [show]);

  // Determine parent company details
  const activeCompany = companyLists.find(
    (c) => c.id === Number(activeCompanyId),
  );
  const parentCompanyId = activeCompany?.parent_company_id || activeCompany?.id;

  useEffect(() => {
    if (show && parentCompanyId) {
      fetchCompanyTeamApi(setParentTeamList, parentCompanyId, "");
    }
  }, [show, parentCompanyId]);

  // Filter workspaces belonging to this company hierarchy (fallback to companyLists if no parent match)
  const filteredWorkspaces = companyLists.filter(
    (c) => c.id === parentCompanyId || c.parent_company_id === parentCompanyId,
  );
  const workspaces = filteredWorkspaces.length > 0 ? filteredWorkspaces : companyLists;

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!newWorkspaceName.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }
    if (!parentCompanyId) {
      toast.error("Parent company details not found");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsCreating(true);
      const response = await axiosInstance.post(
        "createWorkspace",
        {
          workspace_name: newWorkspaceName.trim(),
          parent_company_id: parentCompanyId,
          employee_ids: selectedEmployees,
        },
        {
          timeout: 300000, // 5 minutes timeout (to allow SQL replication and migrations)
        },
      );

      if (
        response.data.code === 200 &&
        response.data.ack === DEFAULT_STATUS_CODE_SUCCESS
      ) {
        toast.success(
          response.data.ack_msg || "Workspace created successfully!",
        );
        setNewWorkspaceName("");
        setSelectedEmployees([]);
        await fetchWorkspaces();
      } else {
        toast.error(response.data.ack_msg || "Failed to create workspace");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || "An error occurred");
    } finally {
      setIsCreating(false);
      isSubmittingRef.current = false;
    }
  };

  // Determine if active company is Main Company or a child workspace
  const isMainCompany =
    activeCompany?.parent_company_id === null ||
    activeCompany?.parent_company_id === undefined;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="fw-bold font-size-20">
          Manage Workspaces
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <p className="text-muted font-size-14 mb-4">
          View your workspaces or switch active workspace. Workspaces can only be created from the Main Company.
        </p>

        {/* Workspace Creation Form - Only visible for Main Company */}
        {isMainCompany ? (
          <Form
            onSubmit={handleCreateWorkspace}
            className="mb-4 border p-3 rounded bg-white"
          >
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold font-size-14">
                Workspace Name
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter new workspace name (e.g. branch office)"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                disabled={isCreating}
                className="py-2"
              />
            </Form.Group>

            {parentTeamList.filter((member) => member.company_flag === 2).length >
              0 && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold font-size-14">
                  Assign Employees & Copy Permissions
                </Form.Label>
                <div
                  className="border rounded p-3 bg-light"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {parentTeamList
                    .filter((member) => member.company_flag === 2)
                    .map((member) => (
                      <Form.Check
                        key={member.id}
                        type="checkbox"
                        id={`employee-${member.id}`}
                        label={`${member.username} (${member.recovery_mobile})`}
                        checked={selectedEmployees.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees([
                              ...selectedEmployees,
                              member.id,
                            ]);
                          } else {
                            setSelectedEmployees(
                              selectedEmployees.filter((id) => id !== member.id),
                            );
                          }
                        }}
                        className="mb-2"
                      />
                    ))}
                </div>
                <Form.Text className="text-muted">
                  Selected employees will automatically get access and inherit
                  their permissions in the new workspace database.
                </Form.Text>
              </Form.Group>
            )}

            <div className="d-flex justify-content-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isCreating}
                style={{
                  backgroundColor: "#f58634",
                  borderColor: "#f58634",
                  whiteSpace: "nowrap",
                }}
                className="px-4 py-2"
              >
                {isCreating ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Creating...
                  </>
                ) : (
                  "Add Workspace"
                )}
              </Button>
            </div>
          </Form>
        ) : (
          <div
            className="p-3 mb-4 rounded border"
            style={{ backgroundColor: "#fff3eb", borderColor: "#f58634" }}
          >
            <span className="fw-semibold text-dark font-size-14">
              Note:
            </span>{" "}
            <span className="text-muted font-size-13">
              Workspaces can only be created from the Main Company. Please switch to your Main Company to create a new workspace.
            </span>
          </div>
        )}

        <h5 className="fw-semibold mb-3 font-size-16">Workspaces List</h5>

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center text-muted py-3">
            No workspaces found.
          </div>
        ) : (
          <ListGroup variant="flush" className="border rounded">
            {workspaces.map((workspace) => {
              const isActive = workspace.id === Number(activeCompanyId);
              const isParent = workspace.parent_company_id === null;

              return (
                <ListGroup.Item
                  key={workspace.id}
                  className="d-flex justify-content-between align-items-center py-3 px-4"
                  style={{
                    backgroundColor: isActive ? "#fff9f5" : "#fff",
                  }}
                >
                  <div className="d-flex align-items-center">
                    <div>
                      <span className="fw-semibold text-dark font-size-15">
                        {workspace.company_name}
                      </span>
                      {isParent ? (
                        <span className="badge bg-primary text-white ms-2 font-size-10 fw-normal">
                          Main Company
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted ms-2 font-size-10 border fw-normal">
                          Workspace
                        </span>
                      )}
                      {isActive && (
                        <span
                          className="badge ms-2 font-size-10 fw-normal"
                          style={{ backgroundColor: "#f58634", color: "#fff" }}
                        >
                          Active Session
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-muted font-size-13">
                      {workspace.company_email}
                    </div>
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleSwitchWorkspace(workspace.id)}
                        disabled={isSwitching !== null}
                        style={{
                          fontSize: "12px",
                          padding: "4px 12px",
                        }}
                      >
                        {isSwitching === workspace.id ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Switch"
                        )}
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0">
        <Button variant="secondary" onClick={onHide} className="px-4">
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ManageWorkspacesModal;
