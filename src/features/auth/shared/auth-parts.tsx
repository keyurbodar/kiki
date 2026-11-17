import type { ReactNode } from "react";
import { CapyLogo } from "@/components/capy-logo";

export const authLinkClassName =
  "text-foreground hover:underline underline-offset-2";

export function AuthStep({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-6 transition-[opacity,translate] duration-base ease-out-quint starting:opacity-0 motion-safe:starting:translate-y-1">
      {children}
    </div>
  );
}

export function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | undefined;
}) {
  return (
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
  );
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

export function AuthText({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-sm font-normal text-muted-foreground-1">
      {children}
    </p>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-xs font-normal text-destructive">{children}</p>;
}

export function AuthDivider() {
  return (
    <div
      role="none"
      className="h-[calc(var(--spacing)/8)] w-full shrink-0 bg-border-1"
    />
  );
}

export function AuthSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      role="status"
      aria-label={label}
      className="size-(--icon-sm) shrink-0 animate-pulse"
    >
      {[3, 7, 11].flatMap((cy) =>
        [3, 7, 11].map((cx) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="1"
            fill="currentColor"
          />
        )),
      )}
    </svg>
  );
}

export function AuthPending({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm font-normal text-muted-foreground-1">
      <AuthSpinner />
      {label}
    </div>
  );
}

export function SupportLink() {
  return (
    <a
      className="text-(--text-link) hover:underline underline-offset-2"
      href="mailto:support@capy.ai"
    >
      support@capy.ai
    </a>
  );
}
