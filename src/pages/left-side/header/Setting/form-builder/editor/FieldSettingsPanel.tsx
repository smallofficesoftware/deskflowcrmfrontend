import React, { useState } from "react";
import { fieldTypeOptions, IFormBuilderField, isEncryptedField, referenceMasterOptions } from "../FormBuilderController";
import { formatPresetOptions } from "../formatPresets";
import OptionsEditor from "./OptionsEditor";
import RepeaterColumnsEditor from "./RepeaterColumnsEditor";
import AutoNumberSettings from "./AutoNumberSettings";
import ConditionEditor from "./ConditionEditor";
import QuestionTableSettings from "./QuestionTableSettings";
import CalculationSettings, { referenceChoices } from "./CalculationSettings";
import CustomListsManager from "./CustomListsManager";
import CustomerLookupSettings from "./CustomerLookupSettings";
import { useCustomLists } from "./useCustomLists";
import { isListableType } from "../listCells";
import { fieldStageId, IApprovalStage } from "../approval";
import {
  hasDefaultValue,
  hasFormatCheck,
  hasPlaceholder,
  isChoiceType,
  isLayoutOnly,
  isRangedType,
  sectionEnd,
  takenKeys,
  typeLabel,
  TYPE_ICONS,
} from "./fieldHelpers";

interface Props {
  field: IFormBuilderField;
  index: number;
  fields: IFormBuilderField[];
  relatedModule?: string | null;
  publishedKeys: Set<string>;
  onPatch: (patch: Partial<IFormBuilderField>, tag?: string) => void;
  onLabel: (label: string) => void;
  onKeyByHand: (raw: string) => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSectionWidth: (width: "full" | "half" | "third") => void;
  // Approval stages of the form (empty when the form needs no approval).
  stages?: IApprovalStage[];
  onSectionStage?: (stage: string) => void;
}

const Group: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="fb-settings-group">
      <button type="button" className="fb-settings-group-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <i className={open ? "pi pi-chevron-down" : "pi pi-chevron-right"} style={{ fontSize: 11 }} />
        {title}
      </button>
      {open ? <div className="fb-settings-group-body">{children}</div> : null}
    </div>
  );
};

const Check: React.FC<{ id: string; label: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; note?: React.ReactNode }> = ({
  id,
  label,
  checked,
  disabled,
  onChange,
  note,
}) => (
  <div className="form-check mb-2">
    <input type="checkbox" className="form-check-input" id={id} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <label className="form-check-label" htmlFor={id}>
      {label}
    </label>
    {note}
  </div>
);

