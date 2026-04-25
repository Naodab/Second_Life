type SearchParamValue = string | string[] | undefined | null;

/**
 * Build `/search` path with merged query params (current window search + updates).
 * Array values use repeated keys (e.g. `categoryIds=a&categoryIds=b`, `subCategoryIds=…`) for Spring `List<String>` binding.
 */
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

/**
 * Build `/search` from scratch (does not merge current page query). Use from non-search routes.
 */
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
