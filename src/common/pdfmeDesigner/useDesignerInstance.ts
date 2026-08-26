import { Designer } from "@pdfme/ui";
import { useRef, useState } from "react";
import { loadDesignerFonts } from "./pdfmeFonts";
import { setFieldSettingsDesignerRef } from "./pdfmeFieldSettingsPlugin";

export interface SelectedField {
  name: string;
  pageIndex: number;
  schemaIndex: number;
  schema: any;
}

// One shared mount routine for every pdfme Designer instance in this app —
// DocumentDesignerView.tsx, CustomFieldDesignerPageEditorView.tsx, and
// ProductPageDesignerEditorView.tsx each used to keep their own hand-copied
// version of this; a bug fixed here (like the retry below) fixes it for all
// three, and for whatever uses pdfme next.
//
// `onSelectionChange` is captured ONCE, the first time this mounts a real
// Designer instance (pdfme's own onChangeSelection registration only
// happens at construction) — pass a stable function (e.g. a useState
// setter) rather than an inline arrow that changes identity every render.
export function useDesignerInstance(plugins: any, onSelectionChange: (field: SelectedField | null) => void) {
  const designerContainerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer | null>(null);
  const fontsPromiseRef = useRef<Promise<any> | null>(null);
  const [designerMounted, setDesignerMounted] = useState(false);

  if (!fontsPromiseRef.current) {
    fontsPromiseRef.current = loadDesignerFonts();
  }

  const mountOrUpdateDesigner = async (template: any) => {
    if (designerRef.current) {
      console.log("[pdfme-mount] updateTemplate() on existing instance");
      designerRef.current.updateTemplate(template);
      return;
    }
    console.log("[pdfme-mount] awaiting fonts...");
    const font = await fontsPromiseRef.current;
    console.log("[pdfme-mount] fonts resolved, container present?", !!designerContainerRef.current);
    // The font fetch can outlive a fast re-render (e.g. React re-running
    // this effect before the network request finishes) — the container DOM
    // node briefly detaches/reattaches during that window. Retrying a few
    // times over ~500ms covers that race instead of permanently giving up
    // on the very next tick.
    for (let attempt = 0; !designerContainerRef.current && attempt < 10; attempt++) {
      console.log(`[pdfme-mount] container missing, retry ${attempt + 1}/10...`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!designerContainerRef.current) {
      console.error("[pdfme-mount] ABORTED: designerContainerRef.current still null after retries (stale/unmounted component)");
      return;
    }
    try {
      designerRef.current = new Designer({
        domContainer: designerContainerRef.current,
        template,
        plugins,
        options: {
          zoomLevel: 1,
          maxZoom: 500,
          font,
          sidebarOpen: true,
          theme: { token: { colorPrimary: "#f58634" } },
        },
      });
      setFieldSettingsDesignerRef(designerRef.current);
      setDesignerMounted(true);
      console.log("[pdfme-mount] Designer constructed OK");
    } catch (e) {
      console.error("[pdfme-mount] Designer constructor THREW:", e);
      throw e;
    }
    designerRef.current.onChangeSelection((selection) => {
      const schemas = selection.schemas;
      onSelectionChange(
        schemas.length === 1
          ? { name: schemas[0].name, pageIndex: schemas[0].pageIndex, schemaIndex: schemas[0].schemaIndex, schema: schemas[0].schema }
          : null,
      );
    });
  };

  return { designerContainerRef, designerRef, designerMounted, mountOrUpdateDesigner };
}
