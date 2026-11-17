import { Link, useRouter } from "@tanstack/react-router";
import { type MouseEvent, useEffect, useState } from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import appIcon from "./app-icon.png";
import { leaveDelay, leavingHref, prefersReducedMotion } from "./intro-leave";

const stepClass =
  "transition-[opacity,translate] duration-slower ease-out-quint starting:opacity-0 motion-safe:starting:translate-y-1.5";

const stepDelay = [
  "delay-0",
  "delay-(--delay-intro-step)",
  "delay-[calc(var(--delay-intro-step)*2)]",
  "delay-[calc(var(--delay-intro-step)*3)]",
] as const;

const spotlight = {
  backgroundImage:
    "radial-gradient(ellipse 30rem 22rem at 50% 46%, var(--panel) 35%, color-mix(in oklch, var(--panel) 70%, transparent) 60%, transparent 100%)",
};

const panelStub = {
  background: "transparent",
  boxShadow: "0 0 0 100vmax var(--background), var(--sh-card)",
};

export type WelcomePageProps = {
  redirectUrl?: string;
};

export function WelcomePage({ redirectUrl }: WelcomePageProps) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    void router.preloadRoute({ to: "/sign-in", search: { email: undefined } });
  }, [router]);

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const href = leavingHref(event);
    if (href === undefined || prefersReducedMotion()) return;
    event.preventDefault();
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => router.history.push(href), leaveDelay());
  };

  return (
    <div
      data-leaving={leaving ? "" : undefined}
      onClickCapture={onClickCapture}
      className="group/intro relative isolate flex h-dvh w-full flex-col items-center justify-center bg-background pt-(--safe-top) pb-[8dvh]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          data-slot="fabric"
          aria-hidden
          className="pointer-events-none absolute inset-0"
        />
        <div
          className="absolute inset-0 transition-opacity duration-base ease-out group-data-[leaving]/intro:opacity-0"
          style={spotlight}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex pt-(--safe-top) opacity-0 transition-opacity duration-base ease-out group-data-[leaving]/intro:opacity-100"
      >
        <div className="min-w-0 flex-1 bg-background px-6" />
        <aside className="hidden min-w-0 flex-1 p-2 pl-0 lg:flex">
          <Card variant="panel" className="min-w-0 flex-1" style={panelStub} />
        </aside>
      </div>
      <div className="relative flex w-full max-w-96 flex-col items-center px-6 transition-opacity duration-fast ease-out group-data-[leaving]/intro:opacity-0">
        <div className={`${stepClass} ${stepDelay[0]}`}>
          <div className="size-16 rounded-[22.5%] shadow-(--sh-sheet)">
            <img
              src={appIcon}
              alt="Capy"
              draggable={false}
              className="size-16 select-none"
            />
          </div>
        </div>
        <h1
          className={`mt-7 max-w-72 text-center text-xl font-medium text-balance text-foreground ${stepClass} ${stepDelay[1]}`}
        >
          The best AI software engineer
        </h1>
        <div className={`mt-9 w-full ${stepClass} ${stepDelay[2]}`}>
          <Button
            data-track-owner="features/auth/welcome-page.tsx#WelcomePage:Button[Sign in]"
            variant="inverse"
            size="lg"
            className="w-full"
            render={
              <Link
                data-track-owner="features/auth/welcome-page.tsx#WelcomePage:Link.1"
                to="/sign-in"
                search={{ email: undefined }}
              />
            }
          >
            Sign in
          </Button>
        </div>
        <div className={`mt-4 ${stepClass} ${stepDelay[3]}`}>
          <div className="flex items-center justify-center gap-1 text-xs font-normal text-muted-foreground-2">
            New to Capy?
            <Button
              data-track-owner="features/auth/welcome-page.tsx#WelcomePage:Button[Create an account]"
              variant="link"
              size="auto-xs"
              className="text-foreground underline-offset-2 hover:underline"
              render={
                <Link
                  data-track-owner="features/auth/welcome-page.tsx#WelcomePage:Link.2"
                  to="/sign-up"
                  search={{
                    email: undefined,
                    redirect_url: redirectUrl,
                    continue: undefined,
                  }}
                />
              }
            >
              Create an account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
