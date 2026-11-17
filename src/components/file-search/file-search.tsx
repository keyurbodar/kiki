import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { type ContentMatch, type MatchRange, splitHits } from "./match";

const sectionLabel =
  "mt-1 flex min-h-5.5 items-center px-2 text-xs font-medium text-muted-foreground-2 first:mt-0";

export const fileSearchRowClass =
  "relative flex h-(--h-menu-row) w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal text-foreground outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-sm) data-[highlighted]:bg-[var(--menu-row-highlight,var(--popover-hover))]";

export type HighlightProps = {
  text: string;
  ranges: readonly MatchRange[];
  hitClassName: string;
};

export function Highlight({ text, ranges, hitClassName }: HighlightProps) {
  return splitHits(text, ranges).map((segment, index) =>
    segment.hit ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
      <span key={index} className={hitClassName}>
        {segment.text}
      </span>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
      <span key={index}>{segment.text}</span>
    ),
  );
}

export function SearchDirectory({ path }: { path: string }) {
  return (
    <span className="truncate-start min-w-0 text-xs font-normal text-muted-foreground-3">
      <bdi>{path}</bdi>
    </span>
  );
}

export type SearchPathProps = {
  path: string;
  where: "name" | "path";
  ranges: readonly MatchRange[];
};

export function SearchPath({ path, where, ranges }: SearchPathProps) {
  const slash = path.lastIndexOf("/");
  const name = path.slice(slash + 1);
  if (where === "name" || slash === -1) {
    return (
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-foreground">
          {where === "name" ? (
            <Highlight text={name} ranges={ranges} hitClassName="font-medium" />
          ) : (
            name
          )}
        </span>
        {slash !== -1 && <SearchDirectory path={path.slice(0, slash)} />}
      </span>
    );
  }
  const nameStart = slash + 1;
  const nameRanges = ranges
    .filter((range) => range.end > nameStart)
    .map((range) => ({
      start: Math.max(0, range.start - nameStart),
      end: range.end - nameStart,
    }));
  const directoryRanges = ranges
    .filter((range) => range.start < slash)
    .map((range) => ({ start: range.start, end: Math.min(range.end, slash) }));
  return (
    <span className="flex min-w-0 flex-1 items-baseline gap-2">
      <span className="truncate text-foreground">
        <Highlight text={name} ranges={nameRanges} hitClassName="font-medium" />
      </span>
      <span className="truncate-start min-w-0 text-xs font-normal text-muted-foreground-3">
        <bdi>
          <Highlight
            text={path.slice(0, slash)}
            ranges={directoryRanges}
            hitClassName="font-medium text-muted-foreground-1"
          />
        </bdi>
      </span>
    </span>
  );
}

export type SearchRowProps = {
  index: number;
  active: number;
  activeRef: RefObject<HTMLDivElement | null>;
  onActiveChange: (index: number) => void;
  onOpen: () => void;
  compact?: boolean;
  children: ReactNode;
};

export function SearchRow({
  index,
  active,
  activeRef,
  onActiveChange,
  onOpen,
  compact = false,
  children,
}: SearchRowProps) {
  const current = index === active;
  return (
    <div
      data-track-owner="shared/files/file-search.tsx#SearchRow:div.1"
      ref={current ? activeRef : undefined}
      id={`capy-file-search-row-${index}`}
      role="option"
      tabIndex={-1}
      aria-selected={current}
      data-highlighted={current ? "" : undefined}
      className={cn(
        fileSearchRowClass,
        compact && "h-6 pointer-coarse:h-(--h-menu-row)",
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        onOpen();
      }}
      onMouseEnter={() => onActiveChange(index)}
    >
      {children}
    </div>
  );
}

export type FileSearchFileResult = SearchPathProps;

export type FileSearchResultsValue = {
  files: readonly FileSearchFileResult[];
  content: readonly ContentMatch[];
  pending: boolean;
  skipped: number;
};

export const fileSearchResultCount = (results: FileSearchResultsValue) =>
  results.files.length + results.content.length;

export const fileSearchResultAt = (
  results: FileSearchResultsValue,
  index: number,
): { path: string; line?: number } | undefined => {
  const file = results.files[index];
  if (file !== undefined) return { path: file.path };
  const hit = results.content[index - results.files.length];
  return hit === undefined
    ? undefined
    : { path: hit.path, line: hit.lineNumber };
};

export type FileSearchResultsProps = {
  results: FileSearchResultsValue;
  active: number;
  onActiveChange: (index: number) => void;
  onOpen: (target: { path: string; line?: number }) => void;
  icon: (name: string) => ReactNode;
};

export function FileSearchResults({
  results,
  active,
  onActiveChange,
  onOpen,
  icon,
}: FileSearchResultsProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (active < 0) return;
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const empty = !results.pending && fileSearchResultCount(results) === 0;
  return (
    <div
      role="listbox"
      aria-label="File search results"
      id="capy-file-search"
      className="flex max-h-96 w-105 max-w-[calc(100vw-(--spacing(4)))] flex-col overflow-hidden"
    >
      <div role="presentation" className="min-h-0 flex-1 overflow-y-auto p-1">
        {empty && (
          <div className="px-2 py-6 text-center text-sm font-normal text-muted-foreground-2">
            No results found
          </div>
        )}
        {results.files.length > 0 && <div className={sectionLabel}>Files</div>}
        {results.files.map((file, index) => (
          <SearchRow
            key={`file:${file.path}`}
            index={index}
            active={active}
            activeRef={activeRef}
            onActiveChange={onActiveChange}
            onOpen={() => onOpen({ path: file.path })}
          >
            {icon(file.path.split("/").at(-1) ?? file.path)}
            <SearchPath
              path={file.path}
              where={file.where}
              ranges={file.ranges}
            />
          </SearchRow>
        ))}
        {results.content.length > 0 && <div className={sectionLabel}>Code</div>}
        {results.content.map((hit, index) => {
          const header =
            results.content[index - 1]?.path === hit.path
              ? undefined
              : hit.path;
          return (
            <div key={`content:${hit.path}:${hit.lineNumber}`}>
              {header !== undefined && (
                <div className="flex min-w-0 items-center gap-2 px-2 pt-2 pb-1">
                  {icon(header.split("/").at(-1) ?? header)}
                  <span className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="truncate text-sm text-foreground">
                      {header.split("/").at(-1)}
                    </span>
                    {header.includes("/") && (
                      <SearchDirectory
                        path={header.slice(0, header.lastIndexOf("/"))}
                      />
                    )}
                  </span>
                </div>
              )}
              <SearchRow
                index={results.files.length + index}
                active={active}
                activeRef={activeRef}
                onActiveChange={onActiveChange}
                onOpen={() => onOpen({ path: hit.path, line: hit.lineNumber })}
                compact
              >
                <span className="w-7 shrink-0 pl-1 text-right font-mono text-2xs text-muted-foreground-3 tabular-nums">
                  {hit.lineNumber}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-2xs text-muted-foreground-1">
                  <Highlight
                    text={hit.lineText}
                    ranges={hit.ranges}
                    hitClassName="bg-primary-20 text-foreground"
                  />
                </span>
              </SearchRow>
            </div>
          );
        })}
        {results.pending && (
          <div className="px-2 py-2 text-center text-xs font-normal text-muted-foreground-3">
            Searching
          </div>
        )}
        {!results.pending && results.skipped > 0 && (
          <div className={cn(sectionLabel, "mb-1")}>
            {results.skipped === 1
              ? "1 file not searched"
              : `${results.skipped} files not searched`}
          </div>
        )}
      </div>
    </div>
  );
}
