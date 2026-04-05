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

export async function getProfileById(id: string): Promise<ProfilePayload> {
  const raw = await customFetch<ApiResponseEnvelope<ProfilePayload>>(
    `/api/v1/profiles/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
  return unwrapApiData(raw);
}

export async function getCurrentProfile(): Promise<ProfilePayload> {
  const raw = await customFetch<ApiResponseEnvelope<ProfilePayload>>(`/api/v1/profiles/me`, {
    method: "GET",
  });
  return unwrapApiData(raw);
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

export function profileNeedsSetup(profile: Pick<ProfilePayload, "firstName">): boolean {
  const fn = profile.firstName?.trim();
  return !fn;
}
