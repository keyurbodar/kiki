import { createContext, type ReactNode, type Ref, useContext } from "react";
import { SettingsPage } from "@/components/settings-page";
import { cx } from "./cx";

export const SettingsEmbeddedContext = createContext(false);

const widths = {
  default: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none",
} as const;

export type SettingsPageLayoutProps = {
  title: string;
  description?: ReactNode;
  headerFields?: ReactNode;
  headerContent?: ReactNode;
  icon?: ReactNode;
  iconTile?: "subtle" | "brand";
  headingRef?: Ref<HTMLHeadingElement>;
  width?: keyof typeof widths;
  children?: ReactNode;
};

export function SettingsPageLayout({
  title,
  description,
  headerFields,
  headerContent,
  icon,
  iconTile = "subtle",
  headingRef,
  width = "default",
  children,
}: SettingsPageLayoutProps) {
  const embedded = useContext(SettingsEmbeddedContext);
  const Heading = embedded ? "h2" : "h1";
  return (
    <SettingsPage
      className={cx(
        embedded
          ? "flex w-full flex-col gap-10"
          : "mx-auto flex w-full flex-col gap-10 px-6 pt-6 pb-10 md:pt-16",
        !embedded && widths[width],
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
                    embedded ? "text-base" : "text-xl",
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
    </SettingsPage>
  );
}
