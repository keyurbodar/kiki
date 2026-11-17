import type { ComponentProps, ReactNode } from "react";
import { SettingsRow } from "@/primitives/settings-row";
import { cx } from "./cx";

export type SettingsFieldProps = Omit<ComponentProps<"div">, "onClick"> & {
  label: ReactNode;
  description?: ReactNode;
  descriptionTone?: "muted" | "strong";
  icon?: ReactNode;
  wrapValue?: boolean;
  actions?: ReactNode;
  onClick?: () => void;
  highlighted?: boolean;
};

const descriptionTones = {
  muted: "text-muted-foreground-2",
  strong: "text-muted-foreground-1",
} as const;

export function SettingsField({
  label,
  description,
  descriptionTone = "muted",
  icon,
  wrapValue,
  actions,
  onClick,
  highlighted,
  className,
  children,
  ...props
}: SettingsFieldProps) {
  return (
    <SettingsRow
      className={cx(
        "group/row flex gap-6 p-4",
        wrapValue ? "items-start" : "items-center justify-between",
        icon !== undefined && "min-h-15",
        highlighted && "bg-card-hover",
        onClick !== undefined &&
          "relative cursor-pointer transition-colors duration-100 hover:bg-card-hover",
        className,
      )}
      {...props}
    >
      <div
        className={cx(
          "flex items-center gap-3",
          wrapValue ? "shrink-0" : "min-w-0",
        )}
      >
        {icon && (
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg:not([class*='size-'])]:size-4">
            {icon}
          </div>
        )}
        <div
          className={cx(
            "flex flex-col gap-0.5",
            wrapValue ? "shrink-0" : "min-w-0",
          )}
        >
          <div className="text-sm font-medium text-foreground">
            {onClick === undefined ? (
              label
            ) : (
              <button
                type="button"
                className="text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-ring-inset"
                onClick={onClick}
              >
                {label}
              </button>
            )}
          </div>
          {description && (
            <div
              className={cx(
                "font-normal",
                descriptionTones[descriptionTone],
                icon ? "text-xs" : "text-sm",
              )}
            >
              {description}
            </div>
          )}
        </div>
      </div>
      {(children || actions) && (
        <div
          className={cx(
            "relative flex items-center gap-2",
            onClick !== undefined &&
              "pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_[role=switch]]:pointer-events-auto",
            wrapValue ? "min-w-0 flex-1 justify-end" : "shrink-0",
          )}
        >
          {children}
          {actions && (
            <div
              className={cx(
                "-mr-2 flex items-center gap-1",
                !children &&
                  "opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 focus-within:opacity-100 has-[[data-popup-open]]:opacity-100 pointer-coarse:opacity-100",
              )}
            >
              {actions}
            </div>
          )}
        </div>
      )}
    </SettingsRow>
  );
}
