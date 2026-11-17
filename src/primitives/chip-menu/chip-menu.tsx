import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useState,
} from "react";
import { rankByQuery } from "@/lib/search-rank";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  MenuContent,
  MenuSearchRow,
  menuCheckClassName,
  menuIconClassName,
  menuSearchInputClassName,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";

export type ChipMenuOption<Value extends string = string> = {
  value: Value;
  label: string;
  icon?: ReactNode;
};

export type ChipMenuPickerProps<Value extends string = string> = {
  ariaLabel?: string;
  prefix?: ReactNode;
  current: Value;
  options: ReadonlyArray<ChipMenuOption<Value>>;
  onPick: (value: Value) => void;
  searchPlaceholder?: string;
  disabled?: boolean;
  title?: string;
};

export type ChipMenuRootProps = ComponentProps<typeof BaseMenu.Root>;

export type ChipMenuProps<Value extends string = string> =
  | ChipMenuPickerProps<Value>
  | ChipMenuRootProps;

export type ChipMenuTriggerProps = ComponentProps<typeof BaseMenu.Trigger>;

export function ChipMenuTrigger(props: ChipMenuTriggerProps) {
  return <BaseMenu.Trigger data-slot="menu-trigger" {...props} />;
}

const optionTerms = (option: ChipMenuOption) => [option.label];

const keepMenuKey = (event: KeyboardEvent) =>
  event.key === "Escape" ||
  event.key === "ArrowDown" ||
  event.key === "ArrowUp";

export function ChipMenu<Value extends string = string>(
  props: ChipMenuProps<Value>,
) {
  if (!("options" in props)) return <BaseMenu.Root {...props} />;
  return <ChipMenuPicker {...props} />;
}

function ChipMenuPicker<Value extends string>({
  ariaLabel,
  prefix,
  current,
  options,
  onPick,
  searchPlaceholder,
  disabled,
  title,
}: ChipMenuPickerProps<Value>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown =
    searchPlaceholder === undefined || needle === ""
      ? options
      : rankByQuery(options, optionTerms, needle);
  const selected = options.find((option) => option.value === current);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const first = shown[0];
    if (
      event.key === "Enter" &&
      !event.nativeEvent.isComposing &&
      needle !== "" &&
      first !== undefined
    ) {
      event.preventDefault();
      onPick(first.value);
      onOpenChange(false);
    }
    if (!keepMenuKey(event)) event.stopPropagation();
  };

  return (
    <ResponsiveMenu open={open} onOpenChange={onOpenChange}>
      <ChipMenuTrigger
        render={
          <Button
            variant="soft"
            size="xs"
            aria-label={ariaLabel}
            className="max-w-56"
            disabled={disabled}
            title={title}
          />
        }
      >
        {prefix === undefined ? null : (
          <span className="shrink-0 font-normal text-muted-foreground-2">
            {prefix}
          </span>
        )}
        {selected?.icon}
        <span className="min-w-0 truncate">{selected?.label ?? current}</span>
      </ChipMenuTrigger>
      <MenuContent align="start" className="w-56">
        {searchPlaceholder === undefined ? null : (
          <MenuSearchRow>
            <input
              className={menuSearchInputClassName}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
            />
          </MenuSearchRow>
        )}
        {shown.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
            No results
          </div>
        ) : (
          shown.map((option) => (
            <ResponsiveMenuItem
              key={option.value}
              onClick={() => onPick(option.value)}
            >
              {option.icon === undefined ? null : (
                <span className={menuIconClassName}>{option.icon}</span>
              )}
              <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                {option.label}
              </span>
              {option.value === current ? (
                <Icon
                  name="checkmark-1"
                  size={null}
                  className={cx("ml-auto", menuCheckClassName)}
                />
              ) : null}
            </ResponsiveMenuItem>
          ))
        )}
      </MenuContent>
    </ResponsiveMenu>
  );
}
