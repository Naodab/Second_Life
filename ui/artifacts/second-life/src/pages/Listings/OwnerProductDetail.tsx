import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  Trash2,
  Video,
  RefreshCw,
  Megaphone,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToCloudinary, uploadVideoToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getAllAttributes, type AttributeResponse } from "@/api/attributes";
import {
  getOwnedProductWithVariants,
  updateProduct,
  uploadProductImages,
  publishDraftProduct,
  type OwnedProductDetailResponse,
  type ProductMediaResponse,
  type ProductStatus,
  type ProductVariantSummaryResponse,
} from "@/api/product";
import { manageAddListingPath } from "./manageRoutes";

const DEFAULT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

function statusLabel(s?: ProductStatus): string {
  switch (s) {
    case "DRAFT":
      return "Bản nháp";
    case "PUBLISHED":
      return "Đã đăng";
    case "ARCHIVED":
      return "Đã ẩn";
    default:
      return s ?? "—";
  }
}

function sortMedias(m: ProductMediaResponse[]): ProductMediaResponse[] {
  return [...m].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function OwnerProductDetail({
  facilityId,
  productId,
  onBack,
}: {
  facilityId: string;
  productId: string;
  onBack: () => void;
}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [product, setProduct] = useState<OwnedProductDetailResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allAttributes, setAllAttributes] = useState<AttributeResponse[]>([]);
  const [newVariantDrafts, setNewVariantDrafts] = useState<
    { id: string; selectedAttributeValueByAttributeId: Record<string, string> }[]
  >([]);

  const [removedMediaIds, setRemovedMediaIds] = useState<Set<string>>(new Set());
  const [videoRemoved, setVideoRemoved] = useState(false);
  const [newThumbFile, setNewThumbFile] = useState<File | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const p = await getOwnedProductWithVariants(productId);
      setProduct(p);
      setName(p.name ?? "");
      setDescription(p.description ?? "");
      setNewVariantDrafts([]);
      setRemovedMediaIds(new Set());
      setVideoRemoved(false);
      setNewThumbFile(null);
      setNewGalleryFiles([]);
      setNewVideoFile(null);
      setActiveImageIdx(0);
    } catch (e) {
      setProduct(null);
      setLoadError(e instanceof Error ? e.message : "Không tải được sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const attrs = await getAllAttributes();
        if (!cancelled) {
          setAllAttributes(attrs);
        }
      } catch {
        if (!cancelled) {
          setAllAttributes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mediasSorted = useMemo(
    () => sortMedias(product?.medias ?? []).filter((m) => m.id && !removedMediaIds.has(m.id)),
    [product?.medias, removedMediaIds],
  );

  const imageUrls = useMemo(
    () =>
      mediasSorted
        .filter((m) => m.mediaType === "IMAGE" && m.mediaUrl?.trim())
        .map((m) => m.mediaUrl.trim()),
    [mediasSorted],
  );

  const currentVideoUrl = useMemo(() => {
    if (videoRemoved) return null;
    const v = mediasSorted.find((m) => m.mediaType === "VIDEO" && m.mediaUrl?.trim());
    return v?.mediaUrl.trim() ?? null;
  }, [mediasSorted, videoRemoved]);

  const displaySliderUrls = imageUrls.length > 0 ? imageUrls : [DEFAULT_THUMB];

  const prevImg = () =>
    setActiveImageIdx((i) => (i - 1 + displaySliderUrls.length) % displaySliderUrls.length);
  const nextImg = () =>
    setActiveImageIdx((i) => (i + 1) % displaySliderUrls.length);

  const variants = product?.variants ?? [];
  const productAttributeIds = (product?.attributes ?? []).map((a) => a.id).filter(Boolean);
  const productAttributes = allAttributes.filter((attribute) =>
    productAttributeIds.includes(attribute.id),
  );

  function toggleRemoveMedia(mediaId?: string) {
    if (!mediaId) return;
    setRemovedMediaIds((prev) => {
      const n = new Set(prev);
      if (n.has(mediaId)) n.delete(mediaId);
      else n.add(mediaId);
      return n;
    });
  }

  function addVariantDraft() {
    setNewVariantDrafts((prev) => [
      ...prev,
      {
        id: `new-variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        selectedAttributeValueByAttributeId: {},
      },
    ]);
  }

  function removeVariantDraft(draftId: string) {
    setNewVariantDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
  }

  function setDraftAttributeValue(draftId: string, attributeId: string, valueId: string) {
    setNewVariantDrafts((prev) =>
      prev.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              selectedAttributeValueByAttributeId: {
                ...draft.selectedAttributeValueByAttributeId,
                [attributeId]: valueId,
              },
            }
          : draft,
      ),
    );
  }

  async function commitMediaAndMetadata(mediaDirty: boolean) {
    if (!product || !facilityId) return;

    const subIds = (product.subCategories ?? []).map((s) => s.id).filter(Boolean);
    const primaryId = product.primarySubCategory?.id;
    const attrIds = (product.attributes ?? []).map((a) => a.id).filter(Boolean);
    if (!primaryId || subIds.length === 0 || attrIds.length === 0) {
      toast({
        title: "Thiếu thông tin danh mục",
        description: "Sản phẩm không đủ meta danh mục để lưu. Liên hệ hỗ trợ hoặc tạo lại sản phẩm.",
        variant: "destructive",
      });
      return;
    }

    const existingVariantSignatures = new Set(
      variants.map((variant) => [...(variant.attributeValueIds ?? [])].filter(Boolean).sort().join("|")),
    );
    const variantBodies: { id?: string; attributeValueIds: string[] }[] = variants.map((v) => ({
      id: v.id,
      attributeValueIds: [...(v.attributeValueIds ?? [])].filter(Boolean),
    }));
    for (const draft of newVariantDrafts) {
      const values = productAttributes
        .map((attribute) => draft.selectedAttributeValueByAttributeId[attribute.id] || "")
        .filter(Boolean);
      if (values.length !== productAttributes.length) {
        throw new Error("Vui lòng chọn đủ giá trị thuộc tính cho biến thể mới.");
      }
      const signature = [...values].sort().join("|");
      if (existingVariantSignatures.has(signature)) {
        throw new Error("Biến thể mới bị trùng tổ hợp thuộc tính với SKU hiện có.");
      }
      existingVariantSignatures.add(signature);
      variantBodies.push({
        attributeValueIds: values,
      });
    }

    if (mediaDirty) {
      const keptImageRows = sortMedias(product.medias ?? []).filter(
        (m) =>
          m.id &&
          !removedMediaIds.has(m.id) &&
          m.mediaType === "IMAGE" &&
          Boolean(m.mediaUrl?.trim()),
      );

      const extraGalleryUploaded: string[] = [];
      for (const f of newGalleryFiles) {
        extraGalleryUploaded.push(await uploadImageToCloudinary(f, "second-life/products"));
      }

      let thumbRemote = "";
      if (newThumbFile) {
        thumbRemote = await uploadImageToCloudinary(newThumbFile, "second-life/products");
      }

      if (!thumbRemote) {
        const preferred = keptImageRows.find((r) => r.isThumbnail) ?? keptImageRows[0];
        thumbRemote = preferred?.mediaUrl.trim() ?? "";
      }
      if (!thumbRemote && extraGalleryUploaded.length > 0) {
        thumbRemote = extraGalleryUploaded[0]!;
      }

      const galleryUrls: string[] = [];
      for (const row of keptImageRows) {
        const u = row.mediaUrl.trim();
        if (u && u !== thumbRemote) {
          galleryUrls.push(u);
        }
      }
      for (const u of extraGalleryUploaded) {
        if (u !== thumbRemote) {
          galleryUrls.push(u);
        }
      }

      if (!thumbRemote.trim()) {
        throw new Error("Cần ít nhất một ảnh đại diện (giữ ảnh cũ hoặc tải ảnh mới).");
      }

      let videoRemote: string | undefined;
      if (newVideoFile) {
        videoRemote = await uploadVideoToCloudinary(newVideoFile, "second-life/products");
      } else if (!videoRemoved && currentVideoUrl) {
        videoRemote = currentVideoUrl;
      }

      await uploadProductImages(product.id, {
        thumbnailUrl: thumbRemote,
        productImageUrls: galleryUrls,
        videoUrl: videoRemote,
      });
    }

    await updateProduct(product.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      subCategoryIds: subIds,
      primarySubCategoryId: primaryId,
      attributeIds: attrIds,
      variants: variantBodies,
    });
  }

  const handleSave = async () => {
    const t = name.trim();
    if (!t || t.length < 3) {
      toast({ title: "Tên sản phẩm", description: "Tối thiểu 3 ký tự.", variant: "destructive" });
      return;
    }
    const mediaDirty =
      removedMediaIds.size > 0 ||
      Boolean(newThumbFile) ||
      newGalleryFiles.length > 0 ||
      Boolean(newVideoFile) ||
      videoRemoved;

    setSaving(true);
    try {
      await commitMediaAndMetadata(mediaDirty);
      toast({ title: "Đã cập nhật", description: "Thông tin & media sản phẩm đã lưu." });
      await reload();
    } catch (e) {
      toast({
        title: "Cập nhật thất bại",
        description: e instanceof Error ? e.message : "Thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!product) return;
    setPublishing(true);
    try {
      await publishDraftProduct(product.id);
      toast({
        title: "Đã xuất bản",
        description: "Sản phẩm hiển thị trong kho; bạn có thể Đăng bài từ danh sách.",
      });
      await reload();
    } catch (e) {
      toast({
        title: "Không xuất bản được",
        description:
          e instanceof Error
            ? e.message
            : "Cần ảnh đại diện và trạng thái bản nháp. Kiểm tra media rồi thử lại.",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Đang tải sản phẩm…</p>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full">
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {loadError ?? "Không có dữ liệu."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full">
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
        <h2 className="text-xl font-bold truncate flex-1 min-w-0">{product.name}</h2>
        <Badge variant="outline" className="shrink-0 tabular-nums">
          {statusLabel(product.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-card group">
            <img
              src={displaySliderUrls[activeImageIdx] ?? DEFAULT_THUMB}
              alt=""
              className="w-full h-full object-cover"
            />
            {displaySliderUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-1.5 opacity-0 shadow backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:bg-card/90"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-1.5 opacity-0 shadow backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:bg-card/90"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          {displaySliderUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {displaySliderUrls.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setActiveImageIdx(i)}
                  className={cn(
                    "w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0",
                    i === activeImageIdx ? "border-primary" : "border-transparent opacity-60",
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold">Ảnh & video</p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setNewThumbFile(f ?? null);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => thumbInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {newThumbFile ? "Đã chọn ảnh bìa mới" : "Thay ảnh bìa"}
              </Button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  setNewGalleryFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => galleryInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Thêm ảnh phụ
                {newGalleryFiles.length > 0 ? ` (${newGalleryFiles.length})` : ""}
              </Button>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground max-h-32 overflow-y-auto">
              {sortMedias(product.medias ?? []).map((m) => {
                if (!m.id) return null;
                const gone = removedMediaIds.has(m.id);
                if (m.mediaType === "VIDEO") return null;
                return (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className={cn("truncate", gone && "line-through opacity-50")}>
                      {m.isThumbnail ? "Bìa" : "Ảnh"} · …{m.mediaUrl.slice(-24)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => toggleRemoveMedia(m.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-start gap-2">
                <Video className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1 text-xs">
                  {videoRemoved ? (
                    <p className="text-muted-foreground">Video đã đánh dấu xóa khi lưu.</p>
                  ) : currentVideoUrl || newVideoFile ? (
                    <p className="truncate">{newVideoFile ? newVideoFile.name : currentVideoUrl}</p>
                  ) : (
                    <p className="text-muted-foreground">Chưa có video</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    setNewVideoFile(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <RefreshCw className="w-3 h-3 mr-1 shrink-0" />
                  Video mới
                </Button>
                {(currentVideoUrl || newVideoFile) && !videoRemoved && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs text-destructive border-destructive/40"
                    onClick={() => {
                      setVideoRemoved(true);
                      setNewVideoFile(null);
                    }}
                  >
                    Xóa video
                  </Button>
                )}
                {videoRemoved && (
                  <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setVideoRemoved(false)}>
                    Hoàn tác xóa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap gap-2">
              {product.primarySubCategory?.name && (
                <Badge variant="outline" className="bg-primary/5 text-primary">
                  {product.primarySubCategory.name}
                </Badge>
              )}
              {product.ownerId && <Badge variant="outline" className="bg-muted text-muted-foreground">Owner: {product.ownerId}</Badge>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller-prod-name">Tên</Label>
              <Input id="seller-prod-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller-prod-desc">Mô tả</Label>
              <Textarea
                id="seller-prod-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="resize-y min-h-[120px]"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                className="rounded-full shadow-lg shadow-primary/15"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Cập nhật
              </Button>
              {product.status === "DRAFT" && (
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full"
                  disabled={publishing}
                  onClick={() => void handlePublish()}
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Megaphone className="w-4 h-4 mr-2" />
                  )}
                  Xuất bản (DRAFT → đã đăng)
                </Button>
              )}
              {product.status === "PUBLISHED" && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setLocation(manageAddListingPath(facilityId, product.id))}
                >
                  Tạo bài đăng
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Xuất bản yêu cầu đã có ảnh đại diện. Chỉ sản phẩm đã đăng mới được tạo bài đăng trên marketplace.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold">Biến thể (SKU)</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={addVariantDraft}
                disabled={productAttributes.length === 0}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Thêm biến thể
              </Button>
            </div>
            <div className="space-y-3">
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có biến thể.</p>
              ) : (
                variants.map((v: ProductVariantSummaryResponse) => (
                  <div
                    key={v.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium line-clamp-2">{v.label ?? v.sku}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{v.sku}</p>
                    </div>
                  </div>
                ))
              )}
              {newVariantDrafts.map((draft) => (
                <div key={draft.id} className="rounded-xl border border-dashed bg-muted/20 px-3 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Biến thể mới</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeVariantDraft(draft.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {productAttributes.map((attribute) => (
                      <div key={`${draft.id}-${attribute.id}`} className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{attribute.name}</Label>
                        <select
                          value={draft.selectedAttributeValueByAttributeId[attribute.id] ?? ""}
                          onChange={(e) => setDraftAttributeValue(draft.id, attribute.id, e.target.value)}
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="">Chọn giá trị</option>
                          {(attribute.attributeValues ?? []).map((value) => (
                            <option key={value.id} value={value.id}>
                              {value.value}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {newVariantDrafts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Biến thể mới sẽ được tạo khi bấm <strong>Cập nhật</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
