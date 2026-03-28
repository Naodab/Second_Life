import { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, MOCK_SHOPS, MOCK_REVIEWS, Product, Shop, Review } from '@/lib/mock-data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useProducts(category?: string, type?: string) {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let filtered = [...MOCK_PRODUCTS];
    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }
    if (type && type !== 'All' && type !== 'all') {
      filtered = filtered.filter(p => p.type === type || p.type === 'both');
    }

    delay(800).then(() => {
      setData(filtered);
      setIsLoading(false);
    });
  }, [category, type]);

  return { data, isLoading };
}

export function useProduct(id: string) {
  const [data, setData] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    delay(600).then(() => {
      const product = MOCK_PRODUCTS.find(p => p.id === id) || null;
      setData(product);
      if (product) {
        setShop(MOCK_SHOPS.find(s => s.id === product.shopId) || MOCK_SHOPS[0]);
        const recs = MOCK_PRODUCTS.filter(p => p.id !== id && (p.category === product.category || p.shopId === product.shopId));
        setRecommended(recs.length > 0 ? recs : MOCK_PRODUCTS.filter(p => p.id !== id).slice(0, 6));
      }
      setReviews(MOCK_REVIEWS);
      setIsLoading(false);
    });
  }, [id]);

  return { data, shop, reviews, recommended, isLoading };
}

export function useShop(id: string) {
  const [data, setData] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    delay(600).then(() => {
      setData(MOCK_SHOPS.find(s => s.id === id) || null);
      setProducts(MOCK_PRODUCTS.filter(p => p.shopId === id));
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
  if (!product) return { available: false, message: "Sản phẩm không tồn tại." };
  if (quantity > product.stock) return { available: false, message: `Chỉ còn ${product.stock} sản phẩm trong kho.` };
  return { available: true };
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  images: string[];
  shopId: string;
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
      shopId: product.shopId,
      buyPrice: product.buyPrice || 0,
      rentPrice: product.rentPrice || 0,
      stock: product.stock,
      type: product.type as 'buy' | 'rent' | 'both',
      category: product.category,
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

/* ── Checkout selection store ── */
export interface CheckoutSelection {
  cartItemId: string;
  productId: string;
  name: string;
  images: string[];
  shopId: string;
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
