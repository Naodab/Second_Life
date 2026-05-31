import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type ProfilePayload = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
};

export function normalizeProfilePayload(raw: unknown): ProfilePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const id = String(p.id ?? "").trim();
  const email = String(p.email ?? "").trim();
  if (!id || !email) return null;
  return {
    id,
    email,
    firstName: (p.firstName ?? p.first_name ?? null) as string | null,
    lastName: (p.lastName ?? p.last_name ?? null) as string | null,
    phoneNumber: (p.phoneNumber ?? p.phone_number ?? null) as string | null,
    avatarUrl: (p.avatarUrl ?? p.avatar_url ?? null) as string | null,
  };
}

export async function getProfileById(id: string): Promise<ProfilePayload> {
  const raw = await customFetch<ApiResponseEnvelope<unknown>>(
    `/api/v1/profiles/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
  const data = normalizeProfilePayload(unwrapApiData(raw));
  if (!data) {
    throw new Error("Không đọc được hồ sơ chủ sản phẩm.");
  }
  return data;
}

export async function getCurrentProfile(): Promise<ProfilePayload> {
  const raw = await customFetch<ApiResponseEnvelope<unknown>>(`/api/v1/profiles/me`, {
    method: "GET",
  });
  const data = normalizeProfilePayload(unwrapApiData(raw));
  if (!data) {
    throw new Error("Không đọc được hồ sơ.");
  }
  return data;
}

export type ProfileUpdateBody = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
};

export async function updateProfile(id: string, body: ProfileUpdateBody): Promise<ProfilePayload> {
  const raw = await customFetch<ApiResponseEnvelope<ProfilePayload>>(
    `/api/v1/profiles/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return unwrapApiData(raw);
}

export async function updateCurrentProfile(body: ProfileUpdateBody): Promise<ProfilePayload> {
  const raw = await customFetch<ApiResponseEnvelope<ProfilePayload>>(`/api/v1/profiles/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrapApiData(raw);
}

const vnPhoneRegex = /^(\+84|0)\d{9}$/;

export function profileNeedsSetup(profile: Pick<ProfilePayload, "firstName">): boolean {
  const fn = profile.firstName?.trim();
  return !fn;
}

export function profileIsCompleteForSellerHub(
  profile: Pick<ProfilePayload, "firstName" | "lastName" | "phoneNumber" | "email">,
): boolean {
  const first = profile.firstName?.trim();
  const last = profile.lastName?.trim();
  const phone = profile.phoneNumber?.trim();
  const email = profile.email?.trim();
  return Boolean(first && last && email && phone && vnPhoneRegex.test(phone));
}

export function profileDisplayName(profile: Pick<ProfilePayload, "firstName" | "lastName" | "email">): string {
  const display = [profile.lastName?.trim(), profile.firstName?.trim()].filter(Boolean).join(" ");
  return display || profile.email.split("@")[0] || profile.email;
}

export function profileFullNameParts(profile: Pick<ProfilePayload, "firstName" | "lastName">) {
  return {
    lastName: profile.lastName?.trim() ?? "",
    firstName: profile.firstName?.trim() ?? "",
  };
}
