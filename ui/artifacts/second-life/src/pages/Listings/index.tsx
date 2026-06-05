import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import {
  getMyFacilities,
  uploadFacilityMainImage,
  type FacilityResponse,
  type FacilityWithPlaceNames,
} from "@/api/facility";
import { getProvinces, getWards } from "@/api/location";
import { uploadImageToCloudinary, uploadVideoToCloudinary } from "@/lib/cloudinary";
import { createProduct, uploadProductImages } from "@/api/product";
import { useToast } from "@/hooks/use-toast";
import { AddFacilityModal } from "./AddFacilityModal";
import { AddProductPage } from "./AddProductPage";
import { CreateListingPage } from "./CreateListingPage";
import { FacilityView } from "./FacilityView";
import { ManageListingsView } from "./ManageListingsView";
import { ManageProductsView } from "./ManageProductsView";
import { ListingsSidebar } from "./ListingsSidebar";
import { OwnerProductDetail } from "./OwnerProductDetail";
import { OrdersView } from "./OrdersView";
import { UnpublishedView } from "./UnpublishedView";
import { UploadingModal } from "./UploadingModal";
import {
  manageAddListingPath,
  manageAddProductPath,
  manageFacilityPath,
  manageListingsPath,
  manageProductDetailPath,
  manageProductsPath,
  manageUnpublishedPath,
  manageOrdersPath,
  parseManageRoute,
} from "./manageRoutes";
import type { AddProductSubmitPayload, PendingProduct } from "./types";

function hasFacilityScope(
  r: ReturnType<typeof parseManageRoute>,
): r is
  | { tag: "facility"; facilityId: string }
  | { tag: "add-product"; facilityId: string }
  | { tag: "product"; facilityId: string; productId: string }
  | { tag: "unpublished"; facilityId: string } {
  return !!r && !["products", "listings", "add-listing", "orders"].includes(r.tag);
}

async function attachPlaceNames(
  facilities: FacilityResponse[],
): Promise<FacilityWithPlaceNames[]> {
  if (facilities.length === 0) return [];
  const provinces = await getProvinces({ pageSize: 100 });
  const provinceNameByCode = new Map(provinces.map((p) => [p.code, p.fullName || p.name]));
  const uniqueProvinceCodes = [...new Set(facilities.map((f) => f.provinceCode))];
  const wardNameByProvinceAndCode = new Map<string, Map<string, string>>();
  await Promise.all(
    uniqueProvinceCodes.map(async (provinceCode) => {
      try {
        const wards = await getWards({ provinceCode, pageSize: 500 });
        wardNameByProvinceAndCode.set(
          provinceCode,
          new Map(wards.map((w) => [w.code, w.fullName || w.name])),
        );
      } catch {
        wardNameByProvinceAndCode.set(provinceCode, new Map());
      }
    }),
  );
  return facilities.map((f) => {
    const provinceName = provinceNameByCode.get(f.provinceCode) ?? f.provinceCode;
    const wardName = wardNameByProvinceAndCode.get(f.provinceCode)?.get(f.wardCode) ?? f.wardCode;
    return { ...f, provinceName, wardName };
  });
}

