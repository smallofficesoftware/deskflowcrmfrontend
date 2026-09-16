// Single source of truth for the per-doc-type Document Designer feature
// flag keys (company_feature_flags.feature_key). Each doc type is gated
// independently so a company can enable e.g. Quotation without also
// getting Sales Order/Shipping Label/etc. Keep in sync with
// orderServices.js's PDFME_DOC_TYPE_BY_CART_TYPE and the equivalent
// per-doc-type gates in accountTransactionServices.js,
// employeeAccountTransactionService.js, contactService.js and
// taskManagementServices.js.
export const DOCUMENT_DESIGNER_FEATURE_KEYS: { key: string; label: string }[] = [
  { key: "quotation_document_designer", label: "Quotation" },
  { key: "salesOrder_document_designer", label: "Sales Order" },
  { key: "salesInvoice_document_designer", label: "Sales Invoice" },
  { key: "purchaseInvoice_document_designer", label: "Purchase Invoice" },
  { key: "purchaseOrder_document_designer", label: "Purchase Order" },
  { key: "returnSalesInvoice_document_designer", label: "Return Sales Invoice" },
  { key: "returnPurchaseInvoice_document_designer", label: "Return Purchase Invoice" },
  { key: "inward_document_designer", label: "Inward" },
  { key: "dispatch_document_designer", label: "Dispatch" },
  { key: "proformaInvoice_document_designer", label: "Proforma Invoice" },
  { key: "pendingSalesOrder_document_designer", label: "Pending Sales Order" },
  { key: "pendingPurchaseOrder_document_designer", label: "Pending Purchase Order" },
  { key: "shippingLabel_document_designer", label: "Shipping Label" },
  { key: "accountTransaction_document_designer", label: "Account Transaction" },
  { key: "accountStatement_document_designer", label: "Account Statement" },
  { key: "employeeAccountTransaction_document_designer", label: "Employee Account Transaction" },
  { key: "employeeAccountStatement_document_designer", label: "Employee Account Statement" },
  { key: "contactAddress_document_designer", label: "Contact Address" },
  { key: "contactEnvelope_document_designer", label: "Contact Envelope" },
  { key: "taskDueList_document_designer", label: "Task Due List" },
];

export const documentDesignerFeatureKeyForDocType = (docType: string): string =>
  `${docType}_document_designer`;
