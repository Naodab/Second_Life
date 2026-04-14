import type { Product, Category, Facility, Review, CartItem, Order, Conversation, Notification, User } from './types'

export const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  fullName: 'Nguyen Van A',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  location: {
    province: 'Ho Chi Minh City',
    ward: 'District 1'
  }
}

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Furniture',
    icon: 'Sofa',
    subcategories: [
      { id: '1-1', name: 'Sofas', icon: 'Sofa' },
      { id: '1-2', name: 'Tables', icon: 'Table' },
      { id: '1-3', name: 'Chairs', icon: 'Armchair' },
      { id: '1-4', name: 'Beds', icon: 'Bed' },
    ]
  },
  {
    id: '2',
    name: 'Electronics',
    icon: 'Laptop',
    subcategories: [
      { id: '2-1', name: 'Phones', icon: 'Smartphone' },
      { id: '2-2', name: 'Laptops', icon: 'Laptop' },
      { id: '2-3', name: 'Tablets', icon: 'Tablet' },
      { id: '2-4', name: 'Cameras', icon: 'Camera' },
    ]
  },
  {
    id: '3',
    name: 'Fashion',
    icon: 'Shirt',
    subcategories: [
      { id: '3-1', name: 'Dresses', icon: 'Shirt' },
      { id: '3-2', name: 'Bags', icon: 'ShoppingBag' },
      { id: '3-3', name: 'Shoes', icon: 'Footprints' },
      { id: '3-4', name: 'Accessories', icon: 'Watch' },
    ]
  },
  {
    id: '4',
    name: 'Home & Living',
    icon: 'Home',
    subcategories: [
      { id: '4-1', name: 'Decor', icon: 'Lamp' },
      { id: '4-2', name: 'Kitchen', icon: 'UtensilsCrossed' },
      { id: '4-3', name: 'Garden', icon: 'Flower2' },
      { id: '4-4', name: 'Storage', icon: 'Archive' },
    ]
  },
  {
    id: '5',
    name: 'Sports',
    icon: 'Dumbbell',
    subcategories: [
      { id: '5-1', name: 'Fitness', icon: 'Dumbbell' },
      { id: '5-2', name: 'Outdoor', icon: 'Mountain' },
      { id: '5-3', name: 'Water Sports', icon: 'Waves' },
      { id: '5-4', name: 'Team Sports', icon: 'Trophy' },
    ]
  },
  {
    id: '6',
    name: 'Books & Media',
    icon: 'BookOpen',
    subcategories: [
      { id: '6-1', name: 'Books', icon: 'BookOpen' },
      { id: '6-2', name: 'Music', icon: 'Music' },
      { id: '6-3', name: 'Movies', icon: 'Film' },
      { id: '6-4', name: 'Games', icon: 'Gamepad2' },
    ]
  },
  {
    id: '7',
    name: 'Kids & Baby',
    icon: 'Baby',
    subcategories: [
      { id: '7-1', name: 'Toys', icon: 'ToyBrick' },
      { id: '7-2', name: 'Clothing', icon: 'Shirt' },
      { id: '7-3', name: 'Gear', icon: 'Baby' },
      { id: '7-4', name: 'Education', icon: 'GraduationCap' },
    ]
  },
  {
    id: '8',
    name: 'Vehicles',
    icon: 'Car',
    subcategories: [
      { id: '8-1', name: 'Bicycles', icon: 'Bike' },
      { id: '8-2', name: 'Motorcycles', icon: 'Bike' },
      { id: '8-3', name: 'Scooters', icon: 'Bike' },
      { id: '8-4', name: 'Accessories', icon: 'Wrench' },
    ]
  },
]

