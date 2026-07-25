import React from "react";
import type { VariableConfig } from "../types/windex";
import s from "../../../../style/WhatsappTemplateSender.module.css";

interface Props {
  index: number;
  value: string;
  quickFillKey: string;
  availableVariables: VariableConfig[];
  isDemoMode: boolean;
  isLoadingVar: boolean;
  isFormDisabled: boolean;
  onValueChange: (index: number, value: string) => void;
  onQuickFill: (index: number, key: string) => void;
}

const VariableRow: React.FC<Props> = ({
  index,
  value,
  quickFillKey,
  availableVariables,
  isDemoMode,
  isLoadingVar,
  isFormDisabled,
  onValueChange,
  onQuickFill,
}) => {
  const mappedLabel = availableVariables.find(
    (v) => v.key === quickFillKey,
  )?.label;

  return (
    <div className="col-xl-4 col-md-6 mb-3">
      <div className={s.variableCard}>
        <div className={s.variableLabel}>
          <i className="bi bi-braces" />
          Variable {`{{${index}}}`}
          {mappedLabel && (
            <span className={s.variableMappedBadge} title={mappedLabel}>
              {mappedLabel}
            </span>
          )}
          {isDemoMode && !mappedLabel && (
            <span className={s.variableDemoBadge}>Demo</span>
          )}
        </div>

        <div className="d-flex gap-2">
          {/* Manual value input */}
          <input
            type="text"
            className={`form-control form-control-sm ${s.variableInput}`}
            value={value}
            placeholder={
              isDemoMode
                ? `Demo value for {{${index}}}`
                : `Enter {{${index}}} value`
            }
            onChange={(e) => onValueChange(index, e.target.value)}
            disabled={isFormDisabled}
          />

          {/* Quick-fill dropdown */}
          <select
            className={`form-select form-select-sm ${s.quickFillSelect}`}
            value={quickFillKey}
            onChange={(e) => {
              if (e.target.value) onQuickFill(index, e.target.value);
            }}
            disabled={isLoadingVar || isFormDisabled}
          >
            <option value="">{isLoadingVar ? "Loading…" : "Map field"}</option>
            {availableVariables.map((v) => (
              <option key={v.key} value={v.key}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default VariableRow;
