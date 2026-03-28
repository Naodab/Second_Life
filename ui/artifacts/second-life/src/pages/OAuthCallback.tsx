import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('token');
        const refreshToken = urlParams.get('refresh_token');
        const err = urlParams.get('error');

        if (err) {
          setError(`OAuth error: ${err}`);
          setIsLoading(false);
          return;
        }

        if (!accessToken || !refreshToken) {
          setError('Không nhận được token từ máy chủ đăng nhập');
          setIsLoading(false);
          return;
        }

        await loginWithGoogle(accessToken, refreshToken);
        const path = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;
        window.history.replaceState({}, '', path);
        setLocation('/');
      } catch (callbackErr) {
        console.error('OAuth callback failed:', callbackErr);
        setError('Failed to complete authentication');
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [loginWithGoogle, setLocation]);

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