export type ProductType = 'buy' | 'rent' | 'both';
export interface MockFacility {
  id: string;
  name: string;
  avatar: string;
  address: string;
  province: string;
  ward: string;
  rating: number;
  totalOrders: number;
  joinedDate: string;
  isVerified: boolean;
  categories?: string[];
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  images?: string[];
  videos?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  type: ProductType;
  buyPrice?: number;
  rentPrice?: number;
  aiSuggestedBuyPrice?: number;
  aiSuggestedRentPrice?: number;
  categoryId: string;
  subCategoryId: string;
  subCategoryName: string;
  condition: string;
  location: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  facilityId: string;
  createdAt: string;
}

export const CATEGORIES: string[] = [
  "cat-electronics",
  "cat-home",
  "cat-sports",
  "cat-beauty",
  "cat-others",
  "cat-books",
  "cat-vehicle",
  "cat-real-estate",
  "cat-mother-baby"
];

export const MOCK_FACILITIES: MockFacility[] = [
  {
    id: "s1",
    name: "Green Loop Store",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    address: "123 Lê Lợi",
    province: "TP. Hồ Chí Minh",
    ward: "Phường Bến Nghé, Quận 1",
    rating: 4.8,
    totalOrders: 342,
    joinedDate: "2023-01-15",
    isVerified: true,
    categories: ["Máy ảnh & Quay phim", "Nội thất phòng khách", "Đồ sưu tầm & Đồ cổ", "Sách cũ"]
  },
  {
    id: "s2",
    name: "Tech Recycle",
    avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop",
    address: "45 Cầu Giấy",
    province: "Hà Nội",
    ward: "Phường Quan Hoa, Quận Cầu Giấy",
    rating: 4.5,
    totalOrders: 128,
    joinedDate: "2023-06-20",
    isVerified: false,
    categories: ["Game & Console", "Đồ cắm trại & Du lịch", "Phụ tùng xe"]
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Máy ảnh Film Vintage (Đang hoạt động)",
    description: "Máy ảnh film 35mm cổ điển trong tình trạng tốt. Hoàn hảo cho nhiếp ảnh nghệ thuật hoặc thực tế. Kèm ống kính.\n\nMáy đã qua sử dụng nhẹ, các nút bấm còn hoạt động tốt, màn chập mượt mà. Lens không có bụi hay nấm mốc.",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1625948515291-a5c9f3d01d66?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&h=800&fit=crop"
    ],
    type: "both",
    buyPrice: 1200000,
    rentPrice: 50000,
    aiSuggestedBuyPrice: 1100000,
    aiSuggestedRentPrice: 45000,
    categoryId: "cat-electronics",
    subCategoryId: "sub-camera",
    subCategoryName: "Máy ảnh & Quay phim",
    condition: "Good",
    location: "TP. Hồ Chí Minh",
    stock: 1,
    rating: 4.9,
    reviewsCount: 12,
    facilityId: "s1",
    createdAt: "2024-05-10"
  },
  {
    id: "p2",
    name: "Ghế Mây Bohemian",
    description: "Ghế mây đan tay đẹp mắt. Đã dùng 6 tháng trong nhà. Rất thoải mái và phong cách.\n\nKhung ghế chắc chắn, không bị cong vênh. Thích hợp cho góc đọc sách hoặc ban công.",
    images: [
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop"
    ],
    type: "buy",
    buyPrice: 850000,
    aiSuggestedBuyPrice: 800000,
    categoryId: "cat-home",
    subCategoryId: "sub-furniture-living",
    subCategoryName: "Nội thất phòng khách",
    condition: "Like New",
    location: "Hà Nội",
    stock: 1,
    rating: 4.5,
    reviewsCount: 3,
    facilityId: "s1",
    createdAt: "2024-05-12"
  },
  {
    id: "p3",
    name: "Lều Cắm Trại 4 Người",
    description: "Lều cắm trại chống nước. Dễ dàng lắp đặt. Lý tưởng cho các chuyến dã ngoại cuối tuần.\n\nThiết kế 2 lớp chống thấm, có cửa sổ lưới thoáng khí. Gọn nhẹ khi gập lại, kèm túi đựng.",
    images: [
      "https://images.unsplash.com/photo-1504280390224-3ea3392348a5?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1478827387698-1527781a4887?w=800&h=800&fit=crop"
    ],
    type: "rent",
    rentPrice: 80000,
    aiSuggestedRentPrice: 75000,
    categoryId: "cat-sports",
    subCategoryId: "sub-camping",
    subCategoryName: "Đồ cắm trại & Du lịch",
    condition: "Good",
    location: "Đà Nẵng",
    stock: 2,
    rating: 4.7,
    reviewsCount: 25,
    facilityId: "s2",
    createdAt: "2024-04-20"
  },
  {
    id: "p4",
    name: "Đàn Guitar Acoustic - Phù Hợp Người Mới",
    description: "Đàn guitar acoustic Yamaha. Có một vài vết trầy nhỏ nhưng âm thanh hoàn hảo. Kèm túi đựng mềm.\n\nDây đàn mới thay, cần đàn thẳng không cong. Âm thanh ấm và rõ ràng.",
    images: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&h=800&fit=crop"
    ],
    type: "both",
    buyPrice: 1500000,
    rentPrice: 100000,
    aiSuggestedBuyPrice: 1350000,
    aiSuggestedRentPrice: 90000,
    categoryId: "cat-others",
    subCategoryId: "sub-collectible",
    subCategoryName: "Đồ sưu tầm & Đồ cổ",
    condition: "Fair",
    location: "TP. Hồ Chí Minh",
    stock: 1,
    rating: 4.2,
    reviewsCount: 8,
    facilityId: "s2",
    createdAt: "2024-05-15"
  },
  {
    id: "p5",
    name: "Bàn Làm Việc Gỗ Tối Giản",
    description: "Bàn gỗ đơn giản sạch sẽ, hoàn hảo cho văn phòng tại nhà. Kích thước 120x60cm.\n\nGỗ MDF phủ veneer sồi, bề mặt phẳng không trầy. Chân bàn kim loại chắc chắn.",
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&h=800&fit=crop"
    ],
    type: "buy",
    buyPrice: 600000,
    aiSuggestedBuyPrice: 550000,
    categoryId: "cat-home",
    subCategoryId: "sub-furniture-living",
    subCategoryName: "Nội thất phòng khách",
    condition: "Good",
    location: "Hà Nội",
    stock: 1,
    rating: 4.0,
    reviewsCount: 2,
    facilityId: "s1",
    createdAt: "2024-05-18"
  },
  {
    id: "p6",
    name: "Sony PlayStation 4",
    description: "PS4 với 2 tay cầm và 3 game. Hoạt động hoàn hảo.\n\nMáy đã reset về mặc định, không còn tài khoản cũ. Game kèm theo: FIFA 23, GTA V, God of War.",
    images: [
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&h=800&fit=crop"
    ],
    type: "both",
    buyPrice: 3500000,
    rentPrice: 150000,
    aiSuggestedBuyPrice: 3200000,
    aiSuggestedRentPrice: 130000,
    categoryId: "cat-books",
    subCategoryId: "sub-games",
    subCategoryName: "Game & Console",
    condition: "Good",
    location: "TP. Hồ Chí Minh",
    stock: 1,
    rating: 4.8,
    reviewsCount: 45,
    facilityId: "s2",
    createdAt: "2024-05-01"
  },
  {
    id: "p7",
    name: "Xe Đạp Gấp Brompton Style",
    description: "Xe đạp gấp thành phố, nhẹ nhàng và tiện lợi. Đã đi khoảng 200km, còn rất tốt.",
    images: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=800&fit=crop"
    ],
    type: "both",
    buyPrice: 4200000,
    rentPrice: 120000,
    aiSuggestedBuyPrice: 3900000,
    aiSuggestedRentPrice: 110000,
    categoryId: "cat-vehicle",
    subCategoryId: "sub-bike",
    subCategoryName: "Xe đạp & Xe điện",
    condition: "Good",
    location: "TP. Hồ Chí Minh",
    stock: 1,
    rating: 4.6,
    reviewsCount: 18,
    facilityId: "s1",
    createdAt: "2024-04-28"
  },
  {
    id: "p8",
    name: "Máy Chiếu Mini Portronics",
    description: "Máy chiếu mini tiện lợi cho xem phim tại nhà. Độ phân giải 720p, kết nối HDMI và USB.",
    images: [
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=800&fit=crop"
    ],
    type: "rent",
    rentPrice: 200000,
    aiSuggestedRentPrice: 180000,
    categoryId: "cat-electronics",
    subCategoryId: "sub-tv",
    subCategoryName: "Tivi & Màn hình",
    condition: "Like New",
    location: "Hà Nội",
    stock: 3,
    rating: 4.4,
    reviewsCount: 7,
    facilityId: "s2",
    createdAt: "2024-05-20"
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    userName: "Minh Trần",
    userAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    rating: 5,
    comment: "Sản phẩm đúng như mô tả. Giao hàng nhanh và người bán rất thân thiện! Rất hài lòng với giao dịch này.",
    date: "2024-05-12",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop"
    ]
  },
  {
    id: "r2",
    userName: "Linh Nguyễn",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    rating: 4,
    comment: "Sản phẩm tốt, giá hợp lý cho đồ đã qua sử dụng. Đóng gói cẩn thận, không có vấn đề gì.",
    date: "2024-05-08"
  },
  {
    id: "r3",
    userName: "Hùng Phạm",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    rating: 5,
    comment: "Thuê về dùng thử trước khi mua, rất ưng ý. Sẽ quay lại mua chính thức sau.",
    date: "2024-04-30",
    images: [
      "https://images.unsplash.com/photo-1625948515291-a5c9f3d01d66?w=400&h=400&fit=crop"
    ]
  },
  {
    id: "r4",
    userName: "Thảo Lê",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 3,
    comment: "Sản phẩm ổn nhưng có một vài điểm không như mô tả. Shop phản hồi nhanh và giải quyết thỏa đáng.",
    date: "2024-04-22"
  }
];

