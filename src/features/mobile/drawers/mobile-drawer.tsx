import { cx } from "class-variance-authority";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerTrigger,
} from "@/primitives/drawer";
import { ResponsiveMenuLevel } from "@/primitives/responsive-menu";

export type MobileDrawerProps = {
  label: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

/** A bottom drawer holding one menu level, as Capy's ResponsiveMenu renders on touch. */
export function MobileDrawer({
  label,
  trigger,
  open,
  onOpenChange,
  children,
}: MobileDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger render={trigger} />}
      <DrawerContent aria-label={label}>
        <DrawerHandle />
        <div className="min-h-0 overflow-x-clip overflow-y-auto overscroll-contain">
          <div className="flex flex-col px-2 pb-2">
            <ResponsiveMenuLevel className="flex flex-col">
              {children}
            </ResponsiveMenuLevel>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export const drawerRowClass =
  "relative flex w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal text-foreground outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-sm) h-(--h-menu-row) hover:bg-[var(--menu-row-highlight,var(--popover-hover))] focus-visible:bg-[var(--menu-row-highlight,var(--popover-hover))] data-[selected]:bg-[var(--menu-row-highlight,var(--popover-hover))] disabled:pointer-events-none disabled:opacity-50";

export const drawerIconSlotClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export type MobileDrawerItemProps = Omit<
  ComponentProps<typeof DrawerClose>,
  "children"
> & {
  icon?: ReactNode;
  label: string;
  /** Second line under the label (Capy's rich menu row). */
  description?: string;
  trailing?: ReactNode;
};

/** A drawer row that closes the drawer when pressed. */
export function MobileDrawerItem({
  icon,
  label,
  description,
  trailing,
  className,
  ...props
}: MobileDrawerItemProps) {
  return (
    <DrawerClose
      data-slot="responsive-menu-item"
      className={cx(drawerRowClass, className)}
      {...props}
    >
      <MobileDrawerRow
        icon={icon}
        label={label}
        description={description}
        trailing={trailing}
      />
    </DrawerClose>
  );
}

export type MobileDrawerRowProps = {
  icon?: ReactNode;
  label: string;
  description?: string;
  trailing?: ReactNode;
};

/** The inside of a menu row: icon slot, label (and description), trailing. */
export function MobileDrawerRow({
  icon,
  label,
  description,
  trailing,
}: MobileDrawerRowProps) {
  if (description === undefined && trailing === undefined)
    return (
      <>
        {icon !== undefined && (
          <span className={drawerIconSlotClass}>{icon}</span>
        )}
        <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
          {label}
        </span>
      </>
    );
  return (
    <span
      data-slot="menu-row"
      className="flex min-w-0 flex-1 items-center gap-2 text-left"
    >
      {icon !== undefined && (
        <span className={drawerIconSlotClass}>{icon}</span>
      )}
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground in-data-[intent=danger]:text-destructive">
          {label}
        </span>
        {description !== undefined && (
          <span className="line-clamp-1 min-w-0 text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        )}
      </span>
      {trailing !== undefined && (
        <span
          className={cx(
            "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1",
            description !== undefined && "h-5 self-start",
          )}
        >
          {trailing}
        </span>
      )}
    </span>
  );
}

export type MobileDrawerLabelProps = ComponentProps<"div">;

/** Section label inside a drawer level. */
export function MobileDrawerLabel({
  className,
  ...props
}: MobileDrawerLabelProps) {
  return (
    <div
      className={cx(
        "mt-1 flex min-h-5.5 items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0",
        className,
      )}
      {...props}
    />
  );
}

export function MobileDrawerSeparator() {
  return (
    <div
      data-slot="menu-separator"
      className="mx-1 my-1 h-px shrink-0 bg-border-1"
    />
  );
}

export type MobileDrawerSearchProps = {
  label?: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  children?: ReactNode;
};

export function MobileDrawerSearch({
  label,
  placeholder,
  value,
  onValueChange,
  children,
}: MobileDrawerSearchProps) {
  return (
    <div data-slot="menu-search-row" className="flex shrink-0 items-center">
      <input
        aria-label={label}
        className="h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {children}
    </div>
  );
}

export const matchesQuery = (text: string, query: string) =>
  text.toLowerCase().includes(query.trim().toLowerCase());
