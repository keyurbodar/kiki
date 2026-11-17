import { Link, type LinkProps } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type Ref,
  useContext,
  useEffect,
} from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SkeletonPanel } from "@/primitives/skeleton-panel";

/*
 * Local copy of the C1 settings kit (SettingsPage, SettingsSection,
 * SettingsRow, SettingsRowLink) from kiki#14, with the same props, so these
 * pages render correctly before it lands. Swap to the shared exports from
 * @/components/settings-page and @/primitives/settings-row once it merges.
 */

export const cx = (...parts: Array<string | false | null | undefined>) =>
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
        "flex items-center justify-between gap-6 p-4 transition-colors duration-100 outline-none select-none",
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

export const SettingsNestedContext = createContext(false);

const widthClass = {
  default: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none",
} as const;

export type SettingsPageWidth = keyof typeof widthClass;

export type SettingsPageProps = {
  title: string;
  description?: ReactNode;
  headerFields?: ReactNode;
  headerContent?: ReactNode;
  icon?: ReactNode;
  iconTile?: "subtle" | "brand";
  headingRef?: Ref<HTMLHeadingElement>;
  width?: SettingsPageWidth;
  children?: ReactNode;
};

export function SettingsPage({
  title,
  description,
  headerFields,
  headerContent,
  icon,
  iconTile = "subtle",
  headingRef,
  width = "default",
  children,
}: SettingsPageProps) {
  const nested = useContext(SettingsNestedContext);
  const Heading = nested ? "h2" : "h1";
  useEffect(() => {
    if (!nested) document.title = `${title} | Capy`;
  }, [nested, title]);
  return (
    <div
      data-slot="settings-page"
      className={cx(
        nested
          ? "flex w-full flex-col gap-10"
          : "mx-auto flex w-full flex-col gap-10 px-6 pt-6 pb-10 md:pt-16",
        !nested && widthClass[width],
      )}
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {icon && (
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
            {headerFields === undefined ? (
              <>
                <Heading
                  ref={headingRef}
                  tabIndex={headingRef === undefined ? undefined : -1}
                  className={cx(
                    "font-medium text-foreground",
                    nested ? "text-base" : "text-xl",
                  )}
                >
                  {title}
                </Heading>
                {description && (
                  <p className="text-sm font-normal text-muted-foreground-1">
                    {description}
                  </p>
                )}
              </>
            ) : (
              <>
                <Heading
                  ref={headingRef}
                  tabIndex={headingRef === undefined ? undefined : -1}
                  className="sr-only"
                >
                  {title}
                </Heading>
                {headerFields}
              </>
            )}
          </div>
        </div>
        {headerContent}
      </header>
      {children}
    </div>
  );
}

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
    <section
      id={id}
      data-slot="settings-section"
      className="flex flex-col gap-3"
    >
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

export type SettingsLoadFailedRowProps = {
  label: ReactNode;
  onRetry: () => void;
};

export function SettingsLoadFailedRow({
  label,
  onRetry,
}: SettingsLoadFailedRowProps) {
  return (
    <SettingsRow
      label={label}
      description="Check your connection and try again"
      descriptionTone="strong"
    >
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </SettingsRow>
  );
}

export function SettingsLoadingCard() {
  return (
    <Card>
      <div className="flex flex-col gap-2 p-4">
        <SkeletonPanel className="h-4 w-2/3" />
        <SkeletonPanel className="h-4 w-1/2" />
      </div>
    </Card>
  );
}
