import type { ListingSuggestionResponse } from "@/api/listing";

const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const SESSION_KEY_PREFIX = "slfe_sug_";
const DEFAULT_LIMIT = 8;

interface CacheEntry {
  data: ListingSuggestionResponse[];
  expires: number;
}

const memCache = new Map<string, CacheEntry>();

function normalizeKey(keyword: string): string {
  return keyword.trim().toLowerCase();
}

function isExpired(entry: CacheEntry): boolean {
  return entry.expires <= Date.now();
}

function readFromSession(key: string): ListingSuggestionResponse[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (isExpired(entry)) {
      sessionStorage.removeItem(SESSION_KEY_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeToSession(key: string, entry: CacheEntry): void {
  try {
    sessionStorage.setItem(SESSION_KEY_PREFIX + key, JSON.stringify(entry));
  } catch {
  }
}

export function getSuggestionCached(keyword: string): ListingSuggestionResponse[] | null {
  const key = normalizeKey(keyword);

  const mem = memCache.get(key);
  if (mem) {
    if (!isExpired(mem)) return mem.data;
    memCache.delete(key);
  }

  const session = readFromSession(key);
  if (session !== null) {
    const entry: CacheEntry = { data: session, expires: Date.now() + CACHE_TTL_MS };
    memCache.set(key, entry);
    return session;
  }

  return null;
}

export function setSuggestionCached(keyword: string, data: ListingSuggestionResponse[]): void {
  const key = normalizeKey(keyword);
  const entry: CacheEntry = { data, expires: Date.now() + CACHE_TTL_MS };
  memCache.set(key, entry);
  writeToSession(key, entry);
}

export function getSuggestionFromPrefix(
  keyword: string,
  limit = DEFAULT_LIMIT,
): ListingSuggestionResponse[] | null {
  const lower = normalizeKey(keyword);

  const direct = getSuggestionCached(lower);
  if (direct !== null) return direct;

  let bestMatch: { key: string; data: ListingSuggestionResponse[] } | null = null;

  for (const [key, entry] of memCache) {
    if (isExpired(entry)) {
      memCache.delete(key);
      continue;
    }
    if (
      lower.startsWith(key) &&
      key.length < lower.length &&
      entry.data.length < limit
    ) {
      if (!bestMatch || key.length > bestMatch.key.length) {
        bestMatch = { key, data: entry.data };
      }
    }
  }

  if (bestMatch) {
    const filtered = bestMatch.data.filter((item) =>
      item.title.toLowerCase().includes(lower),
    );
    setSuggestionCached(lower, filtered);
    return filtered;
  }

  return null;
}
