import { Link, type LinkProps } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const settingsRowDescriptionVariants = cva("font-normal", {
  variants: {
    tone: {
      muted: "text-muted-foreground-2",
      strong: "text-muted-foreground-1",
    },
  },
  defaultVariants: { tone: "muted" },
});

export type SettingsRowDescriptionTone = NonNullable<
  VariantProps<typeof settingsRowDescriptionVariants>["tone"]
>;

const iconTileClass = {
  subtle:
    "grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg:not([class*='size-'])]:size-4",
  brand:
    "grid size-8 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground [&_svg]:size-6",
} as const;

export type SettingsRowProps = Omit<
  ComponentProps<"div">,
  "onClick" | "children"
> & {
  label?: ReactNode;
  description?: ReactNode;
  descriptionTone?: SettingsRowDescriptionTone;
  icon?: ReactNode;
  wrapValue?: boolean;
  actions?: ReactNode;
  onClick?: () => void;
  highlighted?: boolean;
  children?: ReactNode;
};

export function SettingsRow({
  label,
  description,
  descriptionTone,
  icon,
  wrapValue,
  actions,
  onClick,
  highlighted,
  className,
  children,
  ...props
}: SettingsRowProps) {
  const clickable = onClick !== undefined;
  return (
    <div
      data-slot="settings-row"
      className={cx(
        "group/row flex gap-6 p-4",
        wrapValue ? "items-start" : "items-center justify-between",
        Boolean(icon) && "min-h-15",
        highlighted && "bg-card-hover",
        clickable &&
          "relative cursor-pointer transition-colors duration-hover hover:bg-card-hover",
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
        {icon && <div className={iconTileClass.subtle}>{icon}</div>}
        <div
          className={cx(
            "flex flex-col gap-0.5",
            wrapValue ? "shrink-0" : "min-w-0",
          )}
        >
          <div className="text-sm font-medium text-foreground">
            {clickable ? (
              <button
                type="button"
                className="text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-ring-inset"
                onClick={onClick}
              >
                {label}
              </button>
            ) : (
              label
            )}
          </div>
          {description && (
            <div
              className={cx(
                settingsRowDescriptionVariants({ tone: descriptionTone }),
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
            clickable &&
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
                  "opacity-0 transition-opacity duration-hover group-hover/row:opacity-100 focus-within:opacity-100 has-[[data-popup-open]]:opacity-100 pointer-coarse:opacity-100",
              )}
            >
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type SettingsRowLinkProps = {
  to: LinkProps["to"];
  params?: LinkProps["params"];
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  descriptionTone?: SettingsRowDescriptionTone;
  icon?: ReactNode;
  iconTile?: "subtle" | "brand";
  chevron?: "always" | "wide";
  children?: ReactNode;
  className?: string;
};

export function SettingsRowLink({
  to,
  params,
  id,
  label,
  description,
  descriptionTone,
  icon,
  iconTile = "subtle",
  chevron = "always",
  children,
  className,
}: SettingsRowLinkProps) {
  return (
    <Link
      to={to}
      params={params}
      id={id}
      data-slot="settings-row-link"
      className={cx(
        "flex items-center justify-between gap-6 p-4 transition-colors duration-hover outline-none select-none",
        "hover:bg-card-hover focus-visible:outline-ring-inset",
        Boolean(icon) && "min-h-15",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon && <div className={iconTileClass[iconTile]}>{icon}</div>}
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description && (
            <div
              className={cx(
                settingsRowDescriptionVariants({ tone: descriptionTone }),
                icon ? "text-xs" : "text-sm",
              )}
            >
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        <svg
          aria-hidden
          data-icon="chevron-right-small"
          viewBox="0 0 24 24"
          fill="none"
          className={cx(
            "size-(--icon-sm) shrink-0 text-muted-foreground-3",
            chevron === "wide" && "max-sm:hidden",
          )}
        >
          <path
            d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}
