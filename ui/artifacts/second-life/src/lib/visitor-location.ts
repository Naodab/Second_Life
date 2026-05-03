const STORAGE_KEY = "secondlife.visitorLocation";
const PROMPT_DONE_KEY = "secondlife.locationPromptV1";

export type VisitorLocationPayload = {
  provinceCode: string | null;
  wardCode: string | null;
  latitude: number;
  longitude: number;
  source: "browser" | "ip";
};

export function loadVisitorLocation(): VisitorLocationPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VisitorLocationPayload>;
    const lat = Number(parsed.latitude);
    const lon = Number(parsed.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      provinceCode: parsed.provinceCode?.trim() || null,
      wardCode: parsed.wardCode?.trim() || null,
      latitude: lat,
      longitude: lon,
      source: parsed.source === "browser" ? "browser" : "ip",
    };
  } catch {
    return null;
  }
}

export function persistVisitorLocation(payload: VisitorLocationPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function isLocationConsentPromptDone(): boolean {
  try {
    return sessionStorage.getItem(PROMPT_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLocationConsentPromptDone(): void {
  try {
    sessionStorage.setItem(PROMPT_DONE_KEY, "1");
  } catch {
    /* ignore */
  }
}
