import { type FormEvent, type KeyboardEvent, useState } from "react";
import { Button, buttonVariants } from "@/primitives/button";
import { Input } from "@/primitives/input";
import {
  MenuCombobox,
  MenuComboboxItem,
  MenuComboboxTrigger,
} from "@/primitives/menu-combobox";
import {
  ChevronDownGlyph,
  CrossGlyph,
  PlusGlyph,
} from "../model-routing/glyphs.tsx";
import { ProviderIcon } from "../model-routing/provider-icon.tsx";
import { modelIdOf } from "../model-routing/routing.ts";
import type { CatalogEntry, ModelSetting } from "../model-routing/types.ts";
import { ComboboxPopup, cx } from "./ui.tsx";

export const matchesEntry = (entry: CatalogEntry, query: string) =>
  `${entry.name} ${entry.id}`
    .toLowerCase()
    .includes(query.trim().toLowerCase());

export type ServedAsRowProps = {
  catalog: ReadonlyArray<CatalogEntry>;
  onAdd: (model: ModelSetting) => void;
  onCancel: () => void;
};

export function ServedAsRow({ catalog, onAdd, onCancel }: ServedAsRowProps) {
  const [entry, setEntry] = useState<CatalogEntry>();
  const [query, setQuery] = useState("");
  const [servedAs, setServedAs] = useState("");
  const ready = entry !== undefined && servedAs.trim() !== "";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (entry !== undefined && servedAs.trim() !== "")
      onAdd({ model: modelIdOf(entry.id), providerModelId: servedAs.trim() });
  };
  const cancelOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCancel();
    }
  };
  return (
    <form
      className="flex h-8 items-center gap-1.5 pl-5.5 text-sm"
      onSubmit={submit}
      onKeyDown={cancelOnEscape}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        <PlusGlyph className="size-(--icon-sm) text-muted-foreground-2" />
      </span>
      <MenuCombobox
        items={[...catalog]}
        value={entry ?? null}
        onValueChange={(next: CatalogEntry | null) => {
          setEntry(next ?? undefined);
          setQuery("");
        }}
        inputValue={query}
        onInputValueChange={setQuery}
        itemToStringLabel={(item: CatalogEntry) => item.name}
        isItemEqualToValue={(a: CatalogEntry, b: CatalogEntry) => a.id === b.id}
        filter={matchesEntry}
      >
        <MenuComboboxTrigger
          aria-label="Model"
          className={buttonVariants({
            variant: "outline",
            size: "xs",
            className: "w-40 shrink-0 justify-between",
          })}
        >
          <span
            className={cx(
              "min-w-0 truncate",
              entry === undefined && "text-muted-foreground-2",
            )}
          >
            {entry?.name ?? "Capy model"}
          </span>
          <ChevronDownGlyph className="text-muted-foreground-3" />
        </MenuComboboxTrigger>
        <ComboboxPopup
          className="w-72"
          searchPlaceholder="Search models"
          emptyText="No model matches"
          empty={!catalog.some((item) => matchesEntry(item, query))}
        >
          {(item: CatalogEntry) => (
            <MenuComboboxItem key={item.id} value={item}>
              <ProviderIcon
                provider={item.provider}
                className="size-4 shrink-0"
              />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
            </MenuComboboxItem>
          )}
        </ComboboxPopup>
      </MenuCombobox>
      <span className="shrink-0 text-xs font-normal text-muted-foreground-2">
        served as
      </span>
      <Input
        size="xs"
        autoComplete="off"
        aria-label="Served as"
        placeholder="id the endpoint expects"
        className="min-w-0 flex-1"
        value={servedAs}
        onChange={(event) => setServedAs(event.currentTarget.value)}
      />
      <Button type="submit" size="xs" disabled={!ready}>
        Add
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Cancel"
        onClick={onCancel}
      >
        <CrossGlyph />
      </Button>
    </form>
  );
}
