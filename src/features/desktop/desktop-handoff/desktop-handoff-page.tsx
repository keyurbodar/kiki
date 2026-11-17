import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { NotFoundPage } from "@/components/not-found-page";
import { Button } from "@/primitives/button";
import {
  AuthActions,
  AuthFooter,
  AuthFrame,
  authLinkClassName,
} from "../auth-frame";
import {
  canOpenDesktopApp,
  configuredDesktopScheme,
  DESKTOP_DOWNLOAD_URL,
  desktopAppUrl,
  HANDOFF_ATTEMPTED_KEY,
  HANDOFF_OPEN_DELAY,
  handoffTarget,
  isRoutablePath,
} from "./handoff";

export type DesktopHandoffPageProps = {
  to?: string;
  scheme?: string;
};

export function DesktopHandoffPage({ to, scheme }: DesktopHandoffPageProps) {
  const router = useRouter();
  const target = handoffTarget(to);
  const routable = isRoutablePath(target, (pathname) => {
    const [, routeParams, foundRoute] = router.getMatchedRoutes(pathname);
    return { routeParams, foundRoutePath: foundRoute?.path };
  });
  const resolvedScheme = scheme ?? configuredDesktopScheme;
  const canOpen = canOpenDesktopApp(target, {
    scheme: resolvedScheme,
    inDesktopApp: "capyDesktop" in window,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  });
  const appHref =
    canOpen && routable && resolvedScheme !== undefined
      ? desktopAppUrl(resolvedScheme, target)
      : undefined;

  useEffect(() => {
    if (!routable) return;
    try {
      window.sessionStorage.setItem(HANDOFF_ATTEMPTED_KEY, "1");
    } catch {}
    if (appHref === undefined) return;
    const timer = window.setTimeout(
      () => window.location.assign(appHref),
      HANDOFF_OPEN_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [appHref, routable]);

  if (!routable) return <NotFoundPage />;

  const opening = appHref !== undefined;
  return (
    <AuthFrame
      title={opening ? "Opening Capy" : "Desktop app unavailable"}
      subtitle={
        opening
          ? "If the app doesn't open, try again or continue in your browser"
          : "Continue in your browser to open this page"
      }
    >
      <AuthActions>
        {opening ? (
          <Button
            intent="accent"
            size="base"
            className="w-full"
            render={<a href={appHref}>Open desktop app</a>}
          />
        ) : null}
        <Button
          size="base"
          className="w-full"
          render={<a href={target}>Continue in browser</a>}
        />
      </AuthActions>
      {opening ? (
        <AuthFooter>
          Don't have the app?
          <a href={DESKTOP_DOWNLOAD_URL} className={authLinkClassName}>
            Download the desktop app
          </a>
        </AuthFooter>
      ) : null}
    </AuthFrame>
  );
}
