import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCurrentProfile,
  profileIsCompleteForSellerHub,
  profileNeedsSetup,
  updateCurrentProfile,
  type ProfilePayload,
} from "@/api";
import { sanitizeReturnTo } from "@/hooks/use-require-auth";
import { SELLER_HUB_HOME } from "@/lib/seller-hub-paths";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@workspace/api-client-react";

const vnPhoneRegex = /^(\+84|0)\d{9}$/;

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Bắt buộc")
  .refine((s) => vnPhoneRegex.test(s), {
    message: "Số điện thoại Việt Nam: +84 hoặc 0 và 9 chữ số",
  });

type ProfileField = "firstName" | "lastName" | "phoneNumber";

type FormValues = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

function readReturnToFromSearch(): string {
  const params = new URLSearchParams(window.location.search);
  return sanitizeReturnTo(params.get("returnTo"));
}

function missingProfileFields(profile: ProfilePayload, forSellerHub: boolean): ProfileField[] {
  const first = profile.firstName?.trim() ?? "";
  const last = profile.lastName?.trim() ?? "";
  const phone = profile.phoneNumber?.trim() ?? "";

  if (forSellerHub) {
    const missing: ProfileField[] = [];
    if (!first) missing.push("firstName");
    if (!last) missing.push("lastName");
    if (!phone || !vnPhoneRegex.test(phone)) missing.push("phoneNumber");
    return missing;
  }

  return first ? [] : ["firstName"];
}

function buildSchema(fields: ProfileField[]) {
  return z.object({
    firstName: fields.includes("firstName")
      ? z.string().trim().min(1, "Bắt buộc")
      : z.string().optional(),
    lastName: fields.includes("lastName")
      ? z.string().trim().min(1, "Bắt buộc")
      : z.string().optional(),
    phoneNumber: fields.includes("phoneNumber") ? phoneSchema : z.string().optional(),
  });
}

function profileStillIncomplete(profile: ProfilePayload, forSellerHub: boolean): boolean {
  return forSellerHub ? !profileIsCompleteForSellerHub(profile) : profileNeedsSetup(profile);
}

const FIELD_LABELS: Record<ProfileField, string> = {
  firstName: "tên",
  lastName: "họ",
  phoneNumber: "số điện thoại",
};

function ProfileSetupShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          className="w-full h-full object-cover opacity-60"
          alt="Nền"
        />
        <div
          className="absolute inset-0 bg-white/40 backdrop-blur-[2px] dark:bg-black/55 dark:backdrop-blur-[2px]"
          aria-hidden
        />
      </div>
      <div className="w-full max-w-md m-auto relative z-10 p-4">{children}</div>
    </div>
  );
}

function ProfileSetupForm({
  profile,
  missingFields,
  forSellerHub,
  returnTo,
  userEmail,
  onSaved,
  onNavigate,
}: {
  profile: ProfilePayload;
  missingFields: ProfileField[];
  forSellerHub: boolean;
  returnTo: string;
  userEmail?: string | null;
  onSaved: () => void;
  onNavigate: (path: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const schema = useMemo(() => buildSchema(missingFields), [missingFields]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: profile.firstName?.trim() ?? "",
      lastName: profile.lastName?.trim() ?? "",
      phoneNumber: profile.phoneNumber?.trim() ?? "",
    },
    mode: "onTouched",
  });

  const introText = useMemo(() => {
    if (forSellerHub) {
      const labels = missingFields.map((f) => FIELD_LABELS[f]);
      if (labels.length === 0) {
        return "Hoàn tất thông tin còn thiếu để vào khu vực quản lý.";
      }
      const joined =
        labels.length === 1
          ? labels[0]
          : labels.length === 2
            ? `${labels[0]} và ${labels[1]}`
            : `${labels.slice(0, -1).join(", ")} và ${labels[labels.length - 1]}`;
      return (
        <>
          Để vào <strong>khu vực quản lý</strong>, vui lòng bổ sung <strong>{joined}</strong>.
          {userEmail ? (
            <>
              {" "}
              Email tài khoản: <strong>{userEmail}</strong>.
            </>
          ) : null}
        </>
      );
    }
    return <>Vui lòng nhập tên để tiếp tục sử dụng ứng dụng.</>;
  }, [forSellerHub, missingFields, userEmail]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const body: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
      } = {};

      if (missingFields.includes("firstName")) {
        body.firstName = values.firstName.trim();
      }
      if (missingFields.includes("lastName")) {
        body.lastName = values.lastName.trim();
      }
      if (missingFields.includes("phoneNumber")) {
        body.phoneNumber = values.phoneNumber.trim();
      }

      await updateCurrentProfile(body);
      await onSaved();
      toast({
        title: "Đã lưu hồ sơ",
        description: forSellerHub
          ? "Bạn có thể vào khu vực quản lý bán hàng."
          : "Bạn có thể tiếp tục sử dụng ứng dụng.",
      });
      onNavigate(returnTo || (forSellerHub ? SELLER_HUB_HOME : "/"));
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

  return (
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

      <h1 className="text-3xl font-display font-bold text-center mb-2 text-foreground">Hoàn tất hồ sơ</h1>
      <p className="text-center text-muted-foreground mb-8">{introText}</p>

      <form onSubmit={onSubmit} className="space-y-5">
        {missingFields.includes("lastName") && (
          <div>
            <label htmlFor="lastName" className="text-sm font-semibold mb-1.5 block text-foreground">
              Họ <span className="text-destructive">*</span>
            </label>
            <Input
              id="lastName"
              autoComplete="family-name"
              className="h-12 rounded-xl bg-muted/50"
              {...form.register("lastName")}
            />
            {form.formState.errors.lastName && (
              <p className="text-sm text-destructive mt-1.5">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        )}

        {missingFields.includes("firstName") && (
          <div>
            <label htmlFor="firstName" className="text-sm font-semibold mb-1.5 block text-foreground">
              Tên <span className="text-destructive">*</span>
            </label>
            <Input
              id="firstName"
              autoComplete="given-name"
              className="h-12 rounded-xl bg-muted/50"
              {...form.register("firstName")}
            />
            {form.formState.errors.firstName && (
              <p className="text-sm text-destructive mt-1.5">{form.formState.errors.firstName.message}</p>
            )}
          </div>
        )}

        {missingFields.includes("phoneNumber") && (
          <div>
            <label htmlFor="phoneNumber" className="text-sm font-semibold mb-1.5 block text-foreground">
              Số điện thoại <span className="text-destructive">*</span>
            </label>
            <Input
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              placeholder="+84901234567 hoặc 0901234567"
              className="h-12 rounded-xl bg-muted/50"
              {...form.register("phoneNumber")}
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-sm text-destructive mt-1.5">{form.formState.errors.phoneNumber.message}</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 rounded-xl text-lg shadow-lg shadow-primary/20 mt-4"
          disabled={submitting || missingFields.length === 0}
        >
          {submitting ? "Đang lưu…" : forSellerHub ? "Lưu và vào quản lý" : "Lưu và tiếp tục"}
        </Button>
      </form>
    </div>
  );
}

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, isLoading, isAdmin, needsProfileSetup, sellerHubProfileComplete, user, refreshSessionProfile } =
    useAuth();
  const returnTo = useMemo(() => readReturnToFromSearch(), []);
  const forSellerHub = returnTo.startsWith("/manage");

  const mustCompleteForm =
    !isAdmin && (needsProfileSetup || (forSellerHub && !sellerHubProfileComplete));

  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !isLoggedIn) {
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    void (async () => {
      try {
        const loaded = await getCurrentProfile();
        if (!cancelled) setProfile(loaded);
      } catch {
        if (!cancelled && user?.email) {
          setProfile({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: null,
          });
        } else if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isLoggedIn, user]);

  const missingFields = useMemo(
    () => (profile ? missingProfileFields(profile, forSellerHub) : []),
    [profile, forSellerHub],
  );

  useEffect(() => {
    if (isLoading || profileLoading) {
      return;
    }
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    if (!mustCompleteForm) {
      setLocation(returnTo || "/");
      return;
    }
    if (profile && !profileStillIncomplete(profile, forSellerHub)) {
      setLocation(returnTo || "/");
    }
  }, [
    isLoading,
    profileLoading,
    isLoggedIn,
    mustCompleteForm,
    profile,
    forSellerHub,
    returnTo,
    setLocation,
  ]);

  if (isLoading || !isLoggedIn || !mustCompleteForm || profileLoading || !profile) {
    return (
      <ProfileSetupShell>
        <div className="rounded-[2rem] border border-border bg-card/85 p-8 text-card-foreground shadow-2xl backdrop-blur-xl dark:bg-card/90 sm:p-10 flex justify-center items-center min-h-[120px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </ProfileSetupShell>
    );
  }

  return (
    <ProfileSetupShell>
      <ProfileSetupForm
        key={missingFields.join("-")}
        profile={profile}
        missingFields={missingFields}
        forSellerHub={forSellerHub}
        returnTo={returnTo}
        userEmail={user?.email}
        onSaved={refreshSessionProfile}
        onNavigate={setLocation}
      />
    </ProfileSetupShell>
  );
}