export default function Listings() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const route = parseManageRoute(location);
  const addListingParams = useMemo(() => {
    const raw = search.startsWith("?") ? search.slice(1) : search;
    const q = new URLSearchParams(raw);
    return {
      facilityId: q.get("facilityId")?.trim() || undefined,
      productId: q.get("productId")?.trim() || undefined,
    };
  }, [search]);
  const { toast } = useToast();

  const [facilities, setFacilities] = useState<FacilityWithPlaceNames[]>([]);
  const [contextFacilityId, setContextFacilityId] = useState("");
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilitiesOpen, setFacilitiesOpen] = useState(true);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);
  const [isUploadingModal, setIsUploadingModal] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFacilitiesLoading(true);
      try {
        const raw = await getMyFacilities();
        if (cancelled) return;
        const list = await attachPlaceNames(raw);
        if (cancelled) return;
        setFacilities(list);
        if (list.length > 0) {
          setContextFacilityId((prev) =>
            prev && list.some((s) => s.id === prev) ? prev : list[0].id,
          );
        }
      } catch (e) {
        if (!cancelled) {
          setFacilities([]);
          toast({
            title: "Không tải được danh sách cơ sở",
            description: e instanceof Error ? e.message : "Vui lòng thử lại sau.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setFacilitiesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    if (!hasFacilityScope(route)) {
      return;
    }
    setContextFacilityId(route.facilityId);
  }, [route]);

  useEffect(() => {
    if (facilitiesLoading || !hasFacilityScope(route)) {
      return;
    }
    const { facilityId } = route;
    if (!facilities.some((f) => f.id === facilityId)) {
      toast({
        title: "Không tìm thấy cơ sở",
        description: "Cơ sở trong đường dẫn không tồn tại hoặc đã bị xóa.",
        variant: "destructive",
      });
      setLocation(manageProductsPath(), { replace: true });
    }
  }, [facilitiesLoading, facilities, route, setLocation, toast]);

  useEffect(() => {
    if (!location.startsWith("/manage")) {
      return;
    }
    const legacyOrders = location.match(/^\/manage\/facilities\/[^/]+\/orders\/?$/);
    if (legacyOrders) {
      setLocation(manageOrdersPath(), { replace: true });
      return;
    }
    const parsed = parseManageRoute(location);
    if (!parsed || location === "/manage/dashboard" || location.startsWith("/manage/dashboard?")) {
      setLocation(manageProductsPath(), { replace: true });
    }
  }, [location, setLocation]);

  const activeFacility = hasFacilityScope(route)
    ? facilities.find((s) => s.id === route.facilityId)
    : undefined;

  const handleAddProductSubmit = async (data: AddProductSubmitPayload) => {
    const uploads: File[] = [data.thumbnailFile, ...data.galleryImageFiles];
    const hadVideo = Boolean(data.videoFile);
    if (data.videoFile) {
      uploads.push(data.videoFile);
    }
    const totalUploads = uploads.length;

    setIsUploadingModal(true);

    try {
      let thumbnailUrl = "";
      const galleryUrls: string[] = [];
      let videoUrl: string | undefined;

      for (let i = 0; i < uploads.length; i++) {
        const file = uploads[i];
        const isVideoSlot = hadVideo && i === uploads.length - 1;
        toast({
          title: "Đang upload lên Cloudinary",
          description:
            `${i + 1}/${totalUploads}` +
            (isVideoSlot ? " — video" : i === 0 ? " — ảnh đại diện" : " — ảnh phụ"),
        });

        const url = isVideoSlot
          ? await uploadVideoToCloudinary(file, "second-life/products")
          : await uploadImageToCloudinary(file, "second-life/products");

        if (i === 0) {
          thumbnailUrl = url;
        } else if (isVideoSlot) {
          videoUrl = url;
        } else {
          galleryUrls.push(url);
        }
      }

      toast({
        title: "Đang lưu sản phẩm",
        description: "Gửi thông tin sản phẩm (bước 1)…",
      });

      const created = await createProduct({
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        manufactureYear: data.manufactureYear,
        subCategoryIds: data.subCategoryIds,
        primarySubCategoryId: data.primarySubCategoryId,
        attributeIds: data.attributeIds,
        variants: data.variants.map((v) => ({
          attributeValueIds: v.attributeValueIds,
        })),
      });

      toast({
        title: "Đang gắn ảnh & đồng bộ",
        description: "Cập nhật media và chỉ mục tìm kiếm…",
      });

      await uploadProductImages(created.id, {
        thumbnailUrl,
        productImageUrls: galleryUrls,
        videoUrl: videoUrl || undefined,
      });

      setIsUploadingModal(false);

      const pending: PendingProduct = {
        id: created.id,
        name: data.name,
        description: data.description,
        subCategoryIds: data.subCategoryIds,
        attributeIds: data.attributeIds,
        variantCount: data.variants.length,
        totalQty: 0,
        previewUrl: thumbnailUrl,
        facilityId: contextFacilityId,
      };
      setPendingProducts((prev) => [...prev, pending]);
      toast({
        title: "Đã tạo sản phẩm",
        description:
          "Ảnh/video đã lên Cloudinary; sản phẩm lưu ở trạng thái nháp và đã đồng bộ tìm kiếm. Vào Sản phẩm chưa đăng để định giá.",
      });

      setLocation(manageProductsPath());
    } catch (e) {
      setIsUploadingModal(false);
      toast({
        title: "Tạo sản phẩm thất bại",
        description: e instanceof Error ? e.message : "Vui lòng thử lại.",
        variant: "destructive",
      });
      throw e;
    }
  };

  const handlePublish = (_id: string, _price?: number) => {
    setPendingProducts((prev) => prev.filter((p) => p.id !== _id));
    toast({ title: "Đã đăng sản phẩm!", description: "Sản phẩm của bạn đã được đăng bán." });
  };

  const handleFacilityCreated = (facility: FacilityWithPlaceNames) => {
    setFacilities((prev) => [...prev, facility]);
    setContextFacilityId(facility.id);
    toast({
      title: "Đã tạo cơ sở",
      description: `${facility.name} đã được thêm vào danh sách.`,
    });
    setLocation(manageFacilityPath(facility.id));
  };

  const handleUpdateFacilityAvatar = async (file: File) => {
    const fid = hasFacilityScope(route) ? route.facilityId : contextFacilityId;
    if (!fid) return;

    try {
      const uploadedUrl = await uploadImageToCloudinary(file, "second-life/facilities");
      await uploadFacilityMainImage(fid, uploadedUrl);
      setFacilities((prev) =>
        prev.map((facility) =>
          facility.id === fid ? { ...facility, imageUrl: uploadedUrl } : facility,
        ),
      );
      toast({
        title: "Đã cập nhật avatar",
        description: "Ảnh đại diện cơ sở đã được cập nhật.",
      });
    } catch (e) {
      toast({
        title: "Cập nhật avatar thất bại",
        description: e instanceof Error ? e.message : "Vui lòng thử lại sau.",
        variant: "destructive",
      });
      throw e;
    }
  };

  const unpublishedFacilityId =
    route?.tag === "unpublished" ? route.facilityId : contextFacilityId;
  const unpublishedProducts = pendingProducts.filter((p) => p.facilityId === unpublishedFacilityId);

  return (
    <div className="flex min-h-screen bg-muted/40 dark:bg-background">
      <ListingsSidebar
        route={route ?? null}
        contextFacilityId={contextFacilityId}
        facilitiesOpen={facilitiesOpen}
        setFacilitiesOpen={setFacilitiesOpen}
        facilitySearch={facilitySearch}
        setFacilitySearch={setFacilitySearch}
        pendingProducts={pendingProducts}
        onGoHome={() => setLocation("/")}
        facilities={facilities}
        onAddFacilityClick={() => setIsAddFacilityModalOpen(true)}
      />

      <main className="flex-1 p-6 overflow-y-auto min-h-screen">
        <div className="max-w-5xl mx-auto">
          {facilitiesLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden />
              <p className="text-sm">Đang tải danh sách cơ sở…</p>
            </div>
          ) : (
            <>
              {route?.tag === "products" && (
                <ManageProductsView
                  contextFacilityId={contextFacilityId}
                  onViewProduct={(productId) =>
                    setLocation(manageProductDetailPath(contextFacilityId, productId))
                  }
                  onCreateProduct={() =>
                    setLocation(
                      contextFacilityId ? manageAddProductPath(contextFacilityId) : manageProductsPath(),
                    )
                  }
                  onCreateListingForProduct={(productId) =>
                    setLocation(manageAddListingPath(undefined, productId))
                  }
                />
              )}
              {route?.tag === "listings" && (
                <ManageListingsView
                  facilities={facilities}
                  onCreateListing={(facilityId, productId) =>
                    setLocation(manageAddListingPath(facilityId, productId))
                  }
                />
              )}

              {route?.tag === "facility" && activeFacility && (
                <FacilityView
                  facility={activeFacility}
                  onManageProducts={() => setLocation(manageProductsPath())}
                  onCreateListing={() => setLocation(manageListingsPath())}
                  onViewUnpublished={() => setLocation(manageUnpublishedPath(activeFacility.id))}
                  onUpdateAvatar={handleUpdateFacilityAvatar}
                  pendingCount={
                    pendingProducts.filter((p) => p.facilityId === activeFacility.id).length
                  }
                />
              )}

              {route?.tag === "add-product" && route.facilityId && (
                <AddProductPage
                  facilityId={route.facilityId}
                  onBack={() => setLocation(manageFacilityPath(route.facilityId))}
                  onSubmit={handleAddProductSubmit}
                />
              )}

              {route?.tag === "add-listing" && (
                <CreateListingPage
                  initialFacilityId={addListingParams.facilityId}
                  facilities={facilities}
                  initialProductId={addListingParams.productId}
                  onBack={() =>
                    setLocation(
                      addListingParams.facilityId
                        ? manageFacilityPath(addListingParams.facilityId)
                        : manageProductsPath(),
                    )
                  }
                />
              )}

              {route?.tag === "product" && (
                <OwnerProductDetail
                  facilityId={route.facilityId}
                  productId={route.productId}
                  onBack={() => setLocation(manageFacilityPath(route.facilityId))}
                />
              )}

              {route?.tag === "unpublished" && (
                <UnpublishedView products={unpublishedProducts} onPublish={handlePublish} />
              )}

              {route?.tag === "orders" && <OrdersView facilities={facilities} />}
            </>
          )}
        </div>
      </main>

      <AddFacilityModal
        open={isAddFacilityModalOpen}
        onClose={() => setIsAddFacilityModalOpen(false)}
        onCreated={handleFacilityCreated}
      />

      <UploadingModal open={isUploadingModal} />
    </div>
  );
}
