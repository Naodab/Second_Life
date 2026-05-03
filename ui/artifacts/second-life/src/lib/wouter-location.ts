export function rawQueryFromBrowserSearch(search: string): string {
  if (!search) return "";
  return search.startsWith("?") ? search.slice(1) : search;
}

export function pathStubForSearchQueryCompare(search: string): string {
  const q = rawQueryFromBrowserSearch(search);
  return q ? `/search?${q}` : "/search";
}

export function pathnameEndsWithSegment(pathname: string, segment: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length > 0 && parts[parts.length - 1] === segment;
}
