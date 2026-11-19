import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileSearchResults,
  type FileSearchResultsValue,
} from "@/components/file-search";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Popover, PopoverContent } from "@/primitives/popover";

const resultLimit = 20;

/**
 * Case-insensitive substring match, best first: a name hit outranks a folder
 * hit, and a shorter path outranks a longer one at the same depth.
 */
export function searchDrivePaths(
  paths: ReadonlyArray<string>,
  query: string,
  limit = resultLimit,
): ReadonlyArray<string> {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];
  return paths
    .filter((path) => path.toLowerCase().includes(needle))
    .map((path) => {
      const name = path.split("/").at(-1) ?? path;
      const inName = name.toLowerCase().includes(needle);
      return { path, score: inName ? 0 : 1 };
    })
    .sort((a, b) => a.score - b.score || a.path.length - b.path.length)
    .slice(0, limit)
    .map((hit) => hit.path);
}

/** Where a query sits in a path, for the row's highlight. */
const rangesOf = (path: string, query: string) => {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];
  const at = path.toLowerCase().indexOf(needle);
  return at === -1 ? [] : [{ start: at, end: at + needle.length }];
};

export type DriveSearchProps = {
  /** Every file in the volume, which is what the tree already holds. */
  paths: ReadonlyArray<string>;
  onOpen: (path: string) => void;
};

/**
 * Drive-wide search over the volume. Capy's field is `Search file contents`;
 * this one matches names and paths, because the contract declares no route that
 * searches a volume's contents — the only content read is one file at a time.
 */
export function DriveSearch({ paths, onOpen }: DriveSearchProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => searchDrivePaths(paths, query), [paths, query]);
  const results: FileSearchResultsValue = {
    files: matches.map((path) => ({
      path,
      where: "path",
      ranges: rangesOf(path, query),
    })),
    content: [],
    pending: false,
    skipped: 0,
  };
  const current = active >= matches.length ? matches.length - 1 : active;
  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && field.current?.contains(event.target))
        return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const pick = (path: string) => {
    setOpen(false);
    setQuery("");
    onOpen(path);
  };
  const onKeyDown = (event: globalThis.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => {
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next = (index < 0 ? -1 : index) + step;
        return Math.min(Math.max(next, 0), matches.length - 1);
      });
      return;
    }
    if (event.key === "Enter" && current >= 0) {
      const target = matches[current];
      if (target !== undefined) {
        event.preventDefault();
        pick(target);
      }
    }
  };
  return (
    <div className="relative">
      <Input
        ref={field}
        icon={<Icon name="magnifying-glass" />}
        size="sm"
        aria-label="Search files"
        placeholder="Search files"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(-1);
          setOpen(event.target.value.trim() !== "");
        }}
        onFocus={() => setOpen(query.trim() !== "")}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverContent
          data-slot="drive-search-results"
          anchor={field.current}
          align="end"
          sideOffset={4}
        >
          <FileSearchResults
            results={results}
            active={current}
            onActiveChange={setActive}
            onOpen={(target) => pick(target.path)}
            icon={() => (
              <Icon name="file-text" size="sm" className="text-icon-muted" />
            )}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
