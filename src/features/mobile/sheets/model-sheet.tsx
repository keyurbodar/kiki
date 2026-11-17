import { type ReactElement, useState } from "react";
import { Badge } from "@/primitives/badge";
import { Icon } from "@/primitives/icon";
import {
  MobileSheet,
  MobileSheetSearch,
  MobileSheetSeparator,
  matchesQuery,
} from "./mobile-sheet";

export type MobileModelOption = {
  id: string;
  name: string;
  price?: string;
  badge?: string;
};

export type MobileModelSection = {
  id: string;
  label: string;
  models: ReadonlyArray<MobileModelOption>;
};

export const filterModelSections = (
  sections: ReadonlyArray<MobileModelSection>,
  query: string,
) =>
  sections
    .map((section) => ({
      ...section,
      models: section.models.filter((model) => matchesQuery(model.name, query)),
    }))
    .filter((section) => section.models.length > 0);

export type MobileModelSheetProps = {
  sections: ReadonlyArray<MobileModelSection>;
  selectedId?: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (id: string) => void;
  onOpenSettings: (id: string) => void;
  onGroupBy: () => void;
};

export function MobileModelSheet({
  sections,
  selectedId,
  trigger,
  open,
  onOpenChange,
  onSelect,
  onOpenSettings,
  onGroupBy,
}: MobileModelSheetProps) {
  const [query, setQuery] = useState("");
  return (
    <MobileSheet
      label="Models"
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <MobileSheetSearch
        placeholder="Search models"
        value={query}
        onValueChange={setQuery}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Group by"
          className="mr-1 flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded px-1.5 text-xs font-normal text-muted-foreground-2 hover:bg-popover-hover hover:text-foreground focus-visible:outline-ring-inset"
          onClick={onGroupBy}
        >
          By provider
        </button>
      </MobileSheetSearch>
      <MobileSheetSeparator />
      <div
        role="listbox"
        aria-label="Models"
        className="relative min-w-0 flex-1"
      >
        {filterModelSections(sections, query).map((section) => (
          <div key={section.id} data-anchor={section.id}>
            <div className="mt-1 flex min-h-[1.375rem] items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground-2 first:mt-0">
              {section.label}
            </div>
            {section.models.map((model) => (
              <div
                key={model.id}
                role="option"
                tabIndex={-1}
                aria-selected={model.id === selectedId}
                className="relative flex h-(--h-menu-row) w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal text-foreground outline-none select-none hover:bg-[var(--menu-row-highlight,var(--popover-hover))]"
                onClick={() => onSelect(model.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    onSelect(model.id);
                }}
              >
                <span className="flex size-(--icon-sm) shrink-0 items-center justify-center" />
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="min-w-0 truncate">{model.name}</span>
                  {model.badge && (
                    <Badge color="success" className="self-center">
                      {model.badge}
                    </Badge>
                  )}
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-2 pl-2">
                  {model.price && (
                    <span className="text-xs tabular-nums text-muted-foreground-2">
                      {model.price}
                    </span>
                  )}
                  {model.id === selectedId && (
                    <span className="text-foreground">✓</span>
                  )}
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={`${model.name} settings`}
                    className="-my-1 -mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground-2 focus-visible:outline-ring-inset"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenSettings(model.id);
                    }}
                  >
                    <Icon name="chevron-right" size="sm" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </MobileSheet>
  );
}
