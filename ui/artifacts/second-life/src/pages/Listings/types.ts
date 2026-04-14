export type ListingsView = "dashboard" | "facility" | "facility-product" | "unpublished" | "orders";

export interface PendingProduct {
  id: string;
  name: string;
  description: string;
  color: string;
  material: string;
  forRent: boolean;
  forBuy: boolean;
  rentQty: number;
  buyQty: number;
  totalQty: number;
  previewUrl: string;
  facilityId: string;
  rentPrice?: number;
  buyPrice?: number;
}

/** Payload từ form thêm sản phẩm (mock) */
export interface AddProductSubmitPayload {
  name: string;
  description: string;
  color: string;
  material: string;
  forRent: boolean;
  forBuy: boolean;
  rentQty: number;
  buyQty: number;
  totalQty: number;
  previewUrl: string;
  facilityId: string;
}
