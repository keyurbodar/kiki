import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { Suspense, useEffect, useMemo, useState } from "react";
import { copyText } from "@/components/file-view/copy";
import type { EventId, JamId, OrgId } from "@/data/api/schemas/ids";
import { automationsAtom, idleAutomationsAtom } from "@/data/atoms/automations";
import { captainsAtom, idleCaptainsAtom } from "@/data/atoms/captains";
import { overviewPullsAtom } from "@/data/atoms/overview";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import { idleThreadPageAtom, threadsAtom } from "@/data/atoms/threads";
import {
  MobileThreadScreen,
  useIsPhoneSurface,
} from "@/features/mobile/thread";
import { formatClarifyAnswers } from "@/features/thread/clarify-takeover";
import { ThreadCostBadge } from "@/features/thread/cost-badge";
import type { EditTarget } from "@/features/thread/message-footer";
import {
  activeTabId,
  ThreadHeader,
  type ThreadTakeoverHandlers,
  ThreadView,
} from "@/features/thread/thread-view";
import {
  closeTab,
  openTab,
  type PaneSession,
  seedSession,
  selectTab,
} from "@/features/thread/thread-view/pane-session";
import { PaneSessionContext } from "@/features/thread/thread-view/pane-session-context";
import { tabForKey } from "@/features/thread/thread-view/thread-tabs";
import {
  editDraftAtom,
  threadKey,
  useThreadTimeline,
} from "@/features/thread/timeline";
import { useComposerSend } from "@/features/thread/use-composer-send";
import { BrowserPane } from "@/features/thread-panes/browser-pane";
import { parsePull, valueList } from "@/features/thread-panes/overview/parse";
import { useSideThreads } from "@/features/thread-panes/side-threads";
import {
  CHAT_TAB_ID,
  type PaneTab,
  tabKey,
} from "@/features/thread-panes/tab-strip";
import { TerminalPane } from "@/features/thread-panes/terminal-pane";
import { ThreadDock } from "@/features/thread-panes/thread-dock";
import {
  findPane,
  keepsPaneParam,
  parseSessionPane,
  surfaceOf,
  writesPaneParam,
} from "@/features/thread-panes/thread-pane";
import { PaneContent } from "./pane-content";

export type ThreadRouteProps = {
  threadId: string;
  pane: string | undefined;
  /** The panel's open tabs. Capy keeps every tab it opens. */
  session?: PaneSession;
  /**
   * Moves the session: opening, selecting and closing a tab all land here, and
   * the URL follows the tab the panel is showing.
   */
  onSession?: (session: PaneSession) => void;
  /** The route's pane search param; undefined returns the thread to its chat. */
  onSelectPane?: (pane: string | undefined) => void;
};

