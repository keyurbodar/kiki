import {
  type ActiveFilterToken,
  type FilterKey,
  type FilterToken,
  filterKeyLabels,
  filterValues,
  keySuggestions,
  type MatchTier,
  matchText,
  mergeFilterToken,
  parseFilterQuery,
  parseSince,
  sincePresetLabels,
  sincePresets,
} from "@/components/filter-search";
import type { IconId } from "@/primitives/icon";

export const searchCategories = [
  "all",
  "captains",
  "threads",
  "pulls",
  "automations",
  "actions",
  "settings",
] as const;

export type SearchCategory = (typeof searchCategories)[number];

export const categoryLabels: Record<SearchCategory, string> = {
  all: "All",
  captains: "Captains",
  threads: "Threads",
  pulls: "Pull requests",
  automations: "Automations",
  actions: "Actions",
  settings: "Settings",
};

export const categoryPlaceholders: Record<SearchCategory, string> = {
  all: "Search threads, actions, settings…",
  captains: "Search Captains…",
  threads: "Search threads…",
  pulls: "Search pull requests…",
  automations: "Search automations…",
  actions: "Search actions…",
  settings: "Search settings…",
};

export type CommandKind =
  | "threadAction"
  | "action"
  | "navigation"
  | "appearance"
  | "account"
  | "admin";

export type ResultKind =
  | CommandKind
  | "captain"
  | "thread"
  | "pull"
  | "automation"
  | "setting";

export const groupLabels: Record<ResultKind, string> = {
  threadAction: "This thread",
  action: "Actions",
  navigation: "Go to",
  appearance: "Appearance",
  account: "Account",
  admin: "Admin",
  captain: "Captains",
  thread: "Threads",
  pull: "Pull requests",
  automation: "Automations",
  setting: "Settings",
};

const kindCategory: Record<ResultKind, SearchCategory> = {
  threadAction: "actions",
  action: "actions",
  navigation: "actions",
  appearance: "actions",
  account: "actions",
  admin: "actions",
  captain: "captains",
  thread: "threads",
  pull: "pulls",
  automation: "automations",
  setting: "settings",
};

export const showsKind = (category: SearchCategory, kind: ResultKind) =>
  category === "all" || kindCategory[kind] === category;

export const stepCategory = (category: SearchCategory, delta: number) =>
  searchCategories[
    (searchCategories.indexOf(category) + delta + searchCategories.length) %
      searchCategories.length
  ] ?? "all";

export type RunOptions = { newTab: boolean };

export type PaletteCommand = {
  id: string;
  kind: CommandKind | "setting";
  icon: IconId;
  title: string;
  searchTerms: ReadonlyArray<string>;
  context?: string;
  checked?: boolean;
  shortcut?: ReadonlyArray<string>;
  intent?: "danger";
  keepOpen?: boolean;
  run: (options: RunOptions) => void;
};

export type ThreadStatus =
  | "working"
  | "waiting"
  | "failed"
  | "idle"
  | "archived";

export type PaletteThread = {
  id: string;
  title: string;
  status: ThreadStatus;
  updatedAt: number;
  projectName?: string;
  archived?: boolean;
  hasUnreads?: boolean;
  /** Who started the thread, so `author:` can name them. */
  author?: string;
  /** The thread's tag names, so `label:` can name them. */
  labels?: ReadonlyArray<string>;
};

export type PaletteCaptain = {
  id: string;
  name: string;
  description?: string;
  crewCount?: number;
  avatarUrl?: string;
  updatedAt: number;
  archived?: boolean;
};

export type PullState = "open" | "draft" | "merged" | "closed";

export type PalettePull = {
  id: string;
  number: number;
  title: string;
  repo: string;
  author: string;
  headRef?: string;
  state: PullState;
  updatedAt: number;
};

export type PaletteAutomation = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
};

export type PaletteSettingsSection = {
  label: string;
  commands: ReadonlyArray<PaletteCommand>;
};

export type CommandMenuSearchData = {
  captains: ReadonlyArray<PaletteCaptain>;
  threads: ReadonlyArray<PaletteThread>;
  pulls: ReadonlyArray<PalettePull>;
  automations: ReadonlyArray<PaletteAutomation>;
  commands: ReadonlyArray<PaletteCommand>;
  currentThread?: {
    thread: PaletteThread;
    commands: ReadonlyArray<PaletteCommand>;
  };
  settings: ReadonlyArray<PaletteCommand>;
  settingsSections: ReadonlyArray<PaletteSettingsSection>;
};

export const emptySearchData: CommandMenuSearchData = {
  captains: [],
  threads: [],
  pulls: [],
  automations: [],
  commands: [],
  settings: [],
  settingsSections: [],
};

export const actionOrder = [
  "shortcut-thread.new",
  "captain-new",
  "issue-new",
  "automation-new",
  "project-new",
  "folder-new",
  "go-threads",
  "go-issues",
];

const groupLimit = 8;
const categoryLimit = 40;
const recentThreadLimit = 5;
const recentCaptainLimit = 4;
export const pullSearchMinLength = 2;

const statusRank: Record<ThreadStatus, number> = {
  working: 0,
  waiting: 1,
  failed: 2,
  idle: 3,
  archived: 4,
};

const tierScore: Record<MatchTier, number> = {
  exact: 1,
  prefix: 0.9,
  word: 0.75,
  substring: 0.6,
  fuzzy: 0.3,
};

export const scoreTerms = (
  terms: ReadonlyArray<string>,
  term: string,
  primary = terms.length,
) => {
  let best = 0;
  terms.forEach((text, index) => {
    const found = matchText(text, term);
    if (found === undefined) return;
    const score = tierScore[found.tier] * (index < primary ? 1 : 0.8);
    if (score > best) best = score;
  });
  return best;
};

export type Ranked<Item> = { item: Item; score: number };

export const rank = <Item>(
  items: ReadonlyArray<Item>,
  terms: (item: Item) => ReadonlyArray<string>,
  term: string,
  primary?: number,
): Array<Ranked<Item>> =>
  term === ""
    ? items.map((item) => ({ item, score: 0 }))
    : items
        .map((item) => ({
          item,
          score: scoreTerms(terms(item), term, primary),
        }))
        .filter((entry) => entry.score > 0)
        .toSorted((a, b) => b.score - a.score);

export type ParsedQuery = {
  term: string;
  text: string;
  actionsPrefix: boolean;
  category: SearchCategory;
  /** The `key:value` tokens the query carries, already split off the free text. */
  tokens: ReadonlyArray<FilterToken>;
  /** The token the caret sits in, which decides what the row above the results offers. */
  active: ActiveFilterToken | undefined;
};

/**
 * Capy's palette accepts typed operators: `author:`, `captain:`, `repo:`,
 * `status:`, `label:` and `since:`, each taking a comma-separated value list.
 */
export const parseQuery = (
  query: string,
  category: SearchCategory,
  caret: number = query.length,
): ParsedQuery => {
  const text = query.trim();
  const actionsPrefix = query.trimStart().startsWith(">");
  const parsed = parseFilterQuery(query, Math.min(caret, query.length));
  const term = (actionsPrefix ? text.slice(1) : parsed.text)
    .trim()
    .toLowerCase();
  return {
    term,
    text: parsed.text,
    actionsPrefix,
    category: actionsPrefix ? "actions" : category,
    tokens: actionsPrefix
      ? []
      : parsed.tokens.map((token) => ({
          key: token.key,
          values: token.values,
        })),
    active: actionsPrefix ? undefined : parsed.active,
  };
};

export const stripActionsPrefix = (query: string) =>
  query.trimStart().slice(1).trimStart();

export type SearchGroup =
  | {
      key: string;
      kind: "captains";
      label: string;
      score: number;
      items: PaletteCaptain[];
    }
  | {
      key: string;
      kind: "threads";
      label: string;
      score: number;
      items: PaletteThread[];
    }
  | {
      key: string;
      kind: "pulls";
      label: string;
      score: number;
      items: PalettePull[];
    }
  | {
      key: string;
      kind: "automations";
      label: string;
      score: number;
      items: PaletteAutomation[];
    }
  | {
      key: string;
      kind: "commands";
      label: string;
      score: number;
      searchGroup: string;
      items: PaletteCommand[];
    };

export type SearchResults = {
  parsed: ParsedQuery;
  groups: SearchGroup[];
  /** The `key:` / value rows the query is mid-token on. */
  suggestions: ReadonlyArray<PaletteSuggestion>;
  compose: boolean;
  emptyText: string;
  total: number;
};

const orderCommands = (commands: ReadonlyArray<PaletteCommand>) => [
  ...actionOrder.flatMap((id) =>
    commands.filter((command) => command.id === id),
  ),
  ...commands.filter((command) => !actionOrder.includes(command.id)),
];

const actionBoost = (id: string) => {
  const index = actionOrder.indexOf(id);
  return index === -1 ? 0 : (actionOrder.length - index) * 0.02;
};

const rankCommands = (commands: ReadonlyArray<PaletteCommand>, term: string) =>
  term === ""
    ? commands.map((item) => ({ item, score: 0 }))
    : commands
        .map((item) => ({
          item,
          score: Math.min(
            scoreTerms(item.searchTerms, term) + actionBoost(item.id),
            1,
          ),
        }))
        .filter((entry) => entry.score > actionBoost(entry.item.id))
        .toSorted((a, b) => b.score - a.score);

const commandGroup = (
  key: string,
  searchGroup: string,
  label: string,
  ranked: Array<Ranked<PaletteCommand>>,
): SearchGroup | undefined =>
  ranked.length === 0
    ? undefined
    : {
        key,
        kind: "commands",
        label,
        searchGroup,
        score: ranked[0]?.score ?? 0,
        items: ranked.map((entry) => entry.item),
      };

/** A token value matched against a field: case-insensitive, substrings welcome. */
const named = (field: string | undefined, values: ReadonlyArray<string>) =>
  field !== undefined &&
  values.some((value) => field.toLowerCase().includes(value.toLowerCase()));

const equals = (field: string, values: ReadonlyArray<string>) =>
  values.some((value) => value.toLowerCase() === field.toLowerCase());

const sinceBoundary = (values: ReadonlyArray<string>, now: number) => {
  const dates = values.flatMap(
    (value) => parseSince(value, new Date(now)) ?? [],
  );
  return dates.length === 0
    ? undefined
    : Math.min(...dates.map((date) => date.getTime()));
};

/** One token against one row; inside a key the values are OR'd. */
const tokenMatches = (
  token: FilterToken,
  fields: {
    readonly author?: string;
    readonly status?: string;
    readonly repo?: string;
    readonly captain?: string;
    readonly labels?: ReadonlyArray<string>;
    readonly updatedAt: number;
  },
  now: number,
): boolean => {
  const values = token.values.filter((value) => value !== "");
  if (values.length === 0) return true;
  if (token.key === "author") return named(fields.author, values);
  if (token.key === "captain") return named(fields.captain, values);
  if (token.key === "repo") return named(fields.repo, values);
  if (token.key === "status")
    return fields.status !== undefined && equals(fields.status, values);
  if (token.key === "label")
    return (
      fields.labels !== undefined &&
      values.some((value) =>
        fields.labels?.some(
          (label) => label.toLowerCase() === value.toLowerCase(),
        ),
      )
    );
  const boundary = sinceBoundary(values, now);
  return boundary === undefined ? true : fields.updatedAt >= boundary;
};

/** Applies every token to one row; values inside a key are OR'd, keys are AND'd. */
export const matchesTokens = (
  fields: {
    readonly author?: string;
    readonly status?: string;
    readonly repo?: string;
    readonly captain?: string;
    readonly labels?: ReadonlyArray<string>;
    readonly updatedAt: number;
  },
  tokens: ReadonlyArray<FilterToken>,
  now: number,
): boolean => tokens.every((token) => tokenMatches(token, fields, now));

export type PaletteSuggestion = {
  readonly id: string;
  /** "Filter by" for a key row, else the group the value belongs to. */
  readonly group: string;
  readonly label: string;
  /** What the row inserts: a key name or a value. */
  readonly value: string;
  readonly detail?: string;
  readonly icon?: IconId;
};

const distinct = (values: ReadonlyArray<string | undefined>) =>
  [
    ...new Set(
      values.filter(
        (value): value is string => value !== undefined && value !== "",
      ),
    ),
  ].sort((a, b) => a.localeCompare(b));

