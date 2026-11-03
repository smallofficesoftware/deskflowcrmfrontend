import { useState } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../services/axiosInstance";

// Re-pull IndiaMART leads for one chosen day. The backend (POST /India-mart)
// takes `date` as DD-MM-YYYY, skips leads already saved, and fills in any
// inquiry / message that is still missing, so running a day twice is safe.
// IndiaMART allows one fetch per key every 5 minutes; its message is shown as is.

const todayIso = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// <input type="date"> gives YYYY-MM-DD; the API wants DD-MM-YYYY.
const toApiDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

const IndiaMartDateFetch = () => {
  const [date, setDate] = useState<string>(todayIso());
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleFetch = async () => {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    const loginId = localStorage.getItem("UUID");
    if (!loginId) {
      toast.error("Missing login details. Please log in again.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await axiosInstance.post("India-mart", {
        a_application_login_id: loginId,
        source_type_id: -1,
        date: toApiDate(date),
      });
      const ok = Number(data?.ack) === 1;
      const message = data?.ack_msg || (ok ? "Fetched successfully" : "Failed to fetch data");
      setResult({ ok, message });
      ok ? toast.success(message) : toast.error(message);
    } catch (error: any) {
      const message =
        error?.response?.data?.ack_msg || error?.message || "Failed to fetch IndiaMART data";
      setResult({ ok: false, message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-group mb-3">
      <label htmlFor="india_mart_fetch_date" className="form_label">
        Fetch IndiaMART leads for a date
      </label>
      <div className="d-flex align-items-center gap-2">
        <input
          id="india_mart_fetch_date"
          type="date"
          className="form-control bg-light"
          style={{ maxWidth: "220px" }}
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          title="Fetch the leads of this date again and add the ones that are missing"
          onClick={handleFetch}
          disabled={loading || !date}
        >
          <i className="bi bi-cloud-download"></i> {loading ? "Fetching..." : "Fetch this date"}
        </button>
      </div>
      <small className="text-muted d-block mt-1">
        Leads already in the CRM are skipped. IndiaMART allows one fetch every 5 minutes.
      </small>
      {result && (
        <div className={`mt-1 ${result.ok ? "text-success" : "text-danger"}`}>{result.message}</div>
      )}
    </div>
  );
};

export default IndiaMartDateFetch;
