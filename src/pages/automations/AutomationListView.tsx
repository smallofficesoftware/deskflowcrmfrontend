import { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { deleteFlow, duplicateFlow, getUsage, listFlows, toggleFlow } from "./automationApi";
import { IFlowSummary } from "./automationTypes";
import { IUsage } from "./automationTypes";

const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleString() : "—");

const AutomationListView = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<IFlowSummary[]>([]);
  const [usage, setUsage] = useState<IUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IFlowSummary | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [flowsRes, usageRes] = await Promise.all([listFlows(), getUsage()]);
      if (flowsRes.ack === DEFAULT_STATUS_CODE_SUCCESS) setFlows(flowsRes.data.item);
      if (usageRes.ack === DEFAULT_STATUS_CODE_SUCCESS) setUsage(usageRes.data.item);
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (flow: IFlowSummary) => {
    setBusyId(flow.id);
    try {
      const res = await toggleFlow(flow.id, !flow.is_active);
      if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(res.ack_msg);
        load();
      } else {
        toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (flow: IFlowSummary) => {
    setBusyId(flow.id);
    try {
      const res = await duplicateFlow(flow.id);
      if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success(res.ack_msg);
        load();
      } else {
        toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await deleteFlow(deleteTarget.id);
      if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        toast.success("Automation deleted");
        load();
      } else {
        toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  const notIncluded = usage?.included === false;
  const atLimit = !!usage?.max_active_flows && usage.active_flows >= usage.max_active_flows;

  return (
    <div style={{ padding: 24 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">Automations</h4>
          {usage && (
            <p className="text-muted small mb-0">
              {usage.active_flows}
              {usage.max_active_flows != null ? ` / ${usage.max_active_flows}` : ""} active automation
              {usage.active_flows === 1 ? "" : "s"} · {usage.runs_this_month}
              {usage.max_runs_per_month != null ? ` / ${usage.max_runs_per_month}` : ""} runs this month
            </p>
          )}
        </div>
        <Button
          variant="primary"
          disabled={notIncluded}
          onClick={() => {
            if (atLimit) {
              toast.error(`Your plan allows ${usage?.max_active_flows} active automations`);
              return;
            }
            navigate("/Automations/flows/new");
          }}
        >
          + New Automation
        </Button>
      </div>

      {notIncluded && (
        <div className="alert alert-warning py-2">Automations are not included in your plan. Ask your administrator to upgrade.</div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" /> Loading…
        </div>
      ) : flows.length === 0 ? (
        <div className="text-center text-muted py-5 border rounded bg-white">
          No automations yet. Click "New Automation" to build your first flow.
        </div>
      ) : (
        <div className="bg-white border rounded">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Trigger</th>
                <th>Steps</th>
                <th>Last run</th>
                <th>Runs</th>
                <th>Status</th>
                <th style={{ width: 220 }}></th>
              </tr>
            </thead>
            <tbody>
              {flows.map((flow) => (
                <tr key={flow.id}>
                  <td>
                    <span
                      role="button"
                      style={{ color: "#1070b2", fontWeight: 600 }}
                      onClick={() => navigate(`/Automations/flows/${flow.id}`)}
                    >
                      {flow.name}
                    </span>
                    {flow.description && <div className="text-muted small">{flow.description}</div>}
                    {flow.is_paused === 1 && flow.paused_reason && (
                      <div className="text-danger small">⚠ {flow.paused_reason}</div>
                    )}
                  </td>
                  <td>{flow.trigger_label}</td>
                  <td>{flow.step_count}</td>
                  <td>{fmtDate(flow.last_run_at)}</td>
                  <td>{flow.run_count}</td>
                  <td>
                    <Form.Check
                      type="switch"
                      checked={flow.is_active === 1}
                      disabled={busyId === flow.id}
                      onChange={() => handleToggle(flow)}
                      label={flow.is_active === 1 ? "On" : "Off"}
                    />
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      className="me-2"
                      onClick={() => navigate(`/Automations/flows/${flow.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      className="me-2"
                      disabled={busyId === flow.id}
                      onClick={() => handleDuplicate(flow)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={busyId === flow.id}
                      onClick={() => setDeleteTarget(flow)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        handleSubmit={handleDelete}
        handleReject={() => setDeleteTarget(null)}
        title="Delete automation"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        btn1="Delete"
        btn2="Cancel"
      />
    </div>
  );
};

export default AutomationListView;
