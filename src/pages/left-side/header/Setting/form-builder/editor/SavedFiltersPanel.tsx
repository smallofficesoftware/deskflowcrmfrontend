import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../../../../../services/axiosInstance";
import ConfirmationModal from "../../../../../../components/model/ConfirmationModal";
import { getReferenceOptions, IFormBuilderField } from "../FormBuilderController";
import { IFormSettings, approvalStagesOf, parseSettings } from "../approval";

interface Props {
  settingsJson: string | null | undefined;
  fields: IFormBuilderField[];
  onSettingsChange: (settings: IFormSettings) => void;
}

// Saved filters for the form's entries list (Form settings > Saved filters). Saved in the form's settings as
//   saved_filters: [{ id, name, is_default?, match, groups: [{ match, rules: [rule] }] }]
// and applied by the server (backend formBuilderDefaultFilters.js, which has the same kinds and conditions).
// The entries list offers "All entries" plus each filter by name; the one marked default is applied when the list
// opens. The conditions in a group are joined by the group's own any (OR) / all (AND), and the groups by the
// filter's, so  (Due + 5 days < today AND Abc is xyz) OR (Due + 5 days > today AND Abc is pqr)  is two groups
// joined by OR. A condition can use a form field or one of the entry's own fields (submitted on, status,
// approval, submitted by). Takes effect after you publish.

type Kind = "text" | "number" | "date" | "time" | "bool" | "multi" | "id" | "customer" | "user" | "status" | "stage";
type Match = "all" | "any";
interface IRule {
  field: string;
  op: string;
  value?: string | boolean;
  value2?: string;
  values?: string[];
  values_text?: string; // what was typed in a free-text "is any of" box (the list in `values` is made from it)
  days?: number;
  value_label?: string; // names shown for ids in the readable line only; the server never uses them
  value_labels?: string[];
}
interface IGroup {
  match: Match;
  rules: IRule[];
}
interface ISavedFilter {
  id: string;
  name: string;
  is_default?: boolean;
  match: Match;
  groups: IGroup[];
}
interface Opt {
  value: string;
  label: string;
}

const TYPE_KIND: Record<string, Kind> = {
  text: "text", textarea: "text", phone: "text", email: "text", url: "text", "auto-number": "text", barcode: "text",
  dropdown: "text", radio: "text", address: "text", location: "text",
  number: "number", currency: "number", percentage: "number", rating: "number", calculation: "number",
  date: "date", datetime: "date",
  time: "time",
  checkbox: "bool", switch: "bool", consent: "bool",
  "multi-select": "multi",
  reference: "id",
  "customer-lookup": "customer",
  user: "user",
};

// The entry's own fields, as the server knows them.
const SYSTEM_FIELDS: { key: string; kind: Kind; label: string }[] = [
  { key: "_created", kind: "date", label: "Submitted on" },
  { key: "_status", kind: "status", label: "Status" },
  { key: "_stage", kind: "stage", label: "Approval" },
  { key: "_submitted_by", kind: "user", label: "Submitted by" },
];

const ME = "__me";

const kindOfField = (f: IFormBuilderField): Kind | null => {
  if (f.type === "calculation" && (f as any).result_type === "date") return "date";
  return TYPE_KIND[f.type] || null;
};

