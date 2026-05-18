import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, Loader2, Package } from "lucide-react";
import {
  createListing,
  type ListingCreateBody,
  type ListingType,
  type RentUnit,
} from "@/api/listing";
import {
  getFacilityProductPage,
  getProductVariants,
  type ProductStatus,
  type ProductVariantSummaryResponse,
} from "@/api/product";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@workspace/api-client-react";
import type { FacilityWithPlaceNames } from "@/api/facility";

function readErrorCode(err: unknown): number | undefined {
  if (!(err instanceof ApiError) || err.data == null || typeof err.data !== "object") {
    return undefined;
  }
  const code = (err.data as { code?: unknown }).code;
  return typeof code === "number" ? code : undefined;
}

const DEFAULT_PRODUCT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

const PRODUCT_PICK_PAGE_SIZE = 200;

const RENT_UNIT_OPTIONS: { value: RentUnit; label: string }[] = [
  { value: "HOUR", label: "Mỗi giờ" },
  { value: "DAY", label: "Mỗi ngày" },
  { value: "MONTH", label: "Mỗi tháng" },
];

type VariantPriceDraft = {
  quantity: string;
  buyPrice: string;
  rentPrice: string;
  rentUnit: RentUnit;
};

function emptyVariantDraft(): VariantPriceDraft {
  return { quantity: "1", buyPrice: "", rentPrice: "", rentUnit: "DAY" };
}

