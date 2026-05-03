import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { UnverifiedEmailError, useAuth } from "@/context/AuthContext";
import { redirectToGoogleOAuth } from "@/api";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@workspace/api-client-react";

function readErrorCode(err: unknown): number | undefined {
  if (!(err instanceof ApiError) || err.data == null || typeof err.data !== "object") {
    return undefined;
  }
  const code = (err.data as { code?: unknown }).code;
  return typeof code === "number" ? code : undefined;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error");
    if (!oauthError) {
      return;
    }
    if (oauthError === "different_provider_login") {
      toast({
        title: "Đăng nhập bằng Google không khả dụng",
        description:
          "Bạn đã đăng ký tài khoản này với email và mật khẩu trên hệ thống. Hãy đăng nhập bằng mật khẩu hoặc dùng Quên mật khẩu nếu cần.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đăng nhập Google thất bại",
        description: "Đã có lỗi xảy ra. Vui lòng thử lại hoặc dùng email và mật khẩu.",
        variant: "destructive",
      });
    }
    params.delete("oauth_error");
    const qs = params.toString();
    const path = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    // window.history.replaceState({}, "", path);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const needsSetup = await login(email, password);
      setLocation(needsSetup ? "/profile/setup" : "/");
    } catch (error) {
      if (error instanceof UnverifiedEmailError) {
        toast({
          title: "Tài khoản chưa được xác thực",
          description:
            "Tài khoản của bạn chưa được xác thực. Mã xác thực đã được gửi đến email của bạn — vui lòng kiểm tra hộp thư (kể cả thư mục spam) và hoàn tất bước xác thực.",
        });
        return;
      }
      const code = readErrorCode(error);
      if (code === 1027) {
        toast({
          title: "Hãy đăng nhập bằng Google",
          description: "Tài khoản này được tạo với Google. Dùng nút “Đăng nhập bằng Gmail” bên trên.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Đăng nhập thất bại",
          description: error instanceof Error ? error.message : "Email hoặc mật khẩu không đúng.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    try {
      redirectToGoogleOAuth("login");
    } catch (error) {
      console.error("Google login failed:", error);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/auth-bg.png`} className="w-full h-full object-cover opacity-60" alt="Nền" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] dark:bg-black/55 dark:backdrop-blur-[2px]" aria-hidden />
      </div>

      <div className="w-full max-w-md m-auto relative z-10 p-4">
        <div className="rounded-[2rem] border border-border bg-card/85 p-8 text-card-foreground shadow-2xl backdrop-blur-xl dark:bg-card/90 sm:p-10">

          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary/20 p-2 rounded-xl">
                <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="Logo" className="w-8 h-8 object-contain" />
              </div>
            </Link>
          </div>

          <h1 className="text-3xl font-display font-bold text-center mb-2">Chào mừng trở lại</h1>
          <p className="text-center text-muted-foreground mb-8">Đăng nhập vào tài khoản Second Life của bạn</p>

          <div className="space-y-4 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-2 hover:bg-muted transition-colors"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isGoogleLoading ? "Đang đăng nhập..." : "Đăng nhập bằng Gmail"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">hoặc</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-1.5 block text-foreground">Email</label>
              <Input
                required
                type="email"
                placeholder="ban@example.com"
                className="h-12 rounded-xl bg-muted/50"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-foreground">Mật khẩu</label>
                <a href="#" className="text-xs text-primary font-medium hover:underline">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 rounded-xl bg-muted/50 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-lg shadow-lg shadow-primary/20 mt-4" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
