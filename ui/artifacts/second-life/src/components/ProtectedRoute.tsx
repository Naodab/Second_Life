import { useAuth } from "@/context/AuthContext";
import { Route, RouteProps } from "wouter";

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // You can replace with a proper loading component
  }

  if (!isLoggedIn) {
    // Redirect to login or show unauthorized message
    window.location.href = '/login';
    return null;
  }

  return <Route {...rest} component={Component} />;
}