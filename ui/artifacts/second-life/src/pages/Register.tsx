import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { ApiError, registerWithEmailPassword, redirectToGoogleOAuth } from "@/api";
import { toast } from "@/hooks/use-toast";

function readErrorCode(err: unknown): number | undefined {
  if (!(err instanceof ApiError) || err.data == null || typeof err.data !== "object") {
    return undefined;
  }
  const code = (err.data as { code?: unknown }).code;
  return typeof code === "number" ? code : undefined;
}

export default function Register() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauth_error");
    if (!oauthError) {
      return;
    }
    if (oauthError === "different_provider_register") {
      toast({
        title: "Đăng ký bằng Google không khả dụng",
        description:
          "Email này đã được đăng ký bằng tài khoản và mật khẩu. Hãy đăng nhập hoặc dùng Quên mật khẩu nếu cần.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đăng ký Google thất bại",
        description: "Đã có lỗi xảy ra. Vui lòng thử lại hoặc đăng ký bằng email.",
        variant: "destructive",
      });
    }
    params.delete("oauth_error");
    const qs = params.toString();
    const path = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", path);
  }, []);

  const handleGoogleRegister = () => {
    setIsGoogleLoading(true);
    try {
      redirectToGoogleOAuth("register");
    } catch (e) {
      console.error("Google register redirect failed:", e);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Mật khẩu không khớp",
        description: "Vui lòng nhập lại mật khẩu xác nhận giống mật khẩu.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await registerWithEmailPassword({ email, password });
      setIsSubmitted(true);
    } catch (err) {
      const code = readErrorCode(err);
      if (code === 1026) {
        toast({
          title: "Email đã dùng với Google",
          description:
            "Địa chỉ này đã đăng ký bằng Google. Hãy đăng nhập bằng Google ở trang đăng nhập.",
          variant: "destructive",
        });
      } else if (code === 1011) {
        toast({
          title: "Email đã được dùng",
          description: "Tài khoản với email này đã tồn tại. Bạn có thể đăng nhập hoặc dùng Quên mật khẩu.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Đăng ký không thành công",
          description: err instanceof Error ? err.message : "Đã có lỗi xảy ra.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          className="w-full h-full object-cover opacity-60 transform scale-x-[-1]"
          alt="Nền"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] dark:bg-black/55 dark:backdrop-blur-[2px]" aria-hidden />
      </div>

      <div className="w-full max-w-md m-auto relative z-10 p-4">
        <div className="rounded-[2rem] border border-border bg-card/85 p-8 text-card-foreground shadow-2xl backdrop-blur-xl dark:bg-card/90 sm:p-10">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary/20 p-2 rounded-xl">
                <img
                  src={`${import.meta.env.BASE_URL}favicon.png`}
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
            </Link>
          </div>

          {isSubmitted ? (
            <div className="text-center py-6 animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Kiểm tra email của bạn</h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Vui lòng xác minh địa chỉ email để kích hoạt tài khoản. Kiểm tra thư mục spam nếu không thấy. Liên kết
                có hiệu lực trong 24 giờ.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full rounded-xl h-12">
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-display font-bold text-center mb-2">Tham gia cùng chúng tôi</h1>
              <p className="text-center text-muted-foreground mb-8">
                Tạo tài khoản Second Life bằng Google hoặc email
              </p>

              <div className="space-y-4 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 hover:bg-muted transition-colors"
                  onClick={handleGoogleRegister}
                  disabled={isGoogleLoading}
                >
                  <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isGoogleLoading ? "Đang chuyển tới Google..." : "Đăng ký với Google"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">hoặc email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block text-foreground">Email</label>
                  <Input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="ban@example.com"
                    className="h-12 rounded-xl bg-muted/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block text-foreground">Mật khẩu</label>
                  <Input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="••••••••"
                    className="h-12 rounded-xl bg-muted/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tối thiểu 6 ký tự.</p>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block text-foreground">Xác nhận mật khẩu</label>
                  <Input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="••••••••"
                    className="h-12 rounded-xl bg-muted/50"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-lg shadow-lg shadow-primary/20 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
