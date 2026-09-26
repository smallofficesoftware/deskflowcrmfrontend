import { Button, Form } from "react-bootstrap";

// [{ key, value }] rows - used by A8.1 Set variable, A8.3 headers/query/
// response mapping, and the "Fields" field type (field/value pairs written
// to a record, key relabeled "field").
interface IRow {
  [key: string]: string;
}

interface IProps {
  rows: IRow[];
  keyName?: string; // property name for the first column, default "key"
  valueName?: string; // default "value"
  keyLabel?: string;
  valueLabel?: string;
  keyPlaceholder?: string;
  onChange: (rows: IRow[]) => void;
}

const KeyValueEditor = ({
  rows,
  keyName = "key",
  valueName = "value",
  keyLabel = "Key",
  valueLabel = "Value",
  keyPlaceholder,
  onChange,
}: IProps) => {
  const list = rows || [];

  const update = (i: number, patch: IRow) => onChange(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, { [keyName]: "", [valueName]: "" }]);

  return (
    <div>
      {list.length > 0 && (
        <div className="d-flex gap-2 mb-1">
          <small className="text-muted" style={{ flex: 1 }}>
            {keyLabel}
          </small>
          <small className="text-muted" style={{ flex: 1 }}>
            {valueLabel}
          </small>
          <div style={{ width: 32 }} />
        </div>
      )}
      {list.map((row, i) => (
        <div key={i} className="d-flex gap-2 mb-2">
          <Form.Control
            size="sm"
            placeholder={keyPlaceholder || keyLabel}
            value={row[keyName] ?? ""}
            onChange={(e) => update(i, { [keyName]: e.target.value })}
            style={{ flex: 1 }}
          />
          <Form.Control
            size="sm"
            placeholder={valueLabel}
            value={row[valueName] ?? ""}
            onChange={(e) => update(i, { [valueName]: e.target.value })}
            style={{ flex: 1 }}
          />
          <Button size="sm" variant="outline-danger" onClick={() => remove(i)}>
            ✕
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline-secondary" onClick={add}>
        + Add row
      </Button>
    </div>
  );
};

export default KeyValueEditor;
