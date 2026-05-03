type SearchParamValue = string | string[] | undefined | null;

export function buildSearchPath(updates: Record<string, SearchParamValue>): string {
  const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
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

function canonicalQueryString(q: string): string {
  const p = new URLSearchParams(q);
  const keys = [...new Set([...p.keys()])].sort();
  const out = new URLSearchParams();
  for (const k of keys) {
    for (const v of [...p.getAll(k)].sort()) {
      out.append(k, v);
    }
  }
  return out.toString();
}
