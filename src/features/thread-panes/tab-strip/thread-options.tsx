import { type KeyboardEvent, type ReactNode, useState } from "react";
import {
  MenuGroup,
  MenuLabel,
  MenuSearchRow,
  MenuSeparator,
} from "@/primitives/menu";
import {
  ResponsiveMenuItem,
  ResponsiveMenuPage,
} from "@/primitives/responsive-menu";
import { toast } from "@/primitives/toaster";
import {
  menuCheck,
  menuChevron,
  menuEmpty,
  menuIcon,
  menuLabel,
  menuSearchInput,
  menuText,
  menuTrailing,
  type StatusColor,
  statusDot,
} from "./classes";
import {
  BranchGlyph,
  ChatBubbleGlyph,
  ChatBubblesGlyph,
  CheckGlyph,
  ChevronRightGlyph,
  ConsoleGlyph,
  DisplayGlyph,
  GlobeGlyph,
  PhoneGlyph,
  PlusGlyph,
  PullRequestGlyph,
} from "./glyphs";
import { shortcutFor } from "./shortcut";
import { tabIcon } from "./tab-icon";
import {
  BUILTIN_TABS,
  matchesQuery,
  type PaneTab,
  tabKey,
  tabLabel,
} from "./tabs";

/** A thread in the captain's crew. */
export type CrewThread = {
  id: string;
  title: string | null;
  code?: string;
  archived?: boolean;
  /** Working or waiting, so it shows in the menu before any search. */
  active?: boolean;
  unread?: boolean;
  /** Capy's `Subagent N`: the thread's place in the crew's creation order. */
  subagentIndex?: number;
  icon?: ReactNode;
  diffStat?: DiffStat;
};

export type PullEntry = {
  number: number;
  url: string;
  title?: string;
  icon?: ReactNode;
};

export type SideThreadEntry = { id: string; title: string | null };

export type TerminalEntry = { id: string; label: string };

export type CommandEntry = {
  name: string;
  command: string;
  repository: string;
};

export type ServiceEntry = {
  name: string;
  repository: string;
  statusLabel: string;
  statusColor: StatusColor;
  tab?: PaneTab;
};

export type MachineEntry = {
  machineId: string;
  state: "creating" | "awake" | "asleep" | "gone";
  statusLabel: string;
  statusColor: StatusColor;
  /** A paired device has no cloud desktop. */
  device: boolean;
  terminals?: readonly TerminalEntry[];
  services?: readonly ServiceEntry[];
  commands?: readonly CommandEntry[];
};

export type PhoneEntry = {
  machineId: string;
  name: string;
  description: string;
  state: "creating" | "awake" | "asleep" | "gone";
};

export type PhoneModel = {
  platform: "ios" | "android";
  model: string | undefined;
  label: string;
};

export type DiffStat = { additions: number; deletions: number };

export const PHONE_MODELS: readonly PhoneModel[] = [
  { platform: "ios", model: undefined, label: "New iPhone" },
  { platform: "ios", model: "iPhone Duo", label: "New iPhone Duo" },
  { platform: "android", model: undefined, label: "New Android" },
];

export type ThreadOptionsProps = {
  /** The heading: the thread or captain title. */
  title?: string;
  /** Keys of every tab already open, which get a check mark. */
  openIds: ReadonlySet<string>;
  /** Owning thread id, used by desktop and scoped pane tabs. */
  threadId?: string;
  /** Set for a captain, whose menu lists its crew instead of diffs. */
  crew?: readonly CrewThread[];
  pulls?: readonly PullEntry[];
  sideThreads?: readonly SideThreadEntry[];
  machines?: readonly MachineEntry[];
  /** Set when phones are enabled for the thread. */
  phones?: readonly PhoneEntry[];
  diffStat?: DiffStat;
  onOpen: (tab: PaneTab) => void;
  onOpenBrowser: () => void;
  onNewSideThread?: () => void;
  onNewTerminal?: (machineId: string) => void;
  onKillTerminal?: (machineId: string, terminalId: string) => void;
  onWake?: (machineId: string) => void;
  onLaunch?: (machineId: string, command: CommandEntry) => Promise<PaneTab>;
  onAddPhone?: (phone: PhoneModel) => Promise<PaneTab>;
};

