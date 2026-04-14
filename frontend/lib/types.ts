// User types
export interface User {
  id: string
  email: string
  fullName: string
  avatar?: string
  location?: {
    province: string
    ward: string
  }
}

// Product types
export type ListingType = 'buy' | 'rent' | 'both'

export interface Product {
  id: string
  name: string
  description: string
  mainImageUrl: string
  images: string[]
  buyPrice?: number
  rentPrice?: number
  aiSuggestedBuyPrice?: number
  aiSuggestedRentPrice?: number
  listingType: ListingType
  stock: number
  rating: number
  reviewCount: number
  facilityId: string
  categoryId: string
  color?: string
  material?: string
  createdAt: string
  isDisabled?: boolean
}

// Category types
export interface Category {
  id: string
  name: string
  icon: string
  subcategories: Subcategory[]
}

export interface Subcategory {
  id: string
  name: string
  icon: string
}

// Facility (Shop) types
export interface Facility {
  id: string
  name: string
  avatar: string
  address: {
    province: string
    ward: string
  }
  totalOrders: number
  joinedAt: string
  rating: number
}

// Review types
export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar: string
  rating: number
  comment: string
  images?: string[]
  videos?: string[]
  createdAt: string
}

// Cart types
export interface CartItem {
  id: string
  product: Product
  quantity: number
  type: 'buy' | 'rent'
  rentDateRange?: {
    start: string
    end: string
  }
  addedAt: string
}

// Order types
export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'completed' | 'awaiting_confirmation'

export interface Order {
  id: string
  items: CartItem[]
  status: OrderStatus
  totalAmount: number
  deposit: number
  createdAt: string
  facility: Facility
}

// Message types
export interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  read: boolean
}

export interface Conversation {
  id: string
  facility: Facility
  lastMessage: Message
  unreadCount: number
}

// Notification types
export interface Notification {
  id: string
  type: 'order' | 'message' | 'system'
  title: string
  content: string
  read: boolean
  createdAt: string
}
