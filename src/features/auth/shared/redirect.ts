export const defaultRedirect = "/new";

export const safeRedirect = (url: string | undefined): string =>
  url?.startsWith("/") && !url.startsWith("//") ? url : defaultRedirect;

export const ssoCallbackUrl = (
  path: "/sign-in/sso-callback" | "/sign-up/sso-callback",
  redirectTo: string,
) => `${path}?redirect_url=${encodeURIComponent(redirectTo)}`;
