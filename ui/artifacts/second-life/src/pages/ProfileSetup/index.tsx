import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCurrentProfile } from "@/api";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@workspace/api-client-react";

const schema = z.object({
  firstName: z
    .string()
    .min(1, "Bắt buộc"),
  lastName: z
    .string()
    .min(1, "Bắt buộc"),
  phoneNumber: z
    .string()
    .optional()
    .transform((s) => s?.trim() ?? "")
    .refine((s) => s === "" || /^(\+84|0)\d{9}$/.test(s), {
      message: "Số điện thoại Việt Nam: +84 hoặc 0 và 9 chữ số",
    }),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, isLoading, needsProfileSetup, refreshSessionProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", phoneNumber: "" },
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    if (!needsProfileSetup) {
      setLocation("/");
    }
  }, [isLoading, isLoggedIn, needsProfileSetup, setLocation]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await updateCurrentProfile({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        ...(values.phoneNumber ? { phoneNumber: values.phoneNumber.trim() } : {}),
      });
      await refreshSessionProfile();
      toast({ title: "Đã lưu hồ sơ", description: "Bạn có thể tiếp tục sử dụng ứng dụng." });
      setLocation("/");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không thể cập nhật hồ sơ.";
      toast({ title: "Cập nhật thất bại", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  });

  if (isLoading || !isLoggedIn || !needsProfileSetup) {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
            className="w-full h-full object-cover opacity-60"
            alt="Nền"
          />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        </div>
        <div className="w-full max-w-md m-auto relative z-10 p-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 border shadow-2xl flex justify-center items-center min-h-[120px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          className="w-full h-full object-cover opacity-60"
          alt="Nền"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
      </div>

      <div className="w-full max-w-md m-auto relative z-10 p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 border shadow-2xl">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary/20 p-2 rounded-xl">
                <img
                  src={`${import.meta.env.BASE_URL}images/logo-leaf.png`}
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
            </Link>
          </div>

          <h1 className="text-3xl font-display font-bold text-center mb-2">Hoàn tất hồ sơ</h1>
          <p className="text-center text-muted-foreground mb-8">
            Vui lòng nhập họ và tên để tiếp tục. Thông tin này dùng hiển thị trên tài khoản của bạn.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="firstName" className="text-sm font-semibold mb-1.5 block">
                Tên
              </label>
              <Input
                id="firstName"
                autoComplete="given-name"
                className="h-12 rounded-xl bg-white/50"
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive mt-1.5">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="text-sm font-semibold mb-1.5 block">
                Họ
              </label>
              <Input
                id="lastName"
                autoComplete="family-name"
                className="h-12 rounded-xl bg-white/50"
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive mt-1.5">{form.formState.errors.lastName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="phoneNumber" className="text-sm font-semibold mb-1.5 block">
                Số điện thoại (tùy chọn)
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+84901234567 hoặc 0901234567"
                className="h-12 rounded-xl bg-white/50"
                {...form.register("phoneNumber")}
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-destructive mt-1.5">{form.formState.errors.phoneNumber.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-lg shadow-lg shadow-primary/20 mt-4"
              disabled={submitting}
            >
              {submitting ? "Đang lưu…" : "Lưu và tiếp tục"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
