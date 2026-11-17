import type { ReactNode } from "react";
import { cx } from "./cx";

export type SettingsSectionProps = {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
};

export function SettingsSection({
  id,
  title,
  description,
  action,
  children,
}: SettingsSectionProps) {
  return (
    <section id={id} className="flex flex-col gap-3">
      {(title ?? action) && (
        <div className="flex flex-col gap-1">
          <div className="flex min-h-7 items-center justify-between gap-3">
            {title && (
              <h2 className="text-base font-medium text-foreground">{title}</h2>
            )}
            {description ? null : action}
          </div>
          {description && (
            <div
              className={cx(
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
