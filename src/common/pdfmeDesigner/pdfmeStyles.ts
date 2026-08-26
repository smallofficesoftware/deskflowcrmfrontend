// pdfme's own "..." control-bar button opens its native Add Page After/
// Remove Page dropdown — hide it wherever Page Before/After/Remove Page
// live as our own toolbar buttons instead, so there's one place to do this,
// not two. Interpolate this into each screen's own <style> block.
export const PDFME_HIDE_NATIVE_PAGE_MENU_CSS = `.pdfme-ui-context-menu { display: none !important; }`;
