import React, { useEffect, useState } from "react";
import {
  DT_DATE,
  DT_DATE_TIME,
  DT_DROPDOWN,
  DT_RADIO,
  DT_SWITCH,
  DT_TIME,
  IStageFormField,
} from "./StageFormApi";

interface IStageFormModalProps {
  show: boolean;
  stageName?: string;
  fields: IStageFormField[];
  initialValues: Record<number, string | boolean>;
  saving: boolean;
  onSubmit: (values: Record<number, string | boolean>) => void;
  onCancel: () => void;
}

// data_type 1 = Number, 8 = Decimal (same input rules as the create forms)
const sanitizeNumber = (dataType: number, value: string) => {
  if (dataType === 1) return value.replace(/[^0-9]/g, "");
  let v = value.replace(/[^0-9.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
  }
  return v;
};

const StageFormModal = ({
  show,
  stageName,
  fields,
  initialValues,
  saving,
  onSubmit,
  onCancel,
}: IStageFormModalProps) => {
  const [values, setValues] = useState<Record<number, string | boolean>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!show) return;
    const start: Record<number, string | boolean> = {};
    fields.forEach((f) => {
      start[f.id] = initialValues[f.id] ?? (f.data_type === DT_SWITCH ? false : "");
    });
    setValues(start);
    setErrors({});
  }, [show, fields, initialValues]);

  if (!show) return null;

  const setValue = (id: number, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSave = () => {
    const nextErrors: Record<number, string> = {};
    fields.forEach((f) => {
      const v = values[f.id];
      if (
        Number(f.required_or_not) === 1 &&
        f.data_type !== DT_SWITCH &&
        (v === undefined || String(v).trim() === "")
      ) {
        nextErrors[f.id] = `${f.title} is required`;
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(values);
    }
  };

  const renderInput = (f: IStageFormField) => {
    const value = values[f.id];
    switch (f.data_type) {
      case 3:
        return (
          <textarea
            className="form-control"
            rows={2}
            value={String(value ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
          />
        );
      case DT_DATE:
        return (
          <input
            type="date"
            className="form-control"
            value={String(value ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
          />
        );
      case DT_DATE_TIME:
        return (
          <input
            type="datetime-local"
            className="form-control"
            value={String(value ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
          />
        );
      case DT_TIME:
        return (
          <input
            type="time"
            className="form-control"
            value={String(value ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
          />
        );
      case DT_SWITCH:
        return (
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              checked={value === true}
              onChange={(e) => setValue(f.id, e.target.checked)}
            />
          </div>
        );
      case 1:
      case 8:
        return (
          <input
            type="text"
            className="form-control"
            value={String(value ?? "")}
            onChange={(e) => setValue(f.id, sanitizeNumber(f.data_type, e.target.value))}
          />
        );
      case DT_DROPDOWN:
        return (
          <select
            className="form-control"
            value={String(value ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
          >
            <option value="">Select</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case DT_RADIO:
        return (
          <div>
            {f.options.map((o) => (
              <label key={o} className="p-1">
                <input
                  type="radio"
                  name={`stage-form-field-${f.id}`}
                  checked={value === o}
                  onChange={() => setValue(f.id, o)}
                />{" "}
                {o}
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            className="form-control"
            value={String(value ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="modal1" style={{ zIndex: 99999 }}>
      <div className="modal-content1" style={{ maxWidth: "560px", width: "92%", padding: "24px" }}>
        <span className="close" onClick={saving ? undefined : onCancel}>
          &times;
        </span>
        <h2 className="modal-title1 form_header_text">
          {stageName ? `Move to ${stageName}` : "Change Status"}
        </h2>
        <div className="row mt-2">
          {fields.map((f) => (
            <div className="col-12 mt-2" key={f.id}>
              <label className="pb-1 form_label">
                {f.title}
                {Number(f.required_or_not) === 1 && f.data_type !== DT_SWITCH && (
                  <span className="text-danger">*</span>
                )}
              </label>
              {renderInput(f)}
              {errors[f.id] && <div className="field-error text-danger">{errors[f.id]}</div>}
            </div>
          ))}
        </div>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageFormModal;
