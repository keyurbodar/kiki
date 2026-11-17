import { type ReactNode, useEffect } from "react";
import { CapyMark } from "@/components/capy-logo";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Icon } from "@/primitives/icon";
import type { CallbackOutcome, CallbackStatus } from "./callback-result";
import { browserLocation } from "./location";

export type CallbackSurfaceProps = {
  status: CallbackStatus;
  icon: ReactNode;
  provider: string;
  completingDescription: string;
  failedDescription?: string;
  returnHref: string;
  returnLabel?: string;
  desktopHref?: string;
  outcome?: CallbackOutcome;
};

export const desktopOpenDelay = 250;

export function callbackTitle(
  status: CallbackStatus,
  provider: string,
  outcome?: CallbackOutcome,
) {
  if (status === "completing") return `Connecting ${provider}`;
  if (status === "unknown_account") return "Signed in to a different account";
  if (status === "returning") {
    if (outcome === "denied") return `${provider} connection canceled`;
    if (outcome === "failed") return `${provider} connection failed`;
    return `${provider} connected`;
  }
  return `${provider} connection failed`;
}

export function CallbackSurface({
  status,
  icon,
  provider,
  completingDescription,
  failedDescription = "Return to settings and try connecting again",
  returnHref,
  returnLabel = `Return to ${provider} settings`,
  desktopHref,
  outcome,
}: CallbackSurfaceProps) {
  useEffect(() => {
    if (status !== "returning" || desktopHref === undefined) return;
    const timer = window.setTimeout(
      () => browserLocation.assign(desktopHref),
      desktopOpenDelay,
    );
    return () => window.clearTimeout(timer);
  }, [desktopHref, status]);

  const description =
    status === "completing"
      ? completingDescription
      : status === "unknown_account"
        ? `A different account started this ${provider} connection`
        : status === "returning"
          ? "Opening Capy, you can close this tab"
          : failedDescription;

  return (
    <main className="grid h-dvh place-items-center bg-background px-6 pt-(--safe-top) pb-(--safe-bottom)">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-4">
            <div className="grid size-10 place-items-center rounded-md bg-secondary">
              <CapyMark className="h-6" />
            </div>
            <Icon
              name="chain-link-2"
              size="sm"
              className="text-muted-foreground-3"
            />
            <div className="grid size-10 place-items-center rounded-md bg-secondary text-foreground [&_svg:not([class*='size-'])]:size-(--icon-lg)">
              {icon}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-medium text-foreground">
              {callbackTitle(status, provider, outcome)}
            </h1>
            <p className="text-sm font-normal text-muted-foreground-1">
              {description}
            </p>
          </div>
          {status === "completing" ? (
            <DotGridIcon
              size="sm"
              role="status"
              aria-hidden={false}
              aria-label={`Connecting ${provider}`}
            />
          ) : status === "unknown_account" ? (
            <Button
              data-track-owner="shared/callback-surface.tsx#CallbackSurface:Button[Switch account]"
              size="sm"
              onClick={() =>
                browserLocation.assign(
                  `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`,
                )
              }
            >
              Switch account
            </Button>
          ) : status === "returning" && desktopHref !== undefined ? (
            <Button
              data-track-owner="shared/callback-surface.tsx#CallbackSurface:Button[Open Capy]"
              size="sm"
              render={
                <a
                  data-track-owner="shared/callback-surface.tsx#CallbackSurface:a.1"
                  href={desktopHref}
                />
              }
            >
              Open Capy
            </Button>
          ) : (
            <Button
              data-track-owner="shared/callback-surface.tsx#CallbackSurface:Button.1"
              size="sm"
              render={
                <a
                  data-track-owner="shared/callback-surface.tsx#CallbackSurface:a.2"
                  href={returnHref}
                />
              }
            >
              {returnLabel}
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
