/**
 * Spring Security OAuth2 login (authservice): GET /api/v1/oauth2/authorize/google
 * with redirect_uri whitelisted in app.oauth2.authorized-redirect-uris.
 * After Google, backend redirects here with ?token=&refresh_token= (not ?code=).
 */
export function redirectToGoogleOAuth(): void {
  const backend = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8080").replace(
    /\/$/,
    "",
  );
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const redirectUri = `${window.location.origin}${basePath}/oauth2/callback/google`;
  const url = `${backend}/api/v1/oauth2/authorize/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
  window.location.href = url;
}
