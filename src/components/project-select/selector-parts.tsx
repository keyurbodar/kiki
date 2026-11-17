import type { ComponentProps, KeyboardEvent, ReactNode } from "react";
import { Icon, type IconProps } from "@/primitives/icon";
import {
  MenuContent,
  MenuSearchRow,
  MenuSub,
  MenuSubTrigger,
} from "@/primitives/menu";
import { SelectorMenuList } from "@/primitives/selector-menu-list";

export const selectorIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
export const selectorItemLabel =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
export const selectorItemTrailing =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";
export const selectorChevron = "shrink-0 text-muted-foreground-3";
export const selectorCheck = "shrink-0 text-foreground";
export const selectorSearchInput =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";
export const selectorTriggerIcon = "translate-y-(--spacing-hairline)";
export const selectorEmpty =
  "px-2 py-4 text-center text-sm font-normal text-muted-foreground-2";
export const selectorTrigger = "-m-1 p-1";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export { cx as joinClasses };

export function SelectorCheck({ className }: { className?: string }) {
  return (
    <Icon
      name="checkmark-1"
      size="sm"
      className={cx(selectorCheck, className)}
    />
  );
}

export function SelectorChevron() {
  return (
    <Icon name="chevron-down-small" size="sm" className={selectorChevron} />
  );
}

export function SelectorItemIcon({ name }: { name: IconProps["name"] }) {
  return (
    <span className={selectorIconSlot}>
      <Icon name={name} size="sm" />
    </span>
  );
}

export function stopMenuTypeahead(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Escape") event.stopPropagation();
}

export type SelectorSearchProps = Omit<ComponentProps<"input">, "className">;

export function SelectorSearch(props: SelectorSearchProps) {
  return (
    <MenuSearchRow className="flex shrink-0 items-center">
      <input
        className={selectorSearchInput}
        onKeyDown={stopMenuTypeahead}
        {...props}
      />
    </MenuSearchRow>
  );
}

export type SelectorLayoutProps = {
  search?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function SelectorLayout({
  search,
  footer,
  children,
}: SelectorLayoutProps) {
  return (
    <div
      role="presentation"
      className="relative md:-m-1 md:flex md:max-h-[min(var(--container-xs),var(--available-height,var(--container-xs)))] md:min-h-0 md:flex-col md:overflow-hidden md:p-1"
    >
      <div
        role="presentation"
        className="sticky top-0 bg-popover md:static md:shrink-0"
      >
        {search}
      </div>
      <SelectorMenuList
        role="presentation"
        data-menu-list=""
        className="md:min-h-0 md:flex-1 md:overflow-x-hidden md:overflow-y-auto md:scroll-fade-y"
      >
        {children}
      </SelectorMenuList>
      {footer ? (
        <div
          role="presentation"
          className="sticky bottom-0 bg-popover md:static md:shrink-0"
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export type SelectorRowProps = {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  density?: "default" | "rich";
  className?: string;
};

export function SelectorRow({
  icon,
  label,
  description,
  trailing,
  density,
  className,
}: SelectorRowProps) {
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
        <span className={cx(selectorIconSlot, rich && "h-5 self-start")}>
          {icon}
        </span>
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
        <span className={cx(selectorItemTrailing, rich && "h-5 self-start")}>
          {trailing}
        </span>
      ) : null}
    </span>
  );
}

export type SelectorSubmenuProps = {
  icon: ReactNode;
  label: ReactNode;
  value?: ReactNode;
  valueClassName?: string;
  trailing?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
};

export function SelectorSubmenu({
  icon,
  label,
  value,
  valueClassName,
  trailing,
  contentClassName,
  children,
}: SelectorSubmenuProps) {
  return (
    <MenuSub>
      <MenuSubTrigger>
        <span className={selectorIconSlot}>{icon}</span>
        <span className={selectorItemLabel}>{label}</span>
        <span className={selectorItemTrailing}>
          {value ? (
            <span className={cx("min-w-0 max-w-32 truncate", valueClassName)}>
              {value}
            </span>
          ) : null}
          <Icon
            name="chevron-right-small"
            size="sm"
            className={selectorChevron}
          />
          {trailing}
        </span>
      </MenuSubTrigger>
      <MenuContent className={contentClassName}>{children}</MenuContent>
    </MenuSub>
  );
}

const dotColors = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
} as const;

export function StatusDot({
  color = "neutral",
  className,
}: {
  color?: keyof typeof dotColors;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "size-1.5 shrink-0 rounded-full",
        dotColors[color],
        className,
      )}
    />
  );
}

export function SelectorSkeleton({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "shimmer-surface shimmer-surface-motion-safe inline-block rounded",
        className,
      )}
    />
  );
}
