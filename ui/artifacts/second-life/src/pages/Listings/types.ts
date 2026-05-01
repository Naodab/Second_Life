export interface PendingProduct {
  id: string;
  name: string;
  description: string;
  subCategoryIds: string[];
  attributeIds: string[];
  variantCount: number;
  totalQty: number;
  previewUrl: string;
  facilityId: string;
  price?: number;
}

export interface AddProductSubmitPayload {
  name: string;
  description: string;
  facilityId: string;
  subCategoryIds: string[];
  primarySubCategoryId: string;
  attributeIds: string[];
  variants: {
    skuPreview: string;
    quantity: number;
    attributeValueIds: string[];
  }[];
  previewUrl: string;
  coverFile: File | null;
  otherImageFiles: File[];
}
