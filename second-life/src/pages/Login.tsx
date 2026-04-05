import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email || "demo@user.com");
    setIsLoading(false);
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/auth-bg.png`} className="w-full h-full object-cover opacity-60" alt="Nền" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
      </div>

      <div className="w-full max-w-md m-auto relative z-10 p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 border shadow-2xl">
          
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary/20 p-2 rounded-xl">
                <img src={`${import.meta.env.BASE_URL}images/logo-leaf.png`} alt="Logo" className="w-8 h-8 object-contain" />
              </div>
            </Link>
          </div>

          <h1 className="text-3xl font-display font-bold text-center mb-2">Chào mừng trở lại</h1>
          <p className="text-center text-muted-foreground mb-8">Đăng nhập vào tài khoản Second Life của bạn</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Email</label>
              <Input 
                required 
                type="email" 
                placeholder="ban@example.com" 
                className="h-12 rounded-xl bg-white/50"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold">Mật khẩu</label>
                <a href="#" className="text-xs text-primary font-medium hover:underline">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <Input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-12 rounded-xl bg-white/50 pr-10"
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
