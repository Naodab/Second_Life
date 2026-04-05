import { useAuth } from "@/context/AuthContext";
import { Route, RouteProps } from "wouter";

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    window.location.href = '/login';
    return null;
  }

  return <Route {...rest} component={Component} />;
}