/** Ranks a pull state in Capy's order, with anything unrecognised last. */
const pullStateRank = (value: string) => {
  const index = statusValues.indexOf(value);
  return index === -1 ? statusValues.length : index;
};

const statusValues = [
  "open",
  "draft",
  "merged",
  "closed",
  "working",
  "waiting",
  "failed",
  "idle",
];

/** Every value a key can take, from what the palette is actually holding. */
export const filterChoices = (
  key: FilterKey,
  data: CommandMenuSearchData,
): ReadonlyArray<string> => {
  switch (key) {
    case "author":
      return distinct([
        ...data.threads.map((thread) => thread.author),
        ...data.pulls.map((pull) => pull.author),
      ]);
    case "captain":
      return distinct(data.captains.map((captain) => captain.name));
    case "repo":
      return distinct(data.pulls.map((pull) => pull.repo));
    case "status":
      return distinct([
        ...data.threads.map((thread) => thread.status),
        ...data.pulls.map((pull) => pull.state),
      ]).sort((a, b) => pullStateRank(a) - pullStateRank(b));
    case "label":
      return distinct(data.threads.flatMap((thread) => thread.labels ?? []));
    case "since":
      return sincePresets.map((preset) => preset);
  }
};

const sinceDetail = (value: string) =>
  sincePresets.find((preset) => preset === value) === undefined
    ? undefined
    : sincePresetLabels[value as keyof typeof sincePresetLabels];

const keyDetail: Record<FilterKey, string> = {
  author: "Who started the thread",
  captain: "Which Captain the thread belongs to",
  repo: "The pull request's repository",
  status: "Thread or pull request state",
  label: "A tag on the thread",
  since: "Updated within this window",
};

/** The rows the palette offers above its results for the token under the caret. */
export const filterSuggestions = (
  active: ActiveFilterToken | undefined,
  data: CommandMenuSearchData,
): ReadonlyArray<PaletteSuggestion> => {
  if (active === undefined) return [];
  if (active.kind === "key") {
    if (active.prefix.length < 2) return [];
    // Only offer a key the palette is actually holding values for; a key with
    // nothing to pick would open an empty page.
    return keySuggestions(active.prefix)
      .filter((key) => filterChoices(key, data).length > 0)
      .map((key) => ({
        id: `key-${key}`,
        group: "Filter by",
        label: `${key}:`,
        value: key,
        detail: keyDetail[key],
      }));
  }
  const partial = active.partial.trim().toLowerCase();
  const chosen = [
    ...filterValues([{ key: active.key, values: active.values }], active.key),
  ];
  const choices = filterChoices(active.key, data).filter(
    (choice) =>
      !chosen.some((value) => value.toLowerCase() === choice.toLowerCase()),
  );
  const matching = choices.filter((choice) =>
    choice.toLowerCase().includes(partial),
  );
  const rows: PaletteSuggestion[] = matching.map((choice) => ({
    id: `value-${active.key}-${choice}`,
    group: filterKeyLabels[active.key],
    label: choice,
    value: choice,
    detail: active.key === "since" ? sinceDetail(choice) : undefined,
  }));
  // A value that matches nothing still becomes a token, so it can be removed
  // on its own rather than leaving the query stuck.
  if (
    partial !== "" &&
    !matching.some((choice) => choice.toLowerCase() === partial)
  )
    rows.push({
      id: `raw-${active.key}-${partial}`,
      group: filterKeyLabels[active.key],
      label: active.partial.trim(),
      value: active.partial.trim(),
    });
  return rows;
};

export const emptyFilters = (parsed: ParsedQuery) => parsed.tokens.length === 0;

export type SearchOptions = {
  /** Tokens already committed to the row above the results. */
  readonly tokens?: ReadonlyArray<FilterToken>;
  readonly now?: number;
};

