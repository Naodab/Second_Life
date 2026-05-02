import { lazy, Suspense, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, RefreshCw, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-mock-api";
import { useCategories } from "@/hooks/use-categories";
import { Skeleton } from "@/components/ui/skeleton";
import { CornerAngleQuickFilter } from "@/components/CornerAngleQuickFilter";
import { buildFreshSearchPath } from "@/lib/search-url";
import { SELLER_HUB_HOME } from "@/lib/seller-hub-paths";
import { HomeCategoryTile } from "@/components/home/HomeCategoryTile";

const HeroEcoCanvas = lazy(() => import("@/components/home/HeroEcoCanvas"));

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  const heroCategoryPins = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        href: buildFreshSearchPath({ categoryIds: [c.id] }),
      })),
    [categories],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat dark:hidden"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/background.jpg)`,
            backgroundPosition: "center bottom",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-no-repeat dark:block"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/background-black.jpg)`,
            backgroundPosition: "center center",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[rgba(255,255,255,0.2)] dark:bg-black/45"
          aria-hidden
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/92 shadow-sm text-sm font-semibold text-emerald-950 mb-6 backdrop-blur-sm ring-1 ring-emerald-900/10 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.45)] dark:bg-emerald-950/80 dark:text-emerald-50 dark:ring-emerald-400/25 dark:[text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
                <Leaf className="w-4 h-4 text-emerald-700 [filter:drop-shadow(0_1px_1px_rgba(255,255,255,0.85))] dark:text-emerald-300 dark:[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.5))]" />
                <span>Mua sắm bền vững</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-display font-bold tracking-tight text-emerald-950 mb-6 leading-[1.1] [text-shadow:0_1px_0_rgba(255,255,255,0.88),0_2px_14px_rgba(255,255,255,0.55),0_1px_4px_rgba(15,23,42,0.1)] dark:text-emerald-50 dark:[text-shadow:0_2px_24px_rgba(0,0,0,0.65),0_1px_2px_rgba(0,0,0,0.9)]">
                Trao thêm giá trị cho{" "}
                <span className="relative whitespace-nowrap text-orange-950 [text-shadow:0_1px_0_rgba(255,255,255,0.92),0_2px_12px_rgba(255,255,255,0.5),0_1px_3px_rgba(154,52,18,0.12)] dark:text-orange-300 dark:[text-shadow:0_2px_16px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.85)]">
                  đồ cũ yêu thương
                  <svg
                    className="absolute -bottom-1 left-0 h-3 w-full text-orange-500 drop-shadow-[0_2px_6px_rgba(234,88,12,0.45)] dark:text-orange-400 dark:drop-shadow-[0_2px_10px_rgba(251,146,60,0.35)]"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3.5" fill="transparent" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg font-semibold text-slate-950 mb-8 text-balance [text-shadow:0_1px_0_rgba(255,255,255,0.85),0_2px_10px_rgba(255,255,255,0.45)] dark:text-zinc-100 dark:[text-shadow:0_2px_14px_rgba(0,0,0,0.55)]">
                Mua, bán và thuê đồ cũ trong cộng đồng của bạn. Tiết kiệm tiền, giảm lãng phí và khám phá những món đồ độc đáo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/search">
                  <Button size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/25 h-14">
                    Khám phá chợ
                  </Button>
                </Link>
                <Link href={SELLER_HUB_HOME}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full px-8 text-base bg-white/95 border shadow-sm h-14 backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-900/85 dark:text-zinc-100 dark:shadow-md dark:backdrop-blur-sm"
                  >
                    Bắt đầu bán
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute inset-0 bg-primary/25 blur-3xl rounded-full opacity-40 transform translate-x-8 translate-y-8 pointer-events-none" aria-hidden />
              <Suspense
                fallback={
                  <div className="h-[min(420px,52vh)] w-full rounded-3xl bg-muted/50 animate-pulse ring-1 ring-border/50" />
                }
              >
                <HeroEcoCanvas pins={heroCategoryPins} categoriesLoading={categoriesLoading} />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section
        className="py-12 border-b border-border/60"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">Mua theo danh mục</h2>
            <Link href="/search" className="text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {categoriesLoading ? (
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="flex-none h-[72px] w-[220px] shrink-0 rounded-2xl" />
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
            <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {categories.map((cat) => (
                <HomeCategoryTile key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Recommended Section */}
      <motion.section
        className="py-16 border-b border-border/60 bg-muted/35"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 font-display">Gợi ý dành cho bạn</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-3xl border border-border/60 bg-card p-4 space-y-4 shadow-sm">
                  <Skeleton className="w-full aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-12 text-center">
                <Link href="/search">
                  <Button variant="outline" size="lg" className="rounded-full px-8 bg-card border-primary/25 shadow-sm hover:bg-accent">
                    Xem thêm sản phẩm
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.section>

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