export const mockFacilities: Facility[] = [
  {
    id: '1',
    name: 'Green Living Store',
    avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
    address: { province: 'Ho Chi Minh City', ward: 'District 1' },
    totalOrders: 1250,
    joinedAt: '2022-03-15',
    rating: 4.8
  },
  {
    id: '2',
    name: 'Tech Resale Hub',
    avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop',
    address: { province: 'Hanoi', ward: 'Hoan Kiem' },
    totalOrders: 890,
    joinedAt: '2023-01-20',
    rating: 4.6
  },
  {
    id: '3',
    name: 'Vintage Finds',
    avatar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
    address: { province: 'Da Nang', ward: 'Hai Chau' },
    totalOrders: 567,
    joinedAt: '2023-06-10',
    rating: 4.9
  },
]

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Modern Leather Sofa',
    description: 'Beautiful 3-seater leather sofa in excellent condition. Perfect for living room. Minor wear on armrests.',
    mainImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop',
    ],
    buyPrice: 2500000,
    rentPrice: 150000,
    aiSuggestedBuyPrice: 2400000,
    aiSuggestedRentPrice: 140000,
    listingType: 'both',
    stock: 1,
    rating: 4.5,
    reviewCount: 23,
    facilityId: '1',
    categoryId: '1-1',
    color: 'Brown',
    material: 'Leather',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'iPhone 14 Pro Max 256GB',
    description: 'Like new iPhone 14 Pro Max. Battery health 95%. Comes with original box and accessories.',
    mainImageUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
    ],
    buyPrice: 18000000,
    listingType: 'buy',
    stock: 2,
    rating: 4.8,
    reviewCount: 45,
    facilityId: '2',
    categoryId: '2-1',
    color: 'Space Black',
    createdAt: '2024-02-01'
  },
  {
    id: '3',
    name: 'Designer Handbag - Vintage',
    description: 'Authentic vintage designer handbag. Great condition with minor signs of use. Perfect for special occasions.',
    mainImageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop',
    ],
    buyPrice: 3500000,
    rentPrice: 200000,
    aiSuggestedBuyPrice: 3200000,
    aiSuggestedRentPrice: 180000,
    listingType: 'both',
    stock: 1,
    rating: 4.9,
    reviewCount: 12,
    facilityId: '3',
    categoryId: '3-2',
    color: 'Black',
    material: 'Leather',
    createdAt: '2024-01-20'
  },
  {
    id: '4',
    name: 'Wooden Dining Table Set',
    description: 'Solid wood dining table with 6 chairs. Minor scratches on surface. Perfect for family dinners.',
    mainImageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=600&fit=crop',
    ],
    buyPrice: 4500000,
    rentPrice: 300000,
    listingType: 'both',
    stock: 1,
    rating: 4.3,
    reviewCount: 8,
    facilityId: '1',
    categoryId: '1-2',
    color: 'Natural Wood',
    material: 'Oak',
    createdAt: '2024-01-25'
  },
  {
    id: '5',
    name: 'MacBook Pro 14" M3',
    description: 'MacBook Pro 14" with M3 chip. 16GB RAM, 512GB SSD. Used for 6 months. Perfect working condition.',
    mainImageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=600&fit=crop',
    ],
    buyPrice: 35000000,
    rentPrice: 2000000,
    listingType: 'both',
    stock: 1,
    rating: 4.9,
    reviewCount: 34,
    facilityId: '2',
    categoryId: '2-2',
    color: 'Space Gray',
    createdAt: '2024-02-10'
  },
  {
    id: '6',
    name: 'Yoga Mat & Accessories Set',
    description: 'Complete yoga set including mat, blocks, strap, and carrying bag. Lightly used.',
    mainImageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=600&fit=crop',
    ],
    buyPrice: 450000,
    rentPrice: 50000,
    listingType: 'both',
    stock: 3,
    rating: 4.6,
    reviewCount: 19,
    facilityId: '3',
    categoryId: '5-1',
    color: 'Purple',
    createdAt: '2024-02-05'
  },
  {
    id: '7',
    name: 'Kids Bicycle - Age 5-8',
    description: 'Colorful kids bicycle with training wheels. Good condition, some paint chips. Great starter bike.',
    mainImageUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&h=600&fit=crop',
    ],
    buyPrice: 800000,
    rentPrice: 80000,
    listingType: 'both',
    stock: 2,
    rating: 4.4,
    reviewCount: 15,
    facilityId: '1',
    categoryId: '8-1',
    color: 'Blue',
    createdAt: '2024-01-30'
  },
  {
    id: '8',
    name: 'Vintage Coffee Table',
    description: 'Mid-century modern coffee table. Solid construction with minor wear. A beautiful statement piece.',
    mainImageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&h=600&fit=crop',
    ],
    buyPrice: 1200000,
    rentPrice: 100000,
    listingType: 'both',
    stock: 1,
    rating: 4.7,
    reviewCount: 28,
    facilityId: '3',
    categoryId: '1-2',
    color: 'Walnut',
    material: 'Wood',
    createdAt: '2024-02-08'
  },
  {
    id: '9',
    name: 'Canon EOS R6 Camera',
    description: 'Professional mirrorless camera with 24-105mm lens kit. Shutter count under 10k. Excellent condition.',
    mainImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
    ],
    buyPrice: 28000000,
    rentPrice: 1500000,
    listingType: 'both',
    stock: 1,
    rating: 4.8,
    reviewCount: 21,
    facilityId: '2',
    categoryId: '2-4',
    color: 'Black',
    createdAt: '2024-02-12'
  },
  {
    id: '10',
    name: 'Kids Educational Toy Set',
    description: 'Complete educational toy set for ages 3-6. Includes puzzles, building blocks, and learning cards.',
    mainImageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=600&fit=crop',
    ],
    buyPrice: 350000,
    rentPrice: 40000,
    listingType: 'both',
    stock: 5,
    rating: 4.5,
    reviewCount: 32,
    facilityId: '1',
    categoryId: '7-1',
    createdAt: '2024-02-14'
  },
  {
    id: '11',
    name: 'Standing Desk - Electric',
    description: 'Electric height-adjustable standing desk. Smooth motor, memory presets. Perfect for home office.',
    mainImageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop',
    ],
    buyPrice: 5500000,
    rentPrice: 350000,
    listingType: 'both',
    stock: 2,
    rating: 4.6,
    reviewCount: 17,
    facilityId: '2',
    categoryId: '1-2',
    color: 'White',
    createdAt: '2024-02-16'
  },
  {
    id: '12',
    name: 'Outdoor Camping Tent',
    description: '4-person camping tent. Waterproof, easy setup. Used only twice. Includes carrying bag.',
    mainImageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop',
    ],
    rentPrice: 200000,
    listingType: 'rent',
    stock: 3,
    rating: 4.7,
    reviewCount: 14,
    facilityId: '3',
    categoryId: '5-2',
    color: 'Green',
    createdAt: '2024-02-18'
  },
  {
    id: '13',
    name: 'Vintage Record Player',
    description: 'Classic vinyl record player with built-in speakers. Plays 33/45/78 RPM. Beautiful retro design.',
    mainImageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=600&fit=crop',
    ],
    buyPrice: 1800000,
    rentPrice: 150000,
    listingType: 'both',
    stock: 1,
    rating: 4.8,
    reviewCount: 9,
    facilityId: '3',
    categoryId: '6-2',
    color: 'Wood Brown',
    createdAt: '2024-02-20'
  },
  {
    id: '14',
    name: 'Office Chair - Ergonomic',
    description: 'High-end ergonomic office chair with lumbar support. Adjustable armrests and headrest.',
    mainImageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=600&fit=crop',
    ],
    buyPrice: 3200000,
    rentPrice: 250000,
    listingType: 'both',
    stock: 2,
    rating: 4.5,
    reviewCount: 26,
    facilityId: '1',
    categoryId: '1-3',
    color: 'Black',
    createdAt: '2024-02-22'
  },
  {
    id: '15',
    name: 'Samsung Galaxy Tab S9',
    description: 'Latest Samsung tablet with S Pen. 128GB storage. Screen protector included. Like new condition.',
    mainImageUrl: 'https://images.unsplash.com/photo-1632882765546-1ee75f53becb?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1632882765546-1ee75f53becb?w=800&h=600&fit=crop',
    ],
    buyPrice: 12000000,
    rentPrice: 800000,
    listingType: 'both',
    stock: 1,
    rating: 4.7,
    reviewCount: 18,
    facilityId: '2',
    categoryId: '2-3',
    color: 'Graphite',
    createdAt: '2024-02-24'
  },
  {
    id: '16',
    name: 'Bookshelf - Industrial Style',
    description: 'Metal and wood industrial bookshelf. 5 tiers. Sturdy construction. Easy assembly.',
    mainImageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800&h=600&fit=crop',
    ],
    buyPrice: 1500000,
    rentPrice: 120000,
    listingType: 'both',
    stock: 2,
    rating: 4.4,
    reviewCount: 11,
    facilityId: '1',
    categoryId: '4-4',
    color: 'Black/Brown',
    material: 'Metal & Wood',
    createdAt: '2024-02-26'
  },
]

