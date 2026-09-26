import { useEffect, useState } from "react";
import { Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { getSample, listenForSample, listWebhooks, updateWebhook } from "./automationApi";
import { IWebhookRow } from "./automationTypes";

const WebhookListView = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<IWebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleFor, setSampleFor] = useState<IWebhookRow | null>(null);
  const [sample, setSample] = useState<any>(null);
  const [listening, setListening] = useState(false);
  const [pollTimer, setPollTimer] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listWebhooks();
      if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) setRows(res.data.item);
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => pollTimer && clearInterval(pollTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied");
    } catch {
      toast.info(url);
    }
  };

  const rotate = async (row: IWebhookRow) => {
    const res = await updateWebhook(row.flow_id, { rotate: true });
    if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) {
      toast.success("URL rotated - update anywhere it was used");
      load();
    } else {
      toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    }
  };

  const setAuth = async (row: IWebhookRow, auth_type: string) => {
    const res = await updateWebhook(row.flow_id, { auth_type });
    if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) load();
    else toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
  };

  const openListen = async (row: IWebhookRow) => {
    setSampleFor(row);
    setSample(null);
    setListening(false);
    const res = await getSample(row.flow_id);
    if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) setSample(res.data.item.sample);
  };

  const startListening = async () => {
    if (!sampleFor) return;
    const res = await listenForSample(sampleFor.flow_id);
    if (res.ack !== DEFAULT_STATUS_CODE_SUCCESS) {
      toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      return;
    }
    setListening(true);
    toast.info("Listening for 5 minutes - send a test call to the URL now");
    const timer = setInterval(async () => {
      const s = await getSample(sampleFor.flow_id);
      if (s.ack === DEFAULT_STATUS_CODE_SUCCESS && s.data.item.sample) {
        setSample(s.data.item.sample);
        setListening(false);
        clearInterval(timer);
      }
    }, 3000);
    setPollTimer(timer);
  };

  return (
    <div style={{ padding: 24 }}>
      <h4 className="mb-3">Webhooks</h4>
      <p className="text-muted small">
        Incoming URLs for automations that start from "Incoming webhook call" - use these to connect a website form, Facebook /
        Google lead ads, or another system.
      </p>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" size="sm" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted py-5 border rounded bg-white">
          No webhook automations yet. Create one with the "Incoming webhook call" trigger.
        </div>
      ) : (
        <div className="bg-white border rounded">
          <Table size="sm" className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Automation</th>
                <th>URL</th>
                <th>Auth</th>
                <th>Last called</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span role="button" style={{ color: "#1070b2" }} onClick={() => navigate(`/Automations/flows/${row.flow_id}`)}>
                      {row.flow_name || `#${row.flow_id}`}
                    </span>
                    {!row.flow_active && <span className="badge bg-secondary ms-2">off</span>}
                  </td>
                  <td>
                    <code style={{ fontSize: 11 }}>{row.url}</code>
                  </td>
                  <td style={{ width: 130 }}>
                    <Form.Select size="sm" value={row.auth_type} onChange={(e) => setAuth(row, e.target.value)}>
                      <option value="token">Token only</option>
                      <option value="secret">Secret header</option>
                      <option value="hmac">HMAC signature</option>
                    </Form.Select>
                  </td>
                  <td>{row.last_called_at ? new Date(row.last_called_at).toLocaleString() : "Never"}</td>
                  <td className="text-end">
                    <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => copyUrl(row.url)}>
                      Copy
                    </Button>
                    <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => openListen(row)}>
                      Sample
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => rotate(row)}>
                      Rotate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={!!sampleFor} onHide={() => setSampleFor(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sample call</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {sample ? (
            <>
              <p className="small text-muted">Last call received - use these paths in your rules and steps as {"{{data.<field>}}"}.</p>
              <pre style={{ maxHeight: 300, overflow: "auto", fontSize: 12 }}>{JSON.stringify(sample, null, 2)}</pre>
            </>
          ) : (
            <>
              <p className="small text-muted">No sample saved yet. Click "Listen" then send a test call to the URL above.</p>
              <Button size="sm" onClick={startListening} disabled={listening}>
                {listening ? <Spinner size="sm" animation="border" /> : "Listen for 5 minutes"}
              </Button>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default WebhookListView;
