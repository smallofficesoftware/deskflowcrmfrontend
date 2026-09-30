import { useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../helpers/AppConstants";
import { axiosInstance } from "../../../services/axiosInstance";

interface IWorkspaceUsageCardProps {
  parentCompanyId?: number;
}

const WorkspaceUsageCard = ({ parentCompanyId }: IWorkspaceUsageCardProps) => {
  const [usage, setUsage] = useState<{
    limit: number | null;
    used: number;
    storageLimitGb: number | null;
  } | null>(null);

  useEffect(() => {
    if (!parentCompanyId) return;
    axiosInstance
      .post("workspaceLimitInfo", { parent_company_id: parentCompanyId })
      .then((response) => {
        const item = response.data?.data?.item;
        if (response.data?.ack === DEFAULT_STATUS_CODE_SUCCESS && item) {
          setUsage({
            limit: item.limit,
            used: item.used,
            storageLimitGb: item.storage_limit_gb ?? null,
          });
        }
      })
      .catch(() => setUsage(null));
  }, [parentCompanyId]);

  if (!usage) return null;

  return (
    <Row className="mb-2">
      <Col md={6} className="dash-board-company-column">
        <Card className="text-end" style={{ borderRadius: "0px" }}>
          <Card.Body>
            <h4 className="dash-board-text-company-count">
              {usage.used + "/" + (usage.limit === null ? "Unlimited" : usage.limit)}
            </h4>
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#5f6368"
              >
                <path d="M80-120v-640h400v160h400v480H80Zm80-80h240v-80H160v80Zm0-160h240v-80H160v80Zm0-160h240v-80H160v80Zm0-160h240v-80H160v80Zm320 480h320v-320H480v320Zm80-160v-80h160v80H560Zm0 160v-80h160v80H560Z" />
              </svg>
            </span>
            <h4 className="dash-board-company-text">Workspaces</h4>
          </Card.Body>
        </Card>
      </Col>
      {usage.storageLimitGb !== null && (
        <Col md={6} className="dash-board-company-column">
          <Card className="text-end" style={{ borderRadius: "0px" }}>
            <Card.Body>
              <h4 className="dash-board-text-company-count">
                {usage.storageLimitGb + " GB"}
              </h4>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#5f6368"
                >
                  <path d="M160-160q-33 0-56.5-23.5T80-240v-160q0-33 23.5-56.5T160-480h640q33 0 56.5 23.5T880-400v160q0 33-23.5 56.5T800-160H160Zm0-80h640v-160H160v160Zm40-40h80v-80h-80v80Zm-40-260q-33 0-56.5-23.5T80-640v-80q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v80q0 33-23.5 56.5T800-560H160Zm0-80h640v-80H160v80Zm40-40h80v-80h-80v80Z" />
                </svg>
              </span>
              <h4 className="dash-board-company-text">Storage (Plan Limit)</h4>
            </Card.Body>
          </Card>
        </Col>
      )}
    </Row>
  );
};

export default WorkspaceUsageCard;
