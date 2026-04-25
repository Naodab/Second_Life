import { Link } from "wouter";
import { ArrowRight, ShieldCheck, RefreshCw, Leaf, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-mock-api";
import { useCategories } from "@/hooks/use-categories";
import { Skeleton } from "@/components/ui/skeleton";
import { CornerAngleQuickFilter } from "@/components/CornerAngleQuickFilter";
import { buildFreshSearchPath } from "@/lib/search-url";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#F4FBF7] pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-sm font-semibold text-primary mb-6 animate-fade-in">
                <Leaf className="w-4 h-4" />
                <span>Mua sắm bền vững</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                Trao thêm giá trị cho <span className="text-primary relative whitespace-nowrap">
                  đồ cũ yêu thương
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-secondary" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-balance">
                Mua, bán và thuê đồ cũ trong cộng đồng của bạn. Tiết kiệm tiền, giảm lãng phí và khám phá những món đồ độc đáo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/search">
                  <Button size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/20 h-14">
                    Khám phá chợ
                  </Button>
                </Link>
                <Link href="/listings">
                  <Button size="lg" variant="secondary" className="rounded-full px-8 text-base bg-white border shadow-sm h-14">
                    Bắt đầu bán
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-50 transform translate-x-10 translate-y-10" />
              <img
                src={`${import.meta.env.BASE_URL}images/hero-illustration.png`}
                alt="Mọi người trao đổi đồ dùng"
                className="relative z-10 w-full h-auto drop-shadow-2xl object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Mua theo danh mục</h2>
            <Link href="/search" className="text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {categoriesLoading ? (
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="flex-none min-w-[240px] h-44 rounded-2xl shrink-0" />
              ))}
            </div>
          ) : categoriesError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>Không tải được danh mục từ máy chủ. Hãy kiểm tra product service và biến môi trường VITE_BACKEND_URL.</span>
              <Button type="button" variant="outline" size="sm" className="shrink-0 border-destructive/40" onClick={() => refetchCategories()}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => {
                const subs = cat.items ?? [];
                const hasSubs = subs.length > 0;
                return (
                  <div
                    key={cat.id}
                    className="flex-none bg-card border rounded-2xl p-5 min-w-[240px] max-w-[280px] hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <Link href={buildFreshSearchPath({ categoryIds: [cat.id] })} className="min-w-0 flex-1">
                        <div className="flex items-start gap-3 cursor-pointer group">
                          <div className="w-11 h-11 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-lg leading-none">{cat.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0 text-left flex-1 pr-1">
                            <span className="font-semibold text-sm block group-hover:text-primary transition-colors line-clamp-2">
                              {cat.name}
                            </span>
                          </div>
                        </div>
                      </Link>
                      {hasSubs ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "mt-0.5 shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground shadow-sm",
                                "hover:bg-muted hover:text-foreground transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                "data-[state=open]:[&>svg]:rotate-180"
                              )}
                              aria-label={`Chọn danh mục con trong ${cat.name}`}
                            >
                              <ChevronUp className="h-4 w-4 transition-transform duration-200" aria-hidden />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            side="bottom"
                            sideOffset={6}
                            className="w-[min(100vw-2rem,16rem)] p-0 overflow-hidden"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground truncate">
                              {cat.name}
                            </div>
                            <div
                              role="listbox"
                              aria-label={`Danh mục con của ${cat.name}`}
                              className="max-h-56 overflow-y-auto py-1"
                            >
                              {subs.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={buildFreshSearchPath({ subCategoryId: sub.id })}
                                  role="option"
                                  className="block w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer truncate"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                            <div className="border-t p-1">
                              <Link
                                href={buildFreshSearchPath({ categoryIds: [cat.id] })}
                                className="flex items-center gap-1 rounded-sm px-2 py-2 text-sm font-medium text-primary hover:bg-accent"
                              >
                                Xem tất cả
                                <ArrowRight className="h-4 w-4 shrink-0" />
                              </Link>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recommended Section */}
      <section className="py-16 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 font-display">Gợi ý dành cho bạn</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-card rounded-2xl p-4 border space-y-4">
                  <Skeleton className="w-full aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(0, 8).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-12 text-center">
                <Link href="/search">
                  <Button variant="outline" size="lg" className="rounded-full px-8 bg-white">
                    Xem thêm sản phẩm
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Trust & Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold font-display mb-4">Tại sao chọn Second Life?</h2>
              <p className="text-muted-foreground">Hàng nghìn người dùng đang lựa chọn mua sắm bền vững, tiết kiệm tiền và tìm kiếm những món đồ độc đáo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                <div className="w-14 h-14 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">Thanh toán an toàn</h3>
                <p className="text-muted-foreground text-sm">Tiền được giữ an toàn cho đến khi bạn nhận và xác nhận sản phẩm.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                <div className="w-14 h-14 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">Thuê hoặc mua</h3>
                <p className="text-muted-foreground text-sm">Chỉ cần dùng một lần? Hãy thuê. Muốn giữ lại? Hãy mua. Bạn có nhiều lựa chọn.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border text-center">
                <div className="w-14 h-14 mx-auto bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                  <Leaf className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg mb-2">Thân thiện môi trường</h3>
                <p className="text-muted-foreground text-sm">Mỗi lần mua đồ cũ giúp giảm đáng kể lượng khí thải carbon của bạn.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CornerAngleQuickFilter variant="home" />
    </div>
  );
}
