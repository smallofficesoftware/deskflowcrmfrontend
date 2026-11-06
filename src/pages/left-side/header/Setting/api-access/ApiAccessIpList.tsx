import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

// IP allow-list card of the "API" addon settings. One list per company, applied to every API key.
// An empty list blocks every API call (backend: services/api-access/apiAccessIpService.js).

const ApiAccessIpList = () => {
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [yourIp, setYourIp] = useState("");
  const [saving, setSaving] = useState(false);

  const parse = (value: string) =>
    value
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.post("api-access/ips/get", {});
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          const list: string[] = data.data?.item?.allowed_ips ?? [];
          setSaved(list);
          setText(list.join("\n"));
          setYourIp(data.data?.item?.your_ip ?? "");
        } else {
          toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.ack_msg || error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const entries = parse(text);
  const dirty = entries.join("\n") !== saved.join("\n");

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.post("api-access/ips/save", { allowed_ips: entries });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const list: string[] = data.data?.item?.allowed_ips ?? entries;
        setSaved(list);
        setText(list.join("\n"));
        toast.success("Allowed IPs saved");
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.ack_msg || error?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setSaving(false);
    }
  };

  const addMyIp = () => {
    if (!yourIp || entries.includes(yourIp)) return;
    setText(entries.length ? `${entries.join("\n")}\n${yourIp}` : yourIp);
  };

  return (
    <section className="card shadow-sm border-0 bg-light p-3 mb-3">
      <h5>Allowed IP addresses</h5>
      <p className="small text-muted mb-2">
        The API can only be used from the addresses listed here, for every key. One per line: a single address (203.0.113.5) or a range (203.0.113.0/24).
        <b> With an empty list every API call is blocked.</b> A change applies within about 30 seconds.
      </p>
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : (
        <>
          {saved.length === 0 && <div className="small text-danger mb-2">No IP is allowed yet - the API is blocked for everyone.</div>}
          <textarea
            className="form-control mb-2"
            rows={5}
            style={{ maxWidth: 420, fontFamily: "monospace" }}
            placeholder={"203.0.113.5\n198.51.100.0/24"}
            value={text}
            disabled={saving}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <button className="btn report_button" onClick={save} disabled={saving || !dirty}>
              {saving ? "Saving..." : "Save IPs"}
            </button>
            {yourIp && (
              <button className="btn btn-outline-secondary" onClick={addMyIp} disabled={saving || entries.includes(yourIp)}>
                Add my current IP ({yourIp})
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default ApiAccessIpList;
