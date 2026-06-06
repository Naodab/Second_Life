import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { appHref } from "@/api";
import { ADMIN_HOME } from "@/lib/admin-paths";
import { decodeJwtPayloadUnsafe, isAdminRole } from "@/lib/jwtPayload";

function formatOAuthCallbackError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("access_denied") || lower.includes("access denied")) {
    return "Bạn đã hủy hoặc từ chối quyền truy cập với Google.";
  }
  if (raw.length > 220) {
    return `${raw.slice(0, 217)}…`;
  }
  return raw;
}

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const handledRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (handledRef.current) {
        return;
      }
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get("token");
        const refreshToken = urlParams.get("refresh_token");
        const errCode = urlParams.get("error")?.trim() ?? "";
        const errDesc = urlParams.get("error_description")?.trim() ?? "";

        if (errCode || errDesc) {
          const detail = formatOAuthCallbackError(
            errDesc || errCode || "Đã có lỗi xảy ra khi đăng nhập Google.",
          );
          toast({
            title: "Đăng nhập Google thất bại",
            description: detail,
            variant: "destructive",
          });
          setError(detail);
          setIsLoading(false);
          return;
        }

        if (!accessToken || !refreshToken) {
          setError("Không nhận được token từ máy chủ đăng nhập");
          setIsLoading(false);
          return;
        }

        handledRef.current = true;
        const needsSetup = await loginWithGoogle(accessToken, refreshToken);
        const isAdmin = isAdminRole(decodeJwtPayloadUnsafe(accessToken)?.role);
        const path = needsSetup
          ? appHref("/profile/setup")
          : appHref(isAdmin ? ADMIN_HOME : "/");
        window.location.replace(`${window.location.origin}${path}`);
      } catch (callbackErr) {
        handledRef.current = false;
        console.error("OAuth callback failed:", callbackErr);
        setError("Failed to complete authentication");
        setIsLoading(false);
      }
    };

    void handleCallback();
  }, [loginWithGoogle]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang xử lý đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Đăng nhập thất bại</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => setLocation('/login')} className="w-full">
            Quay lại đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return null;
}