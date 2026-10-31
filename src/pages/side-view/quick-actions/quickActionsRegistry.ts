import { PAGE_ID, PERMISSION_TYPE } from "../../../helpers/AppEnum";
import { reportsMenuData } from "../reportsMenuData";

// Quick actions of the web Side view. The ids are the SAME as the app's Home Quick actions
// (flutter/lib/Screen/Home/quick_actions_registry.dart), because the chosen actions are saved with the same service
// (report key "home_quick_actions"): one choice then works on both. The app's "Scan Card" is left out (phone camera).
// The list order is the default order, as in the app.

export type TQuickGroup = "daily" | "sales" | "production" | "field";

export const QUICK_GROUP_LABEL: Record<TQuickGroup, string> = {
  daily: "Daily work",
  sales: "Sales documents",
  production: "Production",
  field: "Field & team",
};

/** How an action opens. */
export type TQuickOpen =
  // an existing report / list screen of the Side view
  | { kind: "report"; slug: string }
  // a create popup of its own (customer: the popup needs a customer, so a picker opens first)
  | { kind: "create"; popup: "contact" | "task" | "visit" | "jobcard" }
  | { kind: "create"; popup: "inquiry" | "reminder"; needsCustomer: true }
  // a new sales / purchase document (OrderCreateModal with its document type number)
  | { kind: "document"; orderType: number };

export interface IQuickAction {
  id: string;
  label: string;
  /** PrimeIcons class. */
  icon: string;
  group: TQuickGroup;
  open: TQuickOpen;
  /** Page whose right is needed. A report action uses the report's own page (the one the sidebar checks). */
  pageId: number;
  right: PERMISSION_TYPE.VIEW | PERMISSION_TYPE.ADD;
  /** Shown when the user has never chosen (the app's defaults). */
  isDefault?: boolean;
}

// slug -> the report's own page id, from the sidebar menu data (the single place that knows it).
const reportPageIds: Record<string, number> = {};
reportsMenuData.forEach((group) => group.subMenus.forEach((sub) => (reportPageIds[sub.value] = Number(sub.pageId) || 0)));

const viewReport = (id: string, label: string, icon: string, group: TQuickGroup, slug: string, isDefault = false): IQuickAction => ({
  id,
  label,
  icon,
  group,
  open: { kind: "report", slug },
  pageId: reportPageIds[slug] ?? 0,
  right: PERMISSION_TYPE.VIEW,
  isDefault,
});

/** The ten sales / purchase documents, in the app's order: key (the app's id part), name, type number the create popup
 * takes, its page for the "Add" right, and the report slug for "View". */
const DOCUMENTS = [
  { key: "quotation", name: "Quotation", orderType: 1, pageId: PAGE_ID.QUOTATION, slug: "quotation", isDefault: true },
  { key: "order", name: "Sales Order", orderType: 2, pageId: PAGE_ID.ORDER, slug: "order", isDefault: true },
  { key: "proforma", name: "Proforma Invoice", orderType: 12, pageId: PAGE_ID.PROFOMA_INVOICE, slug: "proforma_invoice_report" },
  { key: "dispatch", name: "Dispatch", orderType: 9, pageId: PAGE_ID.DISPATCH, slug: "dispatch_report" },
  { key: "invoice", name: "Sales Invoice", orderType: 3, pageId: PAGE_ID.INVOICE, slug: "order_invoice" },
  { key: "return_sales", name: "Return Sales Invoice", orderType: 6, pageId: PAGE_ID.RETURN_SALES_INVOICE, slug: "return_sales_invoice" },
  { key: "purchase_order", name: "Purchase Order", orderType: 5, pageId: PAGE_ID.PURCHASE_ORDER, slug: "purchase_order" },
  { key: "inward", name: "Goods Received Note", orderType: 8, pageId: PAGE_ID.INWARD, slug: "inward_report" },
  { key: "purchase", name: "Purchase Invoice", orderType: 4, pageId: PAGE_ID.PURCHASE, slug: "purchase_invoice" },
  { key: "return_purchase", name: "Return Purchase Invoice", orderType: 7, pageId: PAGE_ID.RETURN_PURCHASE_INVOICE, slug: "return_purchase_invoice" },
];