export const buildSearchResults = (
  query: string,
  selectedCategory: SearchCategory,
  data: CommandMenuSearchData,
  options: SearchOptions = {},
): SearchResults => {
  const parsed = parseQuery(query, selectedCategory);
  const { term, category } = parsed;
  const tokens = (options.tokens ?? []).reduce(mergeFilterToken, [
    ...parsed.tokens,
  ]);
  const now = options.now ?? Date.now();
  const filtered = tokens.length > 0;
  // A value page replaces the result list, and a typed operator narrows the
  // results to the kinds it can filter rather than leaving the other groups
  // listed unfiltered beside them.
  const valuePage = parsed.active?.kind === "value";
  const shows = (kind: ResultKind) =>
    valuePage
      ? false
      : filtered
        ? kind === "thread" || kind === "pull" || kind === "captain"
        : showsKind(category, kind);
  const idle = term === "" && category === "all" && !filtered;
  const cap = category === "actions" ? undefined : groupLimit;

  const captainRows = data.captains.filter((captain) =>
    matchesTokens(
      { captain: captain.name, updatedAt: captain.updatedAt },
      tokens,
      now,
    ),
  );
  const captains = shows("captain")
    ? rank(
        term === ""
          ? captainRows
              .filter((captain) => captain.archived !== true)
              .toSorted((a, b) => b.updatedAt - a.updatedAt)
          : captainRows.filter((captain) => captain.archived !== true),
        (captain) => [captain.name, captain.description ?? ""],
        term,
      ).slice(
        0,
        category === "captains"
          ? undefined
          : idle
            ? recentCaptainLimit
            : groupLimit,
      )
    : [];

  const threadAction =
    data.currentThread !== undefined && shows("threadAction")
      ? rankCommands(data.currentThread.commands, term)
      : [];

  const threadRows = data.threads.filter((thread) =>
    matchesTokens(
      {
        author: thread.author,
        status: thread.status,
        labels: thread.labels,
        updatedAt: thread.updatedAt,
      },
      tokens,
      now,
    ),
  );
  const threads = shows("thread")
    ? term === ""
      ? threadRows
          .filter((thread) => thread.archived !== true)
          .toSorted(
            (a, b) =>
              statusRank[a.status] - statusRank[b.status] ||
              b.updatedAt - a.updatedAt,
          )
          .slice(0, category === "threads" ? undefined : recentThreadLimit)
          .map((item) => ({ item, score: 0 }))
      : rank(
          threadRows,
          (thread) => [thread.title, thread.projectName ?? ""],
          term,
          2,
        )
    : [];

  const ordered = orderCommands(data.commands);
  const ranked = rankCommands(ordered, term);
  const ofKind = (kind: CommandKind) =>
    ranked.filter((entry) => entry.item.kind === kind);
  const actions = shows("action") ? ofKind("action").slice(0, cap) : [];
  const navigation = shows("navigation") ? ofKind("navigation") : [];
  const appearance = shows("appearance")
    ? ofKind("appearance").slice(0, cap)
    : [];
  const account =
    shows("account") && !idle ? ofKind("account").slice(0, cap) : [];
  const admin = shows("admin") && !idle ? ofKind("admin").slice(0, cap) : [];

  const pullRows = data.pulls.filter((pull) =>
    matchesTokens(
      {
        author: pull.author,
        repo: pull.repo,
        status: pull.state,
        updatedAt: pull.updatedAt,
      },
      tokens,
      now,
    ),
  );
  const pulls =
    shows("pull") && (filtered || term.length >= pullSearchMinLength)
      ? rank(
          pullRows,
          (pull) => [
            pull.title,
            `#${pull.number}`,
            String(pull.number),
            `${pull.repo}#${pull.number}`,
            pull.repo,
            pull.author,
            pull.headRef ?? "",
          ],
          term,
          4,
        ).slice(0, category === "pulls" ? categoryLimit : groupLimit)
      : [];

  const automations = shows("automation")
    ? term === ""
      ? category === "automations"
        ? data.automations.map((item) => ({ item, score: 0 }))
        : []
      : rank(
          data.automations,
          (automation) => [automation.name, automation.description ?? ""],
          term,
        ).slice(0, category === "automations" ? categoryLimit : groupLimit)
    : [];

  const settings =
    shows("setting") && term !== ""
      ? rank(
          data.settings,
          (command) => [command.title, ...command.searchTerms],
          term,
          // A settings row's own title and the page it lives on outrank its
          // keywords, which match far more loosely: Capy lists every row whose
          // title matches before rows matched only by category or keyword.
          2,
        ).slice(0, category === "settings" ? categoryLimit : groupLimit)
      : [];

  const settingsSections =
    category === "settings" && term === "" ? data.settingsSections : [];

  const groups: Array<SearchGroup | undefined> = [
    commandGroup("settings", "settings", groupLabels.setting, settings),
    captains.length === 0
      ? undefined
      : {
          key: "captains",
          kind: "captains",
          label: groupLabels.captain,
          score: captains[0]?.score ?? 0,
          items: captains.map((entry) => entry.item),
        },
    commandGroup(
      "this_thread",
      "this_thread",
      groupLabels.threadAction,
      threadAction,
    ),
    threads.length === 0
      ? undefined
      : {
          key: "threads",
          kind: "threads",
          label: idle ? "Recent threads" : groupLabels.thread,
          score: threads[0]?.score ?? 0,
          items: threads.map((entry) => entry.item),
        },
    commandGroup("actions", "actions", groupLabels.action, actions),
    commandGroup(
      "navigation",
      "navigation",
      groupLabels.navigation,
      navigation,
    ),
    commandGroup(
      "appearance",
      "appearance",
      groupLabels.appearance,
      appearance,
    ),
    pulls.length === 0
      ? undefined
      : {
          key: "pulls",
          kind: "pulls",
          label: groupLabels.pull,
          score: pulls[0]?.score ?? 0,
          items: pulls.map((entry) => entry.item),
        },
    automations.length === 0
      ? undefined
      : {
          key: "automations",
          kind: "automations",
          label: groupLabels.automation,
          score: automations[0]?.score ?? 0,
          items: automations.map((entry) => entry.item),
        },
    ...settingsSections.map((section) =>
      commandGroup(
        `settings_page_${section.label}`,
        "settings_pages",
        section.label,
        section.commands.map((item) => ({ item, score: 0 })),
      ),
    ),
    commandGroup("account", "account", groupLabels.account, account),
    commandGroup("admin", "admin", groupLabels.admin, admin),
  ];
  const present = groups.filter(
    (group): group is SearchGroup => group !== undefined,
  );
  const sorted =
    term === "" ? present : present.toSorted((a, b) => b.score - a.score);
  const total = sorted.reduce((sum, group) => sum + group.items.length, 0);
  const withTokens = { ...parsed, tokens };
  return {
    parsed: withTokens,
    groups: sorted,
    suggestions: filterSuggestions(parsed.active, data),
    compose:
      (category === "all" || category === "threads") &&
      term !== "" &&
      total === 0,
    emptyText:
      category === "pulls" && term === ""
        ? "Type to search pull requests"
        : "No results",
    total,
  };
};

