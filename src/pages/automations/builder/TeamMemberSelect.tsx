import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { axiosInstance } from "../../../services/axiosInstance";
import { DEFAULT_STATUS_CODE_SUCCESS } from "../../../helpers/AppConstants";

interface IMember {
  id: number;
  username: string;
}

interface IProps {
  value: number | "";
  onChange: (value: number | "") => void;
  emptyLabel?: string;
}

let cache: IMember[] | null = null;

// Dropdown of the company's team members (same "my-team" list the other
// pickers in the CRM use). Keeps a saved id selectable even if that person
// is not in the list (deactivated / out of the user's visible team).
const TeamMemberSelect = ({ value, onChange, emptyLabel = "Not set" }: IProps) => {
  const [members, setMembers] = useState<IMember[]>(cache || []);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axiosInstance.post("my-team", { a_application_login_id: localStorage.getItem("UUID") });
        if (cancelled || data?.ack !== DEFAULT_STATUS_CODE_SUCCESS) return;
        cache = (data.data?.item || []).map((m: any) => ({ id: Number(m.id), username: String(m.username || `User ${m.id}`) }));
        setMembers(cache!);
      } catch {
        /* leave the list empty - the saved id still shows below */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const known = value === "" || members.some((m) => m.id === value);
  return (
    <Form.Select size="sm" value={value === "" ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}>
      <option value="">{emptyLabel}</option>
      {!known && <option value={String(value)}>{`Team member #${value}`}</option>}
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.username}
        </option>
      ))}
    </Form.Select>
  );
};

export default TeamMemberSelect;