export function ThreadRoute({
  threadId,
  pane,
  session,
  onSession,
  onSelectPane,
}: ThreadRouteProps) {
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const timeline = useThreadTimeline(
    orgId as OrgId | undefined,
    threadId as JamId,
  );
  const editKey = threadKey((orgId ?? "") as OrgId, threadId as JamId);
  const editing = useAtomValue(editDraftAtom(editKey));
  const setEditing = useAtomSet(editDraftAtom(editKey));
  const startEdit = (target: EditTarget) =>
    setEditing({ ...target, eventId: target.eventId as EventId });
  const stopEdit = () => setEditing(null);
  useEffect(() => {
    if (editing === null) return;
    if (
      timeline.rows.some(
        (row) => row.type === "user-message" && row.editOf === editing.eventId,
      )
    )
      setEditing(null);
  }, [editing, setEditing, timeline.rows]);
  const listed = Option.getOrUndefined(
    AsyncResult.value(
      useAtomValue(
        orgId === undefined ? idleThreadPageAtom : threadsAtom(orgId as OrgId),
      ),
    ),
  );
  // The automated messages in this thread name their automation, so the list
  // starts loading with the route instead of when the first such row mounts.
  useAtomValue(
    orgId === undefined ? idleAutomationsAtom : automationsAtom(orgId as OrgId),
  );
  const thread = listed?.items.find((card) => card.id === threadId);
  // A Captain is a thread the jams list does not carry: the sidebar and
  // /threads read its card from the Captain list, so this route does too.
  const captains =
    Option.getOrUndefined(
      AsyncResult.value(
        useAtomValue(
          orgId === undefined ? idleCaptainsAtom : captainsAtom(orgId as OrgId),
        ),
      ),
    ) ?? [];
  const captain = captains.find((card) => card.id === threadId);
  const title = thread?.title ?? captain?.title ?? "Untitled thread";
  const working = (thread?.status ?? captain?.status) === "working";
  const sendAnswer = useComposerSend(threadId);
  const handlers = useMemo<ThreadTakeoverHandlers>(
    () => ({
      orgId,
      parentJamId: null,
      onClarifySubmit: (answers) =>
        void sendAnswer({
          text: formatClarifyAnswers(answers),
          mentions: [],
          files: [],
        }),
    }),
    [orgId, sendAnswer],
  );
  const [expanded, setExpanded] = useState(false);
  const sideThreads = useSideThreads(orgId ?? "", threadId);
  const entry = findPane(pane);
  const openTabs =
    session ??
    seedSession(
      entry !== undefined && surfaceOf(entry) === "dock"
        ? tabForKey(entry.id)
        : undefined,
      entry?.id,
    );
  const activeDock = openTabs.tabs.find(
    (tab) => tabKey(tab) === openTabs.active,
  );
  const dockOpen = activeDock !== undefined;
  useEffect(() => {
    if (!dockOpen) setExpanded(false);
  }, [dockOpen]);
  const sessionPane = entry === undefined ? parseSessionPane(pane) : undefined;
  const mainEntry =
    entry !== undefined && surfaceOf(entry) === "main" ? entry : undefined;
  const activeId = openTabs.active;
  const headerActiveId =
    mainEntry === undefined ? CHAT_TAB_ID : activeTabId(mainEntry);
  const openTabIn = (tab: PaneTab) => onSession?.(openTab(openTabs, tab));
  const selectIn = (id: string) => onSession?.(selectTab(openTabs, id));
  const closeIn = (id: string) => onSession?.(closeTab(openTabs, id));
  /** A menu pick lands in the panel when its pane lives there, and in the chat
   * column otherwise — the two strips share one menu. */
  const openInStrip = (id: string) => {
    const target = findPane(id);
    const tab = tabForKey(id);
    const dock = target === undefined || surfaceOf(target) === "dock";
    if (tab !== undefined && dock) openTabIn(tab);
    else onSelectPane?.(id);
  };
  const pulls = useAtomValue(
    orgId === undefined
      ? overviewPullsAtom("" as OrgId, "")
      : overviewPullsAtom(orgId as OrgId, threadId),
  );
  const pullEntries = useMemo(
    () =>
      (AsyncResult.isSuccess(pulls) ? valueList(pulls.value) : []).flatMap(
        (row) => {
          const pull = parsePull(row);
          return pull === undefined
            ? []
            : [{ number: pull.number, url: pull.url, title: pull.title }];
        },
      ),
    [pulls],
  );
  const mainPane =
    entry !== undefined && surfaceOf(entry) === "main" ? (
      <Suspense fallback={null}>
        <entry.component threadId={threadId} />
      </Suspense>
    ) : sessionPane?.kind === "browser" ? (
      <BrowserPane threadId={threadId} sessionId={sessionPane.sessionId} />
    ) : sessionPane?.kind === "shell" ? (
      <TerminalPane threadId={threadId} clientId={sessionPane.clientId} />
    ) : undefined;
  return (
    <PaneSessionContext.Provider value={{ openTab: openTabIn }}>
      <ThreadView
        threadId={threadId}
        rows={timeline.rows}
        loading={timeline.loading}
        failed={timeline.failed}
        onRetry={timeline.retry}
        loadingOlder={timeline.loadingOlder}
        hasOlder={timeline.hasOlder}
        onLoadOlder={timeline.loadOlder}
        pendingAsk={timeline.pendingAsk}
        pendingEnvironment={timeline.pendingEnvironment}
        handlers={handlers}
        paneExpanded={expanded}
        editing={editing}
        onEditMessage={startEdit}
        onCancelEdit={stopEdit}
        mainPane={mainPane}
        dock={
          dockOpen && activeDock !== undefined ? (
            <ThreadDock
              threadId={threadId}
              tabs={openTabs.tabs}
              activeId={activeId}
              title={title}
              menu={{ sideThreads, pulls: pullEntries }}
              expanded={expanded}
              onSelectTab={selectIn}
              onOpenTab={openTabIn}
              onCloseTab={closeIn}
              onClose={() => closeIn(openTabs.active)}
              onToggleExpand={() => setExpanded((current) => !current)}
              onCopyLink={(path) =>
                void copyText(
                  `${window.location.origin}${path}`,
                  "Link copied",
                  "Could not copy link",
                )
              }
            >
              <PaneContent
                tab={activeDock}
                threadId={threadId}
                orgId={orgId as OrgId | undefined}
              />
            </ThreadDock>
          ) : undefined
        }
        topBar={
          <ThreadHeader
            threadId={threadId}
            title={title}
            working={working}
            machine={thread?.primaryMachine}
            tabs={
              entry !== undefined && surfaceOf(entry) === "main"
                ? [tabForKey(pane) ?? { kind: "overview" }]
                : []
            }
            activeId={headerActiveId}
            canExpand={dockOpen}
            onOpenPane={() => openInStrip("overview")}
            menu={{ sideThreads, pulls: pullEntries }}
            cost={
              orgId === undefined ? undefined : (
                <ThreadCostBadge orgId={orgId} jamId={threadId} />
              )
            }
            expanded={expanded}
            onSelectChat={() => onSelectPane?.(undefined)}
            onSelectTab={openInStrip}
            onOpenBrowser={() => onSelectPane?.("browser")}
            onCloseTab={() => onSelectPane?.(undefined)}
            onCopyLink={(path) =>
              void copyText(
                `${window.location.origin}${path}`,
                "Link copied",
                "Could not copy link",
              )
            }
            onToggleExpand={() => setExpanded((current) => !current)}
          />
        }
      />
    </PaneSessionContext.Provider>
  );
}