export const mockReviews: Review[] = [
  {
    id: '1',
    userId: '101',
    userName: 'Tran Minh B',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    rating: 5,
    comment: 'Excellent quality! The sofa looks exactly like the pictures. Very comfortable and the delivery was fast.',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=150&fit=crop'],
    createdAt: '2024-02-10'
  },
  {
    id: '2',
    userId: '102',
    userName: 'Le Thi C',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    rating: 4,
    comment: 'Good product, minor wear as described. Happy with my purchase!',
    createdAt: '2024-02-08'
  },
  {
    id: '3',
    userId: '103',
    userName: 'Pham Van D',
    userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=50&h=50&fit=crop',
    rating: 5,
    comment: 'Perfect for my living room. The seller was very helpful and responsive.',
    images: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200&h=150&fit=crop'
    ],
    createdAt: '2024-02-05'
  },
]

export const mockCartItems: CartItem[] = [
  {
    id: '1',
    product: mockProducts[0],
    quantity: 1,
    type: 'buy',
    addedAt: '2024-02-20'
  },
  {
    id: '2',
    product: mockProducts[5],
    quantity: 1,
    type: 'rent',
    rentDateRange: {
      start: '2024-03-01',
      end: '2024-03-07'
    },
    addedAt: '2024-02-21'
  },
]

