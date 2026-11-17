import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { ArrowLeftIcon } from "../callback-surface";

export function EmailLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-title-band
      className="relative flex h-dvh w-full bg-background pt-(--safe-top)"
    >
      <div className="absolute inset-x-0 top-0 z-(--z-top-bar) flex h-14 items-center pl-3">
        <Button
          data-track-owner="features/auth/auth-layout.tsx#AuthLayout:Button.1"
          variant="ghost"
          size="icon-sm"
          aria-label="Back to capy.ai"
          render={
            // biome-ignore lint/a11y/useAnchorContent: Button renders the icon into the anchor
            <a
              data-track-owner="features/auth/auth-layout.tsx#AuthLayout:a.1"
              href="https://capy.ai"
            />
          }
        >
          <ArrowLeftIcon className="size-(--icon-base)" />
        </Button>
      </div>
      <div
        data-auth-column
        className="flex min-h-full min-w-0 flex-1 flex-col items-center overflow-y-auto px-6"
      >
        <div className="flex w-full max-w-84 flex-1 flex-col justify-center py-16">
          {children}
        </div>
      </div>
      <aside className="hidden min-w-0 flex-1 p-2 pl-0 lg:flex">
        <Card variant="panel" className="relative isolate min-w-0 flex-1" />
      </aside>
    </div>
  );
}
