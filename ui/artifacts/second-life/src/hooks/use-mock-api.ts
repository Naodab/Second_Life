import { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, MOCK_FACILITIES, MOCK_REVIEWS, Product, MockFacility, Review } from '@/lib/mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useProducts(
  subCategoryIds?: string[] | null,
  listingType?: string,
  categoryIds?: string[] | null,
  provinceName?: string | null,
  wardName?: string | null,
) {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let filtered = [...MOCK_PRODUCTS];
    const normalize = (v?: string | null) => (v ?? "").trim().toLowerCase();
    const subIds = (subCategoryIds?.filter(Boolean) ?? []).map(String);
    if (subIds.length > 0) {
      const allowed = new Set(subIds);
      filtered = filtered.filter((p) => allowed.has(String(p.subCategoryId)));
    } else if (categoryIds && categoryIds.length > 0) {
      const allowed = new Set(categoryIds.map(String));
      filtered = filtered.filter((p) => allowed.has(String(p.categoryId)));
    }
    if (listingType && listingType !== "All" && listingType !== "all") {
      filtered = filtered.filter((p) => p.type === listingType || p.type === "both");
    }
    if (provinceName) {
      const wanted = normalize(provinceName);
      filtered = filtered.filter((p) => {
        const facilityProvince = MOCK_FACILITIES.find((f) => f.id === p.facilityId)?.province;
        const candidate = normalize(facilityProvince || p.location);
        return candidate.includes(wanted) || wanted.includes(candidate);
      });
    }
    if (wardName) {
      const wanted = normalize(wardName);
      filtered = filtered.filter((p) => {
        const facilityWard = MOCK_FACILITIES.find((f) => f.id === p.facilityId)?.ward;
        const candidate = normalize(facilityWard);
        return candidate.includes(wanted) || wanted.includes(candidate);
      });
    }

    delay(800).then(() => {
      setData(filtered);
      setIsLoading(false);
    });
  }, [
    subCategoryIds?.join("\0"),
    listingType,
    categoryIds?.join("\0"),
    provinceName,
    wardName,
  ]);

  return { data, isLoading };
}

export function useProduct(id: string) {
  const [data, setData] = useState<Product | null>(null);
  const [facility, setFacility] = useState<MockFacility | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    delay(600).then(() => {
      const product = MOCK_PRODUCTS.find(p => p.id === id) || null;
      setData(product);
      if (product) {
        setFacility(MOCK_FACILITIES.find(f => f.id === product.facilityId) || MOCK_FACILITIES[0]);
        const recs = MOCK_PRODUCTS.filter(
          (p) =>
            p.id !== id &&
            (p.subCategoryId === product.subCategoryId || p.categoryId === product.categoryId || p.facilityId === product.facilityId),
        );
        setRecommended(recs.length > 0 ? recs : MOCK_PRODUCTS.filter(p => p.id !== id).slice(0, 6));
      } else {
        setFacility(null);
      }
      setReviews(MOCK_REVIEWS);
      setIsLoading(false);
    });
  }, [id]);

  return { data, facility, reviews, recommended, isLoading };
}

export function useFacility(id: string) {
  const [data, setData] = useState<MockFacility | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    delay(600).then(() => {
      setData(MOCK_FACILITIES.find(f => f.id === id) || null);
      setProducts(MOCK_PRODUCTS.filter(p => p.facilityId === id));
      setIsLoading(false);
    });
  }, [id]);

  return { data, products, isLoading };
}

export async function checkRentAvailability(
  productId: string,
  startDate: string,
  endDate: string,
  quantity: number
): Promise<{ available: boolean; message?: string }> {
  await delay(600);
  if (!startDate || !endDate) return { available: false, message: "Vui lòng chọn ngày bắt đầu và kết thúc." };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return { available: false, message: "Ngày kết thúc phải sau ngày bắt đầu." };
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product) {
    return { available: true };
  }
  if (quantity > product.stock) return { available: false, message: `Chỉ còn ${product.stock} sản phẩm trong kho.` };
  return { available: true };
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  images: string[];
  facilityId: string;
  buyPrice: number;
  rentPrice: number;
  stock: number;
  type: 'buy' | 'rent' | 'both';
  category: string;
  quantity: number;
  rentalDates?: { start: Date; end: Date };
  addedAt: string;
}

let mockCart: CartItem[] = [];

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCart);

  const addToCart = (product: Product, quantity: number, rentalDates?: { start: Date; end: Date }) => {
    const item: CartItem = {
      cartItemId: Math.random().toString(36).slice(2),
      productId: product.id,
      name: product.name,
      images: product.images,
      facilityId: product.facilityId,
      buyPrice: product.buyPrice || 0,
      rentPrice: product.rentPrice || 0,
      stock: product.stock,
      type: product.type as 'buy' | 'rent' | 'both',
      category: product.subCategoryName,
      quantity,
      rentalDates,
      addedAt: new Date().toISOString(),
    };
    mockCart = [...mockCart, item];
    setCartItems([...mockCart]);
  };

  const removeFromCart = (cartItemId: string) => {
    mockCart = mockCart.filter(item => item.cartItemId !== cartItemId);
    setCartItems([...mockCart]);
  };

  const clearCart = () => {
    mockCart = [];
    setCartItems([]);
  };

  return { cartItems, addToCart, removeFromCart, clearCart };
}

export interface CheckoutSelection {
  cartItemId: string;
  productId: string;
  name: string;
  images: string[];
  facilityId: string;
  buyPrice: number;
  rentPrice: number;
  mode: 'buy' | 'rent';
  quantity: number;
  rentalDates?: { start: Date; end: Date };
}

let pendingCheckout: CheckoutSelection[] = [];
export function setPendingCheckout(items: CheckoutSelection[]) { pendingCheckout = items; }
export function getPendingCheckout(): CheckoutSelection[] { return pendingCheckout; }
export function clearPendingCheckout() { pendingCheckout = []; }