export const mockOrders = [
  {
    id: 'ORD-001',
    product: {
      id: '1',
      title: 'Modern Leather Sofa',
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
    },
    seller: {
      id: '1',
      name: 'Green Living Store',
    },
    status: 'delivered',
    total: 2500,
    shippingAddress: {
      city: 'Ho Chi Minh City',
      state: 'District 1',
    },
    createdAt: '2024-02-15',
  },
  {
    id: 'ORD-002',
    product: {
      id: '2',
      title: 'iPhone 14 Pro Max 256GB',
      images: ['https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800&h=600&fit=crop'],
    },
    seller: {
      id: '2',
      name: 'Tech Resale Hub',
    },
    status: 'shipped',
    total: 1800,
    shippingAddress: {
      city: 'Hanoi',
      state: 'Hoan Kiem',
    },
    createdAt: '2024-02-20',
  },
]

export const mockRentals = [
  {
    id: 'RNT-001',
    product: {
      id: '12',
      title: 'Outdoor Camping Tent',
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop'],
      rentPrice: 20,
    },
    seller: {
      id: '3',
      name: 'Vintage Finds',
    },
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2024-03-15',
    duration: 14,
    total: 280,
  },
  {
    id: 'RNT-002',
    product: {
      id: '9',
      title: 'Canon EOS R6 Camera',
      images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop'],
      rentPrice: 150,
    },
    seller: {
      id: '2',
      name: 'Tech Resale Hub',
    },
    status: 'returned',
    startDate: '2024-02-10',
    endDate: '2024-02-17',
    duration: 7,
    total: 1050,
  },
]

export const mockConversations = [
  {
    id: 'conv-1',
    participant: {
      id: '1',
      name: 'Green Living Store',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      isOnline: true,
    },
    lastMessage: 'Is the sofa still available?',
    lastMessageAt: '2024-02-25T10:30:00',
    unreadCount: 2,
    product: {
      id: '1',
      title: 'Modern Leather Sofa',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
      price: 2500,
    },
  },
  {
    id: 'conv-2',
    participant: {
      id: '2',
      name: 'Tech Resale Hub',
      avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop',
      isOnline: false,
    },
    lastMessage: 'Your order has been shipped!',
    lastMessageAt: '2024-02-24T15:45:00',
    unreadCount: 0,
    product: {
      id: '2',
      title: 'iPhone 14 Pro Max 256GB',
      image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=300&fit=crop',
      price: 1800,
    },
  },
  {
    id: 'conv-3',
    participant: {
      id: '3',
      name: 'Vintage Finds',
      avatar: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
      isOnline: true,
    },
    lastMessage: 'Thanks for renting! Enjoy the camping trip!',
    lastMessageAt: '2024-02-23T09:15:00',
    unreadCount: 0,
    product: null,
  },
]