export const PROVINCES = [
  "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng"
];

export type OrderStatus = 'completed' | 'pending_approval' | 'shipping' | 'waiting_confirm';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  mode: 'buy' | 'rent';
  price: number;
  rentStart?: string;
  rentEnd?: string;
}

export interface Order {
  id: string;
  facilityId: string;
  buyerName: string;
  buyerAvatar: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  address: string;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "o1", facilityId: "s1",
    buyerName: "Minh Trần", buyerAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    items: [{ productId: "p1", productName: "Máy ảnh Film Vintage", productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop", quantity: 1, mode: 'rent', price: 350000, rentStart: "2026-03-20", rentEnd: "2026-03-27" }],
    total: 350000, status: 'shipping', createdAt: "2026-03-19", address: "123 Lê Văn Sỹ, Quận 3, TP. HCM"
  },
  {
    id: "o2", facilityId: "s1",
    buyerName: "Linh Nguyễn", buyerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    items: [{ productId: "p2", productName: "Ghế Mây Bohemian", productImage: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200&h=200&fit=crop", quantity: 1, mode: 'buy', price: 850000 }],
    total: 850000, status: 'pending_approval', createdAt: "2026-03-27", address: "45 Bà Huyện Thanh Quan, Quận 3, TP. HCM"
  },
  {
    id: "o3", facilityId: "s1",
    buyerName: "Hùng Phạm", buyerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    items: [{ productId: "p5", productName: "Bàn Làm Việc Gỗ", productImage: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=200&h=200&fit=crop", quantity: 1, mode: 'buy', price: 600000 }],
    total: 600000, status: 'waiting_confirm', createdAt: "2026-03-26", address: "78 Nguyễn Đình Chiểu, Quận 1, TP. HCM"
  },
  {
    id: "o4", facilityId: "s1",
    buyerName: "Thảo Lê", buyerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    items: [{ productId: "p1", productName: "Máy ảnh Film Vintage", productImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop", quantity: 1, mode: 'buy', price: 1200000 }],
    total: 1200000, status: 'completed', createdAt: "2026-03-10", address: "12 Pasteur, Quận 1, TP. HCM"
  },
  {
    id: "o5", facilityId: "s1",
    buyerName: "Nam Vũ", buyerAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    items: [{ productId: "p7", productName: "Xe Đạp Gấp", productImage: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200&h=200&fit=crop", quantity: 1, mode: 'rent', price: 600000, rentStart: "2026-03-15", rentEnd: "2026-03-20" }],
    total: 600000, status: 'completed', createdAt: "2026-03-14", address: "234 Võ Thị Sáu, Quận 3, TP. HCM"
  },
];

export interface RentalSlot {
  date: string;
  buyerName: string;
  status: 'booked' | 'available' | 'pending';
}

export const MOCK_RENTAL_SLOTS: Record<string, RentalSlot[]> = {
  "p1": [
    { date: "2026-03-28", buyerName: "Minh Trần", status: 'booked' },
    { date: "2026-03-29", buyerName: "Minh Trần", status: 'booked' },
    { date: "2026-03-30", buyerName: "Minh Trần", status: 'booked' },
    { date: "2026-03-31", buyerName: "Minh Trần", status: 'booked' },
    { date: "2026-04-01", buyerName: "", status: 'available' },
    { date: "2026-04-02", buyerName: "", status: 'available' },
    { date: "2026-04-03", buyerName: "Linh Nguyễn", status: 'pending' },
    { date: "2026-04-04", buyerName: "Linh Nguyễn", status: 'pending' },
    { date: "2026-04-05", buyerName: "", status: 'available' },
    { date: "2026-04-06", buyerName: "", status: 'available' },
    { date: "2026-04-07", buyerName: "", status: 'available' },
    { date: "2026-04-08", buyerName: "", status: 'available' },
    { date: "2026-04-09", buyerName: "", status: 'available' },
    { date: "2026-04-10", buyerName: "", status: 'available' },
  ],
  "p7": [
    { date: "2026-03-28", buyerName: "", status: 'available' },
    { date: "2026-03-29", buyerName: "", status: 'available' },
    { date: "2026-03-30", buyerName: "Hùng Phạm", status: 'booked' },
    { date: "2026-03-31", buyerName: "Hùng Phạm", status: 'booked' },
    { date: "2026-04-01", buyerName: "Hùng Phạm", status: 'booked' },
    { date: "2026-04-02", buyerName: "", status: 'available' },
    { date: "2026-04-03", buyerName: "", status: 'available' },
    { date: "2026-04-04", buyerName: "", status: 'available' },
  ]
};
