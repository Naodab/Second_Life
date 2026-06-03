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
  manufactureYear?: number;
  facilityId: string;
  subCategoryIds: string[];
  primarySubCategoryId: string;
  attributeIds: string[];
  variants: {
    skuPreview: string;
    attributeValueIds: string[];
  }[];
  thumbnailFile: File;
  galleryImageFiles: File[];
  videoFile: File | null;
}
