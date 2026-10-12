import "primeicons/primeicons.css";
import React, { useEffect, useState } from "react";
import { CSS } from "../BomHierarchyView";
import { fetchSubJobCardTree, ISubJobCardTreeNode } from "../JobCardController";

const fmt = (v: number) =>
  Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const unitOf = (unit: string) => (unit && unit.trim() ? ` ${unit.trim()}` : "");

const NodeCard = ({ node }: { node: ISubJobCardTreeNode }) => {
  const accent = node.is_done ? "#10b981" : "#0ea5e9";
  const soft = node.is_done ? "#ecfdf5" : "#f0f9ff";
  return (
    <div
      className="bh-card"
      style={{
        background: soft,
        outline: node.is_current ? "2px solid #f97316" : "none",
      }}
    >
      <span className="bar" style={{ background: accent }} />
      <div className="bh-name">{node.product_name}</div>
      <div className="bh-code">
        Job #{node.job_id}
        {node.product_code ? ` · ${node.product_code}` : ""}
      </div>
      <div className="bh-qty" style={{ color: accent }}>
        {fmt(node.qty)}
        {unitOf(node.unit)} <span className="bh-action">to make</span>
      </div>
      <span
        className="bh-tag"
        style={{
          background: node.is_done ? "#d1fae5" : "#fef3c7",
          color: node.is_done ? "#15803d" : "#92400e",
        }}
        title="Produced so far / pending"
      >
        {node.is_done ? "done" : `done ${fmt(node.produced_qty)} · pending ${fmt(node.pending_qty)}`}
      </span>
      {node.is_current && (
        <span className="bh-tag" style={{ background: "#ffedd5", color: "#9a3412" }}>
          this job card
        </span>
      )}
    </div>
  );
};

const Level = ({ nodes, isRoot }: { nodes: ISubJobCardTreeNode[]; isRoot?: boolean }) => (
  <ul className={isRoot ? "bh-tree" : undefined}>
    {nodes.map((n) => (
      <li key={n.job_id}>
        <NodeCard node={n} />
        {n.children.length > 0 && <Level nodes={n.children} />}
      </li>
    ))}
  </ul>
);

const count = (n: ISubJobCardTreeNode): number =>
  1 + n.children.reduce((s, c) => s + count(c), 0);

// Sitemap-style tree of this job card and every sub job card above/below it,
// with qty and progress per card. Shows nothing when the card has no sub job
// cards and is not itself a sub job card.
const SubJobCardTree = ({ jobCardId, refreshKey }: { jobCardId: number; refreshKey?: unknown }) => {
  const [tree, setTree] = useState<ISubJobCardTreeNode | null>(null);

  useEffect(() => {
    let alive = true;
    setTree(null);
    fetchSubJobCardTree(jobCardId).then((t) => {
      if (alive) setTree(t);
    });
    return () => {
      alive = false;
    };
  }, [jobCardId, refreshKey]);

  if (!tree || tree.children.length === 0) return null;

  return (
    <div className="mb-3">
      <style>{CSS}</style>
      <div
        className="d-flex align-items-center gap-2 mb-2"
        style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em" }}
      >
        <i className="pi pi-sitemap" style={{ fontSize: "0.75rem" }} />
        SUB JOB CARDS ({count(tree)} cards)
      </div>
      <div
        style={{
          overflow: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          background: "radial-gradient(#e2e8f0 1px, transparent 1px) 0 0 / 18px 18px, #fff",
          padding: 20,
          maxHeight: "45vh",
        }}
      >
        <div style={{ width: "max-content", margin: "0 auto" }}>
          <Level nodes={[tree]} isRoot />
        </div>
      </div>
    </div>
  );
};

export default SubJobCardTree;
