import { BACKEND_OF_SMALL_OFFICE_CRM_END_POINT } from "../../helpers/AppConstants";

// Noto Sans Devanagari/Gujarati (Hindi/Gujarati script support — Poppins has
// no glyphs for either) must match fonts.js's generate-time font names
// exactly, or a field picking one by name here would render fine on canvas
// but fall back to Poppins (tofu boxes) in the actual generated PDF. Every
// pdfme Designer mount in this app (DocumentDesignerView.tsx,
// CustomFieldDesignerPageEditorView.tsx, ProductPageDesignerEditorView.tsx,
// and whatever's next) shares this one copy — previously each file kept its
// own identical copy-paste of this function.
export async function loadDesignerFonts() {
  const files = [
    "Poppins-Regular.ttf",
    "Poppins-Bold.ttf",
    "Poppins-SemiBold.ttf",
    "NotoSansDevanagari-Regular.ttf",
    "NotoSansGujarati-Regular.ttf",
  ];
  const [regular, bold, semiBold, notoDevanagari, notoGujarati] = await Promise.all(
    files.map((f) => fetch(`${BACKEND_OF_SMALL_OFFICE_CRM_END_POINT}/fonts/${f}`).then((r) => r.arrayBuffer())),
  );
  return {
    Poppins: { data: regular, fallback: true },
    "Poppins Bold": { data: bold },
    "Poppins SemiBold": { data: semiBold },
    "Noto Sans Devanagari": { data: notoDevanagari },
    "Noto Sans Gujarati": { data: notoGujarati },
  };
}
