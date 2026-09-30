import React from "react";

// Phone-friendly fill screens (plan A11) — rendered by FormFieldsRenderer, so
// it covers InternalFormFillView, PublicFormFillView and the editor preview.
// Rules apply below 768px (where col-md-* already stack to full width), and
// always inside .fb-force-mobile (the editor's Mobile preview frame, which
// sits in a wide browser window so the media query can't fire).
const phoneRules = (p: string) => `
  ${p}.fb-fill .form_label.text-truncate { white-space: normal; overflow: visible; }
  ${p}.fb-fill .form-control { font-size: 16px; min-height: 44px; }
  ${p}.fb-fill textarea.form-control { min-height: 88px; }
  ${p}.fb-fill .form-check { margin-bottom: 8px; }
  ${p}.fb-fill .form-check-input { width: 1.25em; height: 1.25em; }
  ${p}.fb-submit-bar { position: sticky; bottom: 0; z-index: 5; background: #fff; margin-top: 12px;
    padding: 8px 0 calc(8px + env(safe-area-inset-bottom)); border-top: 1px solid #e3e6ea; }
  ${p}.fb-submit-bar .btn { width: 100%; min-height: 44px; margin-top: 0 !important; }
  ${p}.fb-repeater-scroll { overflow-x: visible; }
  ${p}.fb-repeater-table, ${p}.fb-repeater-table tbody, ${p}.fb-repeater-table tr, ${p}.fb-repeater-table td { display: block; width: 100%; }
  ${p}.fb-repeater-table { border: 0; }
  ${p}.fb-repeater-table thead { display: none; }
  ${p}.fb-repeater-table tr { border: 1px solid #dee2e6; border-radius: 8px; padding: 8px 10px; margin-bottom: 10px; background: #fff; }
  ${p}.fb-repeater-table td { border: 0 !important; padding: 4px 0; }
  ${p}.fb-repeater-table td[data-label]::before { content: attr(data-label); display: block; font-size: 12px; color: #6c757d; margin-bottom: 2px; }
  ${p}.fb-repeater-table td.fb-rep-actions .btn { width: 100%; min-height: 40px; }
  ${p}.fb-repeater-add { width: 100%; min-height: 44px; }
`;

const FillResponsiveStyles: React.FC = () => (
  <style>{`
    .fb-fill { max-width: 100%; overflow-wrap: anywhere; }
    @media (max-width: 767.98px) {
      ${phoneRules("")}
    }
    ${phoneRules(".fb-force-mobile ")}
  `}</style>
);

export default FillResponsiveStyles;
