import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

export default function Register() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/auth-bg.png`} className="w-full h-full object-cover opacity-60 transform scale-x-[-1]" alt="Nền" />
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

          {isSubmitted ? (
            <div className="text-center py-6 animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-2">Kiểm tra email của bạn</h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Vui lòng xác minh địa chỉ email để kích hoạt tài khoản. Kiểm tra thư mục spam nếu không thấy. Liên kết có hiệu lực trong 24 giờ.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full rounded-xl h-12">Quay lại đăng nhập</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-display font-bold text-center mb-2">Tham gia cùng chúng tôi</h1>
              <p className="text-center text-muted-foreground mb-8">Tạo tài khoản Second Life của bạn</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Họ và tên</label>
                  <Input required placeholder="Nguyễn Văn A" className="h-12 rounded-xl bg-white/50" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Email</label>
                  <Input required type="email" placeholder="ban@example.com" className="h-12 rounded-xl bg-white/50" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Mật khẩu</label>
                  <Input required type="password" placeholder="••••••••" className="h-12 rounded-xl bg-white/50" />
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-lg shadow-lg shadow-primary/20 mt-6">
                  Tạo tài khoản
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
