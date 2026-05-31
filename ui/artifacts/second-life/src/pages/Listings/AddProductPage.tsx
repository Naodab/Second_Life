import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  X,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { getAllAttributes, type AttributeResponse } from "@/api/attributes";
import { getAllCategories, type CategoryResponse } from "@/api/categories";
import { analyzeProductImages } from "@/api/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AddProductSubmitPayload } from "./types";

const MAX_GALLERY_IMAGES = 11;

function revokeIfBlob(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

export function AddProductPage({
  facilityId,
  onBack,
  onSubmit,
}: {
  facilityId: string;
  onBack: () => void;
  onSubmit: (data: AddProductSubmitPayload) => Promise<void>;
}) {
  type VariantDraft = {
    id: string;
    selectedAttributeValueByAttributeId: Record<string, string>;
  };

  const createEmptyVariant = (): VariantDraft => ({
    id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    selectedAttributeValueByAttributeId: {},
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    selectedCategoryIds: [""],
    selectedAttributeIds: [] as string[],
    subCategoryIds: [] as string[],
    primarySubCategoryId: "",
    variants: [createEmptyVariant()],
  });

  const [media, setMedia] = useState<{
    thumbnailFile: File | null;
    thumbnailPreview: string;
    gallery: { key: string; file: File; preview: string }[];
    videoFile: File | null;
    videoPreview: string;
  }>({
    thumbnailFile: null,
    thumbnailPreview: "",
    gallery: [],
    videoFile: null,
    videoPreview: "",
  });

  const [mediaError, setMediaError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [attributes, setAttributes] = useState<AttributeResponse[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterLoadError, setFilterLoadError] = useState("");

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const setField = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setMedia((prev) => {
      revokeIfBlob(prev.thumbnailPreview);
      return { ...prev, thumbnailFile: file, thumbnailPreview: URL.createObjectURL(file) };
    });
    e.target.value = "";
  };

  const clearThumbnail = () => {
    setMedia((prev) => {
      revokeIfBlob(prev.thumbnailPreview);
      return { ...prev, thumbnailFile: null, thumbnailPreview: "" };
    });
  };

  const handleGalleryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setMedia((prev) => {
      const remaining = MAX_GALLERY_IMAGES - prev.gallery.length;
      const slice = files.slice(0, Math.max(0, remaining));
      return {
        ...prev,
        gallery: [
          ...prev.gallery,
          ...slice.map((file) => ({
            key: `g-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            preview: URL.createObjectURL(file),
          })),
        ],
      };
    });
    e.target.value = "";
  };

  const removeGalleryItem = (key: string) => {
    setMedia((prev) => {
      const item = prev.gallery.find((g) => g.key === key);
      if (item) revokeIfBlob(item.preview);
      return { ...prev, gallery: prev.gallery.filter((g) => g.key !== key) };
    });
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) return;
    setMedia((prev) => {
      revokeIfBlob(prev.videoPreview);
      return { ...prev, videoFile: file, videoPreview: URL.createObjectURL(file) };
    });
    e.target.value = "";
  };

  const clearVideo = () => {
    setMedia((prev) => {
      revokeIfBlob(prev.videoPreview);
      return { ...prev, videoFile: null, videoPreview: "" };
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingFilters(true);
      setFilterLoadError("");
      try {
        const [catsResult, attrsResult] = await Promise.allSettled([getAllCategories(), getAllAttributes()]);
        if (cancelled) return;
        setCategories(catsResult.status === "fulfilled" ? catsResult.value : []);
        setAttributes(attrsResult.status === "fulfilled" ? attrsResult.value : []);
        const errors: string[] = [];
        if (catsResult.status === "rejected") errors.push("danh mục");
        if (attrsResult.status === "rejected") errors.push("thuộc tính");
        if (errors.length) setFilterLoadError(`Không thể tải ${errors.join(" và ")}. Vui lòng thử lại.`);
      } catch (err) {
        if (!cancelled) setFilterLoadError(err instanceof Error ? err.message : "Không thể tải dữ liệu bộ lọc.");
      } finally {
        if (!cancelled) setIsLoadingFilters(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const subCategoryIdsByCategoryId = useMemo(() => {
    const result: Record<string, { id: string; name: string; code?: string | null }[]> = {};
    for (const category of categories) {
      result[category.id] = (category.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
      }));
    }
    return result;
  }, [categories]);

  const selectedConcreteAttributeIds = useMemo(() => {
    const validSet = new Set(attributes.map((a) => a.id));
    const seen = new Set<string>();
    const result: string[] = [];
    for (const id of form.selectedAttributeIds) {
      if (!validSet.has(id) || seen.has(id)) continue;
      seen.add(id);
      result.push(id);
    }
    return result;
  }, [attributes, form.selectedAttributeIds]);

  const syncVariantAttributeSelections = (variants: VariantDraft[], attrIds: string[]): VariantDraft[] => {
    const allowed = new Set(attrIds);
    return variants.map((v) => {
      const next: Record<string, string> = {};
      for (const [attrId, valId] of Object.entries(v.selectedAttributeValueByAttributeId)) {
        if (allowed.has(attrId)) next[attrId] = valId;
      }
      return { ...v, selectedAttributeValueByAttributeId: next };
    });
  };

  useEffect(() => {
    setForm((prev) => {
      const same =
        prev.selectedAttributeIds.length === selectedConcreteAttributeIds.length &&
        prev.selectedAttributeIds.every((id, i) => id === selectedConcreteAttributeIds[i]);
      if (same) return prev;
      return {
        ...prev,
        selectedAttributeIds: selectedConcreteAttributeIds,
        variants: syncVariantAttributeSelections(prev.variants, selectedConcreteAttributeIds),
      };
    });
  }, [selectedConcreteAttributeIds]);

  const normalizeSkuPart = (value: string) =>
    value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "NA";

  const toAsciiText = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

  const selectedPrimarySubCategory = useMemo(() => {
    if (!form.primarySubCategoryId) return null;
    for (const cat of categories) {
      const match = cat.items?.find((item) => item.id === form.primarySubCategoryId);
      if (match) return { category: cat, subCategory: match };
    }
    return null;
  }, [categories, form.primarySubCategoryId]);

  const skuPrefix = useMemo(() => {
    if (!selectedPrimarySubCategory) return "PRIMARY";
    const catCode = normalizeSkuPart(
      selectedPrimarySubCategory.category.code || selectedPrimarySubCategory.category.name || selectedPrimarySubCategory.category.id,
    );
    const subCode = normalizeSkuPart(
      selectedPrimarySubCategory.subCategory.code || selectedPrimarySubCategory.subCategory.name || selectedPrimarySubCategory.subCategory.id,
    );
    return `${catCode}${subCode}`;
  }, [selectedPrimarySubCategory]);

  const productSkuPart = useMemo(() => normalizeSkuPart(toAsciiText(form.name || "PRODUCT")), [form.name]);

  const variantPreviewRows = useMemo(() =>
    form.variants.map((variant) => {
      const attrParts = selectedConcreteAttributeIds.map((attrId) => {
        const attr = attributes.find((a) => a.id === attrId);
        const valId = variant.selectedAttributeValueByAttributeId[attrId];
        const val = attr?.attributeValues?.find((v) => v.id === valId);
        return val ? normalizeSkuPart(val.code || val.value || val.id) : "NA";
      });
      return {
        id: variant.id,
        title: `${skuPrefix}-${productSkuPart}-${attrParts.join("-") || "NA"}`,
        attributeValueIds: selectedConcreteAttributeIds
          .map((attrId) => variant.selectedAttributeValueByAttributeId[attrId])
          .filter(Boolean),
      };
    }),
    [attributes, form.variants, productSkuPart, selectedConcreteAttributeIds, skuPrefix],
  );

  const variantSignatureById = useMemo(() => {
    const result = new Map<string, string>();
    for (const variant of form.variants) {
      const values = selectedConcreteAttributeIds.map(
        (attrId) => variant.selectedAttributeValueByAttributeId[attrId] || "",
      );
      result.set(variant.id, values.some((v) => !v) ? "" : values.join("|"));
    }
    return result;
  }, [form.variants, selectedConcreteAttributeIds]);

  const duplicateSignatureCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const sig of variantSignatureById.values()) {
      if (!sig) continue;
      counts.set(sig, (counts.get(sig) ?? 0) + 1);
    }
    return counts;
  }, [variantSignatureById]);

  const hasDuplicateVariants = useMemo(() => {
    for (const count of duplicateSignatureCounts.values()) if (count > 1) return true;
    return false;
  }, [duplicateSignatureCounts]);

  const isDuplicateVariant = (variantId: string) => {
    const sig = variantSignatureById.get(variantId);
    return !!sig && (duplicateSignatureCounts.get(sig) ?? 0) > 1;
  };

  const canSubmit =
    form.name.trim() &&
    form.primarySubCategoryId &&
    form.subCategoryIds.length > 0 &&
    selectedConcreteAttributeIds.length > 0 &&
    form.variants.length > 0 &&
    !hasDuplicateVariants &&
    form.variants.every((v) =>
      selectedConcreteAttributeIds.every((attrId) => !!v.selectedAttributeValueByAttributeId[attrId]),
    );

  const validationMessage = useMemo(() => {
    if (hasDuplicateVariants) return "Có loại sản phẩm bị trùng tổ hợp thuộc tính. Vui lòng chọn lại.";
    if (!form.name.trim()) return "Vui lòng nhập tên sản phẩm.";
    if (!form.primarySubCategoryId) return "Vui lòng chọn danh mục con chính (PRIMARY).";
    if (selectedConcreteAttributeIds.length === 0) return "Vui lòng chọn ít nhất một thuộc tính sản phẩm.";
    const hasMissing = form.variants.some((v) =>
      selectedConcreteAttributeIds.some((attrId) => !v.selectedAttributeValueByAttributeId[attrId]),
    );
    if (hasMissing) return "Vui lòng chọn đủ giá trị thuộc tính cho từng loại sản phẩm.";
    return "";
  }, [form.name, form.primarySubCategoryId, form.variants, hasDuplicateVariants, selectedConcreteAttributeIds]);

  const handleAiAutoFill = async () => {
    if (!media.thumbnailFile) return;
    setAiAnalyzing(true);
    setAiError("");
    try {
      const filesToSend = [
        media.thumbnailFile,
        ...(media.gallery.length > 0 ? [media.gallery[0].file] : []),
      ];
      const result = await analyzeProductImages(filesToSend);

      setForm((prev) => {
        const next = { ...prev };

        if (result.name?.trim()) next.name = result.name.trim();
        if (result.description?.trim()) next.description = result.description.trim();

        if (result.subCategoryIds?.length) {
          const neededCategoryIds: string[] = [];
          for (const subId of result.subCategoryIds) {
            const cat = categories.find((c) => c.items?.some((s) => s.id === subId));
            if (cat && !neededCategoryIds.includes(cat.id)) neededCategoryIds.push(cat.id);
          }
          next.selectedCategoryIds = neededCategoryIds.length > 0 ? neededCategoryIds : [""];
          next.subCategoryIds = result.subCategoryIds;
          next.primarySubCategoryId = result.subCategoryIds[0] ?? "";
        }

        if (result.attributeValues?.length) {
          const attrIds = [...new Set(result.attributeValues.map((av) => av.attributeId))];
          const synced = syncVariantAttributeSelections(next.variants, attrIds);
          const variantUpdates: Record<string, string> = {};
          for (const av of result.attributeValues) {
            variantUpdates[av.attributeId] = av.attributeValueId;
          }
          next.variants = synced.map((v, idx) => {
            if (idx !== 0) return v;
            return {
              ...v,
              selectedAttributeValueByAttributeId: {
                ...v.selectedAttributeValueByAttributeId,
                ...variantUpdates,
              },
            };
          });
          next.selectedAttributeIds = attrIds;
        }

        return next;
      });
    } catch {
      setAiError("Không thể phân tích ảnh. Vui lòng thử lại.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (hasDuplicateVariants || !canSubmit) return;
    if (!media.thumbnailFile) {
      setMediaError("Vui lòng chọn ảnh đại diện (thumbnail).");
      return;
    }
    setMediaError("");
    const variants = variantPreviewRows.map((row) => ({
      skuPreview: row.title,
      attributeValueIds: row.attributeValueIds,
    }));
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        description: form.description,
        facilityId,
        subCategoryIds: form.subCategoryIds,
        primarySubCategoryId: form.primarySubCategoryId,
        attributeIds: selectedConcreteAttributeIds,
        variants,
        thumbnailFile: media.thumbnailFile,
        galleryImageFiles: media.gallery.map((g) => g.file),
        videoFile: media.videoFile,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-2xl shadow-emerald-900/10 dark:border-emerald-900/45 dark:from-emerald-950/50 dark:via-card dark:to-emerald-950/40 sm:p-6">
      <img src="/images/tree-form.png" alt="" aria-hidden className="pointer-events-none absolute -top-1 -left-1 w-32 sm:w-40 md:w-44 select-none opacity-75" />
      <img src="/images/tree-form.png" alt="" aria-hidden className="pointer-events-none absolute -bottom-1 -right-1 w-32 sm:w-40 md:w-44 select-none opacity-75 rotate-180" />

      <div className="relative z-20 px-1 sm:px-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-emerald-900 dark:text-emerald-100">Thêm mặt hàng mới</h2>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-300/90">
            Upload ảnh trước, sau đó dùng AI để tự động điền thông tin hoặc nhập thủ công.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Quay lại
        </Button>
      </div>

      <div className="relative z-20 flex flex-col gap-4 py-3 px-1 sm:px-2">

        <div className="rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5 space-y-5">
          <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
          <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />

          <div>
            <label className="text-sm font-semibold mb-2 block">
              Ảnh đại diện <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-4 items-start">
              {media.thumbnailPreview ? (
                <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40">
                  <img src={media.thumbnailPreview} alt="" className="w-full h-full object-cover" />
                  <Button
                    type="button" size="icon" variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                    onClick={clearThumbnail}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 text-sm text-emerald-800 transition-colors hover:bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-200 dark:hover:bg-emerald-950/55"
                >
                  <ImageIcon className="w-8 h-8 opacity-70" />
                  Chọn ảnh
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-sm font-semibold block">
                Ảnh phụ <span className="text-muted-foreground font-normal">({media.gallery.length}/{MAX_GALLERY_IMAGES})</span>
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {media.gallery.map((g) => (
                <div key={g.key} className="relative aspect-square overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 shadow-sm dark:border-emerald-900/45 dark:bg-emerald-950/40">
                  <img src={g.preview} alt="" className="w-full h-full object-cover" />
                  <Button
                    type="button" size="icon" variant="secondary"
                    className="absolute top-1 right-1 h-7 w-7 rounded-full shadow-md bg-background/90"
                    onClick={() => removeGalleryItem(g.key)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {media.gallery.length < MAX_GALLERY_IMAGES && (
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50/80 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  <Plus className="w-6 h-6" />
                  Thêm ảnh
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Video giới thiệu (tuỳ chọn)</label>
            {media.videoPreview && (
              <div className="relative rounded-xl overflow-hidden border border-emerald-100 bg-black max-h-52 mb-2">
                <video src={media.videoPreview} controls className="w-full max-h-52" playsInline />
                <Button type="button" size="sm" variant="destructive" className="absolute top-2 right-2 rounded-full" onClick={clearVideo}>
                  <X className="w-4 h-4 mr-1" /> Xóa
                </Button>
              </div>
            )}
            {!media.videoFile && (
              <Button
                type="button" variant="outline"
                className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="w-4 h-4 mr-2" /> Chọn video
              </Button>
            )}
          </div>
        </div>

        <div className={cn(
          "rounded-2xl border p-4 sm:p-5 transition-colors",
          media.thumbnailFile
            ? "border-violet-200 bg-violet-50/60 dark:border-violet-800/50 dark:bg-violet-950/20"
            : "border-emerald-100 bg-white/60 dark:border-emerald-900/45 dark:bg-card/60",
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                Tự động điền thông tin bằng AI
              </p>
              <p className="text-xs text-violet-700/80 dark:text-violet-300/70 mt-0.5">
                {media.thumbnailFile
                  ? "Sẵn sàng — AI sẽ phân tích ảnh và điền tên, mô tả, danh mục, thuộc tính tự động."
                  : "Upload ảnh đại diện trước để kích hoạt tính năng này."}
              </p>
              {aiError && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{aiError}
                </p>
              )}
            </div>
            <Button
              type="button"
              disabled={!media.thumbnailFile || aiAnalyzing}
              onClick={() => void handleAiAutoFill()}
              className="shrink-0 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 disabled:opacity-50 gap-2"
            >
              {aiAnalyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Phân tích ảnh</>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5">
          <label className="text-sm font-semibold mb-1.5 block">
            Tên sản phẩm <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="Vd: Máy ảnh cổ điển"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className="rounded-xl border-emerald-200 bg-background focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:bg-card"
          />
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5 space-y-2">
          <label className="text-sm font-semibold block">Mô tả</label>
          <textarea
            className="min-h-[96px] w-full resize-none rounded-xl border border-emerald-200 bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-emerald-900/50 dark:bg-card"
            placeholder="Mô tả tình trạng, thông số kỹ thuật... (AI sẽ tự điền nếu bạn dùng 'Phân tích ảnh')"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5 space-y-4">
          <label className="text-sm font-semibold block">
            Danh mục sản phẩm <span className="text-destructive">*</span>
          </label>
          <div className="space-y-3">
            {isLoadingFilters && <p className="text-sm text-muted-foreground">Đang tải danh mục...</p>}
            {!isLoadingFilters && form.selectedCategoryIds.map((selectedCategoryId, index) => {
              const availableCategories = categories.filter(
                (cat) =>
                  cat.id === selectedCategoryId ||
                  !form.selectedCategoryIds.some((id, idx) => idx !== index && id === cat.id),
              );
              const subCategoriesInGroup = selectedCategoryId
                ? (subCategoryIdsByCategoryId[selectedCategoryId] ?? [])
                : [];

              return (
                <div key={`cat-group-${index}`} className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/45 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          setForm((prev) => {
                            const prevId = prev.selectedCategoryIds[index];
                            const nextSelectedCategoryIds = prev.selectedCategoryIds.map((id, idx) => idx === index ? nextId : id);
                            const removedSubs = prevId ? (subCategoryIdsByCategoryId[prevId] ?? []).map((i) => i.id) : [];
                            const nextSubIds = prev.subCategoryIds.filter((id) => !removedSubs.includes(id));
                            return {
                              ...prev,
                              selectedCategoryIds: nextSelectedCategoryIds,
                              subCategoryIds: nextSubIds,
                              primarySubCategoryId: nextSubIds.includes(prev.primarySubCategoryId) ? prev.primarySubCategoryId : "",
                            };
                          });
                        }}
                        className="h-10 w-full appearance-none rounded-lg border border-emerald-200 bg-background pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-emerald-900/50 dark:bg-card"
                      >
                        <option value="">{index === 0 ? "Chọn danh mục chính" : "Chọn danh mục phụ"}</option>
                        {availableCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {form.selectedCategoryIds.length > 1 && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="text-destructive h-9 w-9 hover:bg-destructive/10"
                        onClick={() => setForm((prev) => {
                          const removedId = prev.selectedCategoryIds[index];
                          const nextIds = prev.selectedCategoryIds.filter((_, idx) => idx !== index);
                          const removedSubs = removedId ? (subCategoryIdsByCategoryId[removedId] ?? []).map((i) => i.id) : [];
                          return {
                            ...prev,
                            selectedCategoryIds: nextIds.length > 0 ? nextIds : [""],
                            subCategoryIds: prev.subCategoryIds.filter((id) => !removedSubs.includes(id)),
                            primarySubCategoryId: removedSubs.includes(prev.primarySubCategoryId) ? "" : prev.primarySubCategoryId,
                          };
                        })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {selectedCategoryId && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        {index === 0 ? "Danh mục con chính (PRIMARY)" : "Danh mục con phụ"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {subCategoriesInGroup.length === 0 && (
                          <p className="text-xs text-muted-foreground">Danh mục này chưa có danh mục con.</p>
                        )}
                        {subCategoriesInGroup.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setForm((prev) => {
                              const checked = prev.subCategoryIds.includes(item.id);
                              return {
                                ...prev,
                                subCategoryIds: checked
                                  ? prev.subCategoryIds.filter((id) => id !== item.id)
                                  : [...prev.subCategoryIds, item.id],
                                primarySubCategoryId: checked
                                  ? prev.primarySubCategoryId === item.id ? "" : prev.primarySubCategoryId
                                  : index === 0 && !prev.primarySubCategoryId ? item.id : prev.primarySubCategoryId,
                              };
                            })}
                            className={cn(
                              "px-3 py-2 rounded-xl text-sm border transition-colors shadow-sm",
                              form.subCategoryIds.includes(item.id)
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "border-emerald-200 bg-background hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-card dark:hover:bg-emerald-950/35",
                            )}
                          >
                            {item.name}
                            {form.primarySubCategoryId === item.id && (
                              <span className="ml-2 rounded-full bg-background/25 px-2 py-0.5 text-[10px] font-semibold dark:bg-emerald-950/60">
                                PRIMARY
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!isLoadingFilters && (
              <Button
                type="button" variant="outline" size="sm"
                className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                onClick={() => setForm((prev) => ({ ...prev, selectedCategoryIds: [...prev.selectedCategoryIds, ""] }))}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm category phụ
              </Button>
            )}
            {filterLoadError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {filterLoadError}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5 space-y-3">
          <label className="text-sm font-semibold block">
            Thuộc tính sản phẩm <span className="text-destructive">*</span>
          </label>
          {isLoadingFilters ? (
            <p className="text-sm text-muted-foreground">Đang tải thuộc tính...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attributes.length === 0 && (
                <p className="text-xs text-muted-foreground">Chưa có thuộc tính khả dụng.</p>
              )}
              {attributes.map((attr) => {
                const checked = form.selectedAttributeIds.includes(attr.id);
                return (
                  <button
                    key={attr.id}
                    type="button"
                    onClick={() => setForm((prev) => {
                      const next = checked
                        ? prev.selectedAttributeIds.filter((id) => id !== attr.id)
                        : [...prev.selectedAttributeIds, attr.id];
                      return {
                        ...prev,
                        selectedAttributeIds: next,
                        variants: syncVariantAttributeSelections(prev.variants, next),
                      };
                    })}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm border transition-colors shadow-sm",
                      checked
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-emerald-200 bg-background hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-card dark:hover:bg-emerald-950/35",
                    )}
                  >
                    {attr.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold block">
              Loại sản phẩm <span className="text-destructive">*</span>
            </label>
            <Button
              type="button" variant="outline" size="sm"
              className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
              onClick={() => setForm((prev) => ({ ...prev, variants: [...prev.variants, createEmptyVariant()] }))}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Tạo loại sản phẩm mới
            </Button>
          </div>

          {form.variants.length === 0 && (
            <p className="text-xs text-muted-foreground">Chọn thuộc tính trước khi tạo biến thể.</p>
          )}

          {form.variants.map((variant) => {
            const preview = variantPreviewRows.find((r) => r.id === variant.id);
            return (
              <div
                key={variant.id}
                className={cn(
                  "rounded-xl border p-3 space-y-3",
                  isDuplicateVariant(variant.id)
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/30",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">SKU biến thể</p>
                    <p className="break-all text-sm font-medium text-emerald-900 dark:text-emerald-100">
                      {preview?.title ?? "NA"}
                    </p>
                  </div>
                  {form.variants.length > 1 && (
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="text-destructive h-9 w-9 hover:bg-destructive/10"
                      onClick={() => setForm((prev) => ({ ...prev, variants: prev.variants.filter((v) => v.id !== variant.id) }))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {selectedConcreteAttributeIds.map((attrId) => {
                    const attr = attributes.find((a) => a.id === attrId);
                    const attrValues = attr?.attributeValues ?? [];
                    return (
                      <div key={`${variant.id}-${attrId}`} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3">
                        <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 md:mt-2 md:min-w-32">
                          {attr?.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {attrValues.map((val) => {
                            const checked = variant.selectedAttributeValueByAttributeId[attrId] === val.id;
                            return (
                              <button
                                key={val.id}
                                type="button"
                                onClick={() => setForm((prev) => ({
                                  ...prev,
                                  variants: prev.variants.map((v) =>
                                    v.id === variant.id
                                      ? {
                                          ...v,
                                          selectedAttributeValueByAttributeId: {
                                            ...v.selectedAttributeValueByAttributeId,
                                            [attrId]: checked ? "" : val.id,
                                          },
                                        }
                                      : v,
                                  ),
                                }))}
                                className={cn(
                                  "px-3 py-2 rounded-xl text-sm border transition-colors shadow-sm",
                                  checked
                                    ? isDuplicateVariant(variant.id)
                                      ? "bg-destructive text-white border-destructive"
                                      : "bg-emerald-600 text-white border-emerald-600"
                                    : "border-emerald-200 bg-background hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-card dark:hover:bg-emerald-950/35",
                                )}
                              >
                                {val.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {mediaError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl p-3 text-sm text-destructive bg-destructive/10">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{mediaError}</span>
        </div>
      )}
      {!canSubmit && validationMessage && (
        <div className={cn(
          "mt-3 flex items-center gap-2 rounded-xl p-3 text-sm",
          hasDuplicateVariants ? "text-destructive bg-destructive/10" : "text-amber-600 bg-amber-50",
        )}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{validationMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
        >
          Quay lại
        </Button>
        <Button
          disabled={!canSubmit || !media.thumbnailFile || submitting || aiAnalyzing}
          onClick={() => void handleSubmit()}
          className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang tạo...</>
          ) : "Tạo sản phẩm"}
        </Button>
      </div>
    </div>
  );
}
