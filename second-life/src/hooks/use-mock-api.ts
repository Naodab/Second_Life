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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    delay(600).then(() => {
      const product = MOCK_PRODUCTS.find(p => p.id === id) || null;
      setData(product);
      if (product) {
        setShop(MOCK_SHOPS.find(s => s.id === product.shopId) || MOCK_SHOPS[0]);
      }
      setReviews(MOCK_REVIEWS);
      setIsLoading(false);
    });
  }, [id]);

  return { data, shop, reviews, isLoading };
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

let mockCart: any[] = [];
export function useCart() {
  const [cartItems, setCartItems] = useState<any[]>(mockCart);

  const addToCart = (product: Product, quantity: number, rentalDates?: { start: Date, end: Date }) => {
    mockCart = [...mockCart, { ...product, cartItemId: Math.random().toString(), quantity, rentalDates, addedAt: new Date().toISOString() }];
    setCartItems(mockCart);
  };

  const removeFromCart = (cartItemId: string) => {
    mockCart = mockCart.filter(item => item.cartItemId !== cartItemId);
    setCartItems(mockCart);
  };

  const clearCart = () => {
    mockCart = [];
    setCartItems([]);
  };

  return { cartItems, addToCart, removeFromCart, clearCart };
}
