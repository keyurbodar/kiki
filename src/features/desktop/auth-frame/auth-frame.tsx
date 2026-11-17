import type { ReactNode } from "react";
import { CapyLogo } from "@/components/capy-logo";

export type AuthFrameProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function AuthFrame({ title, subtitle, children }: AuthFrameProps) {
  return (
    <main className="flex h-dvh w-full items-center justify-center overflow-hidden bg-background p-(--spacing-page-padding)">
      <div className="w-full max-w-84">
        <div className="flex w-full flex-col gap-6 transition-[opacity,translate] duration-base ease-out-quint starting:opacity-0 motion-safe:starting:translate-y-1">
          <div className="flex flex-col items-center gap-4 text-center">
            <CapyLogo className="h-9" />
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-medium text-foreground">{title}</h1>
              {subtitle ? (
                <p className="text-sm font-normal text-muted-foreground-1">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

export function AuthActions({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-2">{children}</div>;
}

export function AuthFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-1 text-xs font-normal text-muted-foreground-2">
      {children}
    </div>
  );
}

export function AuthNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-xs font-normal text-muted-foreground-2">
      {children}
    </p>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-xs font-normal text-destructive">{children}</p>;
}

export const authLinkClassName =
  "text-foreground hover:underline underline-offset-2";
