import type { ComponentProps, ReactElement, ReactNode } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerTrigger,
} from "@/primitives/drawer";

export type MobileSheetProps = {
  label: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

export function MobileSheet({
  label,
  trigger,
  open,
  onOpenChange,
  children,
}: MobileSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger render={trigger} />}
      <DrawerContent aria-label={label}>
        <DrawerHandle />
        <div className="flex flex-col px-2 pb-2">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

const rowClass =
  "relative flex h-(--h-menu-row) w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal text-foreground outline-none select-none hover:bg-[var(--menu-row-highlight,var(--popover-hover))] focus-visible:bg-[var(--menu-row-highlight,var(--popover-hover))] disabled:pointer-events-none disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[selected]:bg-[var(--menu-row-highlight,var(--popover-hover))] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-sm)";

export type MobileSheetRowProps = Omit<
  ComponentProps<typeof DrawerClose>,
  "children"
> & {
  icon?: ReactNode;
  label: string;
  trailing?: ReactNode;
};

export function MobileSheetRow({
  icon,
  label,
  trailing,
  className,
  ...props
}: MobileSheetRowProps) {
  return (
    <DrawerClose
      data-slot="responsive-menu-item"
      className={className ? `${rowClass} ${className}` : rowClass}
      {...props}
    >
      <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive">
        {icon}
      </span>
      <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
        {label}
      </span>
      {trailing}
    </DrawerClose>
  );
}

export function MobileSheetSeparator() {
  return (
    <div
      data-slot="menu-separator"
      className="mx-1 my-1 h-px shrink-0 bg-border-1"
    />
  );
}

export type MobileSheetSearchProps = {
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  children?: ReactNode;
};

export function MobileSheetSearch({
  placeholder,
  value,
  onValueChange,
  children,
}: MobileSheetSearchProps) {
  return (
    <div data-slot="menu-search-row" className="flex shrink-0 items-center">
      <input
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
