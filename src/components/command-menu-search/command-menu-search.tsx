import {
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";
import { HighlightedText } from "@/components/filter-search";
import {
  CommandMenu,
  CommandMenuFilter,
  CommandMenuFilters,
  CommandMenuGroup,
  CommandMenuGroupLabel,
  CommandMenuList,
} from "@/primitives/command-menu";
import { Icon, type IconId } from "@/primitives/icon";
import {
  paletteEmptyClass,
  paletteFilterClass,
  paletteFiltersClass,
  paletteGhostButtonClass,
  paletteGroupClass,
  paletteGroupLabelClass,
  paletteItemIconClass,
  paletteItemTrailingClass,
  paletteListClass,
} from "./classes";
import { PaletteHint, PaletteInput, PaletteItem, PaletteKeys } from "./parts";
import {
  buildSearchResults,
  type CommandMenuSearchData,
  categoryLabels,
  categoryPlaceholders,
  emptySearchData,
  footerModeFor,
  formatAge,
  type PaletteAutomation,
  type PaletteCaptain,
  type PaletteCommand,
  type PalettePull,
  type PaletteThread,
  type PullState,
  type RunOptions,
  repoName,
  type SearchCategory,
  searchCategories,
  stepCategory,
  stripActionsPrefix,
  type ThreadStatus,
} from "./search";

export type OpenTarget =
  | { kind: "thread"; thread: PaletteThread }
  | { kind: "captain"; captain: PaletteCaptain }
  | { kind: "pull"; pull: PalettePull }
  | { kind: "automation"; automation: PaletteAutomation };

export type ComposeRequest = { query: string; seed: string };

export type CommandMenuSearchProps = ComponentProps<"div"> & {
  data?: CommandMenuSearchData;
  initialQuery?: string;
  initialCategory?: SearchCategory;
  now?: number;
  close?: () => void;
  onCompose?: (request: ComposeRequest) => void;
  onOpen?: (target: OpenTarget, options: RunOptions) => void;
  footer?: (hints: ReactNode) => ReactNode;
};

const threadStatusIcon: Record<ThreadStatus, IconId> = {
  working: "progress-50",
  waiting: "clock-alert",
  failed: "circle-x",
  idle: "circle-dotted",
  archived: "circle-dotted",
};

const pullStateIcon: Record<PullState, IconId> = {
  open: "branch-simple",
  draft: "branch-simple",
  merged: "git",
  closed: "circle-x",
};

const categoryKeys = ["←", "→"];
const newTabKeys = "⌘↵";

const initials = (name: string) => name.trim().slice(0, 1).toUpperCase();

function Avatar({ name, src }: { name: string; src?: string }) {
  return src === undefined ? (
    <span className="inline-flex size-(--icon-base) items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground-1">
      {initials(name)}
    </span>
  ) : (
    <img
      alt=""
      src={src}
      className="size-(--icon-base) rounded-full object-cover"
    />
  );
}

export function CommandMenuSearch({
  data = emptySearchData,
  initialQuery = "",
  initialCategory = "all",
  now = Date.now(),
  close,
  onCompose,
  onOpen,
  footer,
  className,
  ...props
}: CommandMenuSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory>(initialCategory);
  const [highlighted, setHighlighted] = useState<string | undefined>();
  const modifier = useRef(false);
  const results = useMemo(
    () => buildSearchResults(query, category, data),
    [query, category, data],
  );
  const { parsed } = results;
  const term = parsed.term;
  const mode = footerModeFor(highlighted, results);

  const compose = () =>
    onCompose?.({ query, seed: parsed.actionsPrefix ? "" : parsed.text });

  const execute =
    (run: (options: RunOptions) => void, keepOpen?: boolean) =>
    (event: MouseEvent) => {
      if (keepOpen !== true) close?.();
      run({ newTab: event.metaKey || event.ctrlKey || modifier.current });
    };

  const open = (target: OpenTarget) =>
    execute((options) => onOpen?.(target, options));

  const selectCategory = (next: SearchCategory) => {
    setCategory(next);
    if (!parsed.actionsPrefix) return;
    setQuery(stripActionsPrefix(query));
  };

  const clickActive = (input: HTMLInputElement) => {
    const id = input.getAttribute("aria-activedescendant");
    const target =
      id === null || id === "" ? null : input.ownerDocument.getElementById(id);
    if (target instanceof HTMLElement) target.click();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const plain =
      !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey;
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && plain) {
      event.preventDefault();
      selectCategory(
        stepCategory(parsed.category, event.key === "ArrowLeft" ? -1 : 1),
      );
      return;
    }
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      compose();
      return;
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      clickActive(event.currentTarget);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close?.();
    }
  };

  const commandRow = (command: PaletteCommand) => (
    <PaletteItem
      key={command.id}
      value={command.id}
      intent={command.intent}
      onClick={execute(command.run, command.keepOpen)}
    >
      <span className={paletteItemIconClass}>
        <Icon name={command.icon} />
      </span>
      <span className="min-w-0 truncate">
        <HighlightedText text={command.title} term={term} />
      </span>
      <span className={paletteItemTrailingClass}>
        {command.context === undefined ? null : (
          <span>
            <HighlightedText text={command.context} term={term} />
          </span>
        )}
        {command.checked === true ? (
          <Icon name="checkmark-1" className="size-(--icon-sm)" />
        ) : null}
        {command.shortcut === undefined ? null : (
          <PaletteKeys keys={command.shortcut} />
        )}
      </span>
    </PaletteItem>
  );

  const captainRow = (captain: PaletteCaptain) => (
    <PaletteItem
      key={captain.id}
      value={`captain-${captain.id}`}
      onClick={open({ kind: "captain", captain })}
    >
      <span className={paletteItemIconClass}>
        <Avatar name={captain.name} src={captain.avatarUrl} />
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 truncate">
          <HighlightedText text={captain.name} term={term} />
        </span>
        {captain.description === undefined ? null : (
          <span className="min-w-0 truncate text-xs text-muted-foreground-2">
            <HighlightedText text={captain.description} term={term} />
          </span>
        )}
        {(captain.crewCount ?? 0) === 0 ? null : (
          <span className="shrink-0 text-xs text-muted-foreground-2">
            {captain.crewCount} in crew
          </span>
        )}
      </span>
      <span className={paletteItemTrailingClass}>
        <span className="min-w-8 text-right tabular-nums">
          {formatAge(captain.updatedAt, now)}
        </span>
      </span>
    </PaletteItem>
  );

  const threadRow = (thread: PaletteThread) => (
    <PaletteItem
      key={thread.id}
      value={`thread-${thread.id}`}
      onClick={open({ kind: "thread", thread })}
    >
      <span className="flex shrink-0 items-center justify-center">
        <Icon
          name={threadStatusIcon[thread.status]}
          className={
            thread.hasUnreads === true ? "text-foreground" : "text-icon-muted"
          }
        />
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span
          className={
            thread.hasUnreads === true
              ? "min-w-0 truncate font-semibold text-foreground"
              : "min-w-0 truncate"
          }
        >
          <HighlightedText text={thread.title} term={term} />
        </span>
      </span>
      <span className={paletteItemTrailingClass}>
        {thread.archived === true ? <span>Archived</span> : null}
        {thread.projectName === undefined ? null : (
          <span>{thread.projectName}</span>
        )}
        <span className="min-w-8 text-right tabular-nums">
          {formatAge(thread.updatedAt, now)}
        </span>
      </span>
    </PaletteItem>
  );

  const pullRow = (pull: PalettePull) => (
    <PaletteItem
      key={pull.id}
      value={`pull-${pull.id}`}
      onClick={open({ kind: "pull", pull })}
    >
      <span className={paletteItemIconClass}>
        <Icon name={pullStateIcon[pull.state]} />
      </span>
      <Avatar name={pull.author} />
      <span className="min-w-0 truncate">
        <HighlightedText text={pull.title} term={term} />
      </span>
      <span className={paletteItemTrailingClass}>
        <span>
          {repoName(pull.repo)}#{pull.number}
        </span>
        <span className="min-w-8 text-right tabular-nums">
          {formatAge(pull.updatedAt, now)}
        </span>
      </span>
    </PaletteItem>
  );

  const automationRow = (automation: PaletteAutomation) => (
    <PaletteItem
      key={automation.id}
      value={`automation-${automation.id}`}
      onClick={open({ kind: "automation", automation })}
    >
      <span className={paletteItemIconClass}>
        <Icon name="calendar-repeat" />
      </span>
      <span className="min-w-0 truncate">
        <HighlightedText text={automation.name} term={term} />
      </span>
      {automation.enabled ? null : (
        <span className={paletteItemTrailingClass}>Disabled</span>
      )}
    </PaletteItem>
  );

  const hints =
    mode === "select" ? (
      <>
        <PaletteHint keys="↵" label="Select" />
        <PaletteHint keys={categoryKeys} label="Category" />
        <PaletteHint keys="Esc" label="Close" />
      </>
    ) : (
      <>
        <PaletteHint keys="↵" label="Open" />
        <PaletteHint keys={newTabKeys} label="Open in new tab" />
        <PaletteHint keys={categoryKeys} label="Category" />
      </>
    );

  return (
    <div
      className={["flex min-h-0 flex-col", className].filter(Boolean).join(" ")}
      onKeyDownCapture={(event) => {
        modifier.current = event.metaKey || event.ctrlKey;
      }}
      onKeyUpCapture={(event) => {
        modifier.current = event.metaKey || event.ctrlKey;
      }}
      onBlurCapture={() => {
        modifier.current = false;
      }}
      {...props}
    >
      <CommandMenu
        open
        mode="none"
        autoHighlight="always"
        value={query}
        onValueChange={(value) => setQuery(value)}
        onItemHighlighted={(value) =>
          setHighlighted(typeof value === "string" ? value : undefined)
        }
      >
        <PaletteInput
          placeholder={categoryPlaceholders[parsed.category]}
          onKeyDown={onKeyDown}
          trailing={
            <button
              type="button"
              data-slot="button"
              className={`${paletteGhostButtonClass} pointer-coarse:hidden`}
              onClick={compose}
            >
              New thread
              <PaletteKeys keys="⇥" />
            </button>
          }
        />
        <CommandMenuFilters
          role="tablist"
          aria-label="Filter"
          className={paletteFiltersClass}
        >
          {searchCategories.map((key) => (
            <CommandMenuFilter
              key={key}
              type="button"
              role="tab"
              tabIndex={-1}
              aria-selected={key === parsed.category}
              data-filter={key}
              className={paletteFilterClass}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectCategory(key)}
            >
              {categoryLabels[key]}
            </CommandMenuFilter>
          ))}
        </CommandMenuFilters>
        <CommandMenuList className={paletteListClass}>
          <div data-slot="command-menu-empty" className={paletteEmptyClass}>
            {results.emptyText}
          </div>
          {results.groups.map((group) => (
            <CommandMenuGroup
              key={group.key}
              data-search-group={
                group.kind === "commands" ? group.searchGroup : group.kind
              }
              className={paletteGroupClass}
            >
              <CommandMenuGroupLabel className={paletteGroupLabelClass}>
                {group.label}
              </CommandMenuGroupLabel>
              {group.kind === "captains"
                ? group.items.map(captainRow)
                : group.kind === "threads"
                  ? group.items.map(threadRow)
                  : group.kind === "pulls"
                    ? group.items.map(pullRow)
                    : group.kind === "automations"
                      ? group.items.map(automationRow)
                      : group.items.map(commandRow)}
            </CommandMenuGroup>
          ))}
          {results.compose ? (
            <PaletteItem value="compose-query" onClick={compose}>
              <span className={paletteItemIconClass}>
                <Icon name="page-edit-text" />
              </span>
              <span className="min-w-0 truncate">
                New thread: {parsed.text}
              </span>
            </PaletteItem>
          ) : null}
        </CommandMenuList>
      </CommandMenu>
      {footer?.(hints)}
    </div>
  );
}
