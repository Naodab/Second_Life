import { useEffect } from "react";
import { Route, RouteProps, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { loginPathWithReturn, currentReturnTo } from "@/hooks/use-require-auth";

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { isLoggedIn, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading || isLoggedIn) {
      return;
    }
    setLocation(loginPathWithReturn(currentReturnTo()));
  }, [isLoading, isLoggedIn, setLocation]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground text-sm">
        Đang tải…
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return <Route {...rest} component={Component} />;
}