export const mockMessages: Record<string, Array<{
  id: string
  senderId: string
  content: string
  createdAt: string
}>> = {
  'conv-1': [
    { id: '1', senderId: 'seller-1', content: 'Hello! Thanks for reaching out.', createdAt: '2024-02-25T10:00:00' },
    { id: '2', senderId: 'current-user', content: 'Hi! Is the sofa still available?', createdAt: '2024-02-25T10:15:00' },
    { id: '3', senderId: 'seller-1', content: 'Yes, it is! Would you like to schedule a viewing?', createdAt: '2024-02-25T10:20:00' },
    { id: '4', senderId: 'current-user', content: 'That would be great. When are you available?', createdAt: '2024-02-25T10:25:00' },
    { id: '5', senderId: 'seller-1', content: 'I am available this weekend. Saturday or Sunday works for me!', createdAt: '2024-02-25T10:30:00' },
  ],
  'conv-2': [
    { id: '1', senderId: 'seller-2', content: 'Hi! Your order ORD-002 has been confirmed.', createdAt: '2024-02-20T14:00:00' },
    { id: '2', senderId: 'current-user', content: 'Thanks! When will it be shipped?', createdAt: '2024-02-20T14:30:00' },
    { id: '3', senderId: 'seller-2', content: 'It will be shipped tomorrow morning.', createdAt: '2024-02-20T15:00:00' },
    { id: '4', senderId: 'seller-2', content: 'Your order has been shipped!', createdAt: '2024-02-24T15:45:00' },
  ],
  'conv-3': [
    { id: '1', senderId: 'current-user', content: 'Hi, I would like to rent the camping tent for 2 weeks.', createdAt: '2024-02-22T11:00:00' },
    { id: '2', senderId: 'seller-3', content: 'Sure! It is available. When do you need it?', createdAt: '2024-02-22T11:30:00' },
    { id: '3', senderId: 'current-user', content: 'Starting March 1st please.', createdAt: '2024-02-22T12:00:00' },
    { id: '4', senderId: 'seller-3', content: 'Perfect! I have created the rental for you.', createdAt: '2024-02-22T12:15:00' },
    { id: '5', senderId: 'seller-3', content: 'Thanks for renting! Enjoy the camping trip!', createdAt: '2024-02-23T09:15:00' },
  ],
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'Order Shipped',
    content: 'Your order ORD-002 has been shipped and will arrive in 2-3 days.',
    read: false,
    createdAt: '2024-02-25T09:00:00'
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message',
    content: 'Green Living Store sent you a message.',
    read: false,
    createdAt: '2024-02-25T08:30:00'
  },
  {
    id: '3',
    type: 'system',
    title: 'Welcome to Second Life!',
    content: 'Start exploring amazing deals on pre-loved items.',
    read: true,
    createdAt: '2024-02-20T12:00:00'
  },
]

export const vietnamProvinces = [
  'Ho Chi Minh City',
  'Hanoi',
  'Da Nang',
  'Hai Phong',
  'Can Tho',
  'Binh Duong',
  'Dong Nai',
  'Khanh Hoa',
  'Quang Ninh',
  'Lam Dong',
]

export const vietnamWards: Record<string, string[]> = {
  'Ho Chi Minh City': ['District 1', 'District 2', 'District 3', 'District 7', 'Binh Thanh', 'Thu Duc', 'Phu Nhuan', 'Tan Binh'],
  'Hanoi': ['Hoan Kiem', 'Ba Dinh', 'Dong Da', 'Hai Ba Trung', 'Cau Giay', 'Thanh Xuan', 'Long Bien', 'Tay Ho'],
  'Da Nang': ['Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son', 'Lien Chieu', 'Cam Le', 'Hoa Vang'],
  'Hai Phong': ['Hong Bang', 'Ngo Quyen', 'Le Chan', 'Hai An', 'Kien An', 'Do Son', 'Duong Kinh'],
  'Can Tho': ['Ninh Kieu', 'Binh Thuy', 'Cai Rang', 'O Mon', 'Thot Not', 'Vinh Thanh', 'Co Do'],
}

export const mockUserListings = [
  {
    id: 'listing-1',
    title: 'Vintage Record Player',
    images: ['https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=600&fit=crop'],
    buyPrice: 180,
    rentPrice: 15,
    status: 'active',
    views: 245,
    favorites: 18,
    createdAt: '2024-02-10',
  },
  {
    id: 'listing-2',
    title: 'Ergonomic Office Chair',
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=600&fit=crop'],
    buyPrice: 320,
    rentPrice: 25,
    status: 'active',
    views: 189,
    favorites: 12,
    createdAt: '2024-02-15',
  },
  {
    id: 'listing-3',
    title: 'MacBook Pro 14" M3',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop'],
    buyPrice: 3500,
    rentPrice: 200,
    status: 'sold',
    views: 567,
    favorites: 45,
    createdAt: '2024-01-20',
  },
  {
    id: 'listing-4',
    title: 'Outdoor Camping Gear Set',
    images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop'],
    buyPrice: 450,
    rentPrice: 35,
    status: 'rented',
    views: 312,
    favorites: 28,
    createdAt: '2024-02-01',
  },
  {
    id: 'listing-5',
    title: 'Designer Handbag',
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop'],
    buyPrice: 350,
    rentPrice: null,
    status: 'paused',
    views: 98,
    favorites: 7,
    createdAt: '2024-02-18',
  },
]

export const categories = mockCategories

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(price)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