/** Keeps typing inside a menu search box instead of driving the menu. */
export const keepTyping = (event: KeyboardEvent<HTMLInputElement>) => {
  if (
    event.key !== "Escape" &&
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp"
  ) {
    event.stopPropagation();
  }
};

const Check = () => <CheckGlyph className={menuCheck} />;

function Shortcut({ children }: { children: ReactNode }) {
  return <span className={menuTrailing}>{children}</span>;
}

function DiffStatText({ additions, deletions }: DiffStat) {
  return (
    <span className="shrink-0 tabular-nums">
      <span className="text-diff-add">+{additions}</span>{" "}
      <span className="text-diff-del">-{deletions}</span>
    </span>
  );
}

function StatusDot({ color }: { color: StatusColor }) {
  return (
    <span
      aria-hidden
      className={`size-1.5 shrink-0 rounded-full ${statusDot[color]}`}
    />
  );
}

type IconRowProps = {
  owner: string;
  icon: ReactNode;
  label: ReactNode;
  trailing?: ReactNode;
  closeOnClick?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function IconRow({
  owner,
  icon,
  label,
  trailing,
  closeOnClick,
  disabled,
  onClick,
}: IconRowProps) {
  return (
    <ResponsiveMenuItem
      data-track-owner={`features/thread/pane/tab-strip.tsx#${owner}`}
      closeOnClick={closeOnClick}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={menuIcon}>{icon}</span>
      <span className={menuText}>{label}</span>
      {trailing}
    </ResponsiveMenuItem>
  );
}

export type EntriesPageProps = {
  icon: ReactNode;
  label: string;
  count: number;
  searchLabel: string;
  pageSize?: number;
  children: (query: string) => ReactNode[];
};

/**
 * A row with a count that opens a searchable, paged list *in place*: the same
 * menu surface swaps its item list for the page, the way Capy's tab menu does
 * for All threads, Pull requests, Side threads, Commands and Phones.
 */
export function EntriesPage({ icon, label, count, ...body }: EntriesPageProps) {
  return (
    <ResponsiveMenuPage
      label={label}
      trigger={
        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className={menuIcon}>{icon}</span>
          <span className="flex min-w-0 flex-1 flex-col justify-center">
            <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground">
              {label}
            </span>
          </span>
          <span className={menuTrailing}>
            <span className="min-w-0 max-w-32 truncate">{String(count)}</span>
            <ChevronRightGlyph className={menuChevron} />
          </span>
        </span>
      }
    >
      <EntriesPageBody label={label} {...body} />
    </ResponsiveMenuPage>
  );
}

export function EntriesPageBody({
  label,
  searchLabel,
  pageSize,
  children,
}: Omit<EntriesPageProps, "icon" | "count">) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const entries = children(query);
  const limit = pageSize === undefined ? undefined : page * pageSize;
  return (
    <>
      <MenuSearchRow className="flex shrink-0 items-center">
        <input
          className={menuSearchInput}
          aria-label={searchLabel}
          placeholder={searchLabel}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          onKeyDown={keepTyping}
        />
      </MenuSearchRow>
      {limit === undefined ? entries : entries.slice(0, limit)}
      {limit !== undefined && entries.length > limit && (
        <ResponsiveMenuItem
          data-track-owner="features/thread/pane/tab-strip.tsx#EntriesPageBody:ResponsiveMenuItem[Show more]"
          closeOnClick={false}
          onClick={() => setPage(page + 1)}
        >
          Show more
        </ResponsiveMenuItem>
      )}
      {entries.length === 0 && (
        <div className={menuEmpty}>
          {query.trim() === "" ? `No ${label.toLowerCase()}` : "No matches"}
        </div>
      )}
    </>
  );
}

type PullRowProps = {
  pull: PullEntry;
  trailing: ReactNode;
  onOpen: () => void;
};

