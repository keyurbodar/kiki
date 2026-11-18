import type { ReactNode } from "react";
import { useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { buttonVariants } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { SearchIcon } from "../icons";

export interface DriveTopBarSearch {
  readonly value: string;
  readonly placeholder: string;
  readonly onValueChange: (value: string) => void;
}

/**
 * The drive list screens' top bar: the shell's `AppTopBar` carrying Capy Drive's
 * title and search, so the screens get the same sidebar trigger as every other
 * top-bar route at narrow widths.
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
    <AppTopBar
      title={title}
      trailing={
        <>
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
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Search"
                    aria-pressed={open}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon-sm",
                    })}
                    onClick={() => {
                      if (open) search.onValueChange("");
                      setOpen(!open);
                    }}
                  >
                    <SearchIcon className="size-(--icon-sm)" />
                  </button>
                }
              />
              <TooltipContent side="bottom">Search</TooltipContent>
            </Tooltip>
          )}
          {trailing}
        </>
      }
    />
  );
}
