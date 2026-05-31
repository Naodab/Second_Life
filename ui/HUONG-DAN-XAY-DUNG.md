# Hướng Dẫn Xây Dựng — Second Life Marketplace

## Tổng quan dự án

Second Life là một nền tảng chợ trực tuyến cho phép người dùng **mua và thuê đồ cũ**. Dự án được xây dựng hoàn toàn bằng **Frontend React + Vite**, sử dụng dữ liệu giả lập (mock data) — không có backend thực.

---

## Cấu trúc thư mục

```
artifacts/second-life/
├── public/
│   └── images/              # Ảnh tĩnh (logo, hero, empty states)
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx   # Thanh điều hướng trên cùng
│   │   │   └── Footer.tsx   # Chân trang
│   │   ├── ProductCard.tsx  # Thẻ sản phẩm dùng chung
│   │   └── ui/              # Các component UI từ shadcn/ui
│   ├── context/
│   │   └── AuthContext.tsx  # Quản lý trạng thái đăng nhập
│   ├── hooks/
│   │   └── use-mock-api.ts  # Hooks giả lập API (useProducts, useCart, v.v.)
│   ├── lib/
│   │   ├── mock-data.ts     # Dữ liệu mẫu (sản phẩm, cửa hàng, đánh giá)
│   │   └── utils.ts         # Hàm tiện ích (formatCurrency, cn)
│   ├── pages/
│   │   ├── Home.tsx         # Trang chủ
│   │   ├── Search.tsx       # Trang tìm kiếm & lọc
│   │   ├── ProductDetail.tsx # Chi tiết sản phẩm
│   │   ├── Shop.tsx         # Trang cửa hàng
│   │   ├── Cart.tsx         # Giỏ hàng
│   │   ├── Checkout.tsx     # Thanh toán
│   │   ├── Orders.tsx       # Đơn hàng
│   │   ├── Messages.tsx     # Tin nhắn
│   │   ├── Listings.tsx     # Quản lý bán hàng
│   │   ├── Login.tsx        # Đăng nhập
│   │   └── Register.tsx     # Đăng ký
│   ├── App.tsx              # Cấu hình router chính
│   ├── main.tsx             # Điểm khởi chạy ứng dụng
│   └── index.css            # CSS toàn cục & design tokens
├── package.json
└── vite.config.ts
```

---

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| **React 18** | Thư viện UI chính |
| **Vite** | Build tool & dev server |
| **TypeScript** | Kiểu dữ liệu tĩnh |
| **Tailwind CSS v4** | Styling utility-first |
| **shadcn/ui** | Bộ component UI có sẵn |
| **Wouter** | Routing phía client |
| **Lucide React** | Bộ icon |
| **Framer Motion** | Animation & transitions |
| **date-fns** | Xử lý ngày tháng |
| **clsx + tailwind-merge** | Ghép className điều kiện |

---

## Cài đặt & Chạy dự án

### Yêu cầu

- Node.js >= 18
- pnpm >= 8

### Bước 1: Cài đặt dependencies

```bash
pnpm install
```

### Bước 2: Chạy môi trường phát triển

```bash
pnpm --filter @workspace/second-life run dev
```

Ứng dụng sẽ chạy tại `http://localhost:<PORT>/`

### Bước 3: Build cho production

```bash
pnpm --filter @workspace/second-life run build
```

Output tĩnh sẽ nằm trong thư mục `artifacts/second-life/dist/`

---

## Hệ thống trang (Routes)