const documentActions = (): IQuickAction[] =>
  DOCUMENTS.flatMap((d) => [
    {
      id: `new_${d.key}`,
      label: `Add ${d.name}`,
      icon: "pi pi-file-edit",
      group: "sales" as TQuickGroup,
      open: { kind: "document", orderType: d.orderType } as TQuickOpen,
      pageId: d.pageId,
      right: PERMISSION_TYPE.ADD as PERMISSION_TYPE.ADD,
      isDefault: d.isDefault,
    },
    viewReport(`view_${d.key}`, `View ${d.name}`, "pi pi-list", "sales", d.slug),
  ]);

export const buildQuickActionRegistry = (): IQuickAction[] => [
  // ---- Daily work ---------------------------------------------------------
  { id: "add_contact", label: "Add Contact", icon: "pi pi-user-plus", group: "daily", open: { kind: "create", popup: "contact" }, pageId: PAGE_ID.CONTACT, right: PERMISSION_TYPE.ADD, isDefault: true },
  { id: "add_inquiry", label: "Add Inquiry", icon: "pi pi-question-circle", group: "daily", open: { kind: "create", popup: "inquiry", needsCustomer: true }, pageId: PAGE_ID.INQUIRY, right: PERMISSION_TYPE.ADD, isDefault: true },
  { id: "add_task", label: "Add Task", icon: "pi pi-check-square", group: "daily", open: { kind: "create", popup: "task" }, pageId: PAGE_ID.TASK_MANAGEMENT, right: PERMISSION_TYPE.ADD, isDefault: true },
  { id: "add_reminder", label: "Add Reminder", icon: "pi pi-bell", group: "daily", open: { kind: "create", popup: "reminder", needsCustomer: true }, pageId: PAGE_ID.REMINDER, right: PERMISSION_TYPE.ADD, isDefault: true },
  viewReport("open_reminders", "Reminders", "pi pi-clock", "daily", "allreminder_report", true),
  viewReport("open_tasks", "Tasks", "pi pi-check-circle", "daily", "alltask_report"),
  viewReport("open_contacts", "Contacts", "pi pi-users", "daily", "all_contact_report"),
  viewReport("open_inquiries", "Inquiries", "pi pi-inbox", "daily", "all_inquiry_report"),
  viewReport("personal_notes", "Notes", "pi pi-book", "daily", "PersonalNotes_Report"),

  // ---- Sales documents: Add + View for each of the ten ---------------------
  ...documentActions(),

  // ---- Production ----------------------------------------------------------
  { id: "add_job_card", label: "Add Job Card", icon: "pi pi-wrench", group: "production", open: { kind: "create", popup: "jobcard" }, pageId: PAGE_ID.JOB_CARD, right: PERMISSION_TYPE.ADD },
  viewReport("job_cards", "Job Cards", "pi pi-th-large", "production", "Job_Card_Grid"),

  // ---- Field & team --------------------------------------------------------
  viewReport("support_tickets", "Support", "pi pi-ticket", "field", "support_ticket_report"),
  viewReport("visits", "Visits", "pi pi-map-marker", "field", "all_visit_report"),
  { id: "add_visit", label: "Add Visit", icon: "pi pi-map", group: "field", open: { kind: "create", popup: "visit" }, pageId: PAGE_ID.VISIT, right: PERMISSION_TYPE.ADD },
  viewReport("products", "Products", "pi pi-box", "sales", "Products_Report"),
  // The app's Call History reads the phone's own call log; on the web it opens the All Call Report.
  viewReport("call_history", "Call History", "pi pi-phone", "field", "all_call_report"),
  viewReport("route_planner", "Routes", "pi pi-directions", "field", "route_planner"),
];

/** At most this many actions are shown on the page (the app's limit). */
export const QUICK_ACTION_LIMIT = 8;

/** The saved choice is shared with the app under this report key. */
export const QUICK_ACTIONS_KEY = "home_quick_actions";

/** The ordered list to show, as the app's resolveQuickActions: never saved = the defaults; saved = the saved ids that
 * are still allowed, minus the hidden ones. */
export const resolveQuickActions = (allowed: IQuickAction[], savedOrder: string[] | null | undefined, savedHidden: string[] | null | undefined) => {
  if (!savedOrder) return allowed.filter((a) => a.isDefault);
  const hidden = new Set(savedHidden ?? []);
  const byId = new Map(allowed.map((a) => [a.id, a]));
  return savedOrder.filter((id) => !hidden.has(id) && byId.has(id)).map((id) => byId.get(id)!);
};
