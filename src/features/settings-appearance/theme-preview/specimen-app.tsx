import { CapyMark } from "@/components/app-sidebar/capy-mark";
import type { SidebarThread } from "@/components/sidebar-threads";
import type { FileId } from "@/data/api/schemas/files";
import type { FileRef, UserId } from "@/data/events";
import { SidebarThreadRow } from "@/features/sidebar/sidebar-thread-row";
import type { AgentMessageRow } from "@/features/thread/agent-message";
import { AgentMessage } from "@/features/thread/agent-message";
import { MessageActionsProvider } from "@/features/thread/message-footer";
import {
  UserMessage,
  type UserMessageRow,
} from "@/features/thread/user-message";
import { Card } from "@/primitives/card";
import { Icon, type IconId } from "@/primitives/icon";

/** The app drawn in a theme's palette, at the size the real shell would have it. */
export const SPECIMEN_WIDTH = 1280;
export const SPECIMEN_HEIGHT = 720;

/** Display samples: plain objects the message parts render, not decoded events. */
const VIEWER = "user_specimen" as UserId;
const AT = new Date(2026, 10, 17, 14, 30);

const NAV: ReadonlyArray<{ label: string; icon: IconId }> = [
  { label: "Overview", icon: "dot-grid-2x3" },
  { label: "Threads", icon: "bubble-dots" },
  { label: "Issues", icon: "circle-dashed" },
  { label: "Pull requests", icon: "pull-request" },
  { label: "Automations", icon: "calendar-clock" },
  { label: "Explore", icon: "compass-round" },
  { label: "Drive", icon: "folder-1" },
];

const THREADS: ReadonlyArray<SidebarThread> = [
  {
    id: "thread_specimen_1",
    title: "Capy retry backoff",
    status: "working",
    needsYou: false,
    ask: null,
    hasUnreads: false,
    age: "2m",
    projectId: null,
    machine: null,
  },
  {
    id: "thread_specimen_2",
    title: "Adding usage analytics values",
    status: "idle",
    needsYou: false,
    ask: null,
    hasUnreads: true,
    age: "5m",
    projectId: null,
    machine: null,
  },
  {
    id: "thread_specimen_3",
    title: "Proxy reconnect level",
    status: "idle",
    needsYou: false,
    ask: null,
    hasUnreads: false,
    age: "12m",
    projectId: null,
    machine: null,
  },
  {
    id: "thread_specimen_4",
    title: "Strip Node to 2.4",
    status: "idle",
    needsYou: false,
    ask: null,
    hasUnreads: false,
    age: "31m",
    projectId: null,
    machine: null,
  },
];

const LOG: FileRef = {
  fileId: "file_specimen_log" as FileId,
  name: "approvals.log",
  mediaType: "text/plain",
  sizeBytes: 11_264,
};

const TITLE = "Capy retry backoff after deploy";

const ownRow = (text: string, files: ReadonlyArray<FileRef>): UserMessageRow =>
  ({
    id: `row_specimen_${text === "" ? "file" : "text"}`,
    eventId: "01J00000000000000000000000",
    createdAt: AT,
    type: "user-message",
    text,
    mentions: [],
    files,
    delivery: "queue",
    actor: { type: "user", userId: VIEWER },
    origin: { type: "web" },
    showOrigin: false,
    state: "answered",
  }) as unknown as UserMessageRow;

const agentText = [
  "Read **3 retries**  \nBailed **4 retries** +2 -1  \nRetries down",
  "The delay kept doubling because the attempt count never reset after a reconnect, so it sat capped at 30 seconds with no jitter.",
  [
    "```ts",
    "const delay = Math.min(cap, base * 2 ** attempt);",
    "return Math.random() * delay;",
    "```",
  ].join("\n"),
].join("\n\n");

const agentRow = {
  id: "row_specimen_agent",
  eventId: "01J00000000000000000000001",
  createdAt: AT,
  startedAt: AT,
  type: "agent-message",
  settled: true,
  interrupted: false,
  turnCloses: true,
  text: agentText,
  files: [],
  uploads: [],
  placed: [],
  placing: [],
  modelId: "model_specimen",
  reasoningMode: "medium",
} as unknown as AgentMessageRow;

const ACTIONS = { viewerUserId: VIEWER, now: AT.getTime() };

function NavRow({ label, icon }: { label: string; icon: IconId }) {
  return (
    <span className="flex h-8 items-center gap-2 rounded px-2 text-sm text-muted-foreground-2">
      <Icon name={icon} className="size-3.5 shrink-0" />
      <span className="mask-fade-r min-w-0 overflow-hidden whitespace-nowrap">
        {label}
      </span>
    </span>
  );
}

function ComposerStub() {
  return (
    <span className="relative flex h-14 items-center rounded-(--radius-card) border-hairline border-border-2 bg-card px-3">
      <span className="text-sm text-muted-foreground-3">
        Ask for follow-up changes…
      </span>
      <span className="absolute right-2 bottom-2 size-4 rounded-(--radius-inner) bg-primary" />
    </span>
  );
}

/**
 * The specimen Capy shows on a theme: the real shell parts — sidebar rows, a
 * panel card and live user and agent messages — so a theme is seen styling the
 * product rather than a drawing of it.
 */
export function SpecimenApp() {
  return (
    <div className="flex h-full w-full bg-background text-foreground">
      <div className="flex w-[19%] shrink-0 flex-col gap-px px-2 pt-2.5 pb-2">
        <span className="flex h-8 items-center px-2">
          <CapyMark className="h-3.5" />
        </span>
        {NAV.map((item) => (
          <NavRow key={item.label} label={item.label} icon={item.icon} />
        ))}
        <span className="mt-3 flex h-8 items-center px-2 text-xs text-muted-foreground-2">
          Today
        </span>
        {THREADS.map((thread) => (
          <SidebarThreadRow key={thread.id} thread={thread} />
        ))}
      </div>
      <Card
        variant="panel"
        className="my-2 mr-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-clip bg-panel"
      >
        <div className="flex min-h-11 shrink-0 items-center gap-2 border-b-hairline border-border-1 px-3">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {TITLE}
          </span>
          <Icon
            name="dot-grid-1x3-horizontal"
            className="size-3 shrink-0 text-icon-muted"
          />
        </div>
        <MessageActionsProvider value={ACTIONS}>
          <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 pt-3">
            <UserMessage
              row={ownRow(
                "Rotates: backoff the API right after a deploy, can you cap the backoff and add jitter?",
                [],
              )}
              footer={false}
            />
            <UserMessage row={ownRow("", [LOG])} footer={false} />
            <AgentMessage row={agentRow} />
          </div>
        </MessageActionsProvider>
        <div className="mx-auto w-full max-w-4xl shrink-0 px-4 pb-3">
          <ComposerStub />
        </div>
      </Card>
    </div>
  );
}
