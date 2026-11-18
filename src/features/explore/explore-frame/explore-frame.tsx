import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CapyLogo } from "@/components/capy-logo";
import { Button, type ButtonVariants } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { SidebarTriggerRail } from "@/primitives/sidebar";
import { useExploreSession } from "../theme-visibility";

export type ExploreCrumb = { readonly label: string; readonly to?: string };

export type ExploreCrumbsProps = { crumbs: ReadonlyArray<ExploreCrumb> };

export function ExploreCrumbs({ crumbs }: ExploreCrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1 pl-2.5"
    >
      {crumbs.map((crumb, index) => (
        <span key={crumb.label} className="flex min-w-0 items-center gap-1">
          {index > 0 && (
            <Icon
              name="chevron-right"
              size="sm"
              className="shrink-0 text-icon-muted"
            />
          )}
          {crumb.to === undefined ? (
            <span className="truncate text-sm font-medium text-foreground">
              {crumb.label}
            </span>
          ) : (
            <Link
              data-track-owner="features/explore/explore-frame.tsx#Crumbs:Link.1"
              to={crumb.to}
              className="shrink-0 rounded text-sm font-medium text-muted-foreground-1 outline-none transition-colors duration-100 hover:text-foreground focus-visible:outline-ring-inset"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export type ExploreFrameProps = {
  crumbs: ReadonlyArray<ExploreCrumb>;
  trailing?: ReactNode;
};

export function ExploreFrame({ crumbs, trailing }: ExploreFrameProps) {
  const { signedIn } = useExploreSession();
  if (!signedIn && crumbs.length < 2) return null;
  return (
    <header className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-(length:--border-width-hairline) border-border-1 bg-panel px-2">
      <SidebarTriggerRail tight={false} />
      <div className="flex min-w-0 flex-1 items-center pl-2">
        <ExploreCrumbs crumbs={crumbs} />
      </div>
      {trailing !== undefined && (
        <div className="ml-auto flex items-center pl-2">{trailing}</div>
      )}
    </header>
  );
}

export type SignInLinkProps = ButtonVariants & {
  readonly className?: string;
  readonly children: ReactNode;
};

export function SignInLink({
  variant = "solid",
  size = "sm",
  className,
  children,
}: SignInLinkProps) {
  return (
    <Button
      data-track-owner="features/explore/explore-frame.tsx#SignInLink:Button.1"
      variant={variant}
      size={size}
      className={className}
      render={
        <Link
          data-track-owner="features/explore/explore-frame.tsx#SignInLink:Link.1"
          to="/sign-in"
        />
      }
    >
      {children}
    </Button>
  );
}

function SignedOutFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background pt-(--safe-top)">
      <header className="flex h-12 shrink-0 items-center gap-2 px-4">
        <Link
          data-track-owner="features/explore/explore-frame.tsx#SignedOutFrame:Link[Capy]"
          to="/explore"
          className="flex items-center gap-2 rounded text-sm font-medium text-foreground outline-none focus-visible:outline-ring-inset"
        >
          <CapyLogo className="h-5" />
          Capy
        </Link>
        <span className="text-sm text-muted-foreground-3">/</span>
        <Link
          data-track-owner="features/explore/explore-frame.tsx#SignedOutFrame:Link[Explore]"
          to="/explore"
          className="rounded text-sm font-medium text-foreground outline-none focus-visible:outline-ring-inset"
        >
          Explore
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <SignInLink variant="ghost">Sign in</SignInLink>
          <Button
            data-track-owner="features/explore/explore-frame.tsx#SignedOutFrame:Button[Sign up]"
            variant="inverse"
            size="sm"
            render={
              <Link
                data-track-owner="features/explore/explore-frame.tsx#SignedOutFrame:Link.1"
                to="/sign-up"
              />
            }
          >
            Sign up
          </Button>
        </div>
      </header>
      <Card variant="panel" className="isolate mb-2 min-h-0 flex-1 md:mx-2">
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto pb-(--safe-bottom)">
          {children}
        </main>
      </Card>
    </div>
  );
}

export type ExploreFrameProviderProps = { readonly children: ReactNode };

/**
 * Capy renders the public Explore chrome only when nobody is signed in; inside
 * the app shell the page draws straight into the existing panel.
 */
export function ExploreFrameProvider({ children }: ExploreFrameProviderProps) {
  const { signedIn } = useExploreSession();
  if (signedIn) return <>{children}</>;
  return <SignedOutFrame>{children}</SignedOutFrame>;
}