/**
 * The thread on a wide screen. The URL seeds the open pane once, and picking a
 * pane keeps the URL in step with Capy's vocabulary: `overview`, `diffs` and
 * `captain_issues` are written, `files` opens without a param, and a value we
 * cannot open is rewritten off the URL. Entering a thread seeds from its URL, so
 * a pane opened from a tab does not follow you back into the thread: with a
 * clean URL Capy lands on the chat there too.
 */
export function ThreadScreen({
  threadId,
  pane,
}: {
  threadId: string;
  pane: string | undefined;
}) {
  return <PaneSelection key={threadId} threadId={threadId} pane={pane} />;
}

function PaneSelection({
  threadId,
  pane,
}: {
  threadId: string;
  pane: string | undefined;
}) {
  const navigate = useNavigate();
  const entry = findPane(pane);
  const [selection, setSelection] = useState(() => ({
    threadId,
    param: pane,
    id: entry?.id,
  }));
  const [session, setSession] = useState<PaneSession>(() =>
    seedSession(
      entry !== undefined && surfaceOf(entry) === "dock"
        ? tabForKey(pane)
        : undefined,
      pane,
    ),
  );
  const active =
    selection.threadId === threadId && selection.param === pane
      ? selection.id
      : findPane(pane)?.id;
  const stray = pane !== undefined && !keepsPaneParam(pane);
  useEffect(() => {
    if (!stray) return;
    setSelection({ threadId, param: undefined, id: findPane(pane)?.id });
    void navigate({
      to: "/thread/$threadId",
      params: { threadId },
      search: {},
      replace: true,
    });
  }, [stray, navigate, pane, threadId]);
  const writePane = (next: PaneSession) => {
    setSession(next);
    const key = writesPaneParam(next.active) ? next.active : undefined;
    if (key === undefined && pane === undefined) return;
    void navigate({
      to: "/thread/$threadId",
      params: { threadId },
      search: key === undefined ? {} : { pane: key },
      replace: true,
    });
  };
  return (
    <ThreadRoute
      threadId={threadId}
      pane={active}
      session={session}
      onSession={writePane}
      onSelectPane={(next) => {
        setSelection({
          threadId,
          param: writesPaneParam(next) ? next : undefined,
          id: next,
        });
        if (next === undefined && pane === undefined) return;
        void navigate({
          to: "/thread/$threadId",
          params: { threadId },
          search: writesPaneParam(next) ? { pane: next } : {},
        });
      }}
    />
  );
}

/** The thread route's page: everything the route renders once it has read its
 * params. It lives in a module of its own so the route can load it on demand —
 * the timeline, the chat list and the panes are only reachable from here. */
export function ThreadScreenRoute({
  threadId,
  pane,
}: {
  threadId: string;
  pane: string | undefined;
}) {
  const isPhoneSurface = useIsPhoneSurface();
  if (isPhoneSurface) return <MobileThreadScreen threadId={threadId} />;
  return <ThreadScreen threadId={threadId} pane={pane} />;
}
