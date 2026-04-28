import type { ReactNode } from "react";
import {
  LayoutDashboard,
  LogOut,
  Store,
  Building2,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { facilityAvatarUrl, type FacilityWithPlaceNames } from "@/api/facility";
import type { ListingsView, PendingProduct } from "./types";

export function ListingsSidebar({
  view,
  setView,
  activeFacilityId,
  onSelectFacility,
  facilitiesOpen,
  setFacilitiesOpen,
  facilitySearch,
  setFacilitySearch,
  pendingProducts,
  onGoHome,
  facilities,
  onAddFacilityClick,
}: {
  view: ListingsView;
  setView: (v: ListingsView) => void;
  activeFacilityId: string;
  onSelectFacility: (id: string) => void;
  facilitiesOpen: boolean;
  setFacilitiesOpen: (v: boolean) => void;
  facilitySearch: string;
  setFacilitySearch: (v: string) => void;
  pendingProducts: PendingProduct[];
  onGoHome: () => void;
  facilities: FacilityWithPlaceNames[];
  onAddFacilityClick: () => void;
}) {
  const filteredFacilities = facilities.filter(
    (s) => !facilitySearch || s.name.toLowerCase().includes(facilitySearch.toLowerCase()),
  );

  const navItem = (label: string, icon: ReactNode, isActive: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
      )}
    >
      {icon} {label}
    </button>
  );

  return (
    <aside className="w-60 bg-white border-r h-screen sticky top-0 flex flex-col flex-shrink-0 shadow-sm">
      <div className="p-4 border-b flex items-center gap-2">
        <div className="bg-primary/20 p-1.5 rounded-lg">
          <img
            src={`${import.meta.env.BASE_URL}images/logo-leaf.png`}
            alt="Logo"
            className="w-5 h-5 object-contain"
          />
        </div>
        <span className="font-display font-bold text-base leading-tight">Quản lý bán hàng</span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItem("Dashboard", <LayoutDashboard className="w-4 h-4" />, view === "dashboard", () => setView("dashboard"))}

        <div>
          <button
            type="button"
            onClick={() => setFacilitiesOpen(!facilitiesOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-all"
          >
            <span className="flex items-center gap-3">
              <Building2 className="w-4 h-4" /> Cơ sở
            </span>
            {facilitiesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {facilitiesOpen && (
            <div className="mt-1 space-y-1 pl-2">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Tìm cơ sở..."
                  value={facilitySearch}
                  onChange={(e) => setFacilitySearch(e.target.value)}
                  className="pl-7 h-7 text-xs rounded-lg border-gray-200"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs rounded-lg border-dashed border-primary/40 text-primary hover:bg-primary/5"
                onClick={onAddFacilityClick}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Thêm cơ sở
              </Button>
              <div className="max-h-[min(280px,42vh)] overflow-y-auto space-y-1 pr-0.5 -mr-0.5">
                {filteredFacilities.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onSelectFacility(f.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all",
                      activeFacilityId === f.id &&
                        (view === "facility" || view === "facility-add-product" || view === "facility-product" || view === "unpublished")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground",
                    )}
                  >
                    <img
                      src={facilityAvatarUrl(f)}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      alt=""
                    />
                    <span className="truncate text-xs">{f.name}</span>
                    {pendingProducts.filter((p) => p.facilityId === f.id).length > 0 && (
                      <span className="ml-auto bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {pendingProducts.filter((p) => p.facilityId === f.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {navItem("Đơn hàng", <FileText className="w-4 h-4" />, view === "orders", () => setView("orders"))}
      </nav>

      <div className="p-3 border-t space-y-1">
        <button
          type="button"
          onClick={onGoHome}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-all"
        >
          <Store className="w-4 h-4" /> Về trang chợ
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}
