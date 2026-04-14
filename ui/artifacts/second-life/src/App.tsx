import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { setBaseUrl } from "@workspace/api-client-react";

import Home from "@/pages/Home";
import Search from "@/pages/Search";
import ProductDetail from "@/pages/ProductDetail";
import Shop from "@/pages/Shop";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Messages from "@/pages/Messages";
import Listings from "@/pages/Listings";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import OAuthCallback from "@/pages/OAuthCallback";
import EmailVerifyCallback from "@/pages/EmailVerifyCallback";
import ProfileSetup from "@/pages/ProfileSetup";

const queryClient = new QueryClient();

/** Sends users with incomplete profile (e.g. Google) to onboarding before other app pages. */
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
  const isAuthPage =
    location === "/login" ||
    location === "/register" ||
    location === "/email-verified" ||
    location === "/profile/setup" ||
    location.startsWith("/oauth2/callback/");

  return (
    <div className="min-h-screen flex flex-col">
      <ProfileSetupRedirect />
      {!isAuthPage && <Header />}
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/search" component={Search} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/shop/:id" component={Shop} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <ProtectedRoute path="/orders" component={Orders} />
          <ProtectedRoute path="/messages" component={Messages} />
          <ProtectedRoute path="/listings" component={Listings} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/oauth2/callback/google" component={OAuthCallback} />
          <Route path="/email-verified" component={EmailVerifyCallback} />
          <ProtectedRoute path="/profile/setup" component={ProfileSetup} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function App() {
  setBaseUrl(import.meta.env.VITE_BACKEND_URL || "http://localhost");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
