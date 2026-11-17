import {
  type ChangeEvent,
  type ComponentProps,
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
  useLayoutEffect,
  useState,
} from "react";
import { menuRowVariants } from "@/primitives/menu";
import {
  type FilterKey,
  type FilterToken,
  filterKeyLabels,
  keySuggestions,
  parseFilterQuery,
  parseSince,
  sincePresets,
  spliceFilterQuery,
} from "./filter-input";
import { matchText, rankOptions, splitByRanges } from "./match";

export type FilterOption = {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly chipIcon?: ReactNode;
  readonly trailing?: ReactNode;
  readonly group?: string;
  readonly terms: ReadonlyArray<string>;
};

export type FilterOptions = Record<FilterKey, ReadonlyArray<FilterOption>>;

export type FilterSelection = Record<FilterKey, ReadonlyArray<string>>;

export const filterSearchPanelId = "capy-filter-search";

const maxSuggestions = 40;

/** Turns typed since: text into a preset or a custom range ending now. */
export const sinceToRange = (value: string, now: Date) => {
  const preset = sincePresets.find((candidate) => candidate === value);
  if (preset !== undefined) return preset;
  const from = parseSince(value, now);
  return from === undefined
    ? undefined
    : {
        kind: "custom" as const,
        from: from.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
      };
};

/** Resolves a typed value to an option id, or keeps free text where the key allows it. */
export const resolveFilterValue = (
  options: FilterOptions,
  key: FilterKey,
  raw: string,
  viewerId?: string,
) => {
  const value = raw.trim();
  if (value === "") return undefined;
  if (key === "author" && value.toLowerCase() === "me")
    return viewerId ?? value;
  if (key === "since")
    return parseSince(value, new Date()) === undefined ? undefined : value;
  const best = rankOptions(options[key], value)[0];
  if (best !== undefined && best.match?.tier !== "fuzzy") return best.item.id;
  if (key === "author") return `github:${value.replace(/^@/, "")}`;
  if (key !== "status" && key !== "captain") return value;
  return undefined;
};

export function HighlightedText({
  text,
  term,
}: {
  text: string;
  term: string;
}) {
  const found = term === "" ? undefined : matchText(text, term);
  if (found === undefined) return text;
  return splitByRanges(text, found.ranges).map((segment, index) =>
    segment.hit ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments have no identity
      <span key={index} className="font-medium">
        {segment.text}
      </span>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments have no identity
      <Fragment key={index}>{segment.text}</Fragment>
    ),
  );
}

