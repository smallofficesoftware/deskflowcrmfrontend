// ─────────────────────────────────────────────────────────────────────────────
// index.ts  — barrel export for the campaign module
// Import everything from one place:
//   import { CampaignModal } from "./campaign";
// ─────────────────────────────────────────────────────────────────────────────

export { default as CampaignModal } from "./CampaignModal";
export { default as RecipientSelector } from "./RecipientSelector";
export { CampaignService, getCampaignService } from "./campaign.service";
export * from "./campaign.types";
export * from "./campaign.utils";

// ─────────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLE
// ─────────────────────────────────────────────────────────────────────────────
//
// import { useState } from "react";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { CampaignModal } from "./campaign";
//
// export default function LeadManagementApp() {
//   const [showCampaign, setShowCampaign] = useState(false);
//
//   // ── These come from your current lead list / filter state ──
//   const activeFilters = {
//     from_date:    "2026-04-01",
//     to_date:      "2026-05-31",
//     contact_type: "lead",
//     city:         "Rajkot",
//     status:       "hot",
//   };
//
//   // ── How template variables map to your Excel/CRM columns ──
//   const variableConfig = {
//     1: "customer_name",
//     2: "company_name",
//     3: "mobile",
//     4: "city",
//   };
//
//   return (
//     <>
//       <button onClick={() => setShowCampaign(true)}>
//         🚀 Send WhatsApp Campaign
//       </button>
//
//       <CampaignModal
//         show={showCampaign}
//         onHide={() => setShowCampaign(false)}
//
//         // ── Your backend (proxies to WhatsApp API) ──
//         backendBaseUrl="https://your-crm.example.com/api"
//         backendApiKey="your-secret-api-key"
//
//         // ── Dynamic filters from your lead management state ──
//         whereParams={activeFilters}
//
//         // ── Variable → column mapping for Excel generation ──
//         templateVariables={variableConfig}
//
//         // ── CRM fields shown in the mapping dropdowns ──
//         predefinedFields={[
//           { label: "Customer Name",  value: "customer_name" },
//           { label: "Company Name",   value: "company_name"  },
//           { label: "Mobile",         value: "mobile"        },
//           { label: "City",           value: "city"          },
//           { label: "Email",          value: "email"         },
//           { label: "Sales Order",    value: "order_id"      },
//           { label: "Amount",         value: "amount"        },
//         ]}
//
//         onSuccess={(res) => {
//           console.log("Campaign sent!", res.campaign_id);
//           // refresh your lead list, show a success notification, etc.
//         }}
//       />
//
//       <ToastContainer position="top-right" autoClose={4000} theme="light" />
//     </>
//   );
// }
//
// ─────────────────────────────────────────────────────────────────────────────
// BACKEND APIs EXPECTED
// ─────────────────────────────────────────────────────────────────────────────
//
// GET  /campaign/templates
//   → { templates: Template[] }
//
// POST /campaign/generate-excel
//   Body: { where: WhereParams, variable_mapping: TemplateVariableConfig, template_id: string }
//   → { success: true, excel_token: string, total_count: number, download_url: string }
//
// POST /campaign/send
//   Body: SendCampaignRequest (see campaign.types.ts)
//   → { success: true, campaign_id: string, message: string, queued_count?: number }
//
// ─────────────────────────────────────────────────────────────────────────────
// FILE STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
//
// campaign/
// ├── index.ts                ← this file (barrel export)
// ├── campaign.types.ts       ← all TypeScript interfaces
// ├── campaign.service.ts     ← axios API layer (Frontend → Your Backend)
// ├── campaign.utils.ts       ← pure helper functions
// ├── RecipientSelector.tsx   ← reusable recipient selection component
// └── CampaignModal.tsx       ← main 5-step wizard modal
