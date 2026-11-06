import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

// "Allowed IP addresses" card of the "API" addon settings - VIEW ONLY. The list is set by the DeskflowCRM team from
// the admin panel; an empty list blocks every API call (backend: services/api-access/apiAccessIpService.js).

const ApiAccessIpList = () => {
  const [loading, setLoading] = useState(true);
  const [ips, setIps] = useState<string[]>([]);
  const [yourIp, setYourIp] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.post("api-access/ips/get", {});
        if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          setIps(data.data?.item?.allowed_ips ?? []);
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

  return (
    <section className="card shadow-sm border-0 bg-light p-3 mb-3">
      <h5>Allowed IP addresses</h5>
      <p className="small text-muted mb-2">
        The API can only be used from the addresses below, for every key. This list is managed by the DeskflowCRM team - contact your account
        manager to add or change an address.
      </p>
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : ips.length === 0 ? (
        <div className="small text-danger">No IP is allowed yet - the API is blocked until your account manager adds one.</div>
      ) : (
        <ul className="list-unstyled mb-0">
          {ips.map((ip) => (
            <li key={ip} style={{ fontFamily: "monospace" }}>
              {ip}
            </li>
          ))}
        </ul>
      )}
      {yourIp && <div className="small text-muted mt-2">Your current IP: {yourIp}</div>}
    </section>
  );
};

export default ApiAccessIpList;
