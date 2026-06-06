import { useEffect } from "react";
import { Link, Route, RouteProps, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { loginPathWithReturn, currentReturnTo } from "@/hooks/use-require-auth";
import { HttpErrorPageLayout } from "@/components/errors";
import { Button } from "@/components/ui/button";

interface AdminRouteProps extends RouteProps {
  component: React.ComponentType;
}

function AdminForbidden() {
  return (
    <HttpErrorPageLayout
      httpStatus={403}
      title="Không có quyền truy cập"
      message="Khu vực quản trị chỉ dành cho tài khoản admin."
      variant="fullscreen"
    >
      <p className="text-sm text-muted-foreground">
        Nếu bạn nghĩ đây là nhầm lẫn, hãy đăng nhập bằng tài khoản quản trị hoặc liên hệ hỗ trợ.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/">
          <Button variant="outline" className="rounded-full">
            Về trang chủ
          </Button>
        </Link>
      </div>
    </HttpErrorPageLayout>
  );
}

export function AdminRoute({ component: Component, ...rest }: AdminRouteProps) {
  const { isLoggedIn, isLoading, isAdmin } = useAuth();
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

  if (!isAdmin) {
    return <AdminForbidden />;
  }

  return <Route {...rest} component={Component} />;
}
