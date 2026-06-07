import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminAccountActivitySummary } from "@/api/admin";
import type { BookingOrderResponse } from "@/api/booking";
import { facilityAvatarUrl } from "@/api/facility";
import { MANAGE_LISTING_STATUSES, type ListingStatus } from "@/api/listing";
import type { ProductStatus } from "@/api/product";
import type { RentalOrderResponse } from "@/api/rental";
import { ApiErrorState } from "@/components/errors";
import { ORDER_STATUS_LABELS } from "@/pages/Orders/useMyOrdersPage";
import {
  ADMIN_LISTING_STATUS_LABELS,
  ADMIN_PRODUCT_STATUS_LABELS,
  formatAdminPrice,
  listingStatusBadgeVariant,
  productStatusBadgeVariant,
} from "./admin-shared";
import { adminUsersPath } from "./adminRoutes";
import {
  useAdminUserAccount,
  useAdminUserActivitySummary,
  useAdminUserFacilities,
  useAdminUserListings,
  useAdminUserOrders,
  useAdminUserProducts,
  type AdminUserOrderScope,
} from "./useAdminUserDetailPage";

const PAGE_SIZE = 12;
const DEFAULT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";
const PRODUCT_STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type MainTab = "overview" | "seller" | "buyer";
type SellerSubTab = "facilities" | "products" | "listings" | "orders-received";
type BuyerSubTab = "buy" | "rent";

function displayName(
  profile?: { firstName?: string | null; lastName?: string | null } | null,
  fallbackEmail?: string,
): string {
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  return fallbackEmail?.split("@")[0] ?? "—";
}

function formatDateTime(value?: string | null): string {
  if (!value?.trim()) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
}

function formatCreatedAt(value?: string | null): string {
  return formatDateTime(value);
}

function customerName(customer?: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim();
  return name || customer?.email || "—";
}

