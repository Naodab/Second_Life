import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { SELLER_HUB_HOME } from "@/lib/seller-hub-paths";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { VisitorLocationProvider } from "@/context/VisitorLocationContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SellerHubProfileGate } from "@/components/SellerHubProfileGate";
import { setBaseUrl } from "@workspace/api-client-react";

import Home from "@/pages/Home";
import Search from "@/pages/Search";
import ListingDetail from "@/pages/ListingDetail";
import FacilityPage from "@/pages/Facility";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Messages from "@/pages/Messages";
import Listings from "@/pages/Listings/index";

function SellerHubLegacyRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(SELLER_HUB_HOME, { replace: true });
  }, [setLocation]);
  return null;
}
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import OAuthCallback from "@/pages/OAuthCallback";
import EmailVerifyCallback from "@/pages/EmailVerifyCallback";
import ProfileSetup from "@/pages/ProfileSetup";

const queryClient = new QueryClient();

function ProfileSetupRedirect() {
  const { isLoggedIn, isLoading, needsProfileSetup } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading || !isLoggedIn || !needsProfileSetup) {
      return;
    }
    if (location === "/profile/setup") {
      return;
    }
    const isAuthFlow =
      location === "/login" ||
      location === "/register" ||
      location === "/email-verified" ||
      location.startsWith("/oauth2/callback/");
    if (isAuthFlow) {
      return;
    }
    setLocation("/profile/setup");
  }, [isLoading, isLoggedIn, needsProfileSetup, location, setLocation]);

  return null;
}

function Router() {
  const [location] = useLocation();
  const isSellerHub = location.startsWith("/manage") || location.startsWith("/listings");
  const isAuthPage =
    location === "/login" ||
    location === "/register" ||
    location === "/email-verified" ||
    location === "/profile/setup" ||
    location.startsWith("/oauth2/callback/");
  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthPage && !isSellerHub && <Header />}
      <main className="flex flex-1 flex-col">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/listing/:id" component={ListingDetail} />
          <Route path="/facility/:id" component={FacilityPage} />
          <Route path="/shop/:id" component={FacilityPage} />
          <ProtectedRoute path="/cart" component={Cart} />
          <ProtectedRoute path="/checkout" component={Checkout} />
          <ProtectedRoute path="/orders" component={Orders} />
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/listings" component={SellerHubLegacyRedirect} />
          <ProtectedRoute path="/manage/*?" component={Listings} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/oauth2/callback/google" component={OAuthCallback} />
          <Route path="/email-verified" component={EmailVerifyCallback} />
          <ProtectedRoute path="/profile/setup" component={ProfileSetup} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAuthPage && !isSellerHub && <Footer />}
    </div>
  );
}

function App() {
  setBaseUrl(import.meta.env.VITE_BACKEND_URL || "http://localhost");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <VisitorLocationProvider>
                <ProfileSetupRedirect />
                <SellerHubProfileGate />
                <Router />
                <Toaster />
              </VisitorLocationProvider>
            </AuthProvider>
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
