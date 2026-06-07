import { useEffect } from "react";
import { useLocation } from "wouter";
import { ADMIN_HOME } from "@/lib/admin-paths";
import { AdminSidebar } from "./AdminSidebar";
import { AllListingsView } from "./AllListingsView";
import { FacilitiesView } from "./FacilitiesView";
import { OrdersView } from "./OrdersView";
import { PendingListingsView } from "./PendingListingsView";
import { ProductsView } from "./ProductsView";
import { UsersView } from "./UsersView";
import { UserDetailView } from "./UserDetailView";
import MessagesPage from "@/pages/Messages/MessagesPage";
import { parseAdminRoute } from "./adminRoutes";

export default function Admin() {
  const [location, setLocation] = useLocation();
  const route = parseAdminRoute(location);

  useEffect(() => {
    if (location === "/admin" || location === "/admin/") {
      setLocation(ADMIN_HOME, { replace: true });
    }
  }, [location, setLocation]);

  return (
    <div className="flex h-screen min-h-0 bg-muted/30">
      <AdminSidebar route={route} onGoHome={() => setLocation("/")} />
      <main className={route?.tag === "messages" ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex-1 overflow-y-auto"}>
        {route?.tag === "messages" ? (
          <MessagesPage embedded mode="admin" />
        ) : (
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {route?.tag === "listings-pending" && <PendingListingsView />}
            {route?.tag === "listings" && <AllListingsView />}
            {route?.tag === "facilities" && <FacilitiesView />}
            {route?.tag === "products" && <ProductsView />}
            {route?.tag === "users" && <UsersView />}
            {route?.tag === "users-detail" && <UserDetailView accountId={route.accountId} />}
            {route?.tag === "orders" && <OrdersView />}
            {!route && location.startsWith("/admin") ? (
              <div className="py-20 text-center text-sm text-muted-foreground">Đang chuyển hướng…</div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
