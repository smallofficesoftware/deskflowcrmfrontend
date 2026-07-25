// productSync.types.ts
// Shared types for the Product Sync feature (DeskFlow CRM <-> Third-Party Software)

export type MatchField =
  | "unique_id"
  | "mobile_number"
  | "gst_number"
  | "contact_name"
  | "client_code";

export type SyncStep = "criteria" | "preview" | "processing";

/** Product as returned by the third-party software's API */
export interface ThirdPartyContact {
  id: string | number;
  name: string;
  gst_number: string;
  mobile_number?: number;
}

/** Product as it exists in our own database */
export interface OurContact {
  id: number;
  name: string;
  gst_number: string | null;
  mobile_number: string | null;
  third_party_id?: string | number | null;
}

/** One row in the preview/comparison table */
export interface SyncPreviewItem {
  thirdPartyContact: ThirdPartyContact;
  matchedContact: OurContact | null;
  matchedBy: MatchField | null;
  status: "matched" | "new";
}

/** Response for POST /product-sync/preview */
export interface SyncPreviewResponse {
  items: SyncPreviewItem[];
  totalFetched: number;
  totalMatched: number;
  totalNew: number;
}

/** Response for POST /product-sync/process */
export interface SyncProcessResponse {
  updatedCount: number;
  createdCount: number;
  failedCount: number;
  errors?: { contactId: string | number; message: string }[];
}
