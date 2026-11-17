import type { ReactNode } from "react";
import { SettingsPage } from "@/components/settings-page";
import { cx as cn } from "./cx.ts";

const widths = {
  default: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none",
} as const;

export interface McpPageProps {
  readonly title: string;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly iconTile?: "subtle" | "brand";
  readonly headerContent?: ReactNode;
  readonly width?: keyof typeof widths;
  readonly children?: ReactNode;
}

export function McpPage({
  title,
  description,
  icon,
  iconTile = "subtle",
  headerContent,
  width = "default",
  children,
}: McpPageProps) {
  return (
    <SettingsPage
      className={cn(
        "mx-auto flex w-full flex-col gap-10 px-6 pt-6 pb-10 md:pt-16",
        widths[width],
      )}
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {icon !== undefined && (
            <div
              className={
                iconTile === "brand"
                  ? "grid size-10 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground [&_svg]:size-7.5"
                  : "grid size-10 shrink-0 place-items-center rounded-md bg-secondary [&_svg]:size-6"
              }
            >
              {icon}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="font-medium text-foreground text-xl">{title}</h1>
            {description !== undefined && (
              <p className="text-sm font-normal text-muted-foreground-1">
                {description}
              </p>
            )}
          </div>
        </div>
        {headerContent}
      </header>
      {children}
    </SettingsPage>
  );
}

export interface McpSectionProps {
  readonly id?: string;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly children?: ReactNode;
}

export function McpSection({
  id,
  title,
  description,
  action,
  children,
}: McpSectionProps) {
  return (
    <section id={id} className="flex flex-col gap-3">
      {(title ?? action) !== undefined && (
        <div className="flex flex-col gap-1">
          <div className="flex min-h-7 items-center justify-between gap-3">
            {title !== undefined && (
              <h2 className="text-base font-medium text-foreground">{title}</h2>
            )}
            {description === undefined ? action : null}
          </div>
          {description !== undefined && (
            <div
              className={cn(
                "flex items-center justify-between gap-3",
                action !== undefined && "min-h-7",
              )}
            >
              <p className="text-sm font-normal text-muted-foreground-2">
                {description}
              </p>
              {action}
            </div>
          )}
        </div>
      )}
      <div className="-mx-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}
