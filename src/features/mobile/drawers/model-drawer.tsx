import { cx } from "class-variance-authority";
import { type ReactElement, useState } from "react";
import { Badge } from "@/primitives/badge";
import { DrawerClose } from "@/primitives/drawer";
import { MobileIcon } from "../thread/mobile-icon";
import {
  drawerRowClass,
  MobileDrawer,
  MobileDrawerLabel,
  MobileDrawerSearch,
  MobileDrawerSeparator,
  matchesQuery,
} from "./mobile-drawer";

export type MobileModelOption = {
  id: string;
  name: string;
  icon?: string;
  /** Price per million tokens, input / output. */
  price?: string;
  badge?: string;
};

export type MobileModelSection = {
  id: string;
  label: string;
  icon?: string;
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

export type MobileModelDrawerProps = {
  sections: ReadonlyArray<MobileModelSection>;
  selectedId?: string;
  groupLabel: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (id: string) => void;
  onOpenSettings: (id: string) => void;
  onGroupBy: () => void;
};

export function MobileModelDrawer({
  sections,
  selectedId,
  groupLabel,
  trigger,
  open,
  onOpenChange,
  onSelect,
  onOpenSettings,
  onGroupBy,
}: MobileModelDrawerProps) {
  const [query, setQuery] = useState("");
  const visible = filterModelSections(sections, query);
  return (
    <MobileDrawer
      label="Models"
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <MobileDrawerSearch
        label="Search models"
        placeholder="Search models"
        value={query}
        onValueChange={setQuery}
      >
        <button
          type="button"
          aria-label="Group by"
          className="mr-1 flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded px-1.5 text-xs font-normal text-muted-foreground-2 hover:bg-popover-hover hover:text-foreground focus-visible:outline-ring-inset"
          onClick={onGroupBy}
        >
          <MobileIcon name="layers" className="size-(--icon-xs)" />
          {groupLabel}
        </button>
      </MobileDrawerSearch>
      <MobileDrawerSeparator />
      <div
        role="listbox"
        aria-label="Models"
        className="relative min-w-0 flex-1"
      >
        {visible.map((section, index) => (
          <div key={section.id}>
            {index > 0 && <MobileDrawerSeparator />}
            <MobileDrawerLabel className="gap-1.5">
              {section.icon !== undefined && (
                <MobileIcon name={section.icon} className="size-(--icon-xs)" />
              )}
              {section.label}
            </MobileDrawerLabel>
            {section.models.map((model) => {
              const selected = model.id === selectedId;
              return (
                <DrawerClose
                  key={model.id}
                  nativeButton={false}
                  render={
                    // biome-ignore lint/a11y/useFocusableInteractive: Base UI's Close render adds tabIndex
                    <div role="option" aria-selected={selected} />
                  }
                  className={cx(drawerRowClass, "min-h-11")}
                  onClick={() => onSelect(model.id)}
                >
                  <span
                    className={cx(
                      "relative flex size-(--icon-sm) shrink-0 items-center justify-center",
                      selected ? "text-primary-ink" : "text-foreground",
                    )}
                  >
                    <MobileIcon
                      name={model.icon ?? "agent"}
                      className="size-(--icon-base)"
                    />
                  </span>
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="min-w-0 truncate">{model.name}</span>
                    {model.badge !== undefined && (
                      <span className="flex shrink-0 self-center">
                        <Badge size="xs" color="success" className="shrink-0">
                          {model.badge}
                        </Badge>
                      </span>
                    )}
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-2 pl-2">
                    {selected ? (
                      <MobileIcon
                        name="checkmark-1"
                        className="size-(--icon-sm) shrink-0 text-foreground"
                      />
                    ) : (
                      model.price !== undefined && (
                        <span className="text-xs text-muted-foreground-2 tabular-nums">
                          {model.price}
                        </span>
                      )
                    )}
                    <button
                      type="button"
                      aria-label={`${model.name} settings`}
                      className="-my-1 -mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground-2 focus-visible:outline-ring-inset"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenSettings(model.id);
                      }}
                    >
                      <MobileIcon name="chevron-right" />
                    </button>
                  </span>
                </DrawerClose>
              );
            })}
          </div>
        ))}
      </div>
    </MobileDrawer>
  );
}
