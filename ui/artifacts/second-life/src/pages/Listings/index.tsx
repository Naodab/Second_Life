import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  getMyFacilities,
  uploadFacilityMainImage,
  type FacilityResponse,
  type FacilityWithPlaceNames,
} from "@/api/facility";
import { getProvinces, getWards } from "@/api/location";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { AddFacilityModal } from "./AddFacilityModal";
import { AddProductPage } from "./AddProductPage";
import { DashboardView } from "./DashboardView";
import { FacilityView } from "./FacilityView";
import { ListingsSidebar } from "./ListingsSidebar";
import { OwnerProductDetail } from "./OwnerProductDetail";
import { OrdersView } from "./OrdersView";
import { UnpublishedView } from "./UnpublishedView";
import { UploadingModal } from "./UploadingModal";
import type { AddProductSubmitPayload, ListingsView, PendingProduct } from "./types";

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
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [view, setView] = useState<ListingsView>("dashboard");
  const [facilities, setFacilities] = useState<FacilityWithPlaceNames[]>([]);
  const [activeFacilityId, setActiveFacilityId] = useState("");
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
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
          setActiveFacilityId((prev) =>
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

  const activeFacility = useMemo(
    () => facilities.find((s) => s.id === activeFacilityId),
    [facilities, activeFacilityId],
  );

  const facilityPendingProducts = pendingProducts.filter((p) => p.facilityId === activeFacilityId);

  const handleSelectFacility = (id: string) => {
    setActiveFacilityId(id);
    setView("facility");
    setActiveProductId(null);
  };

  const handleViewProduct = (productId: string) => {
    setActiveProductId(productId);
    setView("facility-product");
  };

  const handleAddProductSubmit = (data: AddProductSubmitPayload) => {
    setIsUploadingModal(true);
    setTimeout(() => {
      setIsUploadingModal(false);
      setView("facility");
      const pending: PendingProduct = {
        id: `pending-${Date.now()}`,
        name: data.name,
        description: data.description,
        subCategoryIds: data.subCategoryIds,
        attributeIds: data.attributeIds,
        variantCount: data.variants.length,
        totalQty: data.variants.reduce((sum, variant) => sum + variant.quantity, 0),
        previewUrl: data.previewUrl,
        facilityId: data.facilityId,
      };
      setPendingProducts((prev) => [...prev, pending]);
      toast({
        title: "Upload hoàn tất!",
        description: "Sản phẩm đã được xử lý. Vào 'Sản phẩm chưa đăng' để định giá và đăng.",
      });
    }, 2500);
  };

  const handlePublish = (id: string, price?: number) => {
    setPendingProducts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Đã đăng sản phẩm!", description: "Sản phẩm của bạn đã được đăng bán." });
  };

  const handleFacilityCreated = (facility: FacilityWithPlaceNames) => {
    setFacilities((prev) => [...prev, facility]);
    setActiveFacilityId(facility.id);
    setView("facility");
    toast({
      title: "Đã tạo cơ sở",
      description: `${facility.name} đã được thêm vào danh sách.`,
    });
  };

  const handleUpdateFacilityAvatar = async (file: File) => {
    if (!activeFacilityId) return;
    try {
      await uploadFacilityMainImage(activeFacilityId, file);
      const previewUrl = URL.createObjectURL(file);
      setFacilities((prev) =>
        prev.map((facility) =>
          facility.id === activeFacilityId ? { ...facility, imageUrl: previewUrl } : facility,
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

  const activeProduct = activeProductId ? MOCK_PRODUCTS.find((p) => p.id === activeProductId) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ListingsSidebar
        view={view}
        setView={setView}
        activeFacilityId={activeFacilityId}
        onSelectFacility={handleSelectFacility}
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
              {view === "dashboard" && <DashboardView facilityId={activeFacilityId} />}

              {view === "facility" && activeFacility && (
                <FacilityView
                  facility={activeFacility}
                  onViewProduct={handleViewProduct}
                  onAddProduct={() => setView("facility-add-product")}
                  onViewUnpublished={() => setView("unpublished")}
                  onUpdateAvatar={handleUpdateFacilityAvatar}
                  pendingCount={facilityPendingProducts.length}
                />
              )}

              {view === "facility-add-product" && activeFacilityId && (
                <AddProductPage
                  facilityId={activeFacilityId}
                  onBack={() => setView("facility")}
                  onSubmit={handleAddProductSubmit}
                />
              )}

              {view === "facility-product" && activeProduct && (
                <OwnerProductDetail product={activeProduct} onBack={() => setView("facility")} />
              )}

              {view === "unpublished" && (
                <UnpublishedView products={facilityPendingProducts} onPublish={handlePublish} />
              )}

              {view === "orders" && <OrdersView facilityId={activeFacilityId} />}
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
