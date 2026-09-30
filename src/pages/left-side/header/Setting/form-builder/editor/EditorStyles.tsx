import React from "react";

// Scoped inline style block for the three-panel editor, same convention as
// formBuilderBrandStyles.tsx (every screen in this app owns its own styles).
// Accent = the app's orange #F58634.
const EditorStyles: React.FC = () => (
  <style>{`
    .fb-editor-topbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 12px; }
    .fb-editor-topbar h4 { margin: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; }
    .fb-editor-topbar .fb-spacer { flex: 1 1 auto; }
    .fb-seg { display: inline-flex; border: 1px solid #ced4da; border-radius: 6px; overflow: hidden; }
    .fb-seg button { border: 0; background: #fff; padding: 4px 12px; font-size: 13px; color: #495057; }
    .fb-seg button + button { border-left: 1px solid #ced4da; }
    .fb-seg button.active { background: #F58634; color: #fff; }
    .fb-save-state { font-size: 12px; color: #6c757d; display: inline-flex; align-items: center; gap: 4px; max-width: 360px; }
    .fb-save-state.fb-bad { color: #dc3545; }
    .fb-save-state span.fb-msg { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .fb-icon-btn { padding: 2px 8px; }
    .fb-redo-icon { display: inline-block; transform: scaleX(-1); }

    .fb-panel { background: #fff; border: 1px solid #e3e6ea; border-radius: 8px; }
    .fb-panel-title { font-weight: 600; font-size: 14px; padding: 10px 12px; border-bottom: 1px solid #e3e6ea; display: flex; align-items: center; gap: 6px; }
    .fb-panel-body { padding: 12px; }
    @media (min-width: 992px) {
      .fb-panel-sticky { position: sticky; top: 8px; max-height: calc(100vh - 110px); overflow-y: auto; }
    }

    .fb-palette-group { margin-bottom: 10px; }
    .fb-palette-group-title { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #6c757d; margin: 6px 0 4px; }
    .fb-palette-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; border: 1px solid #e3e6ea; background: #fff;
      border-radius: 6px; padding: 6px 8px; margin-bottom: 4px; font-size: 13px; cursor: grab; touch-action: none; }
    .fb-palette-item:hover, .fb-palette-item:focus { border-color: #F58634; color: #F58634; outline: none; }
    .fb-palette-item i { width: 16px; text-align: center; color: #F58634; }
    .fb-palette-chip { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #F58634; color: #F58634;
      border-radius: 6px; padding: 6px 10px; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,.15); cursor: grabbing; }

    .fb-canvas { min-height: 320px; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px dashed transparent; }
    .fb-canvas.fb-canvas-over { border-color: #F58634; }
    .fb-canvas-empty { text-align: center; color: #6c757d; padding: 48px 12px; }
    .fb-canvas-item { position: relative; background: #fff; border: 1px solid #e3e6ea; border-radius: 6px; padding: 8px 10px 4px 28px;
      margin-bottom: 12px; cursor: pointer; }
    .fb-canvas-item:hover { border-color: #f5ab7a; }
    .fb-canvas-item:focus { outline: none; box-shadow: 0 0 0 2px rgba(245,134,52,.35); }
    .fb-canvas-item.fb-selected { border-color: #F58634; box-shadow: 0 0 0 1px #F58634; background: #fffaf5; }
    .fb-canvas-item.fb-dragging { opacity: .5; }
    .fb-canvas-item.fb-drop-before { box-shadow: 0 -3px 0 0 #F58634; }
    .fb-canvas-item.fb-drop-after { box-shadow: 0 3px 0 0 #F58634; }
    .fb-canvas-item .fb-handle { position: absolute; left: 8px; top: 10px; color: #adb5bd; cursor: grab; }
    .fb-canvas-item .fb-item-tools { position: absolute; right: 6px; top: 4px; display: flex; gap: 2px; z-index: 2; }
    .fb-canvas-item .fb-item-tools button { padding: 0 6px; font-size: 12px; }
    .fb-canvas-item .fb-item-preview { pointer-events: none; }
    .fb-canvas-item .fb-item-preview .form-group { margin-bottom: 4px; }
    .fb-canvas-item .fb-item-meta { font-size: 11px; color: #adb5bd; }
    .fb-canvas-section { background: #fff4ec; border-color: #f5c9a8; padding-top: 6px; padding-bottom: 6px; }
    .fb-canvas-section h5 { margin: 0; font-size: 16px; }
    .fb-canvas-placeholder { color: #adb5bd; font-style: italic; font-size: 13px; padding: 4px 0 8px; }
    .fb-canvas-end { height: 36px; border-radius: 6px; }
    .fb-canvas-end.fb-drop-here { border: 2px dashed #F58634; }

    .fb-settings-group { border-top: 1px solid #eef0f2; padding-top: 8px; margin-top: 8px; }
    .fb-settings-group:first-of-type { border-top: 0; margin-top: 0; padding-top: 0; }
    .fb-settings-group-toggle { background: none; border: 0; padding: 0; font-weight: 600; font-size: 13px; color: #343a40; display: flex; align-items: center; gap: 6px; width: 100%; text-align: left; }
    .fb-settings-group-body { padding-top: 8px; }
    .fb-settings-group-body .form-group { margin-bottom: 10px; }
    .fb-flex-input { flex: 1 1 0; min-width: 0; width: auto; }
    .fb-col-row { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; background: #fff; }
    .fb-col-row .fb-handle { color: #adb5bd; cursor: grab; padding: 0 2px; touch-action: none; }
    .fb-col-row select { max-width: 100px; }

    .fb-preview-wrap { display: flex; justify-content: center; }
    .fb-preview-frame { background: #fff; border: 1px solid #e3e6ea; border-radius: 8px; padding: 16px; width: 100%; max-width: 960px; }
    .fb-preview-frame.fb-preview-mobile { max-width: 375px; border: 8px solid #343a40; border-radius: 24px; min-height: 640px; max-height: 760px; overflow-y: auto; overflow-x: hidden; }
  `}</style>
);

export default EditorStyles;
