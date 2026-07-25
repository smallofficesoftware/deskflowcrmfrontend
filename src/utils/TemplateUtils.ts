// ============================================================
// utils/templateUtils.ts — Pure helper functions
// ============================================================

import React from "react";
import type {
  Template,
  VariableValueMap,
} from "../components/model/whatsapp_template_sender/types/windex";

/** Extract all {{N}} placeholder indices from a template body */
export const extractPlaceholderIndices = (template: Template): number[] => {
  const body = template.components.find((c) => c.type === "BODY");
  if (!body?.text) return [];

  const regex = /\{\{(\d+)\}\}/g;
  const indices: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(body.text)) !== null) {
    const idx = parseInt(match[1], 10);
    if (!indices.includes(idx)) indices.push(idx);
  }

  return indices.sort((a, b) => a - b);
};

/** Build an empty variable map from placeholder indices */
export const buildEmptyVariableMap = (indices: number[]): VariableValueMap =>
  Object.fromEntries(indices.map((i) => [i, ""]));

/** Build a demo variable map with placeholder demo values */
export const buildDemoVariableMap = (indices: number[]): VariableValueMap => {
  const demoValues: Record<number, string> = {};
  indices.forEach((i) => {
    demoValues[i] = getDemoValueForIndex(i);
  });
  return demoValues;
};

const getDemoValueForIndex = (index: number): string => {
  const demos = [""];
  return demos[(index - 1) % demos.length] ?? `Demo Value ${index}`;
};

/** Interpolate template body text with resolved variable values */
export const interpolateBodyText = (
  template: Template,
  variables: VariableValueMap,
): string => {
  const body = template.components.find((c) => c.type === "BODY");
  if (!body?.text) return "";

  let text = body.text;
  Object.entries(variables).forEach(([idx, val]) => {
    text = text.replace(
      new RegExp(`\\{\\{${idx}\\}\\}`, "g"),
      val || `{{${idx}}}`,
    );
  });
  return text;
};

/** Get template header text */
export const getTemplateHeader = (template: Template): string => {
  const header = template.components.find((c) => c.type === "HEADER");
  return header?.text ?? "";
};

/** Get template footer text */
export const getTemplateFooter = (template: Template): string => {
  const footer = template.components.find((c) => c.type === "FOOTER");
  return footer?.text ?? "";
};

/** Get template buttons */
export const getTemplateButtons = (template: Template) => {
  const buttons = template.components.find((c) => c.type === "BUTTONS");
  return buttons?.buttons ?? [];
};

/** Check all variables are filled */
export const areAllVariablesFilled = (variables: VariableValueMap): boolean =>
  Object.values(variables).every((v) => v.trim() !== "");

/** Normalize module flag: "carts_42" → "carts" */
export const normalizeModuleFlag = (flag: string): string => {
  const commonFlags = [
    "carts",
    "account_transaction",
    "invoice",
    "auto_contact_assignment",
  ];
  for (const item of commonFlags) {
    if (flag.startsWith(item + "_") || flag === item) return item;
  }
  return flag;
};

/** Format bold WhatsApp text: *bold* → <strong>bold</strong> */
export const parseWhatsAppFormatting = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return React.createElement("strong", { key: i }, part.slice(1, -1));
    }
    return React.createElement(React.Fragment, { key: i }, part);
  });
};
