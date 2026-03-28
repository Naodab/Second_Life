export type ProductType = 'buy' | 'rent' | 'both';

export interface Shop {
  id: string;
  name: string;
  avatar: string;
  address: string;
  rating: number;
  totalOrders: number;
  joinedDate: string;
  isVerified: boolean;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  type: ProductType;
  buyPrice?: number;
  rentPrice?: number; // per day
  aiSuggestedBuyPrice?: number;
  aiSuggestedRentPrice?: number;
  category: string;
  condition: string;
  location: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  shopId: string;
  createdAt: string;
}

export const MOCK_SHOPS: Shop[] = [
  {
    id: "s1",
    name: "Green Loop Store",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    address: "District 1, Ho Chi Minh City",
    rating: 4.8,
    totalOrders: 342,
    joinedDate: "2023-01-15",
    isVerified: true
  },
  {
    id: "s2",
    name: "Tech Recycle",
    avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop",
    address: "Cau Giay, Hanoi",
    rating: 4.5,
    totalOrders: 128,
    joinedDate: "2023-06-20",
    isVerified: false
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Vintage Film Camera (Working)",
    description: "Classic 35mm film camera in great condition. Perfect for aesthetics or real photography. Lens included.",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop"
    ],
    type: "both",
    buyPrice: 1200000,
    rentPrice: 50000,
    aiSuggestedBuyPrice: 1100000,
    aiSuggestedRentPrice: 45000,
    category: "Electronics",
    condition: "Good",
    location: "Ho Chi Minh City",
    stock: 1,
    rating: 4.9,
    reviewsCount: 12,
    shopId: "s1",
    createdAt: "2024-05-10"
  },
  {
    id: "p2",
    name: "Bohemian Rattan Chair",
    description: "Beautiful hand-woven rattan chair. Used for 6 months indoors. Super comfortable and stylish.",
    images: [
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=800&fit=crop"
    ],
    type: "buy",
    buyPrice: 850000,
    aiSuggestedBuyPrice: 800000,
    category: "Furniture",
    condition: "Like New",
    location: "Hanoi",
    stock: 1,
    rating: 4.5,
    reviewsCount: 3,
    shopId: "s1",
    createdAt: "2024-05-12"
  },
  {
    id: "p3",
    name: "Camping Tent 4-Person",
    description: "Waterproof camping tent. Easy to setup. Ideal for weekend getaways.",
    images: [
      "https://images.unsplash.com/photo-1504280390224-3ea3392348a5?w=800&h=800&fit=crop"
    ],
    type: "rent",
    rentPrice: 80000,
    aiSuggestedRentPrice: 75000,
    category: "Sports & Outdoors",
    condition: "Good",
    location: "Da Nang",
    stock: 2,
    rating: 4.7,
    reviewsCount: 25,
    shopId: "s2",
    createdAt: "2024-04-20"
  },
  {
    id: "p4",
    name: "Acoustic Guitar - Beginner Friendly",
    description: "Yamaha acoustic guitar. Has a few scratches but sounds perfect. Comes with a soft case.",
    images: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=800&fit=crop"
    ],
    type: "both",
    buyPrice: 1500000,
    rentPrice: 100000,
    category: "Musical Instruments",
    condition: "Fair",
    location: "Ho Chi Minh City",
    stock: 1,
    rating: 4.2,
    reviewsCount: 8,
    shopId: "s2",
    createdAt: "2024-05-15"
  },
  {
    id: "p5",
    name: "Minimalist Wooden Desk",
    description: "Clean simple wooden desk, perfect for home office. 120x60cm.",
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&h=800&fit=crop"
    ],
    type: "buy",
    buyPrice: 600000,
    category: "Furniture",
    condition: "Good",
    location: "Hanoi",
    stock: 1,
    rating: 4.0,
    reviewsCount: 2,
    shopId: "s1",
    createdAt: "2024-05-18"
  },
  {
    id: "p6",
    name: "Sony PlayStation 4 Console",
    description: "PS4 with 2 controllers and 3 games. Works flawlessly.",
    images: [
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=800&fit=crop"
    ],
    type: "both",
    buyPrice: 3500000,
    rentPrice: 150000,
    category: "Electronics",
    condition: "Good",
    location: "Ho Chi Minh City",
    stock: 1,
    rating: 4.8,
    reviewsCount: 45,
    shopId: "s2",
    createdAt: "2024-05-01"
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    userName: "Minh Tran",
    userAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    rating: 5,
    comment: "Exactly as described. Fast shipping and the seller was very friendly!",
    date: "2024-05-12"
  },
  {
    id: "r2",
    userName: "Linh Nguyen",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 4,
    comment: "Good product, reasonable price for a second-hand item.",
    date: "2024-05-08"
  }
];

export const CATEGORIES = [
  "Electronics", "Clothing", "Furniture", "Books", 
  "Sports & Outdoors", "Toys", "Kitchen", "Musical Instruments", "Tools"
];

export const PROVINCES = [
  "Ho Chi Minh City", "Hanoi", "Da Nang", "Can Tho", "Hai Phong"
];