| Đường dẫn | Trang | Mô tả |
|---|---|---|
| `/` | Trang chủ | Hero, danh mục, gợi ý sản phẩm, about |
| `/search` | Tìm kiếm | Lọc theo loại, địa điểm, danh mục, giá |
| `/product/:id` | Chi tiết sản phẩm | Gallery ảnh, giá, đặt hàng, đánh giá |
| `/shop/:id` | Cửa hàng | Thông tin shop, danh sách sản phẩm |
| `/cart` | Giỏ hàng | Chọn sản phẩm, xem tổng tiền |
| `/checkout` | Thanh toán | Địa chỉ, phương thức, xác nhận |
| `/orders` | Đơn hàng | Lịch sử & trạng thái đơn hàng |
| `/messages` | Tin nhắn | Chat với cửa hàng |
| `/listings` | Quản lý bán hàng | Dashboard người bán |
| `/login` | Đăng nhập | Form đăng nhập |
| `/register` | Đăng ký | Form tạo tài khoản |

---

## Hệ thống thiết kế (Design System)

### Màu sắc chính

```css
/* Xanh lá pastel — màu chủ đạo */
--primary: 145 60% 45%;            /* Xanh lá chính */
--primary-foreground: 0 0% 100%;   /* Trắng trên nền xanh */

/* Xanh nhạt — màu phụ (cho thuê) */
--secondary: 160 40% 85%;

/* Nền trắng sạch */
--background: 0 0% 100%;
```

### Góc bo tròn

Tất cả component đều sử dụng góc bo tròn nhất quán:
- Card nhỏ: `rounded-2xl` (16px)
- Card lớn / modal: `rounded-3xl` (24px)
- Nút: `rounded-full` (pill shape)

### Font

- **Font chính**: Inter (sans-serif)
- **Font display**: sử dụng `font-display` class cho tiêu đề

---

## Dữ liệu mẫu (Mock Data)

File `src/lib/mock-data.ts` chứa toàn bộ dữ liệu giả lập:

### Cấu trúc sản phẩm (Product)

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];          // URL từ Unsplash
  type: 'buy' | 'rent' | 'both';
  buyPrice?: number;         // VND
  rentPrice?: number;        // VND / ngày
  aiSuggestedBuyPrice?: number;
  aiSuggestedRentPrice?: number;
  category: string;
  condition: string;
  location: string;          // Tỉnh / TP Việt Nam
  stock: number;
  rating: number;
  reviewsCount: number;
  shopId: string;
  createdAt: string;
}
```

### Cấu trúc cửa hàng (Shop)

```typescript
interface Shop {
  id: string;
  name: string;
  avatar: string;
  address: string;
  rating: number;
  totalOrders: number;
  joinedDate: string;
  isVerified: boolean;
}
```

---

## Quản lý trạng thái

### Auth Context (`src/context/AuthContext.tsx`)

```typescript
// Trạng thái đăng nhập được quản lý qua React Context
const { user, isLoggedIn, login, logout } = useAuth();

```

### Giỏ hàng (`src/hooks/use-mock-api.ts`)

```typescript
const { cartItems, addToCart, removeFromCart, clearCart } = useCart();

// Giỏ hàng được lưu trong biến module-level (không dùng localStorage)
// Dữ liệu mất khi refresh trang — đây là thiết kế cho demo
```

---

## Kết nối Backend thực tế

Khi cần kết nối backend thực, thay thế các hook trong `src/hooks/use-mock-api.ts` bằng các API call thực:

### Ví dụ thay thế `useProducts`

```typescript
// Hiện tại (mock):
export function useProducts(category?: string, type?: string) {
  const [data, setData] = useState<Product[]>([]);
  // ... delay giả lập

  return { data, isLoading };
}

// Thay bằng (thực tế với TanStack Query):
import { useQuery } from '@tanstack/react-query';

export function useProducts(category?: string, type?: string) {
  return useQuery({
    queryKey: ['products', category, type],
    queryFn: () => fetch(`/api/products?category=${category}&type=${type}`)
      .then(res => res.json())
  });
}
```

### Endpoint API cần xây dựng

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/products` | Lấy danh sách sản phẩm (có query params) |
| `GET` | `/api/products/:id` | Chi tiết sản phẩm |
| `GET` | `/api/shops/:id` | Thông tin cửa hàng |
| `GET` | `/api/shops/:id/products` | Sản phẩm của cửa hàng |
| `POST` | `/api/auth/login` | Đăng nhập, trả về JWT |
| `POST` | `/api/auth/register` | Đăng ký tài khoản |
| `GET` | `/api/cart` | Lấy giỏ hàng của user |
| `POST` | `/api/cart` | Thêm vào giỏ hàng |
| `GET` | `/api/orders` | Đơn hàng của user |
| `POST` | `/api/orders` | Tạo đơn hàng mới |
| `POST` | `/api/orders/checkout` | Khởi tạo thanh toán PayOS |