export type FilterSearchBinding = {
  value: string;
  onValueChange: (value: string, input?: HTMLInputElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSelect: (event: SyntheticEvent<HTMLInputElement>) => void;
  panelId: string;
  activeDescendant: string | undefined;
  panel: ReactNode;
};

export type UseFilterSearchOptions = {
  options: FilterOptions;
  /** Whether a key accepts a value (a screen can refuse, say, a status it cannot filter). */
  accepts: (key: FilterKey, value: string) => boolean;
  selected: FilterSelection;
  onCommit: (tokens: ReadonlyArray<FilterToken>) => void;
  onRemove: (key: FilterKey) => void;
  /** Controlled text; uncontrolled when omitted. */
  text?: { value: string; onChange: (value: string) => void };
  viewerId?: string;
  keyIcons?: Partial<Record<FilterKey, ReactNode>>;
  /** Icon for the "Filter by" key rows and free-text authors. */
  keyIcon?: ReactNode;
  authorIcon?: ReactNode;
};

type Suggestion = {
  id: string;
  group: string;
  icon?: ReactNode;
  label: string;
  detail?: string;
  trailing?: ReactNode;
  pick: () => void;
};

/** Search-box filtering: typing key:value commits a chip; the panel suggests keys and values. */
export function useFilterSearch({
  options,
  accepts,
  selected,
  onCommit,
  onRemove,
  text,
  viewerId,
  keyIcons,
  keyIcon,
  authorIcon,
}: UseFilterSearchOptions): { term: string; search: FilterSearchBinding } {
  const [ownText, setOwnText] = useState("");
  const value = text?.value ?? ownText;
  const setValue = text?.onChange ?? setOwnText;
  const [cursor, setCursor] = useState({ query: "", caret: 0 });
  const caret = cursor.query === value ? cursor.caret : value.length;
  const [highlight, setHighlight] = useState({ query: "", index: 0 });
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [commitOrder, setCommitOrder] = useState<ReadonlyArray<FilterKey>>([]);
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [restoreCaret, setRestoreCaret] = useState<{ at: number } | null>(null);

  useLayoutEffect(() => {
    if (restoreCaret !== null)
      input?.setSelectionRange(restoreCaret.at, restoreCaret.at);
  }, [restoreCaret, input]);

  const active = parseFilterQuery(value, caret).active;
  const valueToken = active?.kind === "value" ? active : undefined;
  const keyRows =
    active?.kind === "key" && active.prefix.length >= 2
      ? keySuggestions(active.prefix)
      : [];

  const resolve = (
    key: FilterKey,
    raw: string,
    within: FilterOptions = options,
  ) => {
    const id = resolveFilterValue(within, key, raw, viewerId);
    return id !== undefined && accepts(key, id) ? id : undefined;
  };

  const commit = (tokens: ReadonlyArray<FilterToken>) => {
    onCommit(tokens);
    const keys = tokens.map((token) => token.key);
    setCommitOrder((order) => [
      ...order.filter((key) => !keys.includes(key)),
      ...keys,
    ]);
  };

  const replaceText = (next: { text: string; caret: number }) => {
    setValue(next.text);
    setCursor({ query: next.text, caret: next.caret });
    setRestoreCaret({ at: next.caret });
  };

  const onValueChange = (next: string, element?: HTMLInputElement) => {
    if (element !== undefined) setInput(element);
    const at = element?.selectionStart ?? next.length;
    const complete = parseFilterQuery(next, at).tokens.flatMap((token) => {
      const values = token.values.flatMap(
        (raw) => resolve(token.key, raw) ?? [],
      );
      return values.length === 0 ? [] : [{ span: token, values }];
    });
    if (complete.length === 0) {
      setValue(next);
      setCursor({ query: next, caret: at });
      return;
    }
    commit(complete.map(({ span, values }) => ({ key: span.key, values })));
    const stripped = complete.toReversed().reduce(
      (state, { span }) => {
        const spliced = spliceFilterQuery(state.text, span.start, span.end);
        const removed = state.text.length - spliced.text.length;
        return {
          text: spliced.text,
          caret: span.end <= state.caret ? state.caret - removed : state.caret,
        };
      },
      { text: next, caret: at },
    );
    replaceText({
      text: stripped.text,
      caret: Math.max(0, Math.min(stripped.caret, stripped.text.length)),
    });
  };

  const pickValue = (id: string) => {
    if (valueToken === undefined) return;
    const earlier = valueToken.values.flatMap(
      (raw) => resolve(valueToken.key, raw) ?? [],
    );
    commit([{ key: valueToken.key, values: [...earlier, id] }]);
    replaceText(spliceFilterQuery(value, valueToken.start, valueToken.end));
  };

  const pickKey = (key: FilterKey) => {
    if (active?.kind === "key")
      replaceText(
        spliceFilterQuery(value, active.start, active.end, `${key}:`),
      );
  };

  const partial = valueToken?.partial.trim() ?? "";
  const partialLower = partial.toLowerCase();
  const ranked =
    valueToken === undefined
      ? []
      : rankOptions(options[valueToken.key], valueToken.partial, [
          ...selected[valueToken.key],
          ...valueToken.values.flatMap(
            (raw) => resolve(valueToken.key, raw) ?? [],
          ),
        ])
          .map((ranking) => ranking.item)
          .filter((option) => accepts(valueToken.key, option.id))
          .slice(0, maxSuggestions);
  const raw =
    valueToken === undefined ||
    partial === "" ||
    ranked.some((option) => option.label.toLowerCase() === partialLower)
      ? undefined
      : resolve(valueToken.key, partial, { ...options, [valueToken.key]: [] });

  const suggestions: Suggestion[] =
    valueToken === undefined
      ? keyRows.map((key) => ({
          id: `key-${key}`,
          group: "Filter by",
          icon: keyIcon,
          label: `${key}:`,
          detail: filterKeyLabels[key],
          pick: () => pickKey(key),
        }))
      : [
          ...ranked.map((option) => ({
            id: `value-${option.id}`,
            group: option.group ?? filterKeyLabels[valueToken.key],
            icon: option.icon,
            label: option.label,
            trailing: option.trailing,
            pick: () => pickValue(option.id),
          })),
          ...(raw === undefined
            ? []
            : [
                {
                  id: `raw-${raw}`,
                  group:
                    ranked.at(-1)?.group ?? filterKeyLabels[valueToken.key],
                  icon:
                    valueToken.key === "author"
                      ? authorIcon
                      : keyIcons?.[valueToken.key],
                  label: partial,
                  pick: () => pickValue(raw),
                },
              ]),
        ];

  const open =
    suggestions.length > 0 && dismissedFor !== value && cursor.query === value;
  const index =
    highlight.query === value
      ? Math.min(highlight.index, suggestions.length - 1)
      : 0;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    setInput(event.currentTarget);
    if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlight({
        query: value,
        index: (index + step + suggestions.length) % suggestions.length,
      });
      return;
    }
    if (
      open &&
      (event.key === "Enter" || (event.key === "Tab" && !event.shiftKey))
    ) {
      event.preventDefault();
      suggestions[index]?.pick();
      return;
    }
    if (open && event.key === "Escape") {
      event.preventDefault();
      setDismissedFor(value);
      return;
    }
    if (event.key !== "Backspace" || value !== "") return;
    const last = commitOrder.findLast((key) => selected[key].length > 0);
    if (last === undefined) return;
    event.preventDefault();
    onRemove(last);
    setCommitOrder((order) => order.filter((key) => key !== last));
  };

  const onSelect = (event: SyntheticEvent<HTMLInputElement>) => {
    setInput(event.currentTarget);
    setCursor({
      query: value,
      caret: event.currentTarget.selectionStart ?? value.length,
    });
  };

  const groups = [
    ...new Set(suggestions.map((suggestion) => suggestion.group)),
  ];
  const highlightTerm = active?.kind === "key" ? active.prefix : partialLower;
  const panel = open ? (
    <div
      role="listbox"
      aria-label="Filter suggestions"
      id={filterSearchPanelId}
      data-slot="menu-content"
      className="flex max-h-96 w-72 max-w-[calc(100vw-(--spacing(4)))] flex-col overflow-hidden"
    >
      <div role="presentation" className="min-h-0 flex-1 overflow-y-auto p-1">
        {groups.map((group) => (
          // biome-ignore lint/a11y/useSemanticElements: Capy's panel groups options in a div with role="group"
          <div key={group} role="group" aria-label={group}>
            <div
              data-slot="menu-label"
              className="px-2 py-1.5 text-xs font-medium text-muted-foreground-2"
            >
              {group}
            </div>
            {suggestions.flatMap((suggestion, at) =>
              suggestion.group === group
                ? [
                    <div
                      key={suggestion.id}
                      ref={at === index ? scrollIntoNearest : undefined}
                      id={`${filterSearchPanelId}-row-${at}`}
                      role="option"
                      tabIndex={-1}
                      aria-selected={at === index}
                      data-highlighted={at === index ? "" : undefined}
                      className={menuRowVariants()}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        suggestion.pick();
                      }}
                      onMouseEnter={() =>
                        setHighlight({ query: value, index: at })
                      }
                    >
                      <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted">
                        {suggestion.icon}
                      </span>
                      <span className="min-w-0 truncate">
                        <HighlightedText
                          text={suggestion.label}
                          term={highlightTerm}
                        />
                        {suggestion.detail === undefined ? null : (
                          <span className="ml-1.5 text-xs text-muted-foreground-2">
                            {suggestion.detail}
                          </span>
                        )}
                      </span>
                      {suggestion.trailing === undefined ? null : (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground-2">
                          {suggestion.trailing}
                        </span>
                      )}
                    </div>,
                  ]
                : [],
            )}
          </div>
        ))}
      </div>
    </div>
  ) : undefined;

  const term = (
    valueToken === undefined
      ? value
      : spliceFilterQuery(value, valueToken.start, valueToken.end).text
  ).trim();

  return {
    term,
    search: {
      value,
      onValueChange,
      onKeyDown,
      onSelect,
      panelId: filterSearchPanelId,
      activeDescendant: open
        ? `${filterSearchPanelId}-row-${index}`
        : undefined,
      panel,
    },
  };
}

const scrollIntoNearest = (element: HTMLElement | null) =>
  element?.scrollIntoView?.({ block: "nearest" });

export type FilterSearchProps = Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "onKeyDown" | "onSelect"
> & {
  search: FilterSearchBinding;
};

/** A search input bound to useFilterSearch, with its suggestion panel underneath. */
export function FilterSearch({
  search,
  className,
  ...props
}: FilterSearchProps) {
  return (
    <div data-slot="filter-search" className="relative min-w-0 flex-1">
      <input
        type="search"
        role="combobox"
        aria-expanded={search.panel !== undefined}
        aria-controls={search.panelId}
        aria-activedescendant={search.activeDescendant}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        {...props}
        className={className}
        value={search.value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          search.onValueChange(event.currentTarget.value, event.currentTarget)
        }
        onKeyDown={search.onKeyDown}
        onSelect={search.onSelect}
      />
      {search.panel === undefined ? null : (
        <div className="absolute top-full left-0 z-(--z-overlay-content) mt-1">
          {search.panel}
        </div>
      )}
    </div>
  );
}