export type FooterMode = "thread" | "openable" | "select";

export const itemValue = (group: SearchGroup, index: number) => {
  switch (group.kind) {
    case "captains":
      return `captain-${group.items[index]?.id}`;
    case "threads":
      return `thread-${group.items[index]?.id}`;
    case "pulls":
      return `pull-${group.items[index]?.id}`;
    case "automations":
      return `automation-${group.items[index]?.id}`;
    case "commands":
      return group.items[index]?.id ?? "";
  }
};

export const footerModeFor = (
  value: string | undefined,
  results: SearchResults,
): FooterMode => {
  if (value === undefined) return "select";
  for (const group of results.groups) {
    const index = group.items.findIndex(
      (_, at) => itemValue(group, at) === value,
    );
    if (index === -1) continue;
    if (group.kind === "threads") return "thread";
    if (group.kind === "commands")
      return group.searchGroup === "settings" ||
        group.searchGroup === "settings_pages"
        ? "openable"
        : "select";
    return "openable";
  }
  return "select";
};

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

export const formatAge = (then: number, now: number) => {
  const elapsed = Math.max(0, now - then);
  if (elapsed < minute) return "now";
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}m`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)}h`;
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)}d`;
  if (elapsed < 30 * day) return `${Math.floor(elapsed / (7 * day))}w`;
  if (elapsed < 365 * day) return `${Math.floor(elapsed / (30 * day))}mo`;
  return `${Math.floor(elapsed / (365 * day))}y`;
};

export const repoName = (repo: string) => repo.split("/").at(-1) ?? repo;
