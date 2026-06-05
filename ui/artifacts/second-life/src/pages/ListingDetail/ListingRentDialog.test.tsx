import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingRentDialog } from "./ListingRentDialog";

const cartBridge = {
  id: "listing-2",
  name: "Máy ảnh mirrorless",
  description: "",
  images: ["https://example.com/cam.jpg"],
  type: "rent" as const,
  rentPrice: 50_000,
  categoryId: "",
  subCategoryId: "",
  subCategoryName: "Điện tử",
  condition: "Cho thuê",
  location: "TP.HCM",
  stock: 1,
  rating: 4.8,
  reviewsCount: 0,
  facilityId: "facility-2",
  createdAt: new Date().toISOString(),
};

function renderRentDialog(overrides: Partial<Parameters<typeof ListingRentDialog>[0]> = {}) {
  const onCheckout = vi.fn();
  const onAddToCart = vi.fn();
  render(
    <ListingRentDialog
      open
      onOpenChange={vi.fn()}
      heroImageUrl="https://example.com/cam.jpg"
      cartBridge={cartBridge}
      variantAxes={[]}
      variantSelection={{}}
      onVariantSelectionChange={vi.fn()}
      rentUnit="DAY"
      schedulerStock={1}
      lineStock={1}
      lineUnitRentPrice={50_000}
      rentQty={1}
      onRentQtyChange={vi.fn()}
      rentWindow={{
        startMs: new Date("2026-06-10T08:00:00").getTime(),
        endExclusiveMs: new Date("2026-06-15T18:00:00").getTime(),
      }}
      onRentWindowChange={vi.fn()}
      rentValidity={{ ok: true, billUnits: 5 }}
      onRentValidityChange={vi.fn()}
      rentalPeriods={[]}
      rentalsLoading={false}
      schedulerResetKey="variant-2:1"
      checkoutDisabled={false}
      onCheckout={onCheckout}
      onAddToCart={onAddToCart}
      addToCartDisabled={false}
      {...overrides}
    />,
  );
  return { onCheckout, onAddToCart };
}

describe("ListingRentDialog", () => {
  it("calls onCheckout when Thuê ngay is clicked", async () => {
    const user = userEvent.setup();
    const { onCheckout } = renderRentDialog();
    await user.click(screen.getByRole("button", { name: "Thuê ngay" }));
    expect(onCheckout).toHaveBeenCalledOnce();
  });

  it("disables Thuê ngay when checkout is blocked", () => {
    renderRentDialog({ checkoutDisabled: true });
    expect(screen.getByRole("button", { name: "Thuê ngay" })).toBeDisabled();
  });

  it("calls onAddToCart when Thêm vào giỏ is clicked", async () => {
    const user = userEvent.setup();
    const { onAddToCart } = renderRentDialog();
    await user.click(screen.getByRole("button", { name: "Thêm vào giỏ" }));
    expect(onAddToCart).toHaveBeenCalledOnce();
  });

  it("disables Thêm vào giỏ when addToCartDisabled", () => {
    renderRentDialog({ addToCartDisabled: true });
    expect(screen.getByRole("button", { name: "Thêm vào giỏ" })).toBeDisabled();
  });
});
