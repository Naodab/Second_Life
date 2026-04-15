export type GoogleOAuthEntry = "login" | "register";

export function appHref(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function redirectToGoogleOAuth(entry: GoogleOAuthEntry): void {
  const backend = (import.meta.env.VITE_BACKEND_URL || "http://localhost").replace(
    /\/$/,
    "",
  );
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const redirectUri = `${window.location.origin}${basePath}/oauth2/callback/google`;
  const url =
    `${backend}/api/v1/oauth2/authorize/google?redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&oauth_entry=${encodeURIComponent(entry)}`;
  window.location.href = url;
}
