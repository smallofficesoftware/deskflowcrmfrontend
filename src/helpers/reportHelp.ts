// "How this report works" text shown by ReportHelpButton, keyed by report.
// Keep each entry in sync with the report's backend service - the date
// column in particular differs from report to report.

export interface IReportHelp {
  title: string;
  summary: string;
  dateRange: string;
  filters: { name: string; description: string }[];
}

export const REPORT_HELP: Record<string, IReportHelp> = {
  all_contact: {
    title: "All Contact Report",
    summary:
      "Lists your contacts. Team members who can only see their own data see contacts they created or that are assigned to them.",
    dateRange:
      "Filters by the date the contact was created. When a product filter is applied, it filters by the document / inquiry date instead.",
    filters: [
      {
        name: "Label",
        description:
          "OR: contacts that have any of the selected labels. AND: contacts that have all of them. \"Blank\" shows contacts with no label.",
      },
      {
        name: "Source type",
        description:
          "Contacts from the selected sources. \"Blank\" shows contacts with no source.",
      },
      {
        name: "Stage and Status",
        description:
          "Contacts currently in the selected status. \"Blank\" shows contacts with no status.",
      },
      {
        name: "Team Member",
        description: "Contacts created by the selected team members.",
      },
      {
        name: "Multi team Member",
        description:
          "Contacts created by (Created By) or assigned to (Assigned To) any of the selected team members.",
      },
      {
        name: "Demography",
        description: "Contacts in the selected country / state / city / area.",
      },
      {
        name: "Product + Document Type",
        description:
          "Contacts who have the selected product in at least one document of the selected type (e.g. Quotation, Sales Invoice) or in an Inquiry. Both must be selected.",
      },
      {
        name: "Lead Ageing",
        description:
          "Days: contacts whose last activity (of the selected types) was at least that many days ago. 0: contacts with no activity at all.",
      },
    ],
  },
};
