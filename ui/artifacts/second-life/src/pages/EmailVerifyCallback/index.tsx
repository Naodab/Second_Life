import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { appHref } from "@/api";

export default function EmailVerifyCallback() {
  const [, setLocation] = useLocation();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const handledRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (handledRef.current) {
        return;
      }
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get("token");
        const refreshToken = urlParams.get("refresh_token");

        if (!accessToken || !refreshToken) {
          setError("Liên kết xác minh không hợp lệ hoặc đã hết hạn.");
          setIsLoading(false);
          return;
        }

        handledRef.current = true;
        const needsSetup = await loginWithGoogle(accessToken, refreshToken);
        const path = needsSetup ? appHref("/profile/setup") : appHref("/");
        window.location.replace(`${window.location.origin}${path}`);
      } catch (e) {
        handledRef.current = false;
        console.error("Email verification callback failed:", e);
        toast({
          title: "Xác minh email thất bại",
          description: "Không thể hoàn tất đăng nhập. Thử đăng nhập thủ công.",
          variant: "destructive",
        });
        setError("Không thể hoàn tất xác minh email.");
        setIsLoading(false);
      }
    };

    void run();
  }, [loginWithGoogle]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang xác minh email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Xác minh thất bại</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => setLocation("/login")} className="w-full">
            Đến trang đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
