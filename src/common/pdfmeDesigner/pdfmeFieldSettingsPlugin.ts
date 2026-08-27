// Field data-binding/visibility/insert-token controls, merged into pdfme's
// own per-field sidebar via its propPanel plugin API — the same mechanism
// @pdfme/schemas' own `select` plugin uses to extend `text`'s propPanel
// (confirmed by reading @pdfme/schemas' compiled source). This is the ONE
// place this logic lives; DocumentDesignerView.tsx,
// CustomFieldDesignerPageEditorView.tsx, and
// ProductPageDesignerEditorView.tsx all call extendPluginWithFieldSettings()
// to get it, instead of each keeping its own hand-copied version — a bug
// fixed here fixes it everywhere at once, and whatever pdfme screen comes
// next gets it for free.
//
// A custom accordion/toolbar section doing this via
// designerRef.current.updateTemplate() was the ORIGINAL approach in all
// three files — updateTemplate() ALWAYS clears pdfme's internal field
// selection on the next render (confirmed by reading pdfme's own bundled
// source: TemplateEditor compares template object identity and calls
// onEditEnd() whenever it differs), closing the very panel being edited.
// changeSchemas() — only reachable from inside a propPanel widget — patches
// the field in place without ever touching the template reference, so
// selection never clears.
export interface DictionaryEntry {
  key: string;
  label: string;
  group: string;
}

const dictionaryBridge: { current: DictionaryEntry[] } = { current: [] };
const designerRefBridge: { current: { getTemplate?: () => any } | null } = { current: null };

// Called once per render from each view (same "bridge" pattern this
// codebase already uses for designerRef/fontsPromiseRef) — keeps these
// module-scope, built-once plugin objects in sync with whichever component
// instance is actually mounted right now.
export function setFieldSettingsDictionary(dictionary: DictionaryEntry[]) {
  dictionaryBridge.current = dictionary;
}

export function setFieldSettingsDesignerRef(designer: { getTemplate?: () => any } | null) {
  designerRefBridge.current = designer;
}

function getLiveField(schemaId: string): any {
  const template = designerRefBridge.current?.getTemplate?.();
  if (!template) return null;
  for (const page of template.schemas || []) {
    const found = page.find((f: any) => f.id === schemaId);
    if (found) return found;
  }
  return null;
}

function buildFieldSettingsWidget(includeTokenInsert: boolean) {
  return (props: any) => {
    const { rootElement, activeSchema, changeSchemas } = props;
    const schemaId = activeSchema.id;
    const dictionary = dictionaryBridge.current;

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.gap = "8px";

    // Bound-to-data toggle sits above the rest — flip it on to reveal the
    // data-dictionary select, off to go back to plain static text.
    const toggleLabel = document.createElement("label");
    toggleLabel.style.display = "flex";
    toggleLabel.style.alignItems = "center";
    toggleLabel.style.gap = "6px";
    toggleLabel.style.fontSize = "12px";
    toggleLabel.style.fontWeight = "600";
    toggleLabel.style.cursor = "pointer";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    const initialDataSource = typeof activeSchema.dataSource === "string" ? activeSchema.dataSource : "";
    toggle.checked = !!initialDataSource;
    toggleLabel.appendChild(toggle);
    toggleLabel.appendChild(document.createTextNode("Bound to Data"));

    const select = document.createElement("select");
    select.style.fontSize = "12px";
    select.style.width = "100%";
    select.style.display = toggle.checked ? "" : "none";
    const groups: Record<string, DictionaryEntry[]> = {};
    dictionary.forEach((d) => {
      (groups[d.group] = groups[d.group] || []).push(d);
    });
    Object.entries(groups).forEach(([group, items]) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group;
      items.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.key;
        opt.textContent = d.label;
        optgroup.appendChild(opt);
      });
      select.appendChild(optgroup);
    });
    select.value = initialDataSource || dictionary[0]?.key || "";

    toggle.addEventListener("change", () => {
      if (toggle.checked) {
        select.style.display = "";
        changeSchemas([{ key: "dataSource", value: select.value || dictionary[0]?.key || "", schemaId }]);
      } else {
        select.style.display = "none";
        changeSchemas([{ key: "dataSource", value: undefined, schemaId }]);
      }
    });
    select.addEventListener("change", () => {
      changeSchemas([{ key: "dataSource", value: select.value, schemaId }]);
    });

    const visLabel = document.createElement("label");
    visLabel.style.display = "flex";
    visLabel.style.alignItems = "center";
    visLabel.style.gap = "6px";
    visLabel.style.fontSize = "12px";
    visLabel.style.cursor = "pointer";
    const visToggle = document.createElement("input");
    visToggle.type = "checkbox";
    visToggle.checked = activeSchema.visibilityCondition?.mode === "hideIfEmpty";
    visLabel.appendChild(visToggle);
    visLabel.appendChild(document.createTextNode("Hide if empty"));
    visToggle.addEventListener("change", () => {
      changeSchemas([
        { key: "visibilityCondition", value: visToggle.checked ? { mode: "hideIfEmpty" } : undefined, schemaId },
      ]);
    });

    wrapper.appendChild(toggleLabel);
    wrapper.appendChild(select);
    wrapper.appendChild(visLabel);

    if (includeTokenInsert) {
      // pdfme's installed version (@pdfme/schemas 6.1.12) actually supports
      // inline rich text (bold/italic/strikethrough/code/links mixed within
      // one field) via textFormat: "inline-markdown" — it's just never been
      // exposed here, every text field defaults to "plain". This toggle
      // flips a field between the two; "plain" renders **word** literally,
      // "inline-markdown" renders it bold. Safe to flip on for any existing
      // field — content with no markdown syntax in it renders identically
      // either way.
      const richTextLabel = document.createElement("label");
      richTextLabel.style.display = "flex";
      richTextLabel.style.alignItems = "center";
      richTextLabel.style.gap = "6px";
      richTextLabel.style.fontSize = "12px";
      richTextLabel.style.cursor = "pointer";
      const richTextToggle = document.createElement("input");
      richTextToggle.type = "checkbox";
      richTextToggle.checked = activeSchema.textFormat === "inline-markdown";
      richTextLabel.appendChild(richTextToggle);
      richTextLabel.appendChild(document.createTextNode("Rich text (**bold**, *italic*)"));
      richTextToggle.addEventListener("change", () => {
        changeSchemas([{ key: "textFormat", value: richTextToggle.checked ? "inline-markdown" : "plain", schemaId }]);
      });
      wrapper.appendChild(richTextLabel);

      const tokenLabel = document.createElement("div");
      tokenLabel.style.fontSize = "11px";
      tokenLabel.style.color = "#666";
      tokenLabel.textContent = "Insert token:";
      const tokenRow = document.createElement("div");
      tokenRow.style.display = "flex";
      tokenRow.style.flexWrap = "wrap";
      tokenRow.style.gap = "4px";
      dictionary.forEach((d) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = `{{${d.key}}}`;
        btn.title = `${d.group}: ${d.label}`;
        btn.style.fontSize = "10px";
        btn.style.padding = "1px 6px";
        btn.style.border = "1px solid #f58634";
        btn.style.color = "#f58634";
        btn.style.background = "#fff";
        btn.style.borderRadius = "4px";
        btn.style.cursor = "pointer";
        // Reads the field's LIVE content off the designer (not the
        // `activeSchema` this widget mounted with) — canvas text typed
        // directly by the user can make that snapshot stale.
        btn.addEventListener("click", () => {
          const live = getLiveField(schemaId);
          const current =
            typeof live?.content === "string" ? live.content : typeof activeSchema.content === "string" ? activeSchema.content : "";
          const separator = current && !/\s$/.test(current) ? " " : "";
          changeSchemas([{ key: "content", value: `${current}${separator}{{${d.key}}}`, schemaId }]);
        });
        tokenRow.appendChild(btn);
      });
      wrapper.appendChild(tokenLabel);
      wrapper.appendChild(tokenRow);

      const helpNote = document.createElement("p");
      helpNote.style.fontSize = "10px";
      helpNote.style.color = "#888";
      helpNote.style.marginTop = "6px";
      helpNote.textContent =
        "Bold/underline (in the settings above) apply to the whole field. To bold or italicize just part of the text, turn on Rich text and wrap the word(s) in **double asterisks** or *single asterisks* in the content.";
      wrapper.appendChild(helpNote);
    }

    rootElement.appendChild(wrapper);
  };
}

export function extendPluginWithFieldSettings(basePlugin: any, widgetName: string, includeTokenInsert: boolean) {
  const widgetFn = buildFieldSettingsWidget(includeTokenInsert);
  return {
    ...basePlugin,
    propPanel: {
      ...basePlugin.propPanel,
      widgets: { ...basePlugin.propPanel.widgets, [widgetName]: widgetFn },
      schema: (propPanelProps: any) => {
        const base =
          typeof basePlugin.propPanel.schema === "function"
            ? basePlugin.propPanel.schema(propPanelProps)
            : basePlugin.propPanel.schema;
        return {
          ...base,
          fieldSettingsCard: {
            title: "Data Binding & Visibility",
            type: "string",
            widget: "Card",
            span: 24,
            properties: {
              fieldSettingsWidget: { type: "void", widget: widgetName, span: 24 },
            },
          },
        };
      },
    },
  };
}
