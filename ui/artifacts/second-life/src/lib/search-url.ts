type SearchParamValue = string | string[] | undefined | null;

function paramsFromSearchString(search: string): URLSearchParams {
  const s = search.trim();
  const raw = s.startsWith("?") ? s.slice(1) : s;
  return new URLSearchParams(raw || "");
}

export function buildSearchPath(
  updates: Record<string, SearchParamValue>,
  currentSearch?: string | null,
): string {
  let p: URLSearchParams;
  if (currentSearch !== undefined && currentSearch !== null) {
    p = paramsFromSearchString(currentSearch);
  } else if (typeof window !== "undefined") {
    p = paramsFromSearchString(window.location.search);
  } else {
    p = new URLSearchParams();
  }
  for (const [key, value] of Object.entries(updates)) {
    const baseKey = key.endsWith("[]") ? key.slice(0, -2) : key;
    const arrayKey = `${baseKey}[]`;
    if (value === undefined) continue;
    if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
      p.delete(baseKey);
      p.delete(arrayKey);
      continue;
    }
    if (Array.isArray(value)) {
      p.delete(baseKey);
      p.delete(arrayKey);
      for (const v of value) {
        if (v) p.append(arrayKey, v);
      }
    } else {
      p.delete(arrayKey);
      p.set(baseKey, value);
    }
  }
  const q = p.toString();
  return q ? `/search?${q}` : "/search";
}

export function buildFreshSearchPath(updates: Record<string, SearchParamValue>): string {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(updates)) {
    const baseKey = key.endsWith("[]") ? key.slice(0, -2) : key;
    const arrayKey = `${baseKey}[]`;
    if (value === undefined) continue;
    if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v) p.append(arrayKey, v);
      }
    } else {
      p.set(baseKey, value);
    }
  }
  const q = p.toString();
  return q ? `/search?${q}` : "/search";
}

export function searchPathsQueryEqual(a: string, b: string): boolean {
  const qa = a.includes("?") ? (a.split("?")[1] ?? "") : "";
  const qb = b.includes("?") ? (b.split("?")[1] ?? "") : "";
  return canonicalQueryString(qa) === canonicalQueryString(qb);
}

/** Map legacy / duplicate query keys to one canonical name (prevents URL sync loops). */
function canonicalParamKey(rawKey: string): string {
  const key = rawKey.replace(/\[\]$/, "");
  switch (key) {
    case "WardCode":
    case "ward":
      return "wardCode";
    case "province":
      return "provinceCode";
    case "type":
      return "listingType";
    case "q":
      return "keyword";
    case "categoryIds":
    case "categoryId":
      return "categoryId";
    case "subCategoryIds":
    case "subCategoryId":
      return "subCategoryId";
    default:
      return key;
  }
}

function canonicalParamValue(key: string, value: string): string {
  if (key === "listingType") {
    const t = value.trim().toLowerCase();
    if (t === "buy" || t === "rent") return t;
    const u = value.trim().toUpperCase();
    if (u === "BUY") return "buy";
    if (u === "RENT") return "rent";
  }
  return value.trim();
}

function canonicalQueryString(q: string): string {
  const p = new URLSearchParams(q);
  const merged = new Map<string, string>();
  for (const [rawKey, rawValue] of p.entries()) {
    const key = canonicalParamKey(rawKey);
    const value = canonicalParamValue(key, rawValue);
    if (!value) continue;
    merged.set(key, value);
  }
  // Default sort is omitted from desired paths; treat explicit default as absent.
  if (merged.get("sortBy") === "UPDATED_AT_DESC") {
    merged.delete("sortBy");
  }
  const keys = [...merged.keys()].sort();
  const out = new URLSearchParams();
  for (const k of keys) {
    out.set(k, merged.get(k)!);
  }
  return out.toString();
}
