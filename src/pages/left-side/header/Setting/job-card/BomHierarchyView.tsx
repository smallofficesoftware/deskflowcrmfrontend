import "primeicons/primeicons.css";
import React, { useState } from "react";
import { SingleValue } from "react-select";
import CustomSearchDropdown from "../../../../../components/CustomSearchDropdown";
import { IOption } from "../../../../../helpers/AppInterface";
import {
  fetchBomHierarchy,
  IBomHierarchy,
  IBomHierarchyRow,
  IBomTreeNode,
} from "./BomHierarchyController";
import { searchBomProducts } from "./JobCardController";

const fmt = (v: number | undefined) =>
  Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

// " Piece" (leading space) or "" when the product has no unit name.
const unitOf = (unit: string | number | undefined) =>
  typeof unit === "string" && unit.trim() ? ` ${unit.trim()}` : "";

// Seconds -> "1h 20m" / "45m" / "30s".
const fmtTime = (sec: number | undefined) => {
  const s = Math.round(Number(sec) || 0);
  if (s <= 0) return "-";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return m ? `${h}h ${m}m` : `${h}h`;
  if (m) return r ? `${m}m ${r}s` : `${m}m`;
  return `${r}s`;
};

// Colour per node kind: finished product, made from its own BOM (gets a sub
// job card), raw material.
const KIND = {
  root: { accent: "#f97316", soft: "#fff7ed", label: "Finished product" },
  made: { accent: "#0ea5e9", soft: "#f0f9ff", label: "Sub job card item" },
  raw: { accent: "#10b981", soft: "#ecfdf5", label: "Raw material" },
} as const;

const CSS = `
.bh-tree, .bh-tree ul { display: flex; justify-content: center; margin: 0; padding: 0; list-style: none; }
.bh-tree ul { padding-top: 26px; position: relative; }
.bh-tree li { position: relative; display: flex; flex-direction: column; align-items: center; padding: 26px 8px 0; }
.bh-tree > li { padding-top: 0; }
.bh-tree li::before, .bh-tree li::after { content: ""; position: absolute; top: 0; width: 50%; height: 26px; border-top: 2px solid #cbd5e1; }
.bh-tree li::before { right: 50%; }
.bh-tree li::after { left: 50%; border-left: 2px solid #cbd5e1; }
.bh-tree > li::before, .bh-tree > li::after { display: none; }
.bh-tree li:first-child::before, .bh-tree li:last-child::after { border: 0 none; }
.bh-tree li:last-child::before { border-right: 2px solid #cbd5e1; border-radius: 0 8px 0 0; }
.bh-tree li:first-child::after { border-radius: 8px 0 0 0; }
.bh-tree li:only-child::before, .bh-tree li:only-child::after { display: none; }
.bh-tree li:only-child { padding-top: 0; }
.bh-tree ul::before { content: ""; position: absolute; top: 0; left: 50%; height: 26px; border-left: 2px solid #cbd5e1; }
.bh-card { position: relative; width: 168px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 1px 3px rgba(15,23,42,.08); padding: 8px 10px 8px 14px; text-align: left; overflow: hidden; transition: box-shadow .15s, transform .15s; }
.bh-card:hover { box-shadow: 0 6px 16px rgba(15,23,42,.14); transform: translateY(-1px); }
.bh-card .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 5px; }
.bh-name { font-size: .8rem; font-weight: 600; color: #0f172a; line-height: 1.2; word-break: break-word; }
.bh-code { font-size: .68rem; color: #64748b; }
.bh-qty { font-size: .95rem; font-weight: 700; margin-top: 2px; }
.bh-action { font-size: .68rem; font-weight: 600; color: #64748b; }
.bh-tag { display: inline-block; font-size: .64rem; font-weight: 600; border-radius: 999px; padding: 1px 7px; margin-top: 4px; margin-right: 4px; }
.bh-table th { background: #f8fafc; font-weight: 600; color: #475569; }
`;