const OPS: Record<Kind, { value: string; label: string }[]> = {
  text: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "contains", label: "contains" },
    { value: "starts_with", label: "starts with" },
    { value: "is_any_of", label: "is any of" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  number: [
    { value: "is", label: "=" },
    { value: "is_not", label: "not =" },
    { value: "gt", label: ">" },
    { value: "gte", label: ">=" },
    { value: "lt", label: "<" },
    { value: "lte", label: "<=" },
    { value: "between", label: "is between" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  date: [
    { value: "preset", label: "is in period" },
    { value: "between", label: "is between dates" },
    { value: "gt", label: ">" },
    { value: "gte", label: ">=" },
    { value: "lt", label: "<" },
    { value: "lte", label: "<=" },
    { value: "is", label: "=" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  time: [
    { value: "is", label: "=" },
    { value: "gt", label: ">" },
    { value: "gte", label: ">=" },
    { value: "lt", label: "<" },
    { value: "lte", label: "<=" },
    { value: "between", label: "is between" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  bool: [{ value: "is", label: "is" }],
  multi: [
    { value: "contains", label: "has" },
    { value: "is_any_of", label: "has any of" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  id: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "is_any_of", label: "is any of" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  customer: [
    { value: "contains", label: "name contains" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  user: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "is_any_of", label: "is any of" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  status: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
    { value: "is_any_of", label: "is any of" },
  ],
  stage: [
    { value: "is", label: "is" },
    { value: "at_stage", label: "is at stage" },
  ],
};

const PRESETS: Opt[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "next_7_days", label: "Next 7 days" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
];
const STAGE_OPTS: Opt[] = [
  { value: "waiting_for_me", label: "Waiting for me" },
  { value: "pending", label: "Pending" },
  { value: "sent_back", label: "Sent back" },
  { value: "completed", label: "Completed" },
];
const FORM_SUBMISSIONS_ORDER_TYPE = 15; // the status type of form entries

const MAX_FILTERS = 20;
const MAX_GROUPS = 10;
const MAX_RULES = 20;
const NAME_MAX = 60;
const matchOf = (m: unknown): Match => (m === "any" ? "any" : "all");
const blank = (v: unknown) => v == null || String(v).trim() === "";
const isNoValueOp = (op: string) => op === "is_empty" || op === "is_not_empty";

// A new condition on a field: its first condition, with a sensible starting value.
function freshRule(field: string, kind: Kind): IRule {
  switch (kind) {
    case "date":
      return { field, op: "preset", value: "today" };
    case "bool":
      return { field, op: "is", value: "1" };
    case "multi":
      return { field, op: "contains", value: "" };
    case "customer":
      return { field, op: "contains", value: "" };
    case "stage":
      return { field, op: "is", value: "waiting_for_me" };
    default:
      return { field, op: "is", value: "" };
  }
}

// One filter's groups, from the new { match, groups } form or the older flat { match, rules } form.
function readConfig(cfg: any): { match: Match; groups: IGroup[] } {
  if (cfg && Array.isArray(cfg.groups)) {
    return {
      match: matchOf(cfg.match),
      groups: cfg.groups.filter((g: any) => g && Array.isArray(g.rules)).map((g: any) => ({ match: matchOf(g.match), rules: g.rules })),
    };
  }
  if (cfg && Array.isArray(cfg.rules) && cfg.rules.length) {
    return cfg.match === "any"
      ? { match: "any", groups: cfg.rules.map((r: IRule) => ({ match: "all" as Match, rules: [r] })) }
      : { match: "all", groups: [{ match: "all", rules: cfg.rules }] };
  }
  return { match: "any", groups: [] };
}

// The saved filters. The older single default_filters (before named filters) shows up as one default filter.
function readFilters(settings: IFormSettings): ISavedFilter[] {
  if (Array.isArray(settings.saved_filters)) {
    return settings.saved_filters
      .filter((f: any) => f && typeof f === "object")
      .map((f: any) => ({ id: String(f.id ?? ""), name: String(f.name ?? ""), is_default: f.is_default === true, ...readConfig(f) }));
  }
  const legacy = readConfig(settings.default_filters);
  return legacy.groups.length ? [{ id: "default", name: "Default filter", is_default: true, ...legacy }] : [];
}

const SavedFiltersPanel: React.FC<Props> = ({ settingsJson, fields, onSettingsChange }) => {
  const settings = parseSettings(settingsJson);
  const filters = readFilters(settings);
  const stages: Opt[] = approvalStagesOf(settings).map((s) => ({ value: s.id, label: s.name }));
  const select = "form-control form-control-sm w-auto";
  const smallInput = "form-control form-control-sm";

  // The saved filter waiting for "Delete" to be confirmed (its position), or null.
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Choices behind ids: statuses, team members and the masters of reference fields.
  const [statuses, setStatuses] = useState<Opt[]>([]);
  const [users, setUsers] = useState<Opt[]>([]);
  const [refs, setRefs] = useState<Record<string, Opt[]>>({});
  const masters = Array.from(new Set(fields.filter((f) => f.type === "reference" && f.master).map((f) => f.master as string))).join(",");

  useEffect(() => {
    let alive = true;
    axiosInstance
      .post("get-status", { status_type: FORM_SUBMISSIONS_ORDER_TYPE, a_application_login_id: Number(localStorage.getItem("UUID")) })
      .then(({ data }) => {
        const list = data?.data?.item || data?.data || [];
        if (alive && Array.isArray(list)) setStatuses(list.map((s: any) => ({ value: String(s.id), label: String(s.name) })));
      })
      .catch(() => undefined);
    getReferenceOptions("user").then((res) => {
      const list = res?.data?.item;
      if (alive && Array.isArray(list)) setUsers(list.map((u: any) => ({ value: String(u.id), label: String(u.label) })));
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    masters.split(",").filter(Boolean).forEach((m) => {
      getReferenceOptions(m).then((res) => {
        const list = res?.data?.item;
        if (alive && Array.isArray(list)) setRefs((prev) => ({ ...prev, [m]: list.map((o: any) => ({ value: String(o.id), label: String(o.label) })) }));
      });
    });
    return () => {
      alive = false;
    };
  }, [masters]);

  const formFields = fields.filter((f) => f.key && kindOfField(f));

  // What a rule's `field` points at: its kind and label, or null (removed field / unsupported type).
  const infoFor = (key: string): { kind: Kind; label: string; field?: IFormBuilderField } | null => {
    const sys = SYSTEM_FIELDS.find((s) => s.key === key);
    if (sys) return { kind: sys.kind, label: sys.label };
    const f = fields.find((x) => x.key === key);
    const kind = f ? kindOfField(f) : null;
    return f && kind ? { kind, label: f.label || f.key, field: f } : null;
  };

  // The choices a rule picks from, when there is a fixed list.
  const choicesFor = (info: { kind: Kind; field?: IFormBuilderField }, op: string): Opt[] | null => {
    if (info.kind === "status") return statuses;
    if (info.kind === "user") return [{ value: ME, label: "Me" }, ...users];
    if (info.kind === "id") return refs[info.field?.master || ""] || [];
    if (info.kind === "stage") return op === "at_stage" ? stages : STAGE_OPTS;
    if ((info.kind === "text" || info.kind === "multi") && Array.isArray(info.field?.options) && info.field!.options!.length) {
      return info.field!.options!.map((o) => ({ value: o, label: o }));
    }
    return null;
  };

  const save = (next: ISavedFilter[]) => {
    const out: IFormSettings = { ...settings };
    delete out.default_filters; // replaced by saved_filters
    if (next.length) out.saved_filters = next;
    else delete out.saved_filters;
    onSettingsChange(out);
  };

  const firstUsable = (): IRule | null => {
    const first = formFields[0];
    if (first) return freshRule(first.key, kindOfField(first) as Kind);
    return freshRule(SYSTEM_FIELDS[0].key, SYSTEM_FIELDS[0].kind);
  };

  const setFilter = (fi: number, patch: Partial<ISavedFilter>) => save(filters.map((f, k) => (k === fi ? { ...f, ...patch } : f)));

  const addFilter = () => {
    const rule = firstUsable();
    if (!rule) return;
    const used = new Set(filters.map((f) => f.id));
    let n = filters.length + 1;
    while (used.has(`f${n}`)) n += 1;
    save([...filters, { id: `f${n}`, name: `Filter ${filters.length + 1}`, match: "any", groups: [{ match: "all", rules: [rule] }] }]);
  };

  const setDefault = (fi: number, on: boolean) => save(filters.map((f, k) => ({ ...f, is_default: on && k === fi })));

  // ---- the readable line (same wording as the server's) ----
  const valueName = (r: IRule, choices: Opt[] | null): string => {
    if (r.value === ME) return "me";
    const hit = choices?.find((o) => o.value === String(r.value));
    return r.value_label || hit?.label || String(r.value ?? "");
  };
  const describe = (r: IRule): string | null => {
    const info = infoFor(r.field);
    if (!info) return null;
    const op = OPS[info.kind].find((o) => o.value === r.op)?.label || r.op;
    const choices = choicesFor(info, r.op);
    if (isNoValueOp(r.op)) return `${info.label} ${op}`;
    if (info.kind === "stage") return r.op === "at_stage" ? `${info.label} ${op} ${valueName(r, choices)}` : `${info.label} is ${(STAGE_OPTS.find((o) => o.value === r.value)?.label || "").toLowerCase()}`;
    if (info.kind === "date") {
      if (r.op === "preset") return `${info.label}: ${(PRESETS.find((p) => p.value === r.value)?.label || "").toLowerCase()}`;
      if (r.op === "between") return `${info.label} is between ${r.value ?? ""} and ${r.value2 ?? ""}`;
      const d = Number(r.days) || 0;
      return `${info.label}${d === 0 ? "" : d > 0 ? ` + ${d} day${d === 1 ? "" : "s"}` : ` - ${Math.abs(d)} day${d === -1 ? "" : "s"}`} ${op} today`;
    }
    if (r.op === "between") return `${info.label} is between ${r.value ?? ""} and ${r.value2 ?? ""}`;
    if (info.kind === "bool") return `${info.label} is ${r.value === "1" || r.value === true ? "yes" : "no"}`;
    if (r.op === "is_any_of") {
      const names = (r.values || []).map((v, i) => (v === ME ? "me" : r.value_labels?.[i] || choices?.find((o) => o.value === v)?.label || v));
      return `${info.label} is any of ${names.join(", ")}`;
    }
    return `${info.label} ${op} ${valueName(r, choices)}`;
  };
  const lineOf = (f: ISavedFilter) => {
    const lines = f.groups.map((g) => g.rules.map(describe).filter(Boolean).join(g.match === "any" ? " OR " : " AND ")).filter(Boolean);
    return lines.length > 1 ? lines.map((l) => `(${l})`).join(f.match === "any" ? " OR " : " AND ") : lines[0] || "";
  };

  // ---- the value inputs of one condition ----
  const renderValue = (rule: IRule, info: { kind: Kind; field?: IFormBuilderField }, change: (patch: Partial<IRule>) => void) => {
    const { kind } = info;
    const op = rule.op;
    if (isNoValueOp(op)) return null;
    const text = (v: unknown) => (v == null ? "" : String(v));
    const choices = choicesFor(info, op);

    // date
    if (kind === "date") {
      if (op === "preset") {
        return (
          <select className={select} value={text(rule.value)} onChange={(e) => change({ value: e.target.value })} aria-label="Period">
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        );
      }
      if (op === "between") {
        return (
          <>
            <input type="date" className={smallInput} style={{ width: 150 }} value={text(rule.value)} onChange={(e) => change({ value: e.target.value })} aria-label="From date" />
            <span className="small">and</span>
            <input type="date" className={smallInput} style={{ width: 150 }} value={text(rule.value2)} onChange={(e) => change({ value2: e.target.value })} aria-label="To date" />
          </>
        );
      }
      return (
        <>
          <span className="small">+</span>
          <input
            type="number"
            className={smallInput}
            style={{ width: 70 }}
            value={rule.days ?? 0}
            onChange={(e) => change({ days: e.target.value === "" ? 0 : Math.trunc(Number(e.target.value)) })}
            aria-label="Days added to the date"
          />
          <span className="small">days, against today</span>
        </>
      );
    }

    // between (number / time)
    if (op === "between") {
      const type = kind === "time" ? "time" : "number";
      return (
        <>
          <input type={type} className={smallInput} style={{ width: 120 }} value={text(rule.value)} onChange={(e) => change({ value: e.target.value })} aria-label="From" />
          <span className="small">and</span>
          <input type={type} className={smallInput} style={{ width: 120 }} value={text(rule.value2)} onChange={(e) => change({ value2: e.target.value })} aria-label="To" />
        </>
      );
    }

    if (kind === "bool") {
      return (
        <select className={select} value={rule.value === "0" || rule.value === false ? "0" : "1"} onChange={(e) => change({ value: e.target.value })} aria-label="Yes or no">
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      );
    }

    // "is any of": tick the choices, or type a comma separated list when the field has no fixed choices
    if (op === "is_any_of") {
      if (choices && choices.length > 0) {
        const picked = new Set(rule.values || []);
        const toggle = (o: Opt) => {
          const values = picked.has(o.value) ? (rule.values || []).filter((v) => v !== o.value) : [...(rule.values || []), o.value];
          change({ values, value_labels: values.map((v) => (v === ME ? "me" : choices.find((c) => c.value === v)?.label || v)) });
        };
        return (
          <div className="d-flex flex-wrap" style={{ gap: 8, maxHeight: 110, overflowY: "auto", maxWidth: 420 }}>
            {choices.map((o) => (
              <label key={o.value} className="small mb-0 d-flex align-items-center" style={{ gap: 4 }}>
                <input type="checkbox" checked={picked.has(o.value)} onChange={() => toggle(o)} /> {o.label}
              </label>
            ))}
          </div>
        );
      }
      return (
        <input
          className={smallInput}
          style={{ width: 240 }}
          value={rule.values_text ?? (rule.values || []).join(", ")}
          onChange={(e) => change({ values_text: e.target.value, values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })}
          placeholder="value, value, ..."
          aria-label="Values, separated by commas"
        />
      );
    }

    // one value from a fixed list
    if (choices && (choices.length > 0 || kind === "status" || kind === "user" || kind === "id" || kind === "stage")) {
      return (
        <select
          className={select}
          value={text(rule.value)}
          onChange={(e) => change({ value: e.target.value, value_label: choices.find((o) => o.value === e.target.value)?.label })}
          aria-label="Value"
        >
          <option value="">Choose...</option>
          {choices.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    // a typed value
    return (
      <input
        type={kind === "number" ? "number" : kind === "time" ? "time" : "text"}
        className={smallInput}
        style={{ width: kind === "time" ? 130 : 160 }}
        value={text(rule.value)}
        onChange={(e) => change({ value: e.target.value })}
        placeholder="Value"
        aria-label="Value"
      />
    );
  };

  // The groups / conditions editor of ONE filter.
  const renderFilterBody = (filter: ISavedFilter, fi: number) => {
    const { match, groups } = filter;
    const totalRules = groups.reduce((n, g) => n + g.rules.length, 0);
    const saveGroups = (nextMatch: Match, nextGroups: IGroup[]) => setFilter(fi, { match: nextMatch, groups: nextGroups.filter((g) => g.rules.length > 0) });
    const setGroup = (gi: number, patch: Partial<IGroup>) => saveGroups(match, groups.map((g, k) => (k === gi ? { ...g, ...patch } : g)));
    const replaceRule = (gi: number, ri: number, rule: IRule) => setGroup(gi, { rules: groups[gi].rules.map((r, k) => (k === ri ? rule : r)) });

    const changeField = (gi: number, ri: number, key: string) => {
      const info = infoFor(key);
      if (info) replaceRule(gi, ri, freshRule(key, info.kind));
    };
    // A new condition starts clean: only what the chosen condition uses is kept.
    const changeOp = (gi: number, ri: number, rule: IRule, op: string, kind: Kind) => {
      const next: IRule = { field: rule.field, op };
      if (kind === "date" && !["preset", "between", "is_empty", "is_not_empty"].includes(op)) next.days = rule.days ?? 0;
      if (kind === "date" && op === "preset") next.value = "today";
      if (kind === "bool") next.value = "1";
      if (kind === "stage") next.value = op === "at_stage" ? stages[0]?.value || "" : "waiting_for_me";
      replaceRule(gi, ri, next);
    };
    const addRule = (gi: number) => {
      const rule = firstUsable();
      if (rule) setGroup(gi, { rules: [...groups[gi].rules, rule] });
    };
    const addGroup = () => {
      const rule = firstUsable();
      if (rule) saveGroups(groups.length === 0 ? "any" : match, [...groups, { match: "all", rules: [rule] }]);
    };

    return (
      <>
        {groups.length > 1 && (
          <div className="d-flex align-items-center mb-2" style={{ gap: 8 }}>
            <span className="small">Show an entry when</span>
            <select className={select} value={match} onChange={(e) => saveGroups(e.target.value as Match, groups)} aria-label="Match any or all groups">
              <option value="any">any group matches (OR)</option>
              <option value="all">all groups match (AND)</option>
            </select>
          </div>
        )}

        {groups.map((group, gi) => (
          <div key={gi} className="mb-2 p-2 rounded-2" style={{ border: "1px solid #e1e4ea", background: "#fff" }}>
            <div className="d-flex align-items-center mb-2" style={{ gap: 8 }}>
              {groups.length > 1 && <b className="small">Group {gi + 1}</b>}
              {group.rules.length > 1 && (
                <select className={select} value={group.match} onChange={(e) => setGroup(gi, { match: e.target.value as Match })} aria-label="Match any or all conditions in this group">
                  <option value="all">all of these (AND)</option>
                  <option value="any">any of these (OR)</option>
                </select>
              )}
              {groups.length > 1 && (
                <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2 ms-auto" onClick={() => saveGroups(match, groups.filter((_, k) => k !== gi))}>
                  Remove group
                </button>
              )}
            </div>

            {group.rules.map((rule, ri) => {
              const info = infoFor(rule.field);
              return (
                <div key={ri} className="d-flex align-items-center flex-wrap mb-2 p-2 rounded-2" style={{ gap: 6, background: "#f5f6f8" }}>
                  <select className={select} value={rule.field} onChange={(e) => changeField(gi, ri, e.target.value)} aria-label="Field">
                    {!info && <option value={rule.field}>{rule.field} (removed from form)</option>}
                    <optgroup label="Entry">
                      {SYSTEM_FIELDS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Form fields">
                      {formFields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label || f.key}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {info && (
                    <>
                      <select className={select} value={rule.op} onChange={(e) => changeOp(gi, ri, rule, e.target.value, info.kind)} aria-label="Condition">
                        {OPS[info.kind].map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {renderValue(rule, info, (patch) => replaceRule(gi, ri, { ...rule, ...patch }))}
                    </>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2 ms-auto"
                    onClick={() => setGroup(gi, { rules: group.rules.filter((_, k) => k !== ri) })}
                    aria-label="Remove condition"
                    title="Remove condition"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={totalRules >= MAX_RULES} onClick={() => addRule(gi)}>
              + Add condition
            </button>
          </div>
        ))}

        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={groups.length >= MAX_GROUPS || totalRules >= MAX_RULES} onClick={() => addGroup()}>
          {groups.length === 0 ? "+ Add condition" : `+ Add another group (${match === "any" ? "OR" : "AND"})`}
        </button>
        {lineOf(filter) && (
          <small className="d-block mt-2" style={{ color: "#555" }}>
            Shows: {lineOf(filter)}
          </small>
        )}
      </>
    );
  };

  return (
    <div className="form-group">
      <small className="text-muted d-block mb-2">
        Named filters people can pick on the entries list. The one marked default is applied when the list opens. Takes effect after you publish.
      </small>

      {filters.map((filter, fi) => (
        <div key={filter.id || fi} className="mb-3 p-2 rounded-2" style={{ border: "1px solid #d5d9e2", background: "#fafbfc" }}>
          <div className="d-flex align-items-center flex-wrap mb-2" style={{ gap: 8 }}>
            <input
              className={smallInput}
              style={{ width: 200 }}
              maxLength={NAME_MAX}
              value={filter.name}
              onChange={(e) => setFilter(fi, { name: e.target.value })}
              placeholder="Filter name"
              aria-label="Filter name"
            />
            <label className="small mb-0 d-flex align-items-center" style={{ gap: 4 }}>
              <input type="checkbox" checked={filter.is_default === true} onChange={(e) => setDefault(fi, e.target.checked)} /> Open the list with this filter
            </label>
            <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2 ms-auto" onClick={() => setConfirmDelete(fi)}>
              Delete filter
            </button>
          </div>
          {renderFilterBody(filter, fi)}
        </div>
      ))}

      {/* The section's Add action: the Form Builder's orange outline button (formBuilderBrandStyles.tsx). */}
      <button type="button" className="btn btn-sm fb-btn-outline-primary" disabled={filters.length >= MAX_FILTERS} onClick={addFilter}>
        + Add filter
      </button>

      {/* Deleting a saved filter asks first (REPORT_UI_GUIDELINES.md section 8). */}
      <ConfirmationModal
        show={confirmDelete !== null}
        onHide={() => setConfirmDelete(null)}
        title="Delete saved filter"
        message={
          confirmDelete !== null && filters[confirmDelete]
            ? `Delete “${filters[confirmDelete].name || "this filter"}”? People keep seeing it on the entries list until you publish the form.`
            : ""
        }
        btn1="Cancel"
        btn2="Delete"
        handleSubmit={() => {
          if (confirmDelete !== null) save(filters.filter((_, k) => k !== confirmDelete));
          setConfirmDelete(null);
        }}
      />
    </div>
  );
};

export default SavedFiltersPanel;
