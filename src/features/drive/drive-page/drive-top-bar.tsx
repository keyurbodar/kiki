import { type ReactNode, useState } from "react";
import { Button } from "@/primitives/button";
import { SearchIcon } from "../icons";

export interface DriveTopBarSearch {
  readonly value: string;
  readonly placeholder: string;
  readonly onValueChange: (value: string) => void;
}

/**
 * The drive screens' top bar, matching Capy's `AppTopBar` markup (title,
 * search toggle, trailing actions). The shared `app-top-bar` component is
 * still a stub; swap this for it once it takes a title, search and trailing.
 */
export function DriveTopBar({
  title,
  search,
  trailing,
}: {
  title: ReactNode;
  search?: DriveTopBarSearch;
  trailing?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-(length:--border-width-hairline) border-border-1 bg-panel px-2">
      <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
        {title}
      </h1>
      <div className="ml-auto flex items-center gap-1.5 pl-2">
        {search !== undefined && open && (
          <input
            data-slot="input"
            // biome-ignore lint/a11y/noAutofocus: the field opens on demand, like Capy's top bar search
            autoFocus
            aria-label={search.placeholder}
            placeholder={search.placeholder}
            value={search.value}
            onChange={(event) => search.onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              search.onValueChange("");
              setOpen(false);
            }}
            className="h-(--h-control-sm) w-56 min-w-0 rounded border-(length:--border-width-hairline) border-border-2 bg-input px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground-3 focus-visible:outline-ring-inset"
          />
        )}
        {search !== undefined && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Search"
            aria-pressed={open}
            onClick={() => {
              if (open) search.onValueChange("");
              setOpen(!open);
            }}
          >
            <SearchIcon className="size-(--icon-sm)" />
          </Button>
        )}
        {trailing}
      </div>
    </header>
  );
}
