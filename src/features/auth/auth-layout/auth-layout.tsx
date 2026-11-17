import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Toaster } from "@/primitives/toaster";
import { ArrowLeftIcon } from "../shared";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-title-band
      className="relative flex h-dvh w-full bg-background pt-(--safe-top)"
    >
      <div className="absolute inset-x-0 top-0 z-(--z-top-bar) flex h-14 items-center pl-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to capy.ai"
          render={<a href="https://capy.ai" />}
        >
          <ArrowLeftIcon />
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
        <Card variant="panel" className="relative isolate min-w-0 flex-1">
          <div
            data-auth-fabric
            aria-hidden
            className="pointer-events-none absolute inset-0"
          />
        </Card>
      </aside>
      <Toaster />
    </div>
  );
}
