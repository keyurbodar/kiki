const LOCAL_ORIGIN = "https://capy.local";
const FALLBACK_PATH = "/new";

export const DESKTOP_DOWNLOAD_URL = "https://capy.ai/download";
export const HANDOFF_ATTEMPTED_KEY = "capy-web:desktop-handoff-attempted";
export const HANDOFF_OPEN_DELAY = 250;

const DESKTOP_SCHEMES = new Set([
  "capy",
  "capy-nightly",
  "capy-staging",
  "capy-preview",
]);

export function handoffTarget(value: unknown): string {
  if (typeof value !== "string" || !URL.canParse(value, LOCAL_ORIGIN)) {
    return FALLBACK_PATH;
  }
  const url = new URL(value, LOCAL_ORIGIN);
  if (
    url.origin !== LOCAL_ORIGIN ||
    url.pathname === "/" ||
    url.pathname === "/desktop"
  ) {
    return FALLBACK_PATH;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function desktopScheme(value: unknown): string | undefined {
  return typeof value === "string" && DESKTOP_SCHEMES.has(value)
    ? value
    : undefined;
}

export const configuredDesktopScheme = desktopScheme(
  import.meta.env.VITE_DESKTOP_SCHEME,
);

export type RouteMatch = {
  routeParams: Record<string, string>;
  foundRoutePath: string | undefined;
};

export function isRoutablePath(
  path: string,
  match: (pathname: string) => RouteMatch,
): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  const { routeParams, foundRoutePath } = match(
    new URL(path, LOCAL_ORIGIN).pathname,
  );
  return (
    foundRoutePath !== undefined &&
    foundRoutePath !== "$" &&
    (foundRoutePath === "/" || !routeParams["**"])
  );
}

export type DesktopEnvironment = {
  scheme: string | undefined;
  inDesktopApp: boolean;
  platform: string;
  maxTouchPoints: number;
};

export function canOpenDesktopApp(path: string, env: DesktopEnvironment) {
  return (
    env.scheme !== undefined &&
    !env.inDesktopApp &&
    !/^\/admin(?:\/|$)/i.test(new URL(path, LOCAL_ORIGIN).pathname) &&
    /mac/i.test(env.platform) &&
    env.maxTouchPoints < 2
  );
}

export function desktopAppUrl(scheme: string, target: string) {
  return `${scheme}://app${handoffTarget(target)}`;
}
