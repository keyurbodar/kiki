import { type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSearchRow,
  MenuTrigger,
} from "@/primitives/menu";
import { Checkmark, ChevronDownSmall } from "./icons";
import {
  cx,
  menuCheckClass,
  menuIconClass,
  menuSearchInputClass,
  stopMenuKeys,
} from "./parts";

export type MultiSelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type MultiSelectMenuProps = {
  "aria-label": string;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  selected: ReadonlyArray<string>;
  options: ReadonlyArray<MultiSelectOption>;
  disabled?: boolean;
  onToggle: (value: string) => void;
};

export const multiSelectSummary = (
  selected: ReadonlyArray<MultiSelectOption>,
  placeholder: string,
) =>
  selected.length === 0
    ? placeholder
    : selected.length === 1
      ? (selected[0]?.label ?? placeholder)
      : `${selected.length} selected`;

export function MultiSelectMenu({
  "aria-label": ariaLabel,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  selected,
  options,
  disabled,
  onToggle,
}: MultiSelectMenuProps) {
  const [query, setQuery] = useState("");
  const all: ReadonlyArray<MultiSelectOption> = [
    ...options,
    ...selected
      .filter((value) => !options.some((option) => option.value === value))
      .map((value) => ({ value, label: value })),
  ];
  const needle = query.trim().toLowerCase();
  const visible = all.filter((option) =>
    option.label.toLowerCase().includes(needle),
  );
  const chosen = all.filter((option) => selected.includes(option.value));
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="solid"
            size="sm"
            className="justify-between"
            aria-label={ariaLabel}
            disabled={disabled}
          />
        }
      >
        <span
          className={cx(
            "truncate",
            chosen.length === 0 && "text-muted-foreground-2",
          )}
        >
          {multiSelectSummary(chosen, placeholder)}
        </span>
        <ChevronDownSmall />
      </MenuTrigger>
      <MenuContent align="end" className="w-56">
        {all.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
            {emptyLabel}
          </div>
        ) : (
          <>
            <MenuSearchRow>
              <input
                className={menuSearchInputClass}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={stopMenuKeys}
              />
            </MenuSearchRow>
            {visible.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
                No matches
              </div>
            ) : (
              visible.map((option) => (
                <MenuItem
                  key={option.value}
                  closeOnClick={false}
                  onClick={() => onToggle(option.value)}
                >
                  <span className={menuIconClass}>{option.icon}</span>
                  <span className="min-w-0 truncate">{option.label}</span>
                  {selected.includes(option.value) ? (
                    <Checkmark className={cx("ml-auto", menuCheckClass)} />
                  ) : null}
                </MenuItem>
              ))
            )}
          </>
        )}
      </MenuContent>
    </Menu>
  );
}