const NodeCard = ({
  node,
  kind,
  selected,
  onSelect,
}: {
  node: IBomTreeNode;
  kind: keyof typeof KIND;
  selected: boolean;
  onSelect: (n: IBomTreeNode) => void;
}) => {
  const k = KIND[kind];
  const open = node.open_job_cards || [];
  const short =
    kind === "raw" && (node.available_qty ?? 0) < node.qty ? node.qty - (node.available_qty ?? 0) : 0;
  const openTitle = open
    .map((c) => `Job #${c.job_id}: ${fmt(c.produced_qty)} / ${fmt(c.production_qty)} done`)
    .join("\n");
  return (
    <div
      className="bh-card"
      style={{
        background: k.soft,
        cursor: "pointer",
        outline: selected ? `2px solid ${k.accent}` : "none",
      }}
      onClick={() => onSelect(node)}
    >
      <span className="bar" style={{ background: k.accent }} />
      <div className="bh-name">{node.product_name}</div>
      {node.product_code && <div className="bh-code">{node.product_code}</div>}
      {/* What to do: make it (has a BOM) or purchase the part stock can't cover. */}
      {kind === "raw" ? (
        short > 0 ? (
          <div className="bh-qty" style={{ color: "#b91c1c" }}>
            {fmt(short)}
            {unitOf(node.unit)} <span className="bh-action">to purchase</span>
          </div>
        ) : (
          <div className="bh-qty" style={{ color: "#15803d" }}>
            <span className="bh-action">in stock</span>
          </div>
        )
      ) : (
        <div className="bh-qty" style={{ color: k.accent }}>
          {fmt(node.qty)}
          {unitOf(node.unit)} <span className="bh-action">to make</span>
        </div>
      )}
      {kind === "raw" && (
        <span className="bh-tag" style={{ background: "#e2e8f0", color: "#475569" }} title="Required / in stock">
          need {fmt(node.qty)}
          {unitOf(node.unit)} · stock {fmt(node.available_qty)}
        </span>
      )}
      {kind !== "raw" && (
        <span className="bh-tag" style={{ background: "#ede9fe", color: "#5b21b6" }} title="Process time for this qty">
          <i className="pi pi-clock" style={{ fontSize: ".6rem" }} /> {fmtTime(node.own_seconds)}
        </span>
      )}
      {kind !== "raw" && (
        <span
          className="bh-tag"
          style={{
            background: open.length ? "#fef3c7" : "#e2e8f0",
            color: open.length ? "#92400e" : "#64748b",
          }}
          title={openTitle || "No open job card for this product"}
        >
          {open.length
            ? `${open.length} open job card${open.length > 1 ? "s" : ""}`
            : "no open job card"}
        </span>
      )}
      {node.truncated && (
        <span className="bh-tag" style={{ background: "#fee2e2", color: "#b91c1c" }}>
          loop / too deep
        </span>
      )}
    </div>
  );
};

const TreeLevel = ({
  nodes,
  isRoot,
  selected,
  onSelect,
}: {
  nodes: IBomTreeNode[];
  isRoot?: boolean;
  selected: IBomTreeNode | null;
  onSelect: (n: IBomTreeNode) => void;
}) => (
  <ul className={isRoot ? "bh-tree" : undefined}>
    {nodes.map((n, i) => (
      <li key={`${n.product_id}-${i}`}>
        <NodeCard
          node={n}
          kind={isRoot ? "root" : n.has_bom ? "made" : "raw"}
          selected={selected === n}
          onSelect={onSelect}
        />
        {n.children.length > 0 && (
          <TreeLevel nodes={n.children} selected={selected} onSelect={onSelect} />
        )}
      </li>
    ))}
  </ul>
);

