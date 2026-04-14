import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { MOCK_PRODUCTS, MOCK_SHOPS, type Shop } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { AddFacilityModal } from "./AddFacilityModal";
import { AddProductModal } from "./AddProductModal";
import { DashboardView } from "./DashboardView";
import { FacilityView } from "./FacilityView";
import { ListingsSidebar } from "./ListingsSidebar";
import { OwnerProductDetail } from "./OwnerProductDetail";
import { OrdersView } from "./OrdersView";
import { UnpublishedView } from "./UnpublishedView";
import { UploadingModal } from "./UploadingModal";
import { MY_FACILITY_IDS } from "./constants";
import type { AddProductSubmitPayload, ListingsView, PendingProduct } from "./types";

export default function Listings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [view, setView] = useState<ListingsView>("dashboard");
  const [facilities, setFacilities] = useState(() =>
    MOCK_SHOPS.filter((s) => MY_FACILITY_IDS.includes(s.id)),
  );
  const [activeFacilityId, setActiveFacilityId] = useState<string>(MY_FACILITY_IDS[0]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [facilitiesOpen, setFacilitiesOpen] = useState(true);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);
  const [isUploadingModal, setIsUploadingModal] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);

  const activeShop = useMemo(
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
    setIsAddModalOpen(false);
    setIsUploadingModal(true);
    setTimeout(() => {
      setIsUploadingModal(false);
      const pending: PendingProduct = {
        id: `pending-${Date.now()}`,
        name: data.name,
        description: data.description,
        color: data.color,
        material: data.material,
        forRent: data.forRent,
        forBuy: data.forBuy,
        rentQty: data.rentQty,
        buyQty: data.buyQty,
        totalQty: data.totalQty,
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

  const handlePublish = (id: string) => {
    setPendingProducts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Đã đăng sản phẩm!", description: "Sản phẩm của bạn đã được đăng bán." });
  };

  const handleFacilityCreated = (shop: Shop) => {
    setFacilities((prev) => [...prev, shop]);
    setActiveFacilityId(shop.id);
    setView("facility");
    toast({ title: "Đã tạo cơ sở", description: `${shop.name} đã được thêm vào danh sách.` });
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
          {view === "dashboard" && <DashboardView facilityId={activeFacilityId} />}

          {view === "facility" && activeShop && (
            <FacilityView
              shop={activeShop}
              onViewProduct={handleViewProduct}
              onAddProduct={() => setIsAddModalOpen(true)}
              onViewUnpublished={() => setView("unpublished")}
              pendingCount={facilityPendingProducts.length}
            />
          )}

          {view === "facility-product" && activeProduct && (
            <OwnerProductDetail product={activeProduct} onBack={() => setView("facility")} />
          )}

          {view === "unpublished" && (
            <UnpublishedView products={facilityPendingProducts} onPublish={handlePublish} />
          )}

          {view === "orders" && <OrdersView facilityId={activeFacilityId} />}
        </div>
      </main>

      <AddProductModal
        open={isAddModalOpen}
        facilityId={activeFacilityId}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProductSubmit}
      />

      <AddFacilityModal
        open={isAddFacilityModalOpen}
        onClose={() => setIsAddFacilityModalOpen(false)}
        onCreated={handleFacilityCreated}
      />

      <UploadingModal open={isUploadingModal} />
    </div>
  );
}
