import { type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import { ChipMenu, ChipMenuTrigger } from "@/primitives/chip-menu";
import { MenuContent, MenuItem, MenuSearchRow } from "@/primitives/menu";
import { Checkmark } from "./icons";

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const menuIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
export const menuLabelClass =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
export const menuCheckClass = "size-(--icon-sm) shrink-0 text-foreground";
export const menuTrailingClass =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";
export const chevronClass = "size-(--icon-sm) shrink-0 text-muted-foreground-3";
export const menuSearchInputClass =
  "h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3";
export const menuEmptyClass =
  "px-2 py-4 text-center text-sm font-normal text-muted-foreground-2";

export const stopMenuKeys = (event: {
  key: string;
  stopPropagation: () => void;
}) => {
  if (
    event.key !== "Escape" &&
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp"
  )
    event.stopPropagation();
};

export type SectionHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {subtitle === undefined ? action : null}
      </div>
      {subtitle === undefined ? null : (
        <div
          className={cx(
            "flex items-center justify-between gap-3",
            Boolean(action) && "min-h-7",
          )}
        >
          <p className="text-sm font-normal text-muted-foreground-2">
            {subtitle}
          </p>
          {action}
        </div>
      )}
    </div>
  );
}

export type OptionChipOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type OptionChipProps = {
  ariaLabel: string;
  prefix?: string;
  current: string;
  options: ReadonlyArray<OptionChipOption>;
  onPick: (value: string) => void;
  searchPlaceholder?: string;
  disabled?: boolean;
};

export function OptionChip({
  ariaLabel,
  prefix,
  current,
  options,
  onPick,
  searchPlaceholder,
  disabled,
}: OptionChipProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible =
    searchPlaceholder === undefined || needle === ""
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(needle));
  const selected = options.find((option) => option.value === current);
  return (
    <ChipMenu onOpenChange={(open) => (open ? undefined : setQuery(""))}>
      <ChipMenuTrigger
        render={
          <Button
            variant="soft"
            size="xs"
            aria-label={ariaLabel}
            className="max-w-56"
            disabled={disabled}
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
              className={menuSearchInputClass}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={stopMenuKeys}
            />
          </MenuSearchRow>
        )}
        {visible.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
            No results
          </div>
        ) : (
          visible.map((option) => (
            <MenuItem key={option.value} onClick={() => onPick(option.value)}>
              {option.icon === undefined ? null : (
                <span className={menuIconClass}>{option.icon}</span>
              )}
              <span className={menuLabelClass}>{option.label}</span>
              {option.value === current ? (
                <Checkmark className={cx("ml-auto", menuCheckClass)} />
              ) : null}
            </MenuItem>
          ))
        )}
      </MenuContent>
    </ChipMenu>
  );
}

export type PersonAvatarProps = { name: string; src: string | null };

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export function PersonAvatar({ name, src }: PersonAvatarProps) {
  return src === null ? (
    <span
      data-slot="avatar"
      aria-hidden
      className="grid size-(--icon-sm) shrink-0 place-items-center overflow-hidden rounded-xs bg-secondary text-2xs font-medium text-muted-foreground-1"
    >
      {initialsOf(name)}
    </span>
  ) : (
    <img
      data-slot="avatar"
      alt=""
      src={src}
      className="size-(--icon-sm) shrink-0 rounded-xs object-cover"
    />
  );
}
