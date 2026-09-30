import { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../helpers/AppConstants";
import { getSettings, saveSettings } from "./automationApi";

const WEEKDAYS = [
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
  { v: 7, label: "Sun" },
];

const AutomationSettingsView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [waPerMinute, setWaPerMinute] = useState("");
  const [waPerDay, setWaPerDay] = useState("");
  const [quietFrom, setQuietFrom] = useState("");
  const [quietTo, setQuietTo] = useState("");
  const [bhFrom, setBhFrom] = useState("");
  const [bhTo, setBhTo] = useState("");
  const [bhDays, setBhDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [timezone, setTimezone] = useState("+05:30");
  const [alertUsers, setAlertUsers] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getSettings();
        if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) {
          const s = res.data.item;
          setWaPerMinute(s.wa_limit_per_minute?.toString() || "");
          setWaPerDay(s.wa_limit_per_day?.toString() || "");
          setQuietFrom(s.quiet_hours_from || "");
          setQuietTo(s.quiet_hours_to || "");
          setBhFrom(s.business_hours?.from || "");
          setBhTo(s.business_hours?.to || "");
          setBhDays(s.business_hours?.days || [1, 2, 3, 4, 5, 6]);
          setTimezone(s.timezone || "+05:30");
          setAlertUsers((s.failure_alert_user_ids || []).join(", "));
        }
      } catch (e: any) {
        toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleDay = (d: number) => setBhDays((days) => (days.includes(d) ? days.filter((x) => x !== d) : [...days, d]));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveSettings({
        wa_limit_per_minute: waPerMinute ? Number(waPerMinute) : null,
        wa_limit_per_day: waPerDay ? Number(waPerDay) : null,
        quiet_hours_from: quietFrom || null,
        quiet_hours_to: quietTo || null,
        business_hours: bhFrom && bhTo ? { from: bhFrom, to: bhTo, days: bhDays } : null,
        timezone,
        failure_alert_user_ids: alertUsers
          .split(",")
          .map((s) => Number(s.trim()))
          .filter(Boolean),
      });
      if (res.ack === DEFAULT_STATUS_CODE_SUCCESS) toast.success("Settings saved");
      else toast.error(res.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } catch (e: any) {
      toast.error(e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" /> Loading…
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h4 className="mb-3">Automation settings</h4>

      <h6 className="mt-4">WhatsApp sending limits</h6>
      <p className="text-muted small">Leave blank for no limit.</p>
      <div className="d-flex gap-3 mb-3">
        <Form.Group style={{ flex: 1 }}>
          <Form.Label className="small">Per minute</Form.Label>
          <Form.Control size="sm" type="number" value={waPerMinute} onChange={(e) => setWaPerMinute(e.target.value)} />
        </Form.Group>
        <Form.Group style={{ flex: 1 }}>
          <Form.Label className="small">Per day</Form.Label>
          <Form.Control size="sm" type="number" value={waPerDay} onChange={(e) => setWaPerDay(e.target.value)} />
        </Form.Group>
      </div>

      <h6 className="mt-4">Quiet hours</h6>
      <p className="text-muted small">Automated WhatsApp sends are held until quiet hours end.</p>
      <div className="d-flex gap-3 mb-3">
        <Form.Group style={{ flex: 1 }}>
          <Form.Label className="small">From</Form.Label>
          <Form.Control size="sm" type="time" value={quietFrom} onChange={(e) => setQuietFrom(e.target.value)} />
        </Form.Group>
        <Form.Group style={{ flex: 1 }}>
          <Form.Label className="small">To</Form.Label>
          <Form.Control size="sm" type="time" value={quietTo} onChange={(e) => setQuietTo(e.target.value)} />
        </Form.Group>
      </div>

      <h6 className="mt-4">Business hours</h6>
      <p className="text-muted small">Used by triggers/steps marked "only in business hours".</p>
      <div className="d-flex gap-3 mb-2">
        <Form.Group style={{ flex: 1 }}>
          <Form.Label className="small">From</Form.Label>
          <Form.Control size="sm" type="time" value={bhFrom} onChange={(e) => setBhFrom(e.target.value)} />
        </Form.Group>
        <Form.Group style={{ flex: 1 }}>
          <Form.Label className="small">To</Form.Label>
          <Form.Control size="sm" type="time" value={bhTo} onChange={(e) => setBhTo(e.target.value)} />
        </Form.Group>
      </div>
      <div className="d-flex gap-3 mb-3">
        {WEEKDAYS.map((d) => (
          <Form.Check key={d.v} type="checkbox" label={d.label} checked={bhDays.includes(d.v)} onChange={() => toggleDay(d.v)} />
        ))}
      </div>

      <h6 className="mt-4">Timezone</h6>
      <Form.Control size="sm" style={{ maxWidth: 140 }} value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mb-3" />

      <h6 className="mt-4">Failure alerts</h6>
      <Form.Label className="small">Team member IDs to notify, comma separated (the flow's own creator always gets one too)</Form.Label>
      <Form.Control size="sm" value={alertUsers} onChange={(e) => setAlertUsers(e.target.value)} className="mb-3" />

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Spinner size="sm" animation="border" /> : "Save settings"}
      </Button>
    </div>
  );
};

export default AutomationSettingsView;
