import { Fragment, useEffect, useState } from "react";
import { Button, Form, Spinner, Table } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { cancelExecution, getExecution, listExecutions } from "./automationApi";
import { IExecutionDetail, IExecutionSummary } from "./automationTypes";

const STATUS_COLOR: Record<string, string> = {
  success: "success",
  failed: "danger",
  waiting: "warning",
  running: "info",
  skipped: "secondary",
  cancelled: "secondary",
};

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString() : "—");

const ExecutionListView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const flowId = searchParams.get("flow_id");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<IExecutionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<IExecutionDetail | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listExecutions({ flow_id: flowId ? Number(flowId) : undefined, status: status || undefined, limit: 50 });
      if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) setRows(res.data.item);
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId, status]);

  const toggleExpand = async (row: IExecutionSummary) => {
    if (expandedId === row.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(row.id);
    setDetail(null);
    const res = await getExecution(row.id);
    if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) setDetail(res.data.item);
  };

  const handleCancel = async (row: IExecutionSummary) => {
    const res = await cancelExecution(row.id);
    if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success("Run cancelled");
      load();
    } else {
      toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Executions {flowId ? `— automation #${flowId}` : ""}</h4>
        <div className="d-flex gap-2">
          {flowId && (
            <Button size="sm" variant="outline-secondary" onClick={() => setSearchParams({})}>
              Clear filter
            </Button>
          )}
          <Form.Select size="sm" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {["running", "waiting", "success", "failed", "cancelled", "skipped"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted py-5 border rounded bg-white">No runs yet.</div>
      ) : (
        <div className="bg-white border rounded">
          <Table size="sm" className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Automation</th>
                <th>Record</th>
                <th>Status</th>
                <th>Started</th>
                <th>Finished</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr role="button" onClick={() => toggleExpand(row)}>
                    <td>{row.flow_name || `#${row.flow_id}`}</td>
                    <td>{row.record_type ? `${row.record_type} #${row.record_id}` : "—"}</td>
                    <td>
                      <span className={`badge bg-${STATUS_COLOR[row.status] || "secondary"}`}>{row.status}</span>
                      {row.is_test === 1 && <span className="badge bg-light text-dark ms-1">test</span>}
                    </td>
                    <td>{fmt(row.started_at)}</td>
                    <td>{fmt(row.completed_at)}</td>
                    <td className="text-end">
                      {row.status === "waiting" && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(row);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr>
                      <td colSpan={6} style={{ background: "#f8fafc" }}>
                        {!detail ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          <div className="py-2">
                            {detail.error && <div className="text-danger small mb-2">{detail.error}</div>}
                            <Table size="sm" bordered className="mb-0 bg-white">
                              <thead>
                                <tr>
                                  <th>Step</th>
                                  <th>Status</th>
                                  <th>Output / error</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.logs.map((log) => (
                                  <tr key={log.id}>
                                    <td>{log.node_type}</td>
                                    <td>
                                      <span className={`badge bg-${STATUS_COLOR[log.status] || "secondary"}`}>{log.status}</span>
                                    </td>
                                    <td>
                                      <pre className="mb-0 small" style={{ whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>
                                        {log.error || JSON.stringify(log.output, null, 2)}
                                      </pre>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ExecutionListView;
