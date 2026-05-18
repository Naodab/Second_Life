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
  ChevronRight,
} from "lucide-react";
import { getAllAttributes, type AttributeResponse } from "@/api/attributes";
import { getAllCategories, type CategoryResponse } from "@/api/categories";
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

  const [step, setStep] = useState<1 | 2>(1);
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
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [attributes, setAttributes] = useState<AttributeResponse[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterLoadError, setFilterLoadError] = useState("");
  const [lastChangedVariantId, setLastChangedVariantId] = useState<string>("");
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const setField = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setMedia((prev) => {
      revokeIfBlob(prev.thumbnailPreview);
      return {
        ...prev,
        thumbnailFile: file,
        thumbnailPreview: URL.createObjectURL(file),
      };
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
      return {
        ...prev,
        videoFile: file,
        videoPreview: URL.createObjectURL(file),
      };
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
        const [categoriesResult, attributesResult] = await Promise.allSettled([getAllCategories(), getAllAttributes()]);
        if (cancelled) return;

        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value);
        } else {
          setCategories([]);
        }

        if (attributesResult.status === "fulfilled") {
          setAttributes(attributesResult.value);
        } else {
          setAttributes([]);
        }

        const errors: string[] = [];
        if (categoriesResult.status === "rejected") {
          errors.push("danh mục");
        }
        if (attributesResult.status === "rejected") {
          errors.push("thuộc tính");
        }
        if (errors.length > 0) {
          setFilterLoadError(`Không thể tải ${errors.join(" và ")}. Vui lòng thử lại.`);
        }
      } catch (error) {
        if (cancelled) return;
        setFilterLoadError(error instanceof Error ? error.message : "Không thể tải dữ liệu bộ lọc.");
      } finally {
        if (!cancelled) {
          setIsLoadingFilters(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const subCategoryIdsByCategoryId = useMemo(() => {
    const result: Record<string, { id: string; name: string; code?: string | null }[]> = {};
    for (const category of categories) {
      result[category.id] = (category.items ?? []).map((item) => ({ id: item.id, name: item.name, code: item.code }));
    }
    return result;
  }, [categories]);

  const selectedConcreteAttributeIds = useMemo(() => {
    const validAttributeIdSet = new Set(attributes.map((attribute) => attribute.id));
    const uniqueAttributeIds: string[] = [];
    const seen = new Set<string>();
    for (const attributeId of form.selectedAttributeIds) {
      if (!validAttributeIdSet.has(attributeId) || seen.has(attributeId)) {
        continue;
      }
      seen.add(attributeId);
      uniqueAttributeIds.push(attributeId);
    }
    return uniqueAttributeIds;
  }, [attributes, form.selectedAttributeIds]);

  const syncVariantAttributeSelections = (
    variants: VariantDraft[],
    attributeIds: string[],
  ): VariantDraft[] => {
    const allowed = new Set(attributeIds);
    return variants.map((variant) => {
      const nextSelections: Record<string, string> = {};
      for (const [attributeId, valueId] of Object.entries(variant.selectedAttributeValueByAttributeId)) {
        if (allowed.has(attributeId)) {
          nextSelections[attributeId] = valueId;
        }
      }
      return {
        ...variant,
        selectedAttributeValueByAttributeId: nextSelections,
      };
    });
  };

  useEffect(() => {
    setForm((prev) => {
      const sameSelectedAttributeIds =
        prev.selectedAttributeIds.length === selectedConcreteAttributeIds.length &&
        prev.selectedAttributeIds.every((attributeId, index) => attributeId === selectedConcreteAttributeIds[index]);
      if (sameSelectedAttributeIds) {
        return prev;
      }
      return {
        ...prev,
        selectedAttributeIds: selectedConcreteAttributeIds,
        variants: syncVariantAttributeSelections(prev.variants, selectedConcreteAttributeIds),
      };
    });
  }, [selectedConcreteAttributeIds]);

  const normalizeSkuPart = (value: string) =>
    value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "NA";

  const toAsciiText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");

  const selectedPrimarySubCategory = useMemo(() => {
    if (!form.primarySubCategoryId) {
      return null;
    }
    for (const category of categories) {
      const match = category.items?.find((item) => item.id === form.primarySubCategoryId);
      if (match) {
        return { category, subCategory: match };
      }
    }
    return null;
  }, [categories, form.primarySubCategoryId]);

  const skuPrefix = useMemo(() => {
    if (!selectedPrimarySubCategory) {
      return "PRIMARY";
    }
    const categoryCode = normalizeSkuPart(
      selectedPrimarySubCategory.category.code || selectedPrimarySubCategory.category.name || selectedPrimarySubCategory.category.id,
    );
    const subCategoryCode = normalizeSkuPart(
      selectedPrimarySubCategory.subCategory.code ||
      selectedPrimarySubCategory.subCategory.name ||
      selectedPrimarySubCategory.subCategory.id,
    );
    return `${categoryCode}${subCategoryCode}`;
  }, [selectedPrimarySubCategory]);

  const productSkuPart = useMemo(() => normalizeSkuPart(toAsciiText(form.name || "PRODUCT")), [form.name]);

  const variantPreviewRows = useMemo(() => {
    return form.variants.map((variant) => {
      const attributeParts = selectedConcreteAttributeIds.map((attributeId) => {
        const attribute = attributes.find((item) => item.id === attributeId);
        const selectedValueId = variant.selectedAttributeValueByAttributeId[attributeId];
        const attributeValue = attribute?.attributeValues?.find((item) => item.id === selectedValueId);
        if (!selectedValueId || !attributeValue) {
          return "NA";
        }
        return normalizeSkuPart(attributeValue.code || attributeValue.value || attributeValue.id);
      });
      return {
        id: variant.id,
        title: `${skuPrefix}-${productSkuPart}-${attributeParts.join("-") || "NA"}`,
        attributeValueIds: selectedConcreteAttributeIds
          .map((attributeId) => variant.selectedAttributeValueByAttributeId[attributeId])
          .filter(Boolean),
      };
    });
  }, [
    attributes,
    form.variants,
    productSkuPart,
    selectedConcreteAttributeIds,
    skuPrefix,
  ]);

  const variantSignatureById = useMemo(() => {
    const result = new Map<string, string>();
    for (const variant of form.variants) {
      const values = selectedConcreteAttributeIds.map((attributeId) => variant.selectedAttributeValueByAttributeId[attributeId] || "");
      if (values.some((value) => !value)) {
        result.set(variant.id, "");
        continue;
      }
      result.set(variant.id, values.join("|"));
    }
    return result;
  }, [form.variants, selectedConcreteAttributeIds]);

  const duplicateSignatureCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const signature of variantSignatureById.values()) {
      if (!signature) continue;
      counts.set(signature, (counts.get(signature) ?? 0) + 1);
    }
    return counts;
  }, [variantSignatureById]);

  const hasDuplicateVariants = useMemo(() => {
    for (const count of duplicateSignatureCounts.values()) {
      if (count > 1) {
        return true;
      }
    }
    return false;
  }, [duplicateSignatureCounts]);

  const isDuplicateVariant = (variantId: string) => {
    const signature = variantSignatureById.get(variantId);
    if (!signature) {
      return false;
    }
    return (duplicateSignatureCounts.get(signature) ?? 0) > 1;
  };

  const canSubmit =
    form.name.trim() &&
    form.primarySubCategoryId &&
    form.subCategoryIds.length > 0 &&
    selectedConcreteAttributeIds.length > 0 &&
    form.variants.length > 0 &&
    !hasDuplicateVariants &&
    form.variants.every((variant) =>
      selectedConcreteAttributeIds.every((attributeId) => !!variant.selectedAttributeValueByAttributeId[attributeId]),
    );

  const validationMessage = useMemo(() => {
    if (hasDuplicateVariants) {
      return "Có loại sản phẩm bị trùng tổ hợp thuộc tính. Vui lòng chọn lại.";
    }
    if (!form.name.trim()) {
      return "Vui lòng nhập tên sản phẩm.";
    }
    if (!form.primarySubCategoryId) {
      return "Vui lòng chọn danh mục con chính (PRIMARY).";
    }
    if (selectedConcreteAttributeIds.length === 0) {
      return "Vui lòng chọn ít nhất một thuộc tính sản phẩm.";
    }
    const hasMissingAttributeValues = form.variants.some((variant) =>
      selectedConcreteAttributeIds.some((attributeId) => !variant.selectedAttributeValueByAttributeId[attributeId]),
    );
    if (hasMissingAttributeValues) {
      return "Vui lòng chọn đủ giá trị thuộc tính cho từng loại sản phẩm.";
    }
    return "";
  }, [
    form.name,
    form.primarySubCategoryId,
    form.variants,
    hasDuplicateVariants,
    selectedConcreteAttributeIds,
  ]);

  const handleFinalSubmit = async () => {
    if (hasDuplicateVariants) return;
    if (!canSubmit) return;
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

  const reset = () => {
    setLastChangedVariantId("");
    setStep(1);
    setMediaError("");
    setMedia((prev) => {
      revokeIfBlob(prev.thumbnailPreview);
      prev.gallery.forEach((g) => revokeIfBlob(g.preview));
      revokeIfBlob(prev.videoPreview);
      return {
        thumbnailFile: null,
        thumbnailPreview: "",
        gallery: [],
        videoFile: null,
        videoPreview: "",
      };
    });
    setForm({
      name: "",
      description: "",
      selectedCategoryIds: [""],
      selectedAttributeIds: [],
      subCategoryIds: [],
      primarySubCategoryId: "",
      variants: [createEmptyVariant()],
    });
  };

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

      <div className="relative z-20 px-1 sm:px-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-emerald-900 dark:text-emerald-100">
            {step === 1 ? "Thêm mặt hàng mới" : "Ảnh & video sản phẩm"}
          </h2>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-300/90">
            {step === 1
              ? "Thiết lập thông tin và thuộc tính ở bước 1, sau đó tải ảnh/video ở bước 2."
              : `Ảnh đại diện bắt buộc; tối đa ${MAX_GALLERY_IMAGES} ảnh phụ (tối đa 12 ảnh). Có thể thêm một video. Nhấn Tạo để upload lên Cloudinary và lưu sản phẩm.`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (step === 2) {
              setStep(1);
              return;
            }
            onBack();
            reset();
          }}
          className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> {step === 2 ? "Về bước 1" : "Quay lại"}
        </Button>
      </div>

      <div className="relative z-20 flex flex-col gap-4 py-3 px-1 sm:px-2">
        {step === 1 ? (
          <>
            <div className="rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
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
              </div>
            </div>

            <div className="order-4 rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold block">
                  Loại sản phẩm <span className="text-destructive">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      variants: [...prev.variants, createEmptyVariant()],
                    }))
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Tạo loại sản phẩm mới
                </Button>
              </div>

              {variantPreviewRows.length === 0 && (
                <p className="text-xs text-muted-foreground">Chọn thuộc tính trước khi tạo biến thể.</p>
              )}

              {form.variants.map((variant) => {
                const variantPreview = variantPreviewRows.find((row) => row.id === variant.id);
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
                      <div className="grid grid-cols-1 gap-3 flex-1 min-w-0">
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">SKU biến thể</p>
                          <p className="break-all text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            {variantPreview?.title ?? "NA"}
                          </p>
                        </div>
                      </div>
                      {form.variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-9 w-9 hover:bg-destructive/10"
                          aria-label="Xóa biến thể"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              variants: prev.variants.filter((item) => item.id !== variant.id),
                            }))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {selectedConcreteAttributeIds.map((attributeId) => {
                        const attribute = attributes.find((item) => item.id === attributeId);
                        const attributeValues = attribute?.attributeValues ?? [];
                        return (
                          <div key={`${variant.id}-${attributeId}`} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3">
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 md:mt-2 md:min-w-32">
                              {attribute?.name}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {attributeValues.map((value) => {
                                const checked = variant.selectedAttributeValueByAttributeId[attributeId] === value.id;
                                return (
                                  <button
                                    key={value.id}
                                    type="button"
                                    onClick={() => {
                                      setLastChangedVariantId(variant.id);
                                      setForm((prev) => ({
                                        ...prev,
                                        variants: prev.variants.map((item) =>
                                          item.id === variant.id
                                            ? {
                                              ...item,
                                              selectedAttributeValueByAttributeId: {
                                                ...item.selectedAttributeValueByAttributeId,
                                                [attributeId]: checked ? "" : value.id,
                                              },
                                            }
                                            : item,
                                        ),
                                      }));
                                    }}
                                    className={cn(
                                      "px-3 py-2 rounded-xl text-sm border transition-colors shadow-sm",
                                      checked
                                        ? isDuplicateVariant(variant.id)
                                          ? "bg-destructive text-white border-destructive"
                                          : "bg-emerald-600 text-white border-emerald-600"
                                        : "border-emerald-200 bg-background hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-card dark:hover:bg-emerald-950/35",
                                    )}
                                  >
                                    {value.value}
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

            <div className="order-2 rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5">
              <label className="text-sm font-semibold mb-1.5 block">Mô tả</label>
              <textarea
                className="min-h-[96px] w-full resize-none rounded-xl border border-emerald-200 bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-emerald-900/50 dark:bg-card"
                placeholder="Mô tả tình trạng, thông số kỹ thuật..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div className="order-3 rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-5 space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Danh mục sản phẩm <span className="text-destructive">*</span>
                </label>
                <div className="space-y-3">
                  {isLoadingFilters && <p className="text-sm text-muted-foreground">Đang tải danh mục con...</p>}
                  {!isLoadingFilters &&
                    form.selectedCategoryIds.map((selectedCategoryId, index) => {
                      const availableCategories = categories.filter(
                        (category) =>
                          category.id === selectedCategoryId ||
                          !form.selectedCategoryIds.some((id, idx) => idx !== index && id === category.id),
                      );

                      const subCategoriesInGroup = selectedCategoryId
                        ? (subCategoryIdsByCategoryId[selectedCategoryId] ?? [])
                        : [];

                      return (
                        <div
                          key={`category-group-${index}`}
                          className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/45 dark:bg-emerald-950/30"
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative min-w-0 flex-1">
                              <select
                                value={selectedCategoryId}
                                onChange={(e) => {
                                  const nextCategoryId = e.target.value;
                                  setForm((prev) => {
                                    const prevCategoryId = prev.selectedCategoryIds[index];
                                    const nextSelectedCategoryIds = prev.selectedCategoryIds.map((id, idx) =>
                                      idx === index ? nextCategoryId : id,
                                    );

                                    const removedSubCategoryIds = prevCategoryId
                                      ? (subCategoryIdsByCategoryId[prevCategoryId] ?? []).map((item) => item.id)
                                      : [];
                                    const nextSubCategoryIds = prev.subCategoryIds.filter(
                                      (id) => !removedSubCategoryIds.includes(id),
                                    );

                                    return {
                                      ...prev,
                                      selectedCategoryIds: nextSelectedCategoryIds,
                                      subCategoryIds: nextSubCategoryIds,
                                      primarySubCategoryId: nextSubCategoryIds.includes(prev.primarySubCategoryId)
                                        ? prev.primarySubCategoryId
                                        : "",
                                    };
                                  });
                                }}
                                className="h-10 w-full appearance-none rounded-lg border border-emerald-200 bg-background pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-emerald-900/50 dark:bg-card"
                              >
                                <option value="">{index === 0 ? "Chọn danh mục chính" : "Chọn danh mục phụ"}</option>
                                {availableCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>

                            {form.selectedCategoryIds.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive h-9 w-9 hover:bg-destructive/10"
                                aria-label="Xóa nhóm danh mục"
                                onClick={() =>
                                  setForm((prev) => {
                                    const removedCategoryId = prev.selectedCategoryIds[index];
                                    const nextSelectedCategoryIds = prev.selectedCategoryIds.filter((_, idx) => idx !== index);
                                    const removedSubCategoryIds = removedCategoryId
                                      ? (subCategoryIdsByCategoryId[removedCategoryId] ?? []).map((item) => item.id)
                                      : [];
                                    return {
                                      ...prev,
                                      selectedCategoryIds: nextSelectedCategoryIds.length > 0 ? nextSelectedCategoryIds : [""],
                                      subCategoryIds: prev.subCategoryIds.filter((id) => !removedSubCategoryIds.includes(id)),
                                      primarySubCategoryId: removedSubCategoryIds.includes(prev.primarySubCategoryId)
                                        ? ""
                                        : prev.primarySubCategoryId,
                                    };
                                  })
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {selectedCategoryId && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-emerald-800">
                                {index === 0 ? "Danh mục con chính (PRIMARY)" : "Danh mục con phụ"}
                              </p>
                              <div className="flex flex-wrap gap-2 w-full">
                                {subCategoriesInGroup.length === 0 && (
                                  <p className="text-xs text-muted-foreground">Danh mục này chưa có danh mục con.</p>
                                )}
                                {subCategoriesInGroup.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => {
                                        const checked = prev.subCategoryIds.includes(item.id);
                                        return {
                                          ...prev,
                                          subCategoryIds: checked
                                            ? prev.subCategoryIds.filter((id) => id !== item.id)
                                            : [...prev.subCategoryIds, item.id],
                                          primarySubCategoryId: checked
                                            ? prev.primarySubCategoryId === item.id
                                              ? ""
                                              : prev.primarySubCategoryId
                                            : index === 0 && !prev.primarySubCategoryId
                                              ? item.id
                                              : prev.primarySubCategoryId,
                                        };
                                      })
                                    }
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
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          selectedCategoryIds: [...prev.selectedCategoryIds, ""],
                        }))
                      }
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm category phụ
                    </Button>
                  )}
                  {!!filterLoadError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {filterLoadError}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Thuộc tính sản phẩm <span className="text-destructive">*</span>
                </label>
                <div className="space-y-3 w-full">
                  {isLoadingFilters && <p className="text-sm text-muted-foreground">Đang tải thuộc tính...</p>}
                  {!isLoadingFilters && (
                    <div className="flex flex-wrap gap-2 w-full">
                      {attributes.length === 0 && (
                        <p className="text-xs text-muted-foreground">Chưa có thuộc tính khả dụng.</p>
                      )}
                      {attributes.map((attribute) => {
                        const checked = form.selectedAttributeIds.includes(attribute.id);
                        return (
                          <button
                            key={attribute.id}
                            type="button"
                            onClick={() =>
                              setForm((prev) => {
                                const nextAttributeIds = checked
                                  ? prev.selectedAttributeIds.filter((id) => id !== attribute.id)
                                  : [...prev.selectedAttributeIds, attribute.id];
                                return {
                                  ...prev,
                                  selectedAttributeIds: nextAttributeIds,
                                  variants: syncVariantAttributeSelections(prev.variants, nextAttributeIds),
                                };
                              })
                            }
                            className={cn(
                              "px-3 py-2 rounded-xl text-sm border transition-colors shadow-sm",
                              checked
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "border-emerald-200 bg-background hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-card dark:hover:bg-emerald-950/35",
                            )}
                          >
                            {attribute.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur dark:border-emerald-900/45 dark:bg-card/95 p-4 sm:p-6 space-y-6">
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryChange}
            />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />

            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Bước 2 / 2</p>
              <label className="text-sm font-semibold mt-3 mb-2 block">
                Ảnh đại diện (thumbnail) <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-4 items-start">
                {media.thumbnailPreview ? (
                  <div className="relative h-40 w-40 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40">
                    <img src={media.thumbnailPreview} alt="" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                      aria-label="Xóa ảnh đại diện"
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
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {media.gallery.map((g) => (
                  <div
                    key={g.key}
                    className="relative aspect-square overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 shadow-sm dark:border-emerald-900/45 dark:bg-emerald-950/40"
                  >
                    <img src={g.preview} alt="" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 h-7 w-7 rounded-full shadow-md bg-background/90"
                      aria-label="Xóa ảnh"
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
              <p className="text-xs text-muted-foreground mt-2">Tối đa {MAX_GALLERY_IMAGES} ảnh phụ; có thể xóa và chọn lại.</p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Video giới thiệu (tuỳ chọn)</label>
              <div className="space-y-3">
                {media.videoPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-100 bg-black max-h-64">
                    <video src={media.videoPreview} controls className="w-full max-h-64" playsInline />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 rounded-full"
                      onClick={clearVideo}
                    >
                      <X className="w-4 h-4 mr-1" /> Xóa video
                    </Button>
                  </div>
                )}
                {!media.videoFile && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Chọn video
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {step === 1 && !canSubmit && validationMessage && (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-xl p-3 text-sm",
            hasDuplicateVariants
              ? "text-destructive bg-destructive/10"
              : "text-amber-600 bg-amber-50",
          )}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationMessage}</span>
        </div>
      )}

      {step === 2 && mediaError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl p-3 text-sm text-destructive bg-destructive/10">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{mediaError}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-2">
        {step === 1 ? (
          <>
            <Button
              variant="outline"
              onClick={() => {
                onBack();
                reset();
              }}
              className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
            >
              Quay lại
            </Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                setMediaError("");
                setStep(2);
              }}
              className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            >
              Tiếp theo <ChevronRight className="w-4 h-4 ml-1 inline" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
              disabled={submitting}
            >
              Quay lại
            </Button>
            <Button
              disabled={!media.thumbnailFile || submitting}
              onClick={() => void handleFinalSubmit()}
              className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            >
              {submitting ? "Đang tạo…" : "Tạo sản phẩm"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
