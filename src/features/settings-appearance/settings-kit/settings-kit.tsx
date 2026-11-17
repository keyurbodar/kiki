import type { ReactNode } from "react";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";

/*
 * Page, section and row structure from Capy's settings-page module, composed
 * here until the C1 shell unit's SettingsPage/SettingsRow kit carries them.
 */
export function SettingsScroll({
  title,
  wide,
  back,
  children,
}: {
  title?: ReactNode;
  wide?: boolean;
  back?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto md:scroll-fade-y">
      {back}
      <div
        className={
          wide
            ? "mx-auto flex w-full flex-col gap-10 px-6 pt-6 pb-10 md:pt-16 max-w-5xl"
            : "mx-auto flex w-full flex-col gap-10 px-6 pt-6 pb-10 md:pt-16 max-w-3xl"
        }
      >
        {title === undefined ? null : (
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">{title}</div>
            </div>
          </header>
        )}
        {children}
      </div>
    </div>
  );
}

export function SettingsSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex min-h-7 items-center justify-between gap-3">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          {description === undefined ? action : null}
        </div>
        {description === undefined ? null : (
          <div className="flex items-center justify-between gap-3 min-h-7">
            <p className="text-sm font-normal text-muted-foreground-2">
              {description}
            </p>
            {action}
          </div>
        )}
      </div>
      <div className="-mx-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function SettingsCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card rows className={className}>
      {children}
    </Card>
  );
}

export function SettingsField({
  id,
  label,
  description,
  children,
  wrap,
}: {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  wrap?: boolean;
}) {
  return (
    <SettingsRow
      id={id}
      className={
        wrap
          ? "group/row flex gap-6 p-4 items-center"
          : "group/row flex gap-6 p-4 items-center justify-between"
      }
    >
      <div
        className={
          wrap
            ? "flex items-center gap-3 shrink-0"
            : "flex items-center gap-3 min-w-0"
        }
      >
        <div
          className={
            wrap
              ? "flex flex-col gap-0.5 shrink-0"
              : "flex flex-col gap-0.5 min-w-0"
          }
        >
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description === undefined ? null : (
            <div className="font-normal text-muted-foreground-2 text-sm">
              {description}
            </div>
          )}
        </div>
      </div>
      {children === undefined ? null : (
        <div
          className={
            wrap
              ? "relative flex items-center gap-2 min-w-0 flex-1 justify-end"
              : "relative flex items-center gap-2 shrink-0"
          }
        >
          {children}
        </div>
      )}
    </SettingsRow>
  );
}
