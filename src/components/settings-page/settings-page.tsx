import {
  createContext,
  type ReactNode,
  type Ref,
  useContext,
  useEffect,
} from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";
import { SkeletonPanel } from "@/primitives/skeleton-panel";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

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
          : "mx-auto flex w-full flex-col gap-9.5 px-6 pt-6 pb-10 md:pt-16",
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
