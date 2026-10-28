import { useEffect, useMemo, useState } from "react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { toast } from "react-toastify";
import { DEFAULT_STATUS_CODE_SUCCESS, MESSAGE_UNKNOWN_ERROR_OCCURRED } from "../../../../../helpers/AppConstants";
import { axiosInstance } from "../../../../../services/axiosInstance";

// Custom fields (UDFs): which CRM sales-invoice field fills which UDF the accountant already created in Tally
// (plans/2026-10-08-marketplace-tally-plan.txt, 4.6). We never create UDFs or TDL in Tally - the name typed
// here must match an existing one. A CRM field with no name is simply not sent. If Tally does not know the
// name, its error shows up in the sync log below for that voucher.

interface IFieldRow {
  source_type: "custom_field" | "column";
  source_ref: string;
  label: string;
  group: "Custom field" | "Standard field";
  external_field_name: string;
  is_active: boolean;
}

const keyOf = (r: Pick<IFieldRow, "source_type" | "source_ref">) => `${r.source_type}:${r.source_ref}`;

const TallyFieldMappingSection = () => {
  const [rows, setRows] = useState<IFieldRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errorOf = (e: any) => e?.response?.data?.ack_msg || e?.message || MESSAGE_UNKNOWN_ERROR_OCCURRED;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post("tally/mappings/fields/get", {});
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const items: IFieldRow[] = data.data?.items || [];
        setRows(items);
        setNames(Object.fromEntries(items.map((r) => [keyOf(r), r.external_field_name || ""])));
      } else {
        setError(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (row: IFieldRow, patch: { name?: string; active?: boolean }) => {
    const key = keyOf(row);
    const name = patch.name ?? names[key] ?? "";
    const active = patch.active ?? row.is_active;
    setSavingKey(key);
    try {
      const { data } = await axiosInstance.post("tally/mappings/fields/save", {
        source_type: row.source_type,
        source_ref: row.source_ref,
        external_field_name: name,
        is_active: active,
      });
      if (data.ack === DEFAULT_STATUS_CODE_SUCCESS) {
        const saved: IFieldRow = data.data.item;
        setRows((prev) => prev.map((r) => (keyOf(r) === key ? { ...r, external_field_name: saved.external_field_name, is_active: saved.is_active } : r)));
        setNames((prev) => ({ ...prev, [key]: saved.external_field_name }));
        toast.success(saved.external_field_name ? "Saved." : "Mapping removed.");
      } else {
        toast.error(data.ack_msg || MESSAGE_UNKNOWN_ERROR_OCCURRED);
      }
    } catch (e) {
      toast.error(errorOf(e));
    } finally {
      setSavingKey(null);
    }
  };

  const mappedCount = useMemo(() => rows.filter((r) => r.external_field_name && r.is_active).length, [rows]);

  return (
    <section className="mt-4">
      <h5 className="tly-heading">Custom fields (Tally UDFs)</h5>
      <p className="text-muted small mb-2">
        Send a field from your sales invoices into a UDF you have already created in Tally. Type the UDF&apos;s name exactly as it is in Tally
        (letters, digits and underscores; a space becomes an underscore). Leave the name empty to send nothing for that field. Applies to sales
        invoices sent to Tally from now on.
      </p>
      {error && <div className="alert alert-warning py-2">{error}</div>}
      <div className="report_card" style={{ display: "flex", flexDirection: "column" }}>
        <DataTable
          value={rows}
          className="custom-centered-table"
          tableStyle={{ tableLayout: "fixed", width: "100%" }}
          loading={loading}
          scrollable
          scrollHeight="40vh"
          emptyMessage="No invoice fields found"
        >
          <Column
            header="CRM field"
            body={(row: IFieldRow) => row.label}
            style={{ fontSize: "14px" }}
            headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
          />
          <Column
            header="Type"
            body={(row: IFieldRow) => row.group}
            style={{ fontSize: "14px", width: "140px" }}
            headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width: "140px" }}
          />
          <Column
            header="Tally UDF name"
            style={{ fontSize: "14px" }}
            headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px" }}
            body={(row: IFieldRow) => (
              <input
                className="form-control form-control-sm"
                maxLength={80}
                placeholder="e.g. PO_Number"
                value={names[keyOf(row)] ?? ""}
                onChange={(e) => setNames((prev) => ({ ...prev, [keyOf(row)]: e.target.value }))}
              />
            )}
          />
          <Column
            header="Send"
            style={{ fontSize: "14px", width: "80px" }}
            headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width: "80px" }}
            body={(row: IFieldRow) => (
              <input
                type="checkbox"
                className="form-check-input"
                aria-label={`Send ${row.label}`}
                checked={row.is_active && Boolean(row.external_field_name)}
                disabled={!row.external_field_name || savingKey === keyOf(row)}
                onChange={(e) => save(row, { active: e.target.checked })}
              />
            )}
          />
          <Column
            header=""
            style={{ fontSize: "14px", width: "100px" }}
            headerStyle={{ position: "sticky", top: 0, zIndex: 1, background: "#f8f9fa", fontSize: "14px", width: "100px" }}
            body={(row: IFieldRow) => {
              const key = keyOf(row);
              const dirty = (names[key] ?? "") !== (row.external_field_name || "");
              return (
                <button className="btn btn-sm report_button" disabled={!dirty || savingKey === key} onClick={() => save(row, {})}>
                  {savingKey === key ? "Saving..." : "Save"}
                </button>
              );
            }}
          />
        </DataTable>
      </div>
      <div className="text-muted small mt-1">{mappedCount} field{mappedCount === 1 ? "" : "s"} will be sent.</div>
    </section>
  );
};

export default TallyFieldMappingSection;
