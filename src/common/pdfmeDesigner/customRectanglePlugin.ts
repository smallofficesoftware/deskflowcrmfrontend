// Rectangle field with an independent border width per side (top/right/
// bottom/left) instead of pdfme's built-in `rectangle` plugin, which only
// exposes ONE uniform borderWidth number applied to all 4 sides at once —
// there's no way to draw "just a bottom border" with the stock plugin.
//
// `type` stays "rectangle" (same key it's registered under in every
// Designer's `plugins` object) so existing templates keep working
// unchanged — a template saved before this change has a plain numeric
// borderWidth, normalized to an all-sides box by toBoxDimension() below.
// PDF generation for this same field happens entirely server-side in
// backend-document-designer's own customRectanglePlugin.js (a separate
// copy, since these are separate repos/runtimes) — this file only needs
// the Designer canvas preview (`ui`) and its property panel (`propPanel`),
// never `pdf`.
import { rectangle } from "@pdfme/schemas";

type BoxDimension = { top: number; right: number; bottom: number; left: number };

function toBoxDimension(value: unknown): BoxDimension {
  if (value && typeof value === "object") {
    const v = value as Partial<BoxDimension>;
    return { top: v.top ?? 0, right: v.right ?? 0, bottom: v.bottom ?? 0, left: v.left ?? 0 };
  }
  const n = typeof value === "number" ? value : 0;
  return { top: n, right: n, bottom: n, left: n };
}

function createBorderStrip(
  width: string,
  height: string,
  top: string | null,
  right: string | null,
  bottom: string | null,
  left: string | null,
  color: string,
) {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.width = width;
  div.style.height = height;
  if (top !== null) div.style.top = top;
  if (right !== null) div.style.right = right;
  if (bottom !== null) div.style.bottom = bottom;
  if (left !== null) div.style.left = left;
  div.style.backgroundColor = color;
  return div;
}

export const customRectangle = {
  ...rectangle,
  ui: (arg: any) => {
    const { schema, rootElement } = arg;
    const borderWidth = toBoxDimension(schema.borderWidth);
    const color = schema.borderColor || "transparent";

    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.boxSizing = "border-box";
    container.style.overflow = "hidden";
    if (schema.radius && schema.radius > 0) container.style.borderRadius = `${schema.radius}mm`;
    container.style.backgroundColor = schema.color || "transparent";
    rootElement.appendChild(container);

    if (borderWidth.top > 0) container.appendChild(createBorderStrip("100%", `${borderWidth.top}mm`, "0", null, null, "0", color));
    if (borderWidth.bottom > 0) container.appendChild(createBorderStrip("100%", `${borderWidth.bottom}mm`, null, null, "0", "0", color));
    if (borderWidth.left > 0) container.appendChild(createBorderStrip(`${borderWidth.left}mm`, "100%", "0", null, null, "0", color));
    if (borderWidth.right > 0) container.appendChild(createBorderStrip(`${borderWidth.right}mm`, "100%", "0", "0", null, null, color));
  },
  propPanel: {
    schema: ({ i18n }: any) => ({
      borderWidth: {
        title: i18n("schemas.borderWidth"),
        type: "object",
        widget: "lineTitle",
        span: 24,
        properties: {
          top: { title: "Top", type: "number", widget: "inputNumber", props: { min: 0, step: 1 }, span: 6 },
          right: { title: "Right", type: "number", widget: "inputNumber", props: { min: 0, step: 1 }, span: 6 },
          bottom: { title: "Bottom", type: "number", widget: "inputNumber", props: { min: 0, step: 1 }, span: 6 },
          left: { title: "Left", type: "number", widget: "inputNumber", props: { min: 0, step: 1 }, span: 6 },
        },
      },
      borderColor: {
        title: i18n("schemas.borderColor"),
        type: "string",
        widget: "color",
        props: { disabledAlpha: true },
        span: 12,
      },
      color: {
        title: i18n("schemas.color"),
        type: "string",
        widget: "color",
        props: { disabledAlpha: true },
      },
      radius: {
        title: i18n("schemas.radius"),
        type: "number",
        widget: "inputNumber",
        props: { min: 0, step: 1 },
        span: 12,
      },
    }),
    defaultSchema: {
      name: "",
      type: "rectangle",
      position: { x: 0, y: 0 },
      width: 62.5,
      height: 37.5,
      rotate: 0,
      opacity: 1,
      borderWidth: { top: 1, right: 1, bottom: 1, left: 1 },
      borderColor: "#000000",
      color: "",
      readOnly: true,
      radius: 0,
    },
  },
};
