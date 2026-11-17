import { Link, type LinkProps } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/primitives/icon";
import { cx } from "./cx";

const descriptionTones = {
  muted: "text-muted-foreground-2",
  strong: "text-muted-foreground-1",
} as const;

export type DescriptionTone = keyof typeof descriptionTones;

export type SettingsRowProps = Omit<ComponentProps<"div">, "onClick"> & {
  label: ReactNode;
  description?: ReactNode;
  descriptionTone?: DescriptionTone;
  icon?: ReactNode;
  wrapValue?: boolean;
  actions?: ReactNode;
  onClick?: () => void;
  highlighted?: boolean;
};

export function SettingsRow({
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
}: SettingsRowProps) {
  return (
    <div
      data-slot="settings-row"
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
    </div>
  );
}

export type SettingsRowLinkProps = Pick<LinkProps, "to" | "params"> & {
  id?: string;
  label: ReactNode;
  description?: ReactNode;
  descriptionTone?: DescriptionTone;
  icon?: ReactNode;
  iconTile?: "subtle" | "brand";
  chevron?: "always" | "wide";
  children?: ReactNode;
};

export function SettingsRowLink({
  to,
  params,
  id,
  label,
  description,
  descriptionTone = "muted",
  icon,
  iconTile = "subtle",
  chevron = "always",
  children,
}: SettingsRowLinkProps) {
  return (
    <Link
      to={to}
      params={params}
      id={id}
      data-slot="settings-row-link"
      className={cx(
        "flex items-center justify-between gap-6 p-4 transition-colors duration-100 outline-none select-none",
        "hover:bg-card-hover focus-visible:outline-ring-inset",
        icon !== undefined && "min-h-15",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div
            className={
              iconTile === "brand"
                ? "grid size-8 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground [&_svg]:size-6"
                : "grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg:not([class*='size-'])]:size-4"
            }
          >
            {icon}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-sm font-medium text-foreground">{label}</div>
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
      <div className="flex shrink-0 items-center gap-2">
        {children}
        <Icon
          name="chevron-right"
          className={cx(
            "size-(--icon-sm) shrink-0 text-muted-foreground-3",
            chevron === "wide" && "max-sm:hidden",
          )}
        />
      </div>
    </Link>
  );
}

export type CardListHeaderProps = {
  label: ReactNode;
  action?: ReactNode;
  tools?: ReactNode;
  className?: string;
};

export function CardListHeader({
  label,
  action,
  tools,
  className,
}: CardListHeaderProps) {
  return (
    <div
      data-slot="card-list-header"
      className={cx(
        "flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4",
        className,
      )}
    >
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-0.5">
        {tools}
        {action}
      </div>
    </div>
  );
}
