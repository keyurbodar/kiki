import { Link } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { SurfaceCard, useIsDesktopApp } from "@/components/crash-surface";
import { Button } from "@/primitives/button";

export type MissingCardProps = {
  title: ReactNode;
  summary: ReactNode;
};

export function MissingCard({ title, summary }: MissingCardProps) {
  return (
    <div className="grid size-full min-h-64 place-items-center p-6">
      <SurfaceCard
        title={title}
        summary={summary}
        actions={
          <Button
            variant="solid"
            intent="accent"
            size="sm"
            render={<Link to="/new" />}
          >
            Back to Capy
          </Button>
        }
      />
    </div>
  );
}

export function NotFoundCard() {
  return (
    <MissingCard
      title="404 Page not found"
      summary="This page doesn't exist, or you don't have access to it. If someone sent you this link, ask them to share it with you."
    />
  );
}

export type NotFoundPageProps = ComponentProps<"main">;

export function NotFoundPage({ className, ...props }: NotFoundPageProps) {
  const desktop = useIsDesktopApp();
  return (
    <main
      {...props}
      className={cx(
        "grid h-dvh w-full place-items-center overflow-hidden bg-background px-6 pt-(--safe-top) pb-(--safe-bottom)",
        className,
      )}
    >
      {desktop ? (
        <div
          aria-hidden
          className="desktop-drag-region fixed inset-x-0 top-0 h-10 [[data-tab-strip]_&]:hidden [[data-title-band]_&]:hidden"
        />
      ) : null}
      <NotFoundCard />
    </main>
  );
}
