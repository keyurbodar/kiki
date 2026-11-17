import type { ReactNode } from "react";

export const menuIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export function MenuIcon({ children }: { children: ReactNode }) {
  return <span className={menuIconClass}>{children}</span>;
}