// Details of a clicked product: its process times and every open job card for
// it (marking which of them are sub job cards of another card).
const NodeDetails = ({ node }: { node: IBomTreeNode }) => {
  const cards = node.open_job_cards || [];
  return (
    <div className="mb-4 p-3" style={{ border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff" }}>
      <h6 className="mb-2">
        <i className="pi pi-info-circle me-2" />
        {node.product_name} - details
        <span className="text-muted ms-2" style={{ fontSize: ".78rem" }}>
          for {fmt(node.qty)}
          {unitOf(node.unit)}
        </span>
      </h6>
      {node.has_bom ? (
        <div className="row g-3">
          <div className="col-md-6">
            <div className="fw-semibold mb-1" style={{ fontSize: ".8rem" }}>
              Process time (total {fmtTime(node.own_seconds)})
            </div>
            <table className="table table-sm table-bordered bh-table" style={{ fontSize: ".8rem" }}>
              <tbody>
                {(node.processes || []).length === 0 && (
                  <tr>
                    <td className="text-muted">No process on this BOM</td>
                  </tr>
                )}
                {(node.processes || []).map((p, i) => (
                  <tr key={i}>
                    <td>{p.process_name}</td>
                    <td className="text-end">{fmtTime(p.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-md-6">
            <div className="fw-semibold mb-1" style={{ fontSize: ".8rem" }}>
              Open job cards ({cards.length})
            </div>
            <table className="table table-sm table-bordered bh-table" style={{ fontSize: ".8rem" }}>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Type</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Done</th>
                  <th className="text-end">Pending</th>
                </tr>
              </thead>
              <tbody>
                {cards.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted">
                      No open job card for this product
                    </td>
                  </tr>
                )}
                {cards.map((c) => (
                  <tr key={c.job_id}>
                    <td>#{c.job_id}</td>
                    <td>
                      {c.parent_job_card_id ? (
                        <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                          sub job of #{c.parent_job_card_id}
                        </span>
                      ) : (
                        "Job card"
                      )}
                    </td>
                    <td className="text-end">{fmt(c.production_qty)}</td>
                    <td className="text-end">{fmt(c.produced_qty)}</td>
                    <td className="text-end">{fmt(c.pending_qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: ".82rem" }}>
          Raw material - needs {fmt(node.qty)}
          {unitOf(node.unit)}, in stock {fmt(node.available_qty)}
          {unitOf(node.unit)}.
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: React.ReactNode; color: string }) => (
  <div
    style={{
      flex: "1 1 140px",
      border: "1px solid #e2e8f0",
      borderTop: `3px solid ${color}`,
      borderRadius: 8,
      padding: "8px 12px",
      background: "#fff",
    }}
  >
    <div style={{ fontSize: "1.25rem", fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: ".72rem", color: "#64748b" }}>{label}</div>
  </div>
);

const RowsTable = ({
  title,
  icon,
  rows,
  mode,
}: {
  title: string;
  icon: string;
  rows: IBomHierarchyRow[];
  mode: "make" | "raw";
}) => (
  <div className="mb-4">
    <h6 className="mb-2">
      <i className={`pi ${icon} me-2`} />
      {title}
    </h6>
    <table className="table table-sm table-bordered bh-table" style={{ fontSize: ".82rem" }}>
      <thead>
        <tr>
          <th>Product</th>
          <th className="text-end">Required</th>
          {mode === "make" && <th className="text-end">Time</th>}
          {mode === "make" && <th className="text-end">Open job cards</th>}
          {mode === "raw" && <th className="text-end">In stock</th>}
          {mode === "raw" && <th className="text-end">To purchase</th>}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="text-muted">
              None
            </td>
          </tr>
        )}
        {rows.map((r) => (
          <tr key={r.product_id}>
            <td>
              {r.product_name}
              {r.product_code ? <span className="text-muted"> ({r.product_code})</span> : null}
            </td>
            <td className="text-end">
              {fmt(r.required_qty)}
              {unitOf(r.unit)}
            </td>
            {mode === "make" && <td className="text-end">{fmtTime(r.time_seconds)}</td>}
            {mode === "make" && (
              <td className="text-end">
                {r.open_job_cards ? (
                  <span className="badge" style={{ background: "#fef3c7", color: "#92400e" }}>
                    {r.open_job_cards}
                  </span>
                ) : (
                  <span className="text-muted">0</span>
                )}
              </td>
            )}
            {mode === "raw" && (
              <td className="text-end">
                {fmt(r.available_qty)}
                {unitOf(r.unit)}
              </td>
            )}
            {mode === "raw" && (
              <td
                className="text-end fw-semibold"
                style={{ color: (r.shortage_qty || 0) > 0 ? "#b91c1c" : "#15803d" }}
              >
                {fmt(r.shortage_qty)}
                {unitOf(r.unit)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Pick a finished product + qty: shows its BOM as a sitemap-style chart
// (product -> its materials -> their materials ... down to raw materials)
// with open job card counts, then a table of products to make and the total
// raw materials needed.
const BomHierarchyView: React.FC = () => {
  const [productOption, setProductOption] = useState<SingleValue<IOption>>(null);
  const [qty, setQty] = useState("1");
  const [data, setData] = useState<IBomHierarchy | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<IBomTreeNode | null>(null);

  const loadProductOptions = async (inputValue: string): Promise<IOption[]> =>
    (await searchBomProducts(inputValue)) || [];

  const handleShow = async () => {
    if (!productOption) return;
    setLoading(true);
    setZoom(1);
    setSelected(null);
    setData(await fetchBomHierarchy(Number(productOption.value), Number(qty)));
    setLoading(false);
  };

  const shortCount = data?.raw_materials.filter((r) => (r.shortage_qty || 0) > 0).length ?? 0;

  return (
    <div style={{ padding: "20px" }}>
      <style>{CSS}</style>
      <h5 className="mb-3">
        <i className="pi pi-sitemap me-2" />
        BOM Hierarchy
      </h5>

      <div
        className="d-flex align-items-end gap-2 mb-3 flex-wrap p-3"
        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}
      >
        <div style={{ width: 340 }}>
          <label className="form-label mb-1" style={{ fontSize: ".75rem" }}>
            Product
          </label>
          <CustomSearchDropdown
            isAsync={true}
            loadOptions={loadProductOptions}
            value={productOption}
            onChange={(o: SingleValue<IOption>) => {
              setProductOption(o);
              setData(null);
            }}
            className="w-100"
            placeholder="Select a product..."
          />
        </div>
        <div>
          <label className="form-label mb-1" style={{ fontSize: ".75rem" }}>
            Qty to make
          </label>
          <input
            type="number"
            min={0}
            className="form-control"
            style={{ width: 120, height: 38 }}
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setData(null);
            }}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ height: 38 }}
          disabled={!productOption || !(Number(qty) > 0) || loading}
          onClick={handleShow}
        >
          {loading ? "Loading..." : "Show chart"}
        </button>
      </div>

      {!data && !loading && (
        <p className="text-muted" style={{ fontSize: ".85rem" }}>
          Select a product and qty to see what it is made of, level by level.
        </p>
      )}

      {data && (
        <>
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <Stat label="Total process time" value={fmtTime(data.total_seconds)} color="#7c3aed" />
            <Stat label="Products to make" value={data.intermediate_products.length} color={KIND.made.accent} />
            <Stat label="Raw materials" value={data.raw_materials.length} color={KIND.raw.accent} />
            <Stat
              label="Raw materials to purchase"
              value={shortCount}
              color={shortCount ? "#dc2626" : "#16a34a"}
            />
          </div>

          <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
            <div className="d-flex gap-3" style={{ fontSize: ".75rem" }}>
              {(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => (
                <span key={k} style={{ color: "#475569" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: KIND[k].accent,
                      marginRight: 5,
                    }}
                  />
                  {KIND[k].label}
                </span>
              ))}
            </div>
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}>
                <i className="pi pi-search-minus" />
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setZoom(1)}>
                {Math.round(zoom * 100)}%
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}>
                <i className="pi pi-search-plus" />
              </button>
            </div>
          </div>

          <div
            style={{
              overflow: "auto",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              background:
                "radial-gradient(#e2e8f0 1px, transparent 1px) 0 0 / 18px 18px, #fff",
              padding: 24,
              marginBottom: 24,
              maxHeight: "55vh",
            }}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: "max-content", margin: "0 auto" }}>
              <TreeLevel nodes={[data.tree]} isRoot selected={selected} onSelect={setSelected} />
            </div>
          </div>

          {selected ? (
            <NodeDetails node={selected} />
          ) : (
            <p className="text-muted" style={{ fontSize: ".78rem" }}>
              Click any box in the chart to see its process time and open job cards.
            </p>
          )}

          <RowsTable
            title="Products to make"
            icon="pi-sitemap"
            rows={data.intermediate_products}
            mode="make"
          />
          <RowsTable
            title="Raw materials to purchase (total)"
            icon="pi-box"
            rows={data.raw_materials}
            mode="raw"
          />
        </>
      )}
    </div>
  );
};

export default BomHierarchyView;
