import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  MobileSheet,
  MobileSheetRow,
  MobileSheetSearch,
  MobileSheetSeparator,
} from "../../sheets";
import { MobileListHeader } from "../list-header";
import { MobileListEmpty, MobileListLoading } from "../list-states";
import { useMobileDrive } from "./drive-data";
import { formatUsage } from "./format-bytes";

/** Page 19's drive list: a three column scope table plus the usage bar. */
export function MobileDrive() {
  const { rows, waiting, usedBytes, capacityBytes } = useMobileDrive();
  const [displayOpen, setDisplayOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const visible = rows.filter((row) =>
    search.trim() === ""
      ? true
      : row.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const used = formatUsage(usedBytes, capacityBytes);
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <MobileListHeader
        title="Capy Drive"
        actions={
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={searchOpen ? "Close search" : "Search"}
              aria-pressed={searchOpen}
              onClick={() => {
                if (searchOpen) setSearch("");
                setSearchOpen(!searchOpen);
              }}
            >
              <Icon name="magnifying-glass" />
            </Button>
            <Button variant="ghost" size="auto-sm">
              <Icon name="share-os" size="sm" />
              Shared
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Display options"
              aria-haspopup="dialog"
              onClick={() => setDisplayOpen(true)}
            >
              <Icon name="settings-slider-ver" />
            </Button>
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {waiting ? (
          <MobileListLoading label="Loading Capy Drive" />
        ) : visible.length === 0 ? (
          <MobileListEmpty line="Nothing in Capy Drive yet" />
        ) : (
          <div className="flex w-full flex-col gap-5 px-6 py-4">
            <div className="flex w-full flex-col">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2">
                {["Name", "Files", "Size"].map((label) => (
                  <span
                    key={label}
                    className="flex min-w-0 items-center truncate text-xs font-normal whitespace-nowrap text-muted-foreground-1 select-none"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-(--radius-card) bg-section px-2 text-xs font-medium text-muted-foreground-1">
                Scopes
                <span className="tabular-nums text-muted-foreground-3">
                  {visible.length}
                </span>
              </div>
              {visible.map((row) => (
                <div
                  key={row.id}
                  data-slot="drive-scope-row"
                  className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon
                      name={row.id.startsWith("personal") ? "user" : "folder-1"}
                      className="shrink-0 text-muted-foreground-1"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {row.name}
                      </span>
                      <span className="truncate text-xs font-normal text-muted-foreground-2">
                        {row.description}
                      </span>
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground-1 tabular-nums">
                    {row.files}
                  </span>
                  <span className="w-16 text-right text-xs text-muted-foreground-1 tabular-nums">
                    {row.size}
                  </span>
                </div>
              ))}
              <div className="flex h-8 items-center">
                <span className="ml-auto text-xs font-normal text-muted-foreground-1 tabular-nums">
                  {used.label}
                </span>
              </div>
              <div className="pb-1">
                <div
                  role="img"
                  aria-label={`${used.label} used`}
                  className="relative flex h-3 w-full items-center overflow-hidden"
                >
                  <div className="absolute inset-x-0 h-1 rounded-full bg-secondary" />
                  <div
                    className="relative flex h-1 rounded-full bg-chart-1"
                    style={{ width: `${used.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <MobileSheet
        label="Display"
        open={displayOpen}
        onOpenChange={setDisplayOpen}
      >
        <MobileSheetSearch
          placeholder="Search scopes"
          value={search}
          onValueChange={setSearch}
        />
        <MobileSheetSeparator />
        <MobileSheetRow
          label="Name"
          aria-checked
          onClick={() => setDisplayOpen(false)}
        />
        <MobileSheetRow
          label="Size"
          aria-checked={false}
          onClick={() => setDisplayOpen(false)}
        />
      </MobileSheet>
    </div>
  );
}