function PaginationBar(props: {
  page: number;
  totalCount: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  unit?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(props.totalCount / props.pageSize));
  if (props.totalCount <= props.pageSize) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Trang {props.page + 1} / {totalPages} · {props.totalCount} {props.unit ?? "mục"}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={props.page <= 0 || props.isLoading}
          onClick={() => props.onPageChange(Math.max(0, props.page - 1))}
        >
          Trước
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={props.page >= totalPages - 1 || props.isLoading}
          onClick={() => props.onPageChange(props.page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

function SummaryCard(props: {
  label: string;
  count: number;
  onClick?: () => void;
}) {
  const clickable = Boolean(props.onClick);
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={props.onClick}
      className={
        "rounded-xl border bg-card p-4 text-left shadow-sm transition-colors " +
        (clickable ? "hover:bg-muted/50 cursor-pointer" : "cursor-default")
      }
    >
      <p className="text-sm text-muted-foreground">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{props.count}</p>
    </button>
  );
}

function OverviewPanel(props: {
  summary?: AdminAccountActivitySummary;
  hasProfile: boolean;
  onNavigateSeller: (sub: SellerSubTab, orderKind?: "buy" | "rent") => void;
  onNavigateBuyer: (sub: BuyerSubTab) => void;
}) {
  const seller = props.summary?.seller;
  const buyer = props.summary?.buyer;

  if (!props.hasProfile) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
        Tài khoản chưa liên kết hồ sơ — chưa có dữ liệu hoạt động.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Người bán</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard
            label="Cơ sở"
            count={seller?.facilities ?? 0}
            onClick={() => props.onNavigateSeller("facilities")}
          />
          <SummaryCard
            label="Sản phẩm"
            count={seller?.products ?? 0}
            onClick={() => props.onNavigateSeller("products")}
          />
          <SummaryCard
            label="Bài đăng"
            count={seller?.listings ?? 0}
            onClick={() => props.onNavigateSeller("listings")}
          />
          <SummaryCard
            label="Đơn mua nhận"
            count={seller?.buyOrdersReceived ?? 0}
            onClick={() => props.onNavigateSeller("orders-received", "buy")}
          />
          <SummaryCard
            label="Đơn thuê nhận"
            count={seller?.rentOrdersReceived ?? 0}
            onClick={() => props.onNavigateSeller("orders-received", "rent")}
          />
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Người mua</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard
            label="Đơn mua"
            count={buyer?.buyOrders ?? 0}
            onClick={() => props.onNavigateBuyer("buy")}
          />
          <SummaryCard
            label="Đơn thuê"
            count={buyer?.rentOrders ?? 0}
            onClick={() => props.onNavigateBuyer("rent")}
          />
        </div>
      </div>
    </div>
  );
}

type UserDetailViewProps = {
  accountId: string;
};

export function UserDetailView({ accountId }: UserDetailViewProps) {
  const [, setLocation] = useLocation();
  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [sellerSubTab, setSellerSubTab] = useState<SellerSubTab>("facilities");
  const [buyerSubTab, setBuyerSubTab] = useState<BuyerSubTab>("buy");
  const [sellerOrderKind, setSellerOrderKind] = useState<"buy" | "rent">("buy");
  const [productStatus, setProductStatus] = useState<"ALL" | ProductStatus>("ALL");
  const [listingStatus, setListingStatus] = useState<"ALL" | ListingStatus>("ALL");
  const [orderStatus, setOrderStatus] = useState("ALL");
  const [page, setPage] = useState(0);

  const accountQuery = useAdminUserAccount(accountId);
  const summaryQuery = useAdminUserActivitySummary(accountId);
  const account = accountQuery.data;
  const profileId = account?.profileId ?? null;
  const hasProfile = Boolean(profileId?.trim());

  const facilitiesEnabled = mainTab === "seller" && sellerSubTab === "facilities";
  const productsEnabled = mainTab === "seller" && sellerSubTab === "products";
  const listingsEnabled = mainTab === "seller" && sellerSubTab === "listings";
  const sellerOrdersEnabled = mainTab === "seller" && sellerSubTab === "orders-received";
  const buyerOrdersEnabled = mainTab === "buyer";

  const sellerOrderScope: AdminUserOrderScope =
    sellerOrderKind === "buy" ? "seller-buy" : "seller-rent";
  const buyerOrderScope: AdminUserOrderScope = buyerSubTab === "buy" ? "buyer-buy" : "buyer-rent";

  const facilitiesQuery = useAdminUserFacilities(profileId, page, PAGE_SIZE, facilitiesEnabled);
  const productsQuery = useAdminUserProducts(profileId, page, PAGE_SIZE, productStatus, productsEnabled);
  const listingsQuery = useAdminUserListings(profileId, page, PAGE_SIZE, listingStatus, listingsEnabled);
  const sellerOrdersQuery = useAdminUserOrders(
    profileId,
    sellerOrderScope,
    page,
    PAGE_SIZE,
    orderStatus,
    sellerOrdersEnabled,
  );
  const buyerOrdersQuery = useAdminUserOrders(
    profileId,
    buyerOrderScope,
    page,
    PAGE_SIZE,
    orderStatus,
    buyerOrdersEnabled,
  );

  useEffect(() => {
    setPage(0);
  }, [mainTab, sellerSubTab, buyerSubTab, sellerOrderKind, productStatus, listingStatus, orderStatus]);

  if (accountQuery.isError) {
    return <ApiErrorState error={accountQuery.error} variant="embedded" />;
  }

  if (accountQuery.isLoading || !account) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải tài khoản…
      </div>
    );
  }

  const avatarUrl = account.profile?.avatarUrl?.trim();
  const name = displayName(account.profile, account.email);

  function navigateSeller(sub: SellerSubTab, orderKind?: "buy" | "rent") {
    setMainTab("seller");
    setSellerSubTab(sub);
    if (orderKind) setSellerOrderKind(orderKind);
  }

  function navigateBuyer(sub: BuyerSubTab) {
    setMainTab("buyer");
    setBuyerSubTab(sub);
  }

  const facilities = facilitiesQuery.data ?? [];
  const facilitiesHasMore = facilities.length >= PAGE_SIZE;
  const facilitiesTotal = facilitiesHasMore
    ? (page + 2) * PAGE_SIZE
    : page * PAGE_SIZE + facilities.length;

  const products = productsQuery.data?.items ?? [];
  const productsTotal = productsQuery.data?.totalCount ?? 0;

  const listings = listingsQuery.data?.items ?? [];
  const listingsTotal = listingsQuery.data?.totalCount ?? 0;

  const activeOrdersQuery = mainTab === "seller" ? sellerOrdersQuery : buyerOrdersQuery;
  const orderRows = (activeOrdersQuery.data?.items ?? []) as Array<
    BookingOrderResponse | RentalOrderResponse
  >;
  const ordersTotal = activeOrdersQuery.data?.totalCount ?? 0;

  const buyStatuses = ["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
  const rentStatuses = ["ALL", "PENDING", "CONFIRMED", "DELIVERED", "RETURNED", "COMPLETED", "CANCELLED"] as const;
  const orderStatusOptions =
    (mainTab === "buyer" ? buyerSubTab : sellerOrderKind) === "buy" ? buyStatuses : rentStatuses;

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-lg -ml-2 gap-2"
        onClick={() => setLocation(adminUsersPath())}
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </Button>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-14 w-14">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
              <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <CardTitle className="text-xl font-display">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">{account.email}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={account.role === "ADMIN" ? "default" : "secondary"}>
                  {account.role === "ADMIN" ? "Admin" : "Người dùng"}
                </Badge>
                <Badge variant={account.emailVerified ? "default" : "outline"}>
                  {account.emailVerified ? "Email đã xác minh" : "Email chưa xác minh"}
                </Badge>
                <Badge variant={account.active ? "secondary" : "destructive"}>
                  {account.active ? "Hoạt động" : "Vô hiệu"}
                </Badge>
                <Badge variant="outline">{account.authProvider === "GOOGLE" ? "Google" : "Email"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Đăng ký {formatCreatedAt(account.createdAt)}
                {profileId ? ` · Profile ${profileId}` : " · Chưa có hồ sơ"}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="seller" className="rounded-lg" disabled={!hasProfile}>
            Người bán
          </TabsTrigger>
          <TabsTrigger value="buyer" className="rounded-lg" disabled={!hasProfile}>
            Người mua
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mainTab === "overview" ? (
        summaryQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải thống kê…
          </div>
        ) : summaryQuery.isError ? (
          <ApiErrorState error={summaryQuery.error} variant="embedded" />
        ) : (
          <OverviewPanel
            summary={summaryQuery.data}
            hasProfile={hasProfile}
            onNavigateSeller={navigateSeller}
            onNavigateBuyer={navigateBuyer}
          />
        )
      ) : null}

      {mainTab === "seller" && hasProfile ? (
        <div className="space-y-4">
          <Tabs value={sellerSubTab} onValueChange={(v) => setSellerSubTab(v as SellerSubTab)}>
            <TabsList className="rounded-xl flex-wrap h-auto">
              <TabsTrigger value="facilities" className="rounded-lg">
                Cơ sở
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-lg">
                Sản phẩm
              </TabsTrigger>
              <TabsTrigger value="listings" className="rounded-lg">
                Bài đăng
              </TabsTrigger>
              <TabsTrigger value="orders-received" className="rounded-lg">
                Đơn nhận
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {sellerSubTab === "products" ? (
            <Select
              value={productStatus}
              onValueChange={(v) => setProductStatus(v as "ALL" | ProductStatus)}
            >
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {PRODUCT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ADMIN_PRODUCT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {sellerSubTab === "listings" ? (
            <Select
              value={listingStatus}
              onValueChange={(v) => setListingStatus(v as "ALL" | ListingStatus)}
            >
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {MANAGE_LISTING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ADMIN_LISTING_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {sellerSubTab === "orders-received" ? (
            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={sellerOrderKind} onValueChange={(v) => setSellerOrderKind(v as "buy" | "rent")}>
                <TabsList className="rounded-xl">
                  <TabsTrigger value="buy" className="rounded-lg">
                    Đơn mua
                  </TabsTrigger>
                  <TabsTrigger value="rent" className="rounded-lg">
                    Đơn thuê
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "ALL" ? "Tất cả trạng thái" : ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            {sellerSubTab === "facilities" && facilitiesQuery.isLoading ? (
              <LoadingRow />
            ) : sellerSubTab === "facilities" && facilities.length === 0 ? (
              <EmptyRow message="Không có cơ sở." />
            ) : sellerSubTab === "facilities" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cơ sở</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={facilityAvatarUrl(row)} alt={row.name} />
                            <AvatarFallback>{row.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.address || "—"}</TableCell>
                      <TableCell>
                        <Link href={`/facility/${row.id}`}>
                          <Button type="button" variant="ghost" size="icon" className="rounded-lg">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {sellerSubTab === "products" && productsQuery.isLoading ? (
              <LoadingRow />
            ) : sellerSubTab === "products" && products.length === 0 ? (
              <EmptyRow message="Không có sản phẩm." />
            ) : sellerSubTab === "products" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Biến thể</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={row.thumbnailImage?.trim() || DEFAULT_THUMB}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                          <span className="font-medium">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.primarySubCategoryName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={productStatusBadgeVariant(row.status)}>
                          {ADMIN_PRODUCT_STATUS_LABELS[row.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.variantCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {sellerSubTab === "listings" && listingsQuery.isLoading ? (
              <LoadingRow />
            ) : sellerSubTab === "listings" && listings.length === 0 ? (
              <EmptyRow message="Không có bài đăng." />
            ) : sellerSubTab === "listings" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bài đăng</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={row.thumbnailImage?.trim() || DEFAULT_THUMB}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{row.title}</p>
                            <p className="text-xs text-muted-foreground">{row.facilityName ?? row.productName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.listingType === "RENT" ? "Thuê" : "Mua"}</TableCell>
                      <TableCell>{formatAdminPrice(row.minPrice, row.maxPrice)}</TableCell>
                      <TableCell>
                        <Badge variant={listingStatusBadgeVariant(row.listingStatus)}>
                          {ADMIN_LISTING_STATUS_LABELS[row.listingStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/listing/${row.id}`}>
                          <Button type="button" variant="ghost" size="icon" className="rounded-lg">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}

            {sellerSubTab === "orders-received" && sellerOrdersQuery.isLoading ? (
              <LoadingRow />
            ) : sellerSubTab === "orders-received" && orderRows.length === 0 ? (
              <EmptyRow message="Không có đơn nhận." />
            ) : sellerSubTab === "orders-received" ? (
              <OrdersTable rows={orderRows} />
            ) : null}
          </div>

          {sellerSubTab === "facilities" && facilities.length > 0 ? (
            <PaginationBar
              page={page}
              totalCount={facilitiesTotal}
              pageSize={PAGE_SIZE}
              isLoading={facilitiesQuery.isLoading}
              onPageChange={setPage}
            />
          ) : null}
          {sellerSubTab === "products" ? (
            <PaginationBar
              page={page}
              totalCount={productsTotal}
              pageSize={PAGE_SIZE}
              isLoading={productsQuery.isLoading}
              onPageChange={setPage}
              unit="sản phẩm"
            />
          ) : null}
          {sellerSubTab === "listings" ? (
            <PaginationBar
              page={page}
              totalCount={listingsTotal}
              pageSize={PAGE_SIZE}
              isLoading={listingsQuery.isLoading}
              onPageChange={setPage}
              unit="bài đăng"
            />
          ) : null}
          {sellerSubTab === "orders-received" ? (
            <PaginationBar
              page={page}
              totalCount={ordersTotal}
              pageSize={PAGE_SIZE}
              isLoading={sellerOrdersQuery.isLoading}
              onPageChange={setPage}
              unit="đơn"
            />
          ) : null}
        </div>
      ) : null}

      {mainTab === "buyer" && hasProfile ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={buyerSubTab} onValueChange={(v) => setBuyerSubTab(v as BuyerSubTab)}>
              <TabsList className="rounded-xl">
                <TabsTrigger value="buy" className="rounded-lg">
                  Đơn mua
                </TabsTrigger>
                <TabsTrigger value="rent" className="rounded-lg">
                  Đơn thuê
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-[200px] rounded-xl">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {orderStatusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "ALL" ? "Tất cả trạng thái" : ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            {buyerOrdersQuery.isLoading ? (
              <LoadingRow />
            ) : orderRows.length === 0 ? (
              <EmptyRow message="Không có đơn hàng." />
            ) : (
              <OrdersTable rows={orderRows} />
            )}
          </div>

          <PaginationBar
            page={page}
            totalCount={ordersTotal}
            pageSize={PAGE_SIZE}
            isLoading={buyerOrdersQuery.isLoading}
            onPageChange={setPage}
            unit="đơn"
          />
        </div>
      ) : null}
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      Đang tải…
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <div className="py-16 text-center text-sm text-muted-foreground">{message}</div>;
}

function OrdersTable(props: { rows: Array<BookingOrderResponse | RentalOrderResponse> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn</TableHead>
          <TableHead>Khách hàng</TableHead>
          <TableHead>Biến thể</TableHead>
          <TableHead>Số lượng</TableHead>
          <TableHead>Giá</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày tạo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-mono text-xs">{row.id}</TableCell>
            <TableCell className="text-sm">{customerName(row.customer ?? undefined)}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{row.listingVariantId}</TableCell>
            <TableCell>{row.quantity}</TableCell>
            <TableCell className="whitespace-nowrap">
              {formatAdminPrice(row.price ?? null, row.price ?? null)}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {ORDER_STATUS_LABELS[row.status as keyof typeof ORDER_STATUS_LABELS] ?? row.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
              {formatDateTime(row.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
