import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps, ReactNode } from "react";
import {
  MenuContent,
  type MenuContentProps,
  MenuSeparator,
  type MenuSeparatorProps,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
  type MenuTriggerProps,
} from "@/primitives/menu";

export const ResponsiveMenu = BaseMenu.Root;

export type ResponsiveMenuProps = ComponentProps<typeof BaseMenu.Root>;

export type ResponsiveMenuLevelProps = ComponentProps<"div">;

export function ResponsiveMenuLevel(props: ResponsiveMenuLevelProps) {
  return <div data-slot="responsive-menu-level" {...props} />;
}

export type ResponsiveMenuItemProps = ComponentProps<typeof BaseMenu.Item>;

export function ResponsiveMenuItem(props: ResponsiveMenuItemProps) {
  return <BaseMenu.Item data-slot="responsive-menu-item" {...props} />;
}

export type ResponsiveMenuCheckboxItemProps = ComponentProps<
  typeof BaseMenu.CheckboxItem
>;

export function ResponsiveMenuCheckboxItem(
  props: ResponsiveMenuCheckboxItemProps,
) {
  return (
    <BaseMenu.CheckboxItem
      data-slot="responsive-menu-checkbox-item"
      {...props}
    />
  );
}

export type ResponsiveMenuTriggerProps = MenuTriggerProps;

export function ResponsiveMenuTrigger(props: ResponsiveMenuTriggerProps) {
  return <MenuTrigger {...props} />;
}

export type ResponsiveMenuContentProps = MenuContentProps;

export function ResponsiveMenuContent({
  children,
  ...props
}: ResponsiveMenuContentProps) {
  return (
    <MenuContent {...props}>
      <ResponsiveMenuLevel data-menu-list="">{children}</ResponsiveMenuLevel>
    </MenuContent>
  );
}

export type ResponsiveMenuSeparatorProps = MenuSeparatorProps;

export function ResponsiveMenuSeparator(props: ResponsiveMenuSeparatorProps) {
  return <MenuSeparator {...props} />;
}

export type ResponsiveMenuSubProps = {
  icon?: ReactNode;
  label: ReactNode;
  value?: ReactNode;
  valueClassName?: string;
  trailing?: ReactNode;
  contentClassName?: string;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children?: ReactNode;
};

export function ResponsiveMenuSub({
  icon,
  label,
  value,
  valueClassName,
  trailing,
  contentClassName,
  onOpenChange,
  defaultOpen,
  children,
}: ResponsiveMenuSubProps) {
  return (
    <MenuSub
      onOpenChange={(open) => onOpenChange?.(open)}
      defaultOpen={defaultOpen}
    >
      <MenuSubTrigger>
        <span
          data-slot="menu-row"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {icon ? (
            <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive">
              {icon}
            </span>
          ) : null}
          <span className="flex min-w-0 flex-1 flex-col justify-center">
            <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground in-data-[intent=danger]:text-destructive">
              {label}
            </span>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
            {value ? (
              <span
                className={["min-w-0 max-w-32 truncate", valueClassName]
                  .filter(Boolean)
                  .join(" ")}
              >
                {value}
              </span>
            ) : null}
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
            >
              <path
                d="M10 16L12.9393 13.0607C13.5251 12.4749 13.5251 11.5251 12.9393 10.9393L10 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {trailing}
          </span>
        </span>
      </MenuSubTrigger>
      <MenuContent className={contentClassName} sideOffset={0} alignOffset={-4}>
        <ResponsiveMenuLevel data-menu-list="">{children}</ResponsiveMenuLevel>
      </MenuContent>
    </MenuSub>
  );
}
