import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ListingBuyDialog } from "./ListingBuyDialog";

const cartBridge = {
  id: "listing-1",
  name: "Áo khoác denim",
  description: "",
  images: ["https://example.com/a.jpg"],
  type: "buy" as const,
  buyPrice: 120_000,
  categoryId: "",
  subCategoryId: "",
  subCategoryName: "Thời trang",
  condition: "Đăng bán",
  location: "Hà Nội",
  stock: 3,
  rating: 4.5,
  reviewsCount: 0,
  facilityId: "facility-1",
  createdAt: new Date().toISOString(),
};

function renderBuyDialog(overrides: Partial<Parameters<typeof ListingBuyDialog>[0]> = {}) {
  const onCheckout = vi.fn();
  const onAddToCart = vi.fn();
  render(
    <ListingBuyDialog
      open
      onOpenChange={vi.fn()}
      heroImageUrl="https://example.com/a.jpg"
      cartBridge={cartBridge}
      variantAxes={[]}
      variantSelection={{}}
      onVariantSelectionChange={vi.fn()}
      lineStock={3}
      lineUnitBuyPrice={120_000}
      buyQty={2}
      onBuyQtyChange={vi.fn()}
      checkoutDisabled={false}
      onCheckout={onCheckout}
      onAddToCart={onAddToCart}
      addToCartDisabled={false}
      {...overrides}
    />,
  );
  return { onCheckout, onAddToCart };
}

describe("ListingBuyDialog", () => {
  it("calls onCheckout when Mua ngay is clicked", async () => {
    const user = userEvent.setup();
    const { onCheckout } = renderBuyDialog();
    await user.click(screen.getByRole("button", { name: "Mua ngay" }));
    expect(onCheckout).toHaveBeenCalledOnce();
  });

  it("disables Mua ngay when checkout is blocked", () => {
    renderBuyDialog({ checkoutDisabled: true });
    expect(screen.getByRole("button", { name: "Mua ngay" })).toBeDisabled();
  });

  it("calls onAddToCart when Thêm vào giỏ is clicked", async () => {
    const user = userEvent.setup();
    const { onAddToCart } = renderBuyDialog();
    await user.click(screen.getByRole("button", { name: "Thêm vào giỏ" }));
    expect(onAddToCart).toHaveBeenCalledOnce();
  });

  it("disables Thêm vào giỏ when addToCartDisabled", () => {
    renderBuyDialog({ addToCartDisabled: true });
    expect(screen.getByRole("button", { name: "Thêm vào giỏ" })).toBeDisabled();
  });
});