---

## Tính năng quan trọng cần biết

### 1. Skeleton Loading

Tất cả các trang list/grid hiển thị skeleton trong khi tải:

```tsx
{isLoading ? (
  <div className="grid grid-cols-4 gap-6">
    {[1,2,3,4].map(i => (
      <div key={i} className="space-y-4">
        <Skeleton className="aspect-square rounded-xl" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    ))}
  </div>
) : (
  // Nội dung thực
)}
```

### 2. Xác thực (Auth)

- JWT được lưu trong cookie (xử lý phía backend)
- Frontend chỉ cần kiểm tra trạng thái qua `useAuth()`
- Nếu token rỗng khi đăng nhập → hiển thị thông báo xác minh email

### 3. Giá tiền

Hàm `formatCurrency` trong `src/lib/utils.ts` định dạng số theo VND:

```typescript
formatCurrency(1200000) // → "1.200.000 ₫"
```

### 4. Đặt cọc thuê

- Tất cả giao dịch thuê yêu cầu đặt cọc **30%** tổng giá trị
- Logic này được hiển thị rõ trong trang Checkout và trang Chi tiết sản phẩm

### 5. Header thông minh

- Header ẩn hoàn toàn trên trang `/listings` (thay bằng sidebar riêng)
- Footer cũng ẩn trên trang `/listings`

---

## Thêm tính năng mới

### Thêm trang mới

1. Tạo file `src/pages/TenTrang.tsx`
2. Đăng ký route trong `src/App.tsx`:

```tsx
import TenTrang from "@/pages/TenTrang";

// Trong Router component:
<Route path="/ten-trang" component={TenTrang} />
```

### Thêm sản phẩm mẫu

Thêm object vào mảng `MOCK_PRODUCTS` trong `src/lib/mock-data.ts`:

```typescript
{
  id: "p7",
  name: "Tên sản phẩm",
  description: "Mô tả...",
  images: ["https://images.unsplash.com/..."],
  type: "both",
  buyPrice: 500000,
  rentPrice: 30000,
  category: "Electronics",
  condition: "Good",
  location: "TP. Hồ Chí Minh",
  stock: 1,
  rating: 4.5,
  reviewsCount: 10,
  shopId: "s1",
  createdAt: "2024-06-01"
}
```

---

## Deploy lên production

Ứng dụng này là **static frontend** — có thể deploy lên bất kỳ CDN nào:

### Vercel / Netlify

```bash
# Build
pnpm --filter @workspace/second-life run build

# Thư mục output: artifacts/second-life/dist/
# Upload thư mục dist/ lên Vercel hoặc Netlify
```

### Replit (hiện tại)

Sử dụng tính năng **Deploy** của Replit — bấm nút Publish trong giao diện để deploy lên domain `.replit.app`.

---

## Ghi chú kỹ thuật

- **Không dùng Redux** — quản lý state bằng React Context + local state
- **Không có backend thực** — tất cả dùng mock data với setTimeout để giả lập latency
- **Ảnh sản phẩm** — lấy từ Unsplash (cần internet để hiển thị)
- **PayOS** — chỉ là UI mock, không tích hợp SDK thực
- **WebSocket** — chưa tích hợp, tin nhắn là dữ liệu tĩnh
- **AI định giá** — badge "Giá hợp lý theo AI" chỉ là hiển thị, chưa có logic thực

---

*Tài liệu này được tạo bởi Second Life Marketplace Project — Phiên bản 1.0*