function PullRow({ pull, trailing, onOpen }: PullRowProps) {
  return (
    <ResponsiveMenuItem
      data-track-owner="features/thread/pane/tab-strip.tsx#PrRow:ResponsiveMenuItem[onClick=onOpen]"
      onClick={onOpen}
    >
      <span className={menuIcon}>{pull.icon ?? <PullRequestGlyph />}</span>
      <span className={menuText}>{pull.title ?? `#${pull.number}`}</span>
      <span className={menuTrailing}>
        {pull.title !== undefined && (
          <span className="tabular-nums">#{pull.number}</span>
        )}
        {trailing}
      </span>
    </ResponsiveMenuItem>
  );
}

const pullTab = (pull: PullEntry): PaneTab => ({
  kind: "pr",
  number: pull.number,
  url: pull.url,
});

type CrewRowProps = {
  thread: CrewThread;
  openCheck: (tab: PaneTab) => ReactNode;
  onOpen: (tab: PaneTab) => void;
};

/**
 * A crew thread, as Capy draws it: `Subagent N` over the thread's own title in
 * one plain row that opens its chat. Capy has no submenu here, and the number
 * is the thread's place in the crew's creation order, counted from the oldest.
 */
function CrewRow({ thread, openCheck, onOpen }: CrewRowProps) {
  const title = thread.title ?? "Untitled thread";
  const chat: PaneTab = { kind: "side_thread", jamId: thread.id };
  const numbered = thread.subagentIndex !== undefined;
  const label = numbered ? `Subagent ${thread.subagentIndex}` : title;
  const second = numbered ? title : thread.code;
  return (
    <ResponsiveMenuItem
      data-track-owner="features/thread/pane/tab-strip.tsx#CrewRow:ResponsiveMenuItem.1"
      onClick={() => onOpen(chat)}
    >
      <span
        className={`${menuIcon} h-5 self-start ${thread.unread ? "text-foreground" : ""}`}
      >
        {thread.icon ?? <ChatBubbleGlyph />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span
          className={`line-clamp-1 min-w-0 text-sm font-normal text-foreground ${thread.unread ? "font-semibold" : ""}`}
        >
          {label}
        </span>
        {second !== undefined && (
          <span className="line-clamp-1 min-w-0 text-xs font-normal text-muted-foreground-2">
            {second}
          </span>
        )}
      </span>
      {openCheck(chat)}
    </ResponsiveMenuItem>
  );
}

type MachineRowsProps = {
  /** Owning thread: desktop tabs are scoped to it, not to the machine. */
  rootJamId: string;
  machine: MachineEntry;
  query: string;
  openCheck: (tab: PaneTab) => ReactNode;
  onOpen: (tab: PaneTab) => void;
  onNewTerminal?: (machineId: string) => void;
  onKillTerminal?: (machineId: string, terminalId: string) => void;
  onWake?: (machineId: string) => void;
  onLaunch?: (machineId: string, command: CommandEntry) => Promise<PaneTab>;
};

/** The thread's machine: services, terminals, new terminal and desktop. */
function MachineRows({
  rootJamId,
  machine,
  query,
  openCheck,
  onOpen,
  onNewTerminal,
  onKillTerminal,
  onWake,
  onLaunch,
}: MachineRowsProps) {
  const alive = machine.state === "awake";
  const gone = machine.state === "gone";
  const match = (...fields: string[]) => matchesQuery(query, ...fields);
  const waking = !alive && !gone && match("Wake machine", machine.statusLabel);
  const services = (machine.services ?? []).filter((service) =>
    match(service.name),
  );
  const commands = machine.commands ?? [];
  const terminals = (machine.terminals ?? []).filter((terminal) =>
    match(terminal.label, "shell"),
  );
  const desktop: PaneTab = {
    kind: "desktop",
    jamId: rootJamId,
    localIndex: null,
  };
  // Nothing reads what a launch returns yet, so a command is listed and shown
  // disabled: the row is real, the press is not wired.
  const launchable = onLaunch !== undefined;
  const launch = (command: CommandEntry) => {
    if (onLaunch === undefined) return;
    onLaunch(machine.machineId, command).then(onOpen, () =>
      toast.error(`Could not launch ${command.name}`),
    );
  };
  const commandRow = (command: CommandEntry) => (
    <ResponsiveMenuItem
      key={`${command.repository}:${command.name}`}
      data-track-owner="features/thread/pane/tab-strip.tsx#commandRow:ResponsiveMenuItem.1"
      disabled={!launchable}
      onClick={() => launch(command)}
    >
      <span className={menuIcon}>
        <ConsoleGlyph />
      </span>
      <span className={menuText}>
        <span className="font-medium">{command.name}</span>
        <span className="ml-2 text-xs text-muted-foreground-2">
          {command.command}
        </span>
      </span>
    </ResponsiveMenuItem>
  );
  const status = (
    <span className="flex items-center gap-1.5">
      <StatusDot color={machine.statusColor} />
      {machine.statusLabel}
    </span>
  );

  return (
    <>
      {query !== "" && <MenuSeparator />}
      {alive && (services.length > 0 || commands.length > 0) && (
        <>
          {query === "" && services.length > 0 && (
            <>
              <MenuSeparator />
              <MenuGroup>
                <MenuLabel className={menuLabel}>Services</MenuLabel>
              </MenuGroup>
            </>
          )}
          {services.map((service) => (
            <ResponsiveMenuItem
              key={`${service.repository}:${service.name}`}
              data-track-owner="features/thread/pane/tab-strip.tsx#SetupEntryRows:ResponsiveMenuItem.1"
              onClick={() => {
                if (service.tab !== undefined) onOpen(service.tab);
              }}
            >
              <span className={menuIcon}>
                <StatusDot color={service.statusColor} />
              </span>
              <span className={`${menuText} font-medium`}>{service.name}</span>
              <span className={menuTrailing}>{service.statusLabel}</span>
              {service.tab !== undefined && openCheck(service.tab)}
            </ResponsiveMenuItem>
          ))}
          {query === "" && commands.length > 0 && (
            <EntriesPage
              icon={<ConsoleGlyph />}
              label="Commands"
              count={commands.length}
              searchLabel="Search commands"
            >
              {(search) =>
                commands
                  .filter((command) =>
                    matchesQuery(search, command.name, command.command),
                  )
                  .map(commandRow)
              }
            </EntriesPage>
          )}
          {query !== "" &&
            commands
              .filter((command) => match(command.name, command.command))
              .map(commandRow)}
        </>
      )}
      {query === "" && <MenuSeparator />}
      {query === "" && !gone && (
        <MenuGroup>
          <MenuLabel className={`${menuLabel} gap-2`}>
            <span className="min-w-0 flex-1 truncate">Terminals</span>
            {!waking && status}
          </MenuLabel>
        </MenuGroup>
      )}
      {alive &&
        terminals.map((terminal) => {
          const tab: PaneTab = {
            kind: "shell",
            machineId: machine.machineId,
            clientId: terminal.id,
            label: terminal.label,
          };
          return (
            <ResponsiveMenuItem
              key={terminal.id}
              data-track-owner="features/thread/pane/tab-strip.tsx#ShellRowList:ResponsiveMenuItem.1"
              aria-keyshortcuts="Delete Backspace"
              onClick={() => onOpen(tab)}
              onKeyDown={(event) => {
                if (event.key === "Delete" || event.key === "Backspace") {
                  event.preventDefault();
                  event.stopPropagation();
                  onKillTerminal?.(machine.machineId, terminal.id);
                }
              }}
            >
              <span className={menuIcon}>
                <ConsoleGlyph />
              </span>
              <span className={menuText}>{terminal.label}</span>
              {openCheck(tab)}
            </ResponsiveMenuItem>
          );
        })}
      {gone ? (
        match("Open diffs") && (
          <IconRow
            owner="MachineFlyoutRows:ResponsiveMenuItem.1"
            icon={<BranchGlyph />}
            label="Open diffs"
            trailing={
              <span className={menuTrailing}>{machine.statusLabel}</span>
            }
            onClick={() => onOpen({ kind: "diffs" })}
          />
        )
      ) : (
        <>
          {match("New terminal") && (
            <IconRow
              owner="MachineOpenRows:ResponsiveMenuItem.1"
              icon={<PlusGlyph />}
              label="New terminal"
              trailing={
                shortcutFor("shell.new") === "" ? undefined : (
                  <Shortcut>{shortcutFor("shell.new")}</Shortcut>
                )
              }
              onClick={() => {
                if (machine.state === "asleep") onWake?.(machine.machineId);
                onNewTerminal?.(machine.machineId);
              }}
            />
          )}
          {!machine.device && match("Desktop") && (
            <IconRow
              owner="MachineOpenRows:ResponsiveMenuItem.2"
              icon={<DisplayGlyph />}
              label="Desktop"
              trailing={openCheck(desktop)}
              onClick={() => onOpen(desktop)}
            />
          )}
        </>
      )}
      {waking && (
        <>
          {query === "" && <MenuSeparator />}
          <IconRow
            owner="MachineFlyoutRows:ResponsiveMenuItem[onClick=wakeForShell]"
            icon={<ConsoleGlyph />}
            label={
              machine.state === "asleep" ? "Wake machine" : machine.statusLabel
            }
            trailing={
              machine.state === "asleep" && <Shortcut>{status}</Shortcut>
            }
            closeOnClick={false}
            disabled={machine.state !== "asleep"}
            onClick={() => onWake?.(machine.machineId)}
          />
        </>
      )}
    </>
  );
}

/** Everything the open-a-tab menu lists for a thread, with search. */
export function ThreadOptions({
  title,
  threadId = "",
  openIds,
  crew,
  pulls = [],
  sideThreads = [],
  machines = [],
  phones,
  diffStat,
  onOpen,
  onOpenBrowser,
  onNewSideThread,
  onNewTerminal,
  onKillTerminal,
  onWake,
  onLaunch,
  onAddPhone,
}: ThreadOptionsProps) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const match = (...fields: Array<string | undefined>) =>
    matchesQuery(query, ...fields);
  const captain = crew !== undefined;
  const openCheck = (tab: PaneTab) =>
    openIds.has(tabKey(tab)) ? <Check /> : undefined;

  const builtins = [
    ...BUILTIN_TABS,
    ...(captain ? [{ kind: "captain_issues" } as const] : []),
  ].filter(
    (tab) =>
      !(captain && tab.kind === "diffs") &&
      match(
        tabLabel(tab),
        tab.kind === "files" ? "Machine files" : undefined,
        tab.kind === "files" ? "Drive" : undefined,
      ),
  );
  const browser = match("Browser", "web");
  const sideRows = sideThreads
    .map((thread) => ({
      tab: { kind: "side_thread", jamId: thread.id } as PaneTab,
      label: thread.title ?? "Side thread",
    }))
    .filter((row) => match("side threads") || match(row.label));
  const newSide =
    onNewSideThread !== undefined && match("new side thread", "side thread");
  const showSide = query === "" || newSide || sideRows.length > 0;
  const pullRows = pulls.filter(
    (pull) =>
      (captain && match("pull requests")) ||
      match(`#${pull.number}`, pull.title),
  );
  const members = (crew ?? []).filter((thread) => !thread.archived);
  const crewRows = members.filter((thread) =>
    query === "" ? true : match(thread.title ?? "Untitled thread", thread.code),
  );
  const allThreads =
    captain && (query === "" || match("all threads") || crewRows.length > 0);
  const pullsPage =
    captain && (query === "" || match("pull requests") || pullRows.length > 0);
  const pullsSection = !captain && pullRows.length > 0;
  const machineMatches = (machine: MachineEntry) =>
    match(machine.statusLabel) ||
    (machine.state === "awake" &&
      ((machine.terminals ?? []).some((terminal) =>
        match(terminal.label, "shell"),
      ) ||
        (machine.services ?? []).some((service) => match(service.name)) ||
        (machine.commands ?? []).some((command) =>
          match(command.name, command.command),
        ))) ||
    (machine.state !== "gone" && match("New terminal")) ||
    (machine.state !== "gone" && !machine.device && match("Desktop")) ||
    (machine.state === "gone" && match("Open diffs")) ||
    (machine.state !== "gone" &&
      machine.state !== "awake" &&
      match("Wake machine"));
  const machineRows = machines.filter(
    (machine) => query === "" || machineMatches(machine),
  );
  const phoneRows = (phones ?? []).filter(
    (phone) => match("phones") || match(phone.name, phone.description, "phone"),
  );
  const phoneModels = PHONE_MODELS.filter((phone) =>
    match(phone.label, "phone"),
  );
  const showPhones =
    phones !== undefined &&
    (query === "" ||
      match("phones") ||
      phoneRows.length > 0 ||
      phoneModels.length > 0);
  const anything =
    builtins.length > 0 ||
    browser ||
    crewRows.length > 0 ||
    allThreads ||
    pullsPage ||
    pullsSection ||
    showSide ||
    machineRows.length > 0 ||
    showPhones;

  const pullRow = (pull: PullEntry) => (
    <PullRow
      key={tabKey(pullTab(pull))}
      pull={pull}
      trailing={openCheck(pullTab(pull))}
      onOpen={() => onOpen(pullTab(pull))}
    />
  );
  const crewRow = (thread: CrewThread) => (
    <CrewRow
      key={thread.id}
      thread={thread}
      openCheck={openCheck}
      onOpen={onOpen}
    />
  );
  const addPhone = (phone: PhoneModel) => {
    onAddPhone?.(phone).then(onOpen, () =>
      toast.error("The phone could not be added"),
    );
  };

  return (
    <>
      <MenuGroup>
        <MenuLabel className={menuLabel}>
          {title ?? (captain ? "Captain" : "This thread")}
        </MenuLabel>
      </MenuGroup>
      <MenuSearchRow className="flex shrink-0 items-center">
        <input
          // biome-ignore lint/a11y/noAutofocus: Capy focuses the menu search on open
          autoFocus
          className={menuSearchInput}
          aria-label="Search tabs"
          placeholder="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={keepTyping}
        />
      </MenuSearchRow>
      {!anything && <div className={menuEmpty}>No tabs found</div>}
      {builtins.map((tab) => (
        <ResponsiveMenuItem
          key={tabKey(tab)}
          data-track-owner="features/thread/pane/tab-strip.tsx#ThreadOptions:ResponsiveMenuItem.1"
          onClick={() => onOpen(tab)}
        >
          <span className={menuIcon}>{tabIcon(tab)}</span>
          <span className={menuText}>{tabLabel(tab)}</span>
          {tab.kind === "diffs" ? (
            <span className={menuTrailing}>
              {diffStat !== undefined && (
                <span className="text-xs">
                  <DiffStatText {...diffStat} />
                </span>
              )}
              <span>{shortcutFor("diffs.open")}</span>
              {openCheck(tab)}
            </span>
          ) : (
            openCheck(tab)
          )}
        </ResponsiveMenuItem>
      ))}
      {browser && (
        <IconRow
          owner="ThreadOptions:ResponsiveMenuItem[onClick=onOpenBrowser]"
          icon={<GlobeGlyph />}
          label="Browser"
          trailing={<Shortcut>{shortcutFor("browser.open")}</Shortcut>}
          onClick={onOpenBrowser}
        />
      )}
      {(crewRows.length > 0 || allThreads) && (
        <>
          <MenuSeparator />
          <MenuGroup>
            <MenuLabel className={menuLabel}>Crew</MenuLabel>
            {crewRows.map(crewRow)}
            {allThreads && (
              <EntriesPage
                icon={<ChatBubbleGlyph />}
                label="All threads"
                count={members.length}
                searchLabel="Search threads"
                pageSize={50}
              >
                {(search) =>
                  members
                    .filter((thread) =>
                      matchesQuery(
                        search,
                        thread.title ?? "Untitled thread",
                        thread.code,
                      ),
                    )
                    .map(crewRow)
                }
              </EntriesPage>
            )}
          </MenuGroup>
        </>
      )}
      {pullsSection && (
        <>
          <MenuSeparator />
          <MenuGroup>
            <MenuLabel className={menuLabel}>Pull requests</MenuLabel>
            {pullRows.map(pullRow)}
          </MenuGroup>
        </>
      )}
      {(pullsPage || showSide) && <MenuSeparator />}
      {pullsPage && (
        <EntriesPage
          icon={<PullRequestGlyph />}
          label="Pull requests"
          count={pullRows.length}
          searchLabel="Search pull requests"
        >
          {(search) =>
            pullRows
              .filter((pull) =>
                matchesQuery(search, `#${pull.number}`, pull.title),
              )
              .map(pullRow)
          }
        </EntriesPage>
      )}
      {showSide && (
        <EntriesPage
          icon={<ChatBubblesGlyph />}
          label="Side threads"
          count={sideRows.length}
          searchLabel="Search side threads"
        >
          {(search) => [
            ...(newSide && matchesQuery(search, "new side thread")
              ? [
                  <IconRow
                    key="new-side-thread"
                    owner="ThreadOptions:ResponsiveMenuItem[onClick=onNewSideThread]"
                    icon={<PlusGlyph />}
                    label="New side thread"
                    trailing={
                      <Shortcut>{shortcutFor("sideThread.new")}</Shortcut>
                    }
                    onClick={() => onNewSideThread?.()}
                  />,
                ]
              : []),
            ...sideRows
              .filter((row) => matchesQuery(search, row.label))
              .map((row) => (
                <IconRow
                  key={tabKey(row.tab)}
                  owner="ThreadOptions:ResponsiveMenuItem.2"
                  icon={<ChatBubbleGlyph />}
                  label={row.label}
                  trailing={openCheck(row.tab)}
                  onClick={() => onOpen(row.tab)}
                />
              )),
          ]}
        </EntriesPage>
      )}
      {machineRows.map((machine) => (
        <MachineRows
          key={machine.machineId}
          rootJamId={threadId}
          machine={machine}
          query={match(machine.statusLabel) ? "" : query}
          openCheck={openCheck}
          onOpen={onOpen}
          onNewTerminal={onNewTerminal}
          onKillTerminal={onKillTerminal}
          onWake={onWake}
          onLaunch={onLaunch}
        />
      ))}
      {showPhones && (
        <>
          <MenuSeparator />
          <EntriesPage
            icon={<PhoneGlyph />}
            label="Phones"
            count={phoneRows.length}
            searchLabel="Search phones"
          >
            {(search) => [
              ...phoneRows
                .filter((phone) =>
                  matchesQuery(search, phone.name, phone.description),
                )
                .map((phone) => {
                  const tab: PaneTab = {
                    kind: "phone",
                    machineId: phone.machineId,
                    label: phone.name,
                  };
                  return (
                    <ResponsiveMenuItem
                      key={phone.machineId}
                      data-track-owner="features/thread/pane/tab-strip.tsx#ThreadOptions:ResponsiveMenuItem.4"
                      onClick={() => onOpen(tab)}
                    >
                      <span className={menuIcon}>
                        <StatusDot
                          color={
                            phone.state === "awake"
                              ? "success"
                              : phone.state === "creating"
                                ? "warning"
                                : "neutral"
                          }
                        />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col justify-center">
                        <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground">
                          {phone.name}
                        </span>
                        <span className="line-clamp-1 min-w-0 text-xs font-normal text-muted-foreground-2">
                          {phone.description}
                        </span>
                      </span>
                      {openCheck(tab)}
                    </ResponsiveMenuItem>
                  );
                }),
              ...(phoneRows.length > 0 && phoneModels.length > 0
                ? [<MenuSeparator key="phones-separator" />]
                : []),
              ...phoneModels
                .filter((phone) => matchesQuery(search, phone.label))
                .map((phone) => (
                  <IconRow
                    key={phone.label}
                    owner="ThreadOptions:ResponsiveMenuItem.5"
                    icon={<PlusGlyph />}
                    label={phone.label}
                    onClick={() => addPhone(phone)}
                  />
                )),
            ]}
          </EntriesPage>
        </>
      )}
    </>
  );
}
