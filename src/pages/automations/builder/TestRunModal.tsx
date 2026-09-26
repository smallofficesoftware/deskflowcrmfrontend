import { useState } from "react";
import { Alert, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../helpers/AppConstants";
import { getExecution, testFlow } from "../automationApi";
import { IExecutionDetail } from "../automationTypes";

interface IProps {
  show: boolean;
  onHide: () => void;
  flowId: number;
  recordType: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  success: "success",
  failed: "danger",
  waiting: "warning",
  running: "info",
  skipped: "secondary",
};

const TestRunModal = ({ show, onHide, flowId, recordType }: IProps) => {
  const [recordId, setRecordId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<IExecutionDetail | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await testFlow(flowId, recordId ? Number(recordId) : undefined, recordType || undefined);
      if (res.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
        toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        return;
      }
      const executionId = res.data.item?.execution_id;
      if (executionId) {
        const detail = await getExecution(executionId);
        if (detail.ack === DEFAULT_STATUS_CODE_SUCCESS) setResult(detail.data.item);
      } else {
        toast.error(res.data.item?.reason || "Nothing ran - check the automation is complete");
      }
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Test run</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="py-2 small">
          Nothing is sent or saved - this is a dry run.
        </Alert>
        {recordType && (
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">
              {recordType} ID to test with (leave blank to test the shape only)
            </Form.Label>
            <Form.Control size="sm" type="number" value={recordId} onChange={(e) => setRecordId(e.target.value)} />
          </Form.Group>
        )}
        <Button size="sm" onClick={run} disabled={running}>
          {running ? <Spinner size="sm" animation="border" /> : "Run test"}
        </Button>

        {result && (
          <div className="mt-3">
            <div className="mb-2">
              Result: <span className={`badge bg-${STATUS_COLOR[result.status] || "secondary"}`}>{result.status}</span>
              {result.error && <span className="text-danger small ms-2">{result.error}</span>}
            </div>
            <Table size="sm" bordered>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Status</th>
                  <th>Output</th>
                </tr>
              </thead>
              <tbody>
                {result.logs.map((log) => (
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
      </Modal.Body>
    </Modal>
  );
};

export default TestRunModal;
