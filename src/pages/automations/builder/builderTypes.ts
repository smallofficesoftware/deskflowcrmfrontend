import { Node, Edge } from "@xyflow/react";

// A React Flow node's `data` payload for every automation step (trigger or
// action). GenericNode.tsx renders any of these the same way, driven by the
// catalog definition looked up by `nodeType`.
export interface IBuilderNodeData extends Record<string, unknown> {
  nodeType: string;
  label: string;
  group: string;
  parameters: Record<string, any>;
  hasError?: boolean;
}

export type BuilderNode = Node<IBuilderNodeData>;
export type BuilderEdge = Edge;
