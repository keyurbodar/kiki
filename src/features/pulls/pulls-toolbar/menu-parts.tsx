import { type ReactNode, useState } from "react";
import {
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
} from "@/primitives/menu";
import {
  CheckGlyph,
  ChevronRightGlyph,
} from "@/features/pulls/pull-row/pull-icons";
import {
  cx,
  menuCheck,
  menuChevron,
  menuIcon,
  menuList,
  menuPopup,
  menuRow,
  menuSearchInput,
  menuSeparator,
  menuTrailing,
} from "./classes";

export function MenuPopup({
  className,
  align = "start",
  side,
  children,
}: {
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right" | "inline-end";
  children: ReactNode;
}) {
  return (
    <MenuContent
      align={align}
      side={side}
      sideOffset={4}
      className={cx(menuPopup, className)}
    >
      <div role="presentation" data-menu-list className={menuList}>
        {children}
      </div>
    </MenuContent>
  );
}

export function MenuRowItem({
  icon,
  label,
  checked,
  trailing,
  closeOnClick = true,
  onClick,
}: {
  icon?: ReactNode;
  label: ReactNode;
  checked?: boolean;
  trailing?: ReactNode;
  closeOnClick?: boolean;
  onClick: () => void;
}) {
  return (
    <MenuItem
      className={menuRow}
      closeOnClick={closeOnClick}
      onClick={onClick}
    >
      {icon === undefined ? null : <span className={menuIcon}>{icon}</span>}
      <span className="min-w-0 truncate">{label}</span>
      {trailing}
      {checked ? <CheckGlyph className={menuCheck} /> : null}
    </MenuItem>
  );
}

export function MenuDivider() {
  return <MenuSeparator className={menuSeparator} />;
}

/** A submenu row: icon, label, current value and a chevron (Capy's ResponsiveMenuSub). */
export function MenuSubmenu({
  icon,
  label,
  value,
  contentClassName,
  children,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <MenuSub>
      <MenuSubTrigger className={menuRow}>
        <span data-slot="menu-row" className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className={menuIcon}>{icon}</span>
          <span className="flex min-w-0 flex-1 flex-col justify-center">
            <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground">
              {label}
            </span>
          </span>
          <span className={menuTrailing}>
            {value === undefined || value === null ? null : (
              <span className="min-w-0 max-w-32 truncate">{value}</span>
            )}
            <ChevronRightGlyph className={menuChevron} />
          </span>
        </span>
      </MenuSubTrigger>
      <MenuPopup side="inline-end" className={contentClassName}>
        {children}
      </MenuPopup>
    </MenuSub>
  );
}

/** `status: 4` style hint after a filter row label (Capy's FilterCount). */
export function FilterCount({ filterKey, value }: { filterKey: string; value?: number }) {
  return (
    <>
      <span className="mr-1.5 text-muted-foreground-3 last:mr-0">{filterKey}:</span>
      {value === undefined ? null : <span>{value}</span>}
    </>
  );
}

export interface SearchableOption {
  readonly key: string;
  readonly label: string;
  readonly leading?: ReactNode;
  readonly checked: boolean;
}

/** A search row over a checkable list (Capy's SearchableFilterItems). */
export function SearchableOptions({
  placeholder,
  options,
  onToggle,
}: {
  placeholder: string;
  options: ReadonlyArray<SearchableOption>;
  onToggle: (key: string) => void;
}) {
  const [term, setTerm] = useState("");
  const needle = term.trim().toLowerCase();
  const shown =
    needle === ""
      ? options
      : options.filter((option) => option.label.toLowerCase().includes(needle));
  return (
    <>
      <div data-slot="menu-search-row" className="flex shrink-0 items-center">
        <input
          className={menuSearchInput}
          aria-label={placeholder}
          placeholder={placeholder}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape" && event.key !== "ArrowDown" && event.key !== "ArrowUp") {
              event.stopPropagation();
            }
          }}
        />
      </div>
      <MenuDivider />
      {shown.length === 0 ? (
        <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
          No results
        </div>
      ) : (
        shown.map((option) => (
          <MenuRowItem
            key={option.key}
            icon={option.leading}
            label={option.label}
            checked={option.checked}
            closeOnClick={false}
            onClick={() => onToggle(option.key)}
          />
        ))
      )}
    </>
  );
}
