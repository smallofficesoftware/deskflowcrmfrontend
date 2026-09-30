import React, { useState } from "react";
import { toast } from "react-toastify";
import { normOption } from "./fieldHelpers";

// ---------- Choices list editor (plan A4) ----------
const OptionsEditor: React.FC<{ options: string[]; onChange: (options: string[]) => void }> = ({ options, onChange }) => {
  const [newOption, setNewOption] = useState("");
  const [newOptionError, setNewOptionError] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const isDuplicateAt = (i: number) => {
    const v = normOption(options[i]);
    return !!v && options.some((o, j) => j !== i && normOption(o) === v);
  };

  const setAt = (i: number, value: string) => onChange(options.map((o, j) => (j === i ? value : o)));
  const removeAt = (i: number) => onChange(options.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= options.length) return;
    const next = [...options];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };

  const addOne = () => {
    const v = newOption.trim();
    if (!v) {
      setNewOptionError("Type a choice first");
      return;
    }
    if (options.some((o) => normOption(o) === normOption(v))) {
      setNewOptionError("That choice is already in the list");
      return;
    }
    onChange([...options, v]);
    setNewOption("");
    setNewOptionError("");
  };

  const addPasted = () => {
    const existing = new Set(options.map(normOption));
    const added: string[] = [];
    let skipped = 0;
    pasteText.split(/\r?\n/).forEach((line) => {
      const v = line.trim();
      if (!v) return;
      if (existing.has(normOption(v))) {
        skipped++;
        return;
      }
      existing.add(normOption(v));
      added.push(v);
    });
    if (added.length) onChange([...options, ...added]);
    toast.info(`Added ${added.length} choice${added.length === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} already in the list` : ""}`);
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <div className="form-group">
      <label className="pb-2 form_label d-block">Choices</label>
      {options.map((opt, i) => {
        const dup = isDuplicateAt(i);
        return (
          <div className="d-flex align-items-center mb-1 flex-wrap" key={i}>
            <input
              className={`form-control form-control-sm fb-flex-input${dup || !opt.trim() ? " is-invalid" : ""}`}
              value={opt}
              onChange={(e) => setAt(i, e.target.value)}
              // A row left blank is simply dropped.
              onBlur={() => {
                if (!opt.trim()) removeAt(i);
              }}
            />
            <button type="button" className="btn btn-sm btn-outline-secondary ms-1" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary ms-1"
              title="Move down"
              disabled={i === options.length - 1}
              onClick={() => move(i, 1)}
            >
              ↓
            </button>
            <button type="button" className="btn btn-sm btn-outline-danger ms-1" title="Remove" onClick={() => removeAt(i)}>
              ✕
            </button>
            {dup ? <small className="text-danger w-100">Already in the list</small> : null}
          </div>
        );
      })}
      <div className="d-flex align-items-center mt-2">
        <input
          className={`form-control form-control-sm fb-flex-input${newOptionError ? " is-invalid" : ""}`}
          placeholder="Add a choice"
          value={newOption}
          onChange={(e) => {
            setNewOption(e.target.value);
            setNewOptionError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOne();
            }
          }}
        />
        <button type="button" className="btn btn-sm fb-btn-outline-primary ms-1 text-nowrap" onClick={addOne}>
          + Add
        </button>
        <button type="button" className="btn btn-sm btn-link ms-1 text-nowrap" onClick={() => setPasteOpen(!pasteOpen)}>
          Paste many
        </button>
      </div>
      {newOptionError ? <div className="field-error text-danger">{newOptionError}</div> : null}
      {pasteOpen ? (
        <div className="mt-2">
          <textarea
            className="form-control"
            rows={5}
            placeholder="One choice per line"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button type="button" className="btn btn-sm fb-btn-outline-primary mt-1" disabled={!pasteText.trim()} onClick={addPasted}>
            Add these
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default OptionsEditor;