// Right-hand panel: every per-field setting from Phase 1, grouped
// Basic / Validation / Advanced (plan A1, A7), plus the field actions
// (move up/down for keyboard users, duplicate, delete — plan A6).
const FieldSettingsPanel: React.FC<Props> = ({
  field,
  index,
  fields,
  relatedModule,
  publishedKeys,
  onPatch,
  onLabel,
  onKeyByHand,
  onMove,
  onDuplicate,
  onDelete,
  onSectionWidth,
  stages = [],
  onSectionStage,
}) => {
  const locked = publishedKeys.has(field.key);
  const isInstruction = field.type === "instruction";
  const isSection = field.type === "section-header";
  const layoutOnly = isLayoutOnly(field.type);
  const fid = `fb-set-${field.id}`;
  // Reserved v2 types stay out of the picker; a field that already carries
  // one still shows it (marked "coming soon") so it isn't lost.
  const typeChoices = fieldTypeOptions.filter((o) => !o.comingSoon || o.id === field.type);
  const otherReferenceFields = fields.filter((f, i) => i !== index && f.type === "reference");
  const isAutoNumber = field.type === "auto-number";
  const { lists: customLists, setLists: setCustomLists } = useCustomLists();
  const [managingLists, setManagingLists] = useState(false);
  const isDate = field.type === "date" || field.type === "datetime";
  const editRule = field.edit_rule || {};
  const isCalculation = field.type === "calculation";
  const hasValidation = !layoutOnly && field.type !== "repeater" && !isAutoNumber && !isCalculation;
  const sectionFieldCount = isSection ? sectionEnd(fields, index) - index : 0;

  const changeType = (type: string) => {
    const patch: Partial<IFormBuilderField> = { type };
    if (isChoiceType(type) && !(field.options || []).length) patch.options = ["Option 1", "Option 2"];
    if (type === "repeater" && !(field.columns || []).length) patch.columns = [];
    if (type === "question-table" && !(field.questions || []).length) {
      patch.questions = [{ id: "q1", text: "" }];
      patch.answer_columns = [{ key: "answer", label: "Yes / No", type: "yes_no" }];
    }
    if (type === "calculation" && field.formula === undefined) Object.assign(patch, { formula: "", result_type: "number", decimals: 2 });
    onPatch(patch);
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-2" style={{ gap: 6 }}>
        <i className={TYPE_ICONS[field.type] || "pi pi-question-circle"} style={{ color: "#F58634" }} />
        <strong className="text-truncate" title={field.label}>
          {typeLabel(field.type)}
        </strong>
      </div>
      <div className="d-flex flex-wrap mb-3" style={{ gap: 4 }}>
        <button type="button" className="btn btn-sm btn-outline-secondary fb-icon-btn" disabled={index === 0} onClick={() => onMove(-1)} title="Move up">
          <i className="pi pi-arrow-up" /> Up
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary fb-icon-btn"
          disabled={index === fields.length - 1}
          onClick={() => onMove(1)}
          title="Move down"
        >
          <i className="pi pi-arrow-down" /> Down
        </button>
        <button type="button" className="btn btn-sm btn-outline-secondary fb-icon-btn" onClick={onDuplicate} title="Duplicate">
          <i className="pi pi-copy" /> Duplicate
        </button>
        <button type="button" className="btn btn-sm btn-outline-danger fb-icon-btn" onClick={onDelete} title="Delete">
          <i className="pi pi-trash" /> Delete
        </button>
      </div>

      <Group title="Basic">
        <div className="form-group">
          <label className="pb-2 form_label d-block" htmlFor={`${fid}-label`}>
            {isInstruction ? "Name (only shown here in the builder)" : isSection ? "Section title" : "Label"}
          </label>
          <input id={`${fid}-label`} className="form-control" value={field.label} onChange={(e) => onLabel(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="pb-2 form_label d-block" htmlFor={`${fid}-type`}>
            Type
          </label>
          <select id={`${fid}-type`} className="form-control" value={field.type} disabled={locked} onChange={(e) => changeType(e.target.value)}>
            {typeChoices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.comingSoon ? `${o.label} (coming soon)` : o.label}
              </option>
            ))}
          </select>
          {locked ? <small className="form-text text-muted d-block">Fixed because this form is published — add a new field instead.</small> : null}
        </div>

        {!layoutOnly && field.type !== "repeater" ? (
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`${fid}-width`}>
              Width
            </label>
            <select id={`${fid}-width`} className="form-control" value={field.width || "full"} onChange={(e) => onPatch({ width: e.target.value as any })}>
              <option value="full">Full</option>
              <option value="half">Half</option>
              <option value="third">Third</option>
            </select>
          </div>
        ) : null}

        {isSection ? (
          <div className="form-group">
            <label className="pb-2 form_label d-block">Fields per row in this section</label>
            <div className="btn-group btn-group-sm" role="group">
              <button type="button" className="btn btn-outline-secondary" disabled={!sectionFieldCount} onClick={() => onSectionWidth("full")}>
                1
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled={!sectionFieldCount} onClick={() => onSectionWidth("half")}>
                2
              </button>
              <button type="button" className="btn btn-outline-secondary" disabled={!sectionFieldCount} onClick={() => onSectionWidth("third")}>
                3
              </button>
            </div>
            <small className="form-text text-muted d-block">
              {sectionFieldCount
                ? `Sets the width of the ${sectionFieldCount} field${sectionFieldCount === 1 ? "" : "s"} in this section. You can still change a single field afterwards.`
                : "Add fields below this section first."}
            </small>
          </div>
        ) : null}

        {isInstruction ? (
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`${fid}-content`}>
              Text to show
            </label>
            <textarea
              id={`${fid}-content`}
              className="form-control"
              rows={5}
              placeholder="e.g. Take the signature of the division head before submitting."
              value={field.content || ""}
              onChange={(e) => onPatch({ content: e.target.value }, `content:${field.id}`)}
            />
          </div>
        ) : null}

        {field.type === "consent" ? (
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`${fid}-content`}>
              Terms the person is agreeing to
            </label>
            <textarea
              id={`${fid}-content`}
              className="form-control"
              rows={5}
              placeholder="e.g. We will contact you on the number above about your inquiry. We never share your details with anyone else."
              value={field.content || ""}
              onChange={(e) => onPatch({ content: e.target.value }, `content:${field.id}`)}
            />
            <small className="text-muted d-block">Shown above the tick box. Publishing is blocked until this is filled in.</small>
          </div>
        ) : null}

        {hasPlaceholder(field.type) ? (
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`${fid}-ph`}>
              Placeholder
            </label>
            <input
              id={`${fid}-ph`}
              className="form-control"
              placeholder="Faint hint shown inside the box"
              value={field.placeholder || ""}
              onChange={(e) => onPatch({ placeholder: e.target.value || null }, `placeholder:${field.id}`)}
            />
          </div>
        ) : null}

        {!layoutOnly ? (
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`${fid}-help`}>
              Help text
            </label>
            <input
              id={`${fid}-help`}
              className="form-control"
              placeholder="Shown below the field"
              value={field.help_text || ""}
              onChange={(e) => onPatch({ help_text: e.target.value || null }, `help:${field.id}`)}
            />
          </div>
        ) : null}

        {isChoiceType(field.type) ? <OptionsEditor options={field.options || []} onChange={(options) => onPatch({ options })} /> : null}

        {hasDefaultValue(field.type) ? (
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`${fid}-default`}>
              Default value
            </label>
            {isChoiceType(field.type) ? (
              <select id={`${fid}-default`} className="form-control" value={field.default ?? ""} onChange={(e) => onPatch({ default: e.target.value || null })}>
                <option value="">None</option>
                {(field.options || [])
                  .filter((o) => o.trim())
                  .map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                id={`${fid}-default`}
                type={field.type === "number" ? "number" : "text"}
                className="form-control"
                value={field.default ?? ""}
                onChange={(e) =>
                  onPatch(
                    { default: e.target.value === "" ? null : field.type === "number" ? Number(e.target.value) : e.target.value },
                    `default:${field.id}`,
                  )
                }
              />
            )}
          </div>
        ) : null}

        {field.type === "date" || field.type === "datetime" ? (
          <Check
            id={`${fid}-today`}
            label={field.type === "datetime" ? "Default to now" : "Default to today"}
            checked={!!field.default_today}
            onChange={(v) => onPatch({ default_today: v })}
          />
        ) : null}

        {field.type === "reference" ? (
          <>
            <div className="form-group">
              <label className="pb-2 form_label d-block" htmlFor={`${fid}-master`}>
                Master
              </label>
              <select
                id={`${fid}-master`}
                className="form-control"
                value={field.master || ""}
                onChange={(e) => onPatch({ master: e.target.value, cascades_from: undefined })}
              >
                <option value="">Select...</option>
                <optgroup label="From your CRM">
                  {referenceMasterOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
                {customLists.length ? (
                  <optgroup label="Your lists">
                    {customLists.map((l) => (
                      <option key={l.id} value={`custom:${l.id}`}>
                        {l.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
              <button type="button" className="btn btn-sm btn-link px-0" onClick={() => setManagingLists(!managingLists)}>
                {managingLists ? "Hide lists" : "Create or edit your lists (Division, Department…)"}
              </button>
            </div>
            {managingLists ? <CustomListsManager lists={customLists} onListsChange={setCustomLists} onClose={() => setManagingLists(false)} /> : null}
            <div className="form-group">
              <label className="pb-2 form_label d-block" htmlFor={`${fid}-cascade`}>
                Depends on field
              </label>
              <select
                id={`${fid}-cascade`}
                className="form-control"
                value={field.cascades_from || ""}
                onChange={(e) => onPatch({ cascades_from: e.target.value || undefined })}
              >
                <option value="">None</option>
                {otherReferenceFields.map((f) => (
                  <option key={f.id} value={f.key}>
                    {f.label}
                  </option>
                ))}
                {field.cascades_from && !otherReferenceFields.some((f) => f.key === field.cascades_from) ? (
                  <option value={field.cascades_from}>{field.cascades_from}</option>
                ) : null}
              </select>
            </div>
          </>
        ) : null}

        {field.type === "repeater" ? (
          <RepeaterColumnsEditor
            columns={field.columns || []}
            onChange={(columns, tag) => onPatch({ columns }, tag)}
            otherKeys={(() => {
              const t = takenKeys(fields, -1);
              (field.columns || []).forEach((c) => t.delete(c.key));
              return t;
            })()}
            publishedKeys={publishedKeys}
            topChoices={referenceChoices(fields.filter((f) => f.type !== "repeater"), "")}
            topFields={fields.filter((f) => f.type !== "repeater")}
          />
        ) : null}

        {field.type === "file" ? (
          <Check id={`${fid}-multi`} label="Allow multiple files" checked={!!field.multiple} onChange={(v) => onPatch({ multiple: v })} />
        ) : null}
      </Group>

      {field.type === "user" ? (
        <Group title="Team member">
          <Check
            id={`${fid}-cur-user`}
            label="Start with the person filling the form"
            checked={!!field.default_current_user}
            onChange={(v) => onPatch({ default_current_user: v })}
          />
          <small className="text-muted d-block">Only shown on the internal form — team members are never offered on a public form.</small>
        </Group>
      ) : null}

      {field.type === "customer-lookup" ? (
        <Group title="Fill from customer">
          <CustomerLookupSettings field={field} fields={fields} onChange={(lookup_map) => onPatch({ lookup_map }, "lookup_map")} />
          <small className="text-muted d-block">Only shown on the internal form — customers are never looked up on a public form.</small>
        </Group>
      ) : null}

      {field.type === "question-table" ? (
        <Group title="Questions">
          <QuestionTableSettings field={field} onPatch={onPatch} />
        </Group>
      ) : null}

      {isCalculation ? (
        <Group title="Formula">
          <CalculationSettings field={field} fields={fields} onPatch={onPatch} />
        </Group>
      ) : null}

      {isAutoNumber ? (
        <Group title="Number format">
          <AutoNumberSettings field={field} fields={fields} locked={locked} onChange={(auto_number) => onPatch({ auto_number }, "auto_number")} />
        </Group>
      ) : null}

      {hasValidation || field.type === "repeater" ? (
        <Group title="Validation">
          <Check id={`${fid}-req`} label="Required" checked={!!field.required} onChange={(v) => onPatch({ required: v })} />

          {hasFormatCheck(field.type) ? (
            <div className="form-group">
              <label className="pb-2 form_label d-block" htmlFor={`${fid}-format`}>
                Format check
              </label>
              <select
                id={`${fid}-format`}
                className="form-control"
                value={field.format_preset || ""}
                onChange={(e) => {
                  const preset = (e.target.value || null) as IFormBuilderField["format_preset"];
                  // How-to-store only applies to Aadhaar; start new Aadhaar
                  // fields on the safe default and drop it otherwise.
                  onPatch({
                    format_preset: preset,
                    sensitive_storage: preset === "aadhaar" ? field.sensitive_storage || "masked" : undefined,
                  });
                }}
              >
                <option value="">None</option>
                {formatPresetOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {hasFormatCheck(field.type) && field.format_preset === "aadhaar" ? (
            <div className="form-group">
              <label className="pb-2 form_label d-block">How to store the Aadhaar number</label>
              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  id={`sensitive-masked-${field.id}`}
                  name={`sensitive-storage-${field.id}`}
                  checked={(field.sensitive_storage || "masked") === "masked"}
                  onChange={() => onPatch({ sensitive_storage: "masked" })}
                />
                <label className="form-check-label" htmlFor={`sensitive-masked-${field.id}`}>
                  Last 4 digits only (safest — the full number can never be seen again)
                </label>
              </div>
              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  id={`sensitive-encrypted-${field.id}`}
                  name={`sensitive-storage-${field.id}`}
                  checked={field.sensitive_storage === "encrypted"}
                  // An encrypted value can't be compared for duplicates,
                  // so Unique is switched off (the server rejects both).
                  onChange={() => onPatch({ sensitive_storage: "encrypted", unique: false })}
                />
                <label className="form-check-label" htmlFor={`sensitive-encrypted-${field.id}`}>
                  Full number, hidden (can be revealed later by permitted users)
                </label>
              </div>
            </div>
          ) : null}

          {/* A format check replaces min/max (server ignores them when one is set). */}
          {isRangedType(field.type) && !field.format_preset ? (
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="pb-2 form_label d-block" htmlFor={`${fid}-min`}>
                    Min
                  </label>
                  <input
                    id={`${fid}-min`}
                    type="number"
                    className="form-control"
                    value={field.min ?? ""}
                    onChange={(e) => onPatch({ min: e.target.value === "" ? null : Number(e.target.value) }, `min:${field.id}`)}
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="pb-2 form_label d-block" htmlFor={`${fid}-max`}>
                    Max
                  </label>
                  <input
                    id={`${fid}-max`}
                    type="number"
                    className="form-control"
                    value={field.max ?? ""}
                    onChange={(e) => onPatch({ max: e.target.value === "" ? null : Number(e.target.value) }, `max:${field.id}`)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {hasValidation ? (
            <Check
              id={`${fid}-unique`}
              label="Unique"
              checked={!!field.unique && !isEncryptedField(field)}
              disabled={isEncryptedField(field)}
              onChange={(v) => onPatch({ unique: v })}
              note={isEncryptedField(field) ? <div className="small text-muted">Not available when the full Aadhaar number is stored hidden.</div> : null}
            />
          ) : null}
        </Group>
      ) : null}

      {isDate ? (
        <Group title="Date rules">
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`${fid}-date-mode`}>
              Who can change this date
            </label>
            <select
              id={`${fid}-date-mode`}
              className="form-control"
              value={editRule.mode || "always"}
              onChange={(e) => onPatch({ edit_rule: { ...editRule, mode: e.target.value } }, "edit_rule")}
            >
              <option value="always">Anyone filling the form</option>
              <option value="permission">Only people allowed to change dates (set under Form settings → Permissions)</option>
              <option value="never">Nobody — always today's date</option>
            </select>
          </div>
          {(editRule.mode || "always") !== "never" ? (
            <>
              <div className="form-group">
                <label className="pb-2 form_label d-block" htmlFor={`${fid}-past-days`}>
                  Earliest date allowed (days back from today)
                </label>
                <input
                  id={`${fid}-past-days`}
                  type="number"
                  min={0}
                  className="form-control"
                  placeholder="No limit"
                  value={editRule.past_days ?? ""}
                  onChange={(e) => onPatch({ edit_rule: { ...editRule, past_days: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) } }, "edit_rule")}
                />
                <small className="text-muted">0 = today only, 7 = up to a week ago. Leave empty for no limit.</small>
              </div>
              <Check
                id={`${fid}-future`}
                label="Allow future dates"
                checked={editRule.allow_future !== false}
                onChange={(v) => onPatch({ edit_rule: { ...editRule, allow_future: v } }, "edit_rule")}
              />
            </>
          ) : (
            <small className="text-muted">The date is filled in automatically when the form is saved.</small>
          )}
        </Group>
      ) : null}

      {field.type === "image" ? (
        <Group title="Photo options">
          <Check
            id={`${fid}-camera`}
            label="Open the camera straight away on a phone"
            checked={!!field.image_camera}
            onChange={(v) => onPatch({ image_camera: v })}
            note={<small className="text-muted d-block">On a computer this still opens the normal file picker.</small>}
          />
          <Check
            id={`${fid}-stamp-time`}
            label="Print the date and time on the photo"
            checked={!!field.image_stamp?.datetime}
            onChange={(v) => onPatch({ image_stamp: { ...(field.image_stamp || {}), datetime: v } })}
          />
          <Check
            id={`${fid}-stamp-loc`}
            label="Print the location on the photo"
            checked={!!field.image_stamp?.location}
            onChange={(v) => onPatch({ image_stamp: { ...(field.image_stamp || {}), location: v } })}
            note={<small className="text-muted d-block">The phone asks for permission to share its location.</small>}
          />
          <small className="text-muted d-block">Photos are shrunk automatically so they upload quickly.</small>
        </Group>
      ) : null}

      {(!layoutOnly && isListableType(field.type)) || (field.type !== "user" && field.type !== "customer-lookup") || (isSection && stages.length > 0) ? (
        <Group title="Where it appears" defaultOpen={false}>
          {field.type !== "user" && field.type !== "customer-lookup" ? (
            <div className="form-group">
              <label className="pb-2 form_label d-block" htmlFor={`${fid}-visible-to`}>
                Who sees this field
              </label>
              <select
                id={`${fid}-visible-to`}
                className="form-control"
                value={field.visible_to === "internal" ? "internal" : "both"}
                onChange={(e) => onPatch({ visible_to: e.target.value as "internal" | "both" })}
              >
                <option value="both">Everyone — staff form and public link</option>
                <option value="internal">Staff only — never shown on the public link</option>
              </select>
            </div>
          ) : (
            <small className="text-muted d-block mb-2">This field is only ever shown to staff, never on a public link.</small>
          )}
          {stages.length > 0 && (!layoutOnly || isSection) ? (
            <div className="form-group">
              <label className="pb-2 form_label d-block" htmlFor={`${fid}-stage`}>
                {isSection ? "Filled at stage (every field under this heading)" : "Filled at stage"}
              </label>
              <select
                id={`${fid}-stage`}
                className="form-control"
                value={fieldStageId(field, stages) || ""}
                onChange={(e) => (isSection && onSectionStage ? onSectionStage(e.target.value) : onPatch({ stage: e.target.value }))}
              >
                {stages.map((st, i) => (
                  <option key={st.id} value={st.id}>
                    Stage {i + 1} — {st.name}
                  </option>
                ))}
              </select>
              <small className="text-muted d-block">Only the people at that stage can fill or change this field.</small>
            </div>
          ) : null}
          {!layoutOnly ? (
            <div className="form-group">
              <label className="pb-2 form_label d-block" htmlFor={`${fid}-restriction`}>
                People without the “See restricted fields” permission
              </label>
              <select
                id={`${fid}-restriction`}
                className="form-control"
                value={field.restriction || "none"}
                onChange={(e) => onPatch({ restriction: e.target.value as "none" | "readonly" | "mask" | "hide" })}
              >
                <option value="none">Can see and change it (no restriction)</option>
                <option value="readonly">Can see it but not change it</option>
                <option value="mask">See •••• instead of the answer</option>
                <option value="hide">Don't see the field at all</option>
              </select>
              {field.restriction && field.restriction !== "none" ? (
                <small className="text-muted d-block">Choose who has that permission under Form settings → Permissions. A restricted field is never asked on a public link.</small>
              ) : null}
            </div>
          ) : null}
          {isListableType(field.type) ? (
            <Check
              id={`${fid}-in-list`}
              label="Show this answer in the entries list"
              checked={isAutoNumber ? field.show_in_list !== false : !!field.show_in_list}
              onChange={(v) => onPatch({ show_in_list: v })}
            />
          ) : null}
        </Group>
      ) : null}

      {!isAutoNumber ? (
        <Group title="Show / hide" defaultOpen={!!field.conditions || !!field.required_conditions}>
          <ConditionEditor
            title="Show this only when"
            hint="always shown"
            group={field.conditions}
            field={field}
            fields={fields}
            onChange={(conditions) => onPatch({ conditions }, "conditions")}
          />
          {hasValidation ? (
            <ConditionEditor
              title="Make this required only when"
              hint="not required unless “Required” above is ticked"
              group={field.required_conditions}
              field={field}
              fields={fields}
              onChange={(required_conditions) => onPatch({ required_conditions }, "required_conditions")}
            />
          ) : null}
        </Group>
      ) : null}

      <Group title="Advanced" defaultOpen={false}>
        {!layoutOnly ? <Check id={`${fid}-filter`} label="Filterable" checked={!!field.filterable} onChange={(v) => onPatch({ filterable: v })} /> : null}

        {["text", "phone", "email"].includes(field.type) && relatedModule === "contact" ? (
          <div className="form-group">
            <label className="pb-2 form_label d-block" htmlFor={`${fid}-match`}>
              Use for duplicate-customer matching
            </label>
            <select id={`${fid}-match`} className="form-control" value={field.match_key || ""} onChange={(e) => onPatch({ match_key: (e.target.value || null) as any })}>
              <option value="">No</option>
              <option value="email">Match by email</option>
              <option value="phone">Match by phone</option>
            </select>
          </div>
        ) : null}

        <div className="form-group">
          <label className="pb-2 form_label d-block" htmlFor={`${fid}-key`}>
            Internal name
          </label>
          <input id={`${fid}-key`} className="form-control" value={field.key} disabled={locked} onChange={(e) => onKeyByHand(e.target.value)} />
          <small className="form-text text-muted d-block">
            {locked ? "Fixed because this form is published — saved entries and reports use it." : "Filled in from the label. Used in exports and reports."}
          </small>
        </div>
      </Group>
    </div>
  );
};

export default FieldSettingsPanel;