export function CreateListingPage({
  facilityId,
  facilities,
  initialProductId,
  onBack,
  onCreated,
}: {
  facilityId: string;
  facilities: FacilityWithPlaceNames[];
  initialProductId?: string;
  onBack: () => void;
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const initialProductAppliedRef = useRef(false);

  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productOptions, setProductOptions] = useState<
    { id: string; name: string; thumb: string; status?: ProductStatus }[]
  >([]);

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilityId);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariantSummaryResponse[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState<ListingType>("BUY");
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [priceByVariantId, setPriceByVariantId] = useState<Record<string, VariantPriceDraft>>({});

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const current = facilities.some((f) => f.id === selectedFacilityId);
    if (current) return;
    const fallback = facilities.find((f) => f.id === facilityId)?.id ?? facilities[0]?.id ?? "";
    setSelectedFacilityId(fallback);
  }, [facilities, facilityId, selectedFacilityId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const page = await getFacilityProductPage(selectedFacilityId, {
          page: 0,
          pageSize: PRODUCT_PICK_PAGE_SIZE,
        });
        if (cancelled) return;
        const items = Array.isArray(page.items) ? page.items : [];
        const rows = [...items].sort((a, b) => {
          const ap = a.status === "PUBLISHED" ? 0 : 1;
          const bp = b.status === "PUBLISHED" ? 0 : 1;
          if (ap !== bp) return ap - bp;
          return String(a.name).localeCompare(String(b.name), "vi");
        });
        setProductOptions(
          rows.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            thumb: (p.thumbnailImage && p.thumbnailImage.trim()) || DEFAULT_PRODUCT_THUMB,
          })),
        );
      } catch (e) {
        if (!cancelled) {
          setProductOptions([]);
          setProductsError(e instanceof Error ? e.message : "Không tải được danh sách sản phẩm.");
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFacilityId]);

  useEffect(() => {
    initialProductAppliedRef.current = false;
    setSelectedProductId("");
    setVariants([]);
    setSelectedVariantIds(new Set());
    setPriceByVariantId({});
  }, [selectedFacilityId, initialProductId]);

  useEffect(() => {
    if (!initialProductId?.trim()) return;
    if (initialProductAppliedRef.current) return;
    const matchInit = productOptions.find((p) => p.id === initialProductId);
    if (!matchInit || matchInit.status !== "PUBLISHED") return;
    initialProductAppliedRef.current = true;
    setSelectedProductId(initialProductId);
  }, [initialProductId, productOptions]);

  useEffect(() => {
    if (!selectedProductId) {
      setTitle("");
      return;
    }
    const pick = productOptions.find((p) => p.id === selectedProductId);
    if (pick?.name) setTitle(pick.name);
  }, [selectedProductId, productOptions]);

  useEffect(() => {
    if (!selectedProductId) {
      setVariants([]);
      setVariantsError(null);
      setSelectedVariantIds(new Set());
      setPriceByVariantId({});
      return;
    }
    let cancelled = false;
    (async () => {
      setVariantsLoading(true);
      setVariantsError(null);
      try {
        const list = await getProductVariants(selectedProductId);
        if (cancelled) return;
        setVariants(Array.isArray(list) ? list : []);
        setSelectedVariantIds(new Set());
        setPriceByVariantId({});
      } catch (e) {
        if (!cancelled) {
          setVariants([]);
          setVariantsError(e instanceof Error ? e.message : "Không tải được loại sản phẩm.");
        }
      } finally {
        if (!cancelled) setVariantsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProductId]);

  const toggleVariant = (vid: string) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) {
        next.delete(vid);
        setPriceByVariantId((draft) => {
          const cp = { ...draft };
          delete cp[vid];
          return cp;
        });
      } else {
        next.add(vid);
        setPriceByVariantId((draft) => ({ ...draft, [vid]: emptyVariantDraft() }));
      }
      return next;
    });
  };

  const allVariantsSelected = variants.length > 0 && selectedVariantIds.size === variants.length;

  const selectAllVariants = () => {
    setSelectedVariantIds(new Set(variants.map((v) => v.id)));
    setPriceByVariantId((prev) => {
      const next = { ...prev };
      for (const v of variants) {
        if (!next[v.id]) {
          next[v.id] = emptyVariantDraft();
        }
      }
      return next;
    });
  };

  const clearVariantSelection = () => {
    setSelectedVariantIds(new Set());
    setPriceByVariantId({});
  };

  const setVariantField = (
    vid: string,
    field: keyof VariantPriceDraft,
    value: string | RentUnit,
  ) => {
    setPriceByVariantId((prev) => ({
      ...prev,
      [vid]: { ...(prev[vid] ?? emptyVariantDraft()), [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!selectedFacilityId) {
      toast({ title: "Chọn cơ sở đăng bài", variant: "destructive" });
      return;
    }
    if (!selectedProductId) {
      toast({ title: "Chọn sản phẩm", variant: "destructive" });
      return;
    }
    const picked = productOptions.find((p) => p.id === selectedProductId);
    if (picked && picked.status !== "PUBLISHED") {
      toast({
        title: "Sản phẩm chưa đăng",
        description: "Chỉ sản phẩm đã xuất bản mới tạo được bài đăng.",
        variant: "destructive",
      });
      return;
    }
    if (!t) {
      toast({ title: "Nhập tiêu đề bài đăng", variant: "destructive" });
      return;
    }
    if (selectedVariantIds.size === 0) {
      toast({
        title: "Chọn ít nhất một loại sản phẩm",
        description: "Bài đăng cần gắn giá cho từng loại bạn đăng.",
        variant: "destructive",
      });
      return;
    }

    const variantBodies: ListingCreateBody["variants"] = [];

    for (const vid of selectedVariantIds) {
      const draft = priceByVariantId[vid] ?? emptyVariantDraft();
      const qty = Number(String(draft.quantity).replace(",", ".").replace(/\s/g, ""));
      if (!Number.isFinite(qty) || qty < 0) {
        toast({
          title: "Số lượng không hợp lệ",
          description: "Kiểm tra các loại sản phẩm đã chọn.",
          variant: "destructive",
        });
        return;
      }
      if (listingType === "BUY") {
        const n = Number(String(draft.buyPrice).replace(",", ".").replace(/\s/g, ""));
        if (!Number.isFinite(n) || n < 0) {
          toast({
            title: "Giá bán không hợp lệ",
            description: "Kiểm tra các loại sản phẩm đã chọn.",
            variant: "destructive",
          });
          return;
        }
        variantBodies.push({
          productVariantId: vid,
          quantity: qty,
          buyPrice: n,
          isActive: true,
        });
      } else {
        const n = Number(String(draft.rentPrice).replace(",", ".").replace(/\s/g, ""));
        if (!Number.isFinite(n) || n < 0) {
          toast({
            title: "Giá thuê không hợp lệ",
            description: "Kiểm tra các loại sản phẩm đã chọn.",
            variant: "destructive",
          });
          return;
        }
        variantBodies.push({
          productVariantId: vid,
          quantity: qty,
          rentPrice: n,
          rentUnit: draft.rentUnit,
          isActive: true,
        });
      }
    }

    const body: ListingCreateBody = {
      productId: selectedProductId,
      facilityId: selectedFacilityId,
      title: t,
      description: description.trim() || null,
      listingType,
      variants: variantBodies,
    };

    setSubmitting(true);
    try {
      await createListing(body);
      toast({ title: "Đã tạo bài đăng", description: "Bài đăng đã được lưu." });
      onCreated?.();
      onBack();
    } catch (err) {
      const code = readErrorCode(err);
      if (code === 1051) {
        toast({
          title: "Sản phẩm chưa đăng",
          description: "Chỉ sản phẩm đã xuất bản mới được tạo bài đăng. Mở chi tiết sản phẩm và bấm «Xuất bản».",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tạo bài đăng thất bại",
          description: err instanceof Error ? err.message : "Thử lại sau.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPick = productOptions.find((p) => p.id === selectedProductId);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-2xl shadow-emerald-900/10 dark:border-emerald-900/45 dark:from-emerald-950/50 dark:via-card dark:to-emerald-950/40 sm:p-6">
      <img
        src="/images/tree-form.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -top-1 -left-1 w-32 sm:w-40 md:w-44 select-none opacity-75"
      />
      <img
        src="/images/tree-form.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -bottom-1 -right-1 w-32 sm:w-40 md:w-44 select-none opacity-75 rotate-180"
      />

      <div className="relative z-20 flex flex-col gap-5 px-1 sm:px-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-emerald-900 dark:text-emerald-100">Tạo bài đăng</h1>
            <p className="mt-1 max-w-xl text-sm text-emerald-700/80 dark:text-emerald-300/90">
              Chọn sản phẩm, loại sản phẩm và giá.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="shrink-0 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden /> Quay lại
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-emerald-100 bg-white/90 dark:border-emerald-900/45 dark:bg-card/95 backdrop-blur p-4 sm:p-5 space-y-2">
            <label className="text-sm font-semibold block">
              Cơ sở đăng bài <span className="text-destructive">*</span>
            </label>
            {facilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bạn chưa có cơ sở để đăng bài.</p>
            ) : (
              <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                <SelectTrigger className="rounded-xl border-emerald-200 bg-background focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card">
                  <SelectValue placeholder="Chọn cơ sở" />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border-emerald-100 dark:border-emerald-900/50">
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white/90 dark:border-emerald-900/45 dark:bg-card/95 backdrop-blur p-4 sm:p-5 space-y-3">
            <label className="text-sm font-semibold block">
              Sản phẩm <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground leading-snug -mt-1">
              Tất cả sản phẩm của cơ sở được liệt kê; chỉ mục «đã xuất bản» mới chọn được. Bản nháp: vào chi tiết sản
              phẩm → Xuất bản.
            </p>
            {productsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" aria-hidden /> Đang tải sản phẩm của cơ sở…
              </div>
            ) : productsError ? (
              <p className="text-sm text-destructive">{productsError}</p>
            ) : productOptions.length === 0 ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900/80 dark:border-emerald-900/45 dark:bg-emerald-950/35 dark:text-emerald-200">
                <Package className="w-5 h-5 shrink-0 opacity-70" aria-hidden />
                <span>Chưa có sản phẩm trong cơ sở — hãy thêm mặt hàng trước.</span>
              </div>
            ) : (
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-auto min-h-11 py-2 rounded-xl border-emerald-200 bg-background focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card [&>span]:flex [&>span]:w-full [&>span]:min-w-0">
                  {selectedPick ? (
                    <span className="flex items-center gap-3 text-left py-0.5 min-w-0 flex-1">
                      <img
                        src={selectedPick.thumb}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-emerald-100 bg-muted shrink-0"
                      />
                      <span className="line-clamp-2 min-w-0 font-medium text-emerald-950 dark:text-emerald-100">
                        {selectedPick.name}
                      </span>
                    </span>
                  ) : (
                    <SelectValue placeholder="Chọn sản phẩm để đăng…" />
                  )}
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="max-h-[min(70vh,24rem)] w-[min(100vw-2rem,var(--radix-select-trigger-width))] rounded-xl border-emerald-100 dark:border-emerald-900/50"
                >
                  {productOptions.map((p) => {
                    const canList = p.status === "PUBLISHED";
                    return (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        disabled={!canList}
                        title={
                          canList ? undefined : "Sản phẩm đang nháp — xuất bản trong trang chi tiết trước khi đăng bài."
                        }
                        className={cn(
                          "py-2.5 rounded-lg items-start min-h-[3.5rem] pr-8",
                          "[&>span:first-child]:top-auto [&>span:first-child]:bottom-2.5 [&>span:first-child]:translate-y-0",
                          !canList && "opacity-60",
                        )}
                      >
                        <span className="flex w-full min-w-0 items-start gap-3">
                          <img
                            src={p.thumb}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover border border-emerald-100 bg-muted shrink-0 mt-0.5"
                          />
                          <span className="line-clamp-3 text-sm leading-snug text-left min-w-0 flex-1">{p.name}</span>
                          {p.status && p.status !== "PUBLISHED" && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {p.status === "DRAFT" ? "Nháp" : "Ẩn"}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {!selectedProductId ? null : variantsLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white/90 p-6 text-sm text-emerald-800 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 dark:text-emerald-200">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" aria-hidden /> Đang tải loại sản phẩm…
            </div>
          ) : variantsError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{variantsError}</div>
          ) : variants.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-white/90 dark:border-emerald-900/45 dark:bg-card/95 backdrop-blur p-4 text-sm text-muted-foreground">
              Sản phẩm này chưa có loại sản phẩm — hãy cập nhật sản phẩm trong hệ thống.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-emerald-100 bg-white/90 dark:border-emerald-900/45 dark:bg-card/95 backdrop-blur p-4 sm:p-5 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div>
                    <label className="text-sm font-semibold block">
                      Loại sản phẩm đăng kèm <span className="text-destructive">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">Chọn một hoặc nhiều loại cần đăng giá.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                      onClick={selectAllVariants}
                      disabled={variants.length === 0 || allVariantsSelected}
                    >
                      Chọn tất cả
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8 text-xs text-muted-foreground hover:text-foreground"
                      onClick={clearVariantSelection}
                      disabled={selectedVariantIds.size === 0}
                    >
                      Bỏ chọn
                    </Button>
                  </div>
                </div>
                <ul className="max-h-[min(50vh,20rem)] divide-y divide-emerald-100 overflow-y-auto overscroll-contain rounded-xl border border-emerald-100 bg-emerald-50/40 dark:divide-emerald-900/40 dark:border-emerald-900/45 dark:bg-emerald-950/25">
                  {variants.map((v) => {
                    const checked = selectedVariantIds.has(v.id);
                    const label = v.label?.trim() || v.sku?.trim() || v.id.slice(0, 8);
                    return (
                      <li key={v.id}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 px-3 py-3 sm:px-4 transition-colors",
                            checked ? "bg-emerald-100/60 dark:bg-emerald-950/50" : "hover:bg-white/80 dark:hover:bg-muted/80",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleVariant(v.id)}
                            className="mt-1 shrink-0 border-emerald-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            aria-label={`Chọn ${label}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug text-emerald-950 dark:text-emerald-100">{label}</p>
                            {v.sku ? (
                              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">SKU: {v.sku}</p>
                            ) : null}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white/90 dark:border-emerald-900/45 dark:bg-card/95 backdrop-blur p-4 sm:p-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="listing-title" className="text-sm font-semibold block">
                      Tiêu đề bài đăng <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="listing-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Tiêu đề hiển thị cho người mua"
                      className="rounded-xl border-emerald-200 bg-background focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="listing-desc" className="text-sm font-semibold block">
                      Mô tả
                    </label>
                    <Textarea
                      id="listing-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả chi tiết bài đăng (tuỳ chọn)"
                      rows={4}
                      className="min-h-[100px] resize-y rounded-xl border-emerald-200 bg-background focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white/90 dark:border-emerald-900/45 dark:bg-card/95 backdrop-blur p-4 sm:p-5 space-y-3">
                <label className="text-sm font-semibold block">
                  Hình thức <span className="text-destructive">*</span>
                </label>
                <RadioGroup
                  value={listingType}
                  onValueChange={(val) => setListingType(val as ListingType)}
                  className="flex flex-wrap gap-3"
                >
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors shadow-sm",
                      listingType === "BUY"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-background text-emerald-900 hover:border-emerald-400 hover:bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-card dark:text-emerald-100 dark:hover:bg-emerald-950/40",
                    )}
                  >
                    <RadioGroupItem value="BUY" id="lt-buy" />
                    Bán
                  </label>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors shadow-sm",
                      listingType === "RENT"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-background text-emerald-900 hover:border-emerald-400 hover:bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-card dark:text-emerald-100 dark:hover:bg-emerald-950/40",
                    )}
                  >
                    <RadioGroupItem value="RENT" id="lt-rent" />
                    Cho thuê
                  </label>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  {listingType === "BUY"
                    ? "Với bán: nhập số lượng và giá mỗi loại (₫)."
                    : "Với thuê: nhập số lượng, giá thuê và đơn vị (giờ / ngày / tuần / tháng) cho từng loại."}
                </p>
              </div>

              {selectedVariantIds.size > 0 && (
                <div className="rounded-2xl border border-emerald-100 bg-white/90 dark:border-emerald-900/45 dark:bg-card/95 backdrop-blur p-4 sm:p-5 space-y-4">
                  <label className="text-sm font-semibold block">
                    {listingType === "BUY" ? "Giá bán theo loại (₫)" : "Giá thuê theo loại (₫)"}
                  </label>
                  <div className="space-y-4">
                    {[...selectedVariantIds].map((vid) => {
                      const meta = variants.find((x) => x.id === vid);
                      const name = meta?.label?.trim() || meta?.sku?.trim() || vid.slice(0, 8);
                      const draft = priceByVariantId[vid] ?? emptyVariantDraft();
                      return (
                        <div
                          key={vid}
                          className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/45 dark:bg-emerald-950/30"
                        >
                          <p className="text-sm font-semibold leading-snug text-emerald-900 dark:text-emerald-100">{name}</p>

                          {listingType === "BUY" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Số lượng</label>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="vd. 1"
                                  value={draft.quantity}
                                  onChange={(e) => setVariantField(vid, "quantity", e.target.value)}
                                  className="rounded-xl border-emerald-200 bg-background tabular-nums focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Giá bán</label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="vd. 199000"
                                  value={draft.buyPrice}
                                  onChange={(e) => setVariantField(vid, "buyPrice", e.target.value)}
                                  className="rounded-xl border-emerald-200 bg-background tabular-nums focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Số lượng</label>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="vd. 1"
                                  value={draft.quantity}
                                  onChange={(e) => setVariantField(vid, "quantity", e.target.value)}
                                  className="rounded-xl border-emerald-200 bg-background tabular-nums focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Giá thuê</label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="vd. 50000"
                                  value={draft.rentPrice}
                                  onChange={(e) => setVariantField(vid, "rentPrice", e.target.value)}
                                  className="rounded-xl border-emerald-200 bg-background tabular-nums focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Đơn vị thuê</label>
                                <Select
                                  value={draft.rentUnit}
                                  onValueChange={(u) => setVariantField(vid, "rentUnit", u as RentUnit)}
                                >
                                  <SelectTrigger className="rounded-xl border-emerald-200 bg-background focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent position="popper" className="rounded-xl border-emerald-100 dark:border-emerald-900/50">
                                    {RENT_UNIT_OPTIONS.map((o) => (
                                      <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={submitting || productsLoading || !selectedFacilityId}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/15"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden /> Đang gửi…
                    </>
                  ) : (
                    "Đăng bài"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={submitting}
                  className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                >
                  Huỷ
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
