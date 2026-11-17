import { type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import { MenuContent, MenuSearchRow, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuCheckboxItem,
} from "@/primitives/responsive-menu";

export type ActivityFilterOption = {
  value: string;
  label: string;
  icon: ReactNode;
};

export type ActivityFilterMenuProps = {
  label: string;
  allLabel: string;
  noun: string;
  heading: string;
  searchPlaceholder: string;
  options: ReadonlyArray<ActivityFilterOption>;
  selected: ReadonlyArray<string>;
  onChange: (selected: string[]) => void;
};

export const filterOptions = (
  options: ReadonlyArray<ActivityFilterOption>,
  query: string,
) => {
  const needle = query.trim().toLowerCase();
  return needle === ""
    ? options
    : options.filter((option) => option.label.toLowerCase().includes(needle));
};

export const filterSummary = (
  options: ReadonlyArray<ActivityFilterOption>,
  selected: ReadonlyArray<string>,
  allLabel: string,
  noun: string,
) => {
  const picked = options.filter((option) => selected.includes(option.value));
  if (selected.length === 0) return { text: allLabel, icons: options };
  if (picked.length === 1 && selected.length === 1)
    return { text: picked[0]?.label ?? allLabel, icons: picked };
  return { text: `${selected.length} ${noun}`, icons: picked };
};

export const toggleSelection = (
  selected: ReadonlyArray<string>,
  value: string,
  checked: boolean,
) =>
  checked ? [...selected, value] : selected.filter((item) => item !== value);

function Stack({ options }: { options: ReadonlyArray<ActivityFilterOption> }) {
  return (
    <span className="flex shrink-0 items-center -space-x-1">
      {options.slice(0, 3).map((option) => (
        <span key={option.value} className="flex">
          {option.icon}
        </span>
      ))}
    </span>
  );
}

function ChevronDownSmall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const keepMenuKeys = (event: React.KeyboardEvent) => {
  if (
    event.key !== "Escape" &&
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp"
  )
    event.stopPropagation();
};

export function ActivityFilterMenu({
  label,
  allLabel,
  noun,
  heading,
  searchPlaceholder,
  options,
  selected,
  onChange,
}: ActivityFilterMenuProps) {
  const [query, setQuery] = useState("");
  const visible = filterOptions(options, query);
  const summary = filterSummary(options, selected, allLabel, noun);
  return (
    <ResponsiveMenu onOpenChange={(open) => (open ? undefined : setQuery(""))}>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            aria-label={`${label} filter`}
            className="max-w-72"
          />
        }
      >
        <span className="shrink-0 font-normal text-muted-foreground-2">
          {label}
        </span>
        <Stack options={summary.icons} />
        <span className="min-w-0 truncate">{summary.text}</span>
        <ChevronDownSmall className="size-(--icon-sm) shrink-0 text-muted-foreground-3" />
      </MenuTrigger>
      <MenuContent align="end" className="w-64">
        <MenuSearchRow>
          <input
            className="h-(--h-menu-row) w-full min-w-0 bg-transparent px-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground-3"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={keepMenuKeys}
          />
        </MenuSearchRow>
        {query.trim() === "" && (
          <ResponsiveMenuCheckboxItem
            checked={selected.length === 0}
            onCheckedChange={() => onChange([])}
          >
            <Stack options={options} />
            <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
              {allLabel}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1 tabular-nums">
              {options.length}
            </span>
          </ResponsiveMenuCheckboxItem>
        )}
        <div className="mt-1 flex min-h-5.5 items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0">
          {heading}
        </div>
        {visible.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
            No results
          </div>
        ) : (
          visible.map((option) => (
            <ResponsiveMenuCheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) =>
                onChange(toggleSelection(selected, option.value, checked))
              }
            >
              {option.icon}
              <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                {option.label}
              </span>
            </ResponsiveMenuCheckboxItem>
          ))
        )}
      </MenuContent>
    </ResponsiveMenu>
  );
}
