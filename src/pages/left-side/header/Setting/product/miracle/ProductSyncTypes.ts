// productSync.types.ts
// Shared types for the Product Sync feature (DeskFlow CRM <-> Third-Party Software)

export type MatchField = "code" | "name" | "alias" | "unique_id";

export type SyncStep = "criteria" | "preview" | "processing";

/** Product as returned by the third-party software's API */
export interface ThirdPartyProduct {
  id: string | number;
  code: string;
  name: string;
  alias?: string | null;
  price?: number;
  category?: string;
}

/** Product as it exists in our own database */
export interface OurProduct {
  id: number;
  code: string;
  name: string;
  alias?: string | null;
  third_party_id?: string | number | null;
}

/** One row in the preview/comparison table */
export interface SyncPreviewItem {
  thirdPartyProduct: ThirdPartyProduct;
  matchedProduct: OurProduct | null;
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
  errors?: { productId: string | number; message: string }[];
}
