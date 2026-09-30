import React, { useState } from "react";
import { IFormBuilderField } from "../FormBuilderController";
import { IFormSettings } from "../approval";
import { IFieldTranslation, secondLanguageName, translatableParts, translatedCount } from "../language";

interface Props {
  settings: IFormSettings;
  fields: IFormBuilderField[];
  onSettingsChange: (settings: IFormSettings) => void;
  onFieldsChange: (fields: IFormBuilderField[]) => void;
}

// Second-language labels (plan M8): name the language once, then translate
// each field's label / help text / placeholder / options. Nothing here is
// required — a field left blank simply shows in the original language.
const LanguageSettingsPanel: React.FC<Props> = ({ settings, fields, onSettingsChange, onFieldsChange }) => {
  const name = secondLanguageName(settings) || "";
  const [expanded, setExpanded] = useState<number | null>(null);

  const setName = (value: string) => onSettingsChange({ ...settings, language: { ...(settings.language || {}), name: value } });

  const patchField = (id: number, patch: Partial<IFieldTranslation>) => {
    onFieldsChange(
      fields.map((f) => (f.id === id ? { ...f, translations: { ...(f.translations || {}), ...patch } } : f)),
    );
  };

  const translatable = fields.filter((f) => f.key);

  return (
    <div>
      <div className="form-group">
        <label className="pb-2 form_label d-block" htmlFor="fb-lang-name">
          Second language
        </label>
        <input
          id="fb-lang-name"
          className="form-control"
          style={{ maxWidth: 260 }}
          placeholder="e.g. Gujarati, Hindi (leave empty to turn off)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <small className="text-muted">People filling this form get a switch to show it in this language. Text left blank below stays in the original language.</small>
      </div>

      {name ? (
        <>
          <div className="small text-muted mb-2">
            {translatedCount(fields)} of {translatable.length} fields translated
          </div>
          <div className="fb-lang-fields">
            {translatable.map((f) => {
              const parts = translatableParts(f);
              const t = f.translations || {};
              const open = expanded === f.id;
              return (
                <div key={f.id} className="border rounded p-2 mb-2">
                  <button type="button" className="btn btn-sm btn-link px-0" onClick={() => setExpanded(open ? null : f.id)}>
                    {f.label || f.key} {t.label || t.help_text || t.content || (t.options || []).some(Boolean) ? "•" : ""}
                  </button>
                  {open ? (
                    <div className="ps-2">
                      {parts.label ? (
                        <div className="form-group">
                          <label className="pb-1 form_label d-block small">Label</label>
                          <input className="form-control form-control-sm" value={t.label || ""} placeholder={f.label} onChange={(e) => patchField(f.id, { label: e.target.value })} />
                        </div>
                      ) : null}
                      {parts.help_text ? (
                        <div className="form-group">
                          <label className="pb-1 form_label d-block small">Help text</label>
                          <input className="form-control form-control-sm" value={t.help_text || ""} placeholder={f.help_text || ""} onChange={(e) => patchField(f.id, { help_text: e.target.value })} />
                        </div>
                      ) : null}
                      {parts.placeholder ? (
                        <div className="form-group">
                          <label className="pb-1 form_label d-block small">Placeholder</label>
                          <input className="form-control form-control-sm" value={t.placeholder || ""} placeholder={f.placeholder || ""} onChange={(e) => patchField(f.id, { placeholder: e.target.value })} />
                        </div>
                      ) : null}
                      {parts.content ? (
                        <div className="form-group">
                          <label className="pb-1 form_label d-block small">Text</label>
                          <textarea className="form-control form-control-sm" rows={2} value={t.content || ""} placeholder={f.content || ""} onChange={(e) => patchField(f.id, { content: e.target.value })} />
                        </div>
                      ) : null}
                      {parts.options ? (
                        <div className="form-group">
                          <label className="pb-1 form_label d-block small">Options</label>
                          {(f.options || []).map((opt, i) => (
                            <input
                              key={opt}
                              className="form-control form-control-sm mb-1"
                              placeholder={opt}
                              value={t.options?.[i] || ""}
                              onChange={(e) => {
                                const next = [...(t.options || [])];
                                next[i] = e.target.value;
                                patchField(f.id, { options: next });
                              }}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default LanguageSettingsPanel;
