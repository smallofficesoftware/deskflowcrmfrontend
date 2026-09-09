import React from "react";

// Bootstrap's default .btn-primary is blue — doesn't match this app's own
// accent (#F58634 / rgb(245,134,52), the same orange used everywhere else:
// Setting.tsx's tile icons, SideBarView.tsx's Smart Reports/Published Forms
// icons). Same fix, same reasoning, same colors as ReportBuilderListView.tsx's
// own .rb-btn-primary override (verified — that's the actual, closest real
// precedent for a plain list-style screen at this same routing tier) — this
// is the form_builder equivalent, scoped to these screens only, matching
// how every screen in this app owns its own inline style block rather than
// a shared global override.
const FormBuilderBrandStyles: React.FC = () => (
  <style>{`
    .fb-btn-primary { background-color: #F58634; border-color: #F58634; color: #fff; }
    .fb-btn-primary:hover, .fb-btn-primary:focus { background-color: #e0752a; border-color: #e0752a; color: #fff; }
    .fb-btn-primary:disabled { background-color: #f5ab7a; border-color: #f5ab7a; }
    .fb-btn-outline-primary { color: #F58634; border-color: #F58634; background-color: transparent; }
    .fb-btn-outline-primary:hover, .fb-btn-outline-primary:focus { background-color: #F58634; border-color: #F58634; color: #fff; }
  `}</style>
);

export default FormBuilderBrandStyles;
