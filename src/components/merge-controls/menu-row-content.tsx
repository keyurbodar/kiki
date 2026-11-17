import type { ReactNode } from "react";
import { PullGlyph } from "@/components/checks-rows";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const iconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const trailingSlot =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";

export type MenuRowContentProps = {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  density?: "default" | "rich";
  className?: string;
};

/** Icon, label, optional description and trailing slot of a menu row. */
export function MenuRowContent({
  icon,
  label,
  description,
  trailing,
  density,
  className,
}: MenuRowContentProps) {
  const rich = density === "rich" && description != null;
  return (
    <span
      data-slot="menu-row"
      className={cx(
        "flex min-w-0 flex-1 items-center gap-2 text-left",
        className,
      )}
    >
      {icon ? (
        <span className={cx(iconSlot, rich && "h-5 self-start")}>{icon}</span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground in-data-[intent=danger]:text-destructive">
          {label}
        </span>
        {description ? (
          <span className="line-clamp-1 min-w-0 text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span className={cx(trailingSlot, rich && "h-5 self-start")}>
          {trailing}
        </span>
      ) : null}
    </span>
  );
}

export type MenuRowDrillContentProps = Omit<MenuRowContentProps, "trailing"> & {
  value?: ReactNode;
  valueClassName?: string;
  after?: ReactNode;
};

/** A menu row that opens a nested panel: its current value, then a chevron. */
export function MenuRowDrillContent({
  value,
  valueClassName,
  after,
  ...props
}: MenuRowDrillContentProps) {
  return (
    <MenuRowContent
      {...props}
      trailing={
        <>
          {value ? (
            <span className={cx("min-w-0 max-w-32 truncate", valueClassName)}>
              {value}
            </span>
          ) : null}
          <PullGlyph
            name="chevron-right-small"
            className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
          />
          {after}
        </>
      }
    />
  );
}
