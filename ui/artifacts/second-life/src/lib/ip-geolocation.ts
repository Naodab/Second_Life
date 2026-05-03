export async function approximateCoordsFromIp(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { credentials: "omit" });
    if (!res.ok) return null;
    const j = (await res.json()) as { latitude?: unknown; longitude?: unknown };
    const lat = Number(j.latitude);
    const lon = Number(j.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { latitude: lat, longitude: lon };
  } catch {
    return null;
  }
}
