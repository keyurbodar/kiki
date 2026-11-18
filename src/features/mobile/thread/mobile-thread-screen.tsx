import { useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import type { ComposerPayload } from "@/components/composer";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import { organizationsAtom } from "@/data/atoms/session";
import type { ComposerCommandId } from "@/features/composer/composer-commands";
import {
  ComposerFooter,
  FooterTrigger,
} from "@/features/composer/composer-footer";
import { useSidebarActions } from "@/features/shell/sidebar-container";
import { JamChat } from "@/features/thread/jam-chat";
import { ThreadMessageActions } from "@/features/thread/thread-view/message-actions";
import { useThreadTimeline } from "@/features/thread/timeline";
import { useComposerSend } from "@/features/thread/use-composer-send";
import { Button } from "@/primitives/button";
import {
  MobileComposer,
  MobileComposerAddTrigger,
  MobileComposerModelTrigger,
} from "../composer";
import {
  MobileAddDrawer,
  MobileMachineDrawer,
  MobileModelDrawer,
  type MobileModelSection,
  MobileTabDrawer,
  type MobileTabPane,
} from "../drawers";
import {
  mobileModelsAtom,
  mobileThreadAtom,
  mobileThreadMachinesAtom,
} from "./atoms";
import { MobileIcon } from "./mobile-icon";
import {
  CHAT_TAB,
  MobileOpenTabTrigger,
  MobileThreadView,
} from "./mobile-thread-view";

/** Panes a thread offers on a phone, in Capy's order. */
export const mobileThreadPanes: ReadonlyArray<Omit<MobileTabPane, "open">> = [
  { id: "overview", label: "Overview", icon: "list" },
  { id: "diffs", label: "Diffs", icon: "changes" },
  { id: "files", label: "Files", icon: "files" },
  { id: "setup", label: "Setup", icon: "server-2" },
  { id: "browser", label: "Browser", icon: "globe" },
];

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const text = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const success = (result: AsyncResult.AsyncResult<unknown, unknown>) =>
  AsyncResult.isSuccess(result) ? result.value : undefined;

/**
 * Models from the models endpoint, grouped by provider. The endpoint answers
 * `{ models, credentials, services }`, so its `models` array is what carries the
 * rows; an array is accepted too, for callers that already unwrapped it.
 */
export function modelSections(models: unknown): MobileModelSection[] {
  const rows = Array.isArray(models)
    ? models
    : Array.isArray(record(models).models)
      ? (record(models).models as ReadonlyArray<unknown>)
      : [];
  const sections = new Map<string, MobileModelSection>();
  for (const entry of rows) {
    const model = record(entry);
    const id = text(model.id);
    const name = text(model.name) ?? id;
    if (id === undefined || name === undefined) continue;
    const provider = text(model.provider) ?? "Models";
    const section = sections.get(provider) ?? {
      id: provider,
      label: provider,
      models: [],
    };
    sections.set(provider, {
      ...section,
      models: [...section.models, { id, name }],
    });
  }
  return [...sections.values()];
}

export type MobileThreadScreenProps = {
  threadId: string;
  /** The chat timeline; defaults to the thread view's JamChat. */
  chat?: ReactNode;
};

function SidebarTrigger() {
  const { setOpenMobile } = useSidebarActions();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Open sidebar"
      onClick={() => setOpenMobile(true)}
    >
      <MobileIcon name="sidebar-simple-left-wide" />
    </Button>
  );
}

/** The thread route on a phone: wires the mobile view, composer and drawers to the data layer. */
export function MobileThreadScreen({
  threadId,
  chat,
}: MobileThreadScreenProps) {
  const organizations = success(useAtomValue(organizationsAtom));
  const orgId = Array.isArray(organizations)
    ? text(record(organizations[0]).id)
    : undefined;
  return orgId === undefined ? (
    <MobileThreadBody threadId={threadId} chat={chat} />
  ) : (
    <MobileThreadData orgId={orgId} threadId={threadId} chat={chat} />
  );
}

function MobileThreadData({
  orgId,
  threadId,
  chat,
}: MobileThreadScreenProps & { orgId: string }) {
  const key = `${orgId}/${threadId}`;
  const thread = record(success(useAtomValue(mobileThreadAtom(key))));
  const machines = success(useAtomValue(mobileThreadMachinesAtom(key)));
  const machine = Array.isArray(machines) ? record(machines[0]) : undefined;
  return (
    <MobileThreadBody
      orgId={orgId}
      threadId={threadId}
      chat={chat}
      title={text(thread.title)}
      working={text(thread.status) === "working"}
      models={success(useAtomValue(mobileModelsAtom))}
      machine={
        machine && {
          name: text(machine.name) ?? "",
          live: machine.status === "running" || machine.status === "online",
        }
      }
    />
  );
}

type MobileThreadBodyProps = MobileThreadScreenProps & {
  orgId?: string;
  title?: string;
  working?: boolean;
  models?: unknown;
  machine?: { name: string; live: boolean };
};

function MobileThreadBody({
  orgId,
  threadId,
  chat,
  title,
  working = false,
  models,
  machine,
}: MobileThreadBodyProps) {
  const send = useComposerSend(threadId);
  const timeline = useThreadTimeline((orgId ?? "") as OrgId, threadId as JamId);
  const navigate = useNavigate();
  const runCommand = (command: ComposerCommandId) => {
    if (command === "new") void navigate({ to: "/new" });
  };
  const [openTabs, setOpenTabs] = useState<ReadonlyArray<string>>(["overview"]);
  const [activeTab, setActiveTab] = useState(CHAT_TAB);
  const [modelId, setModelId] = useState<string>();
  const sections = modelSections(models);
  const model = sections
    .flatMap((section) => section.models)
    .find((option) => option.id === modelId);
  const openPane = (id: string) => {
    setOpenTabs((tabs) => (tabs.includes(id) ? tabs : [...tabs, id]));
    setActiveTab(id);
  };
  const closeTab = (id: string) => {
    setOpenTabs((tabs) => tabs.filter((tab) => tab !== id));
    if (activeTab === id) setActiveTab(CHAT_TAB);
  };
  const threadTitle = title ?? "";
  return (
    <MobileThreadView
      title={threadTitle}
      working={working}
      sidebarTrigger={<SidebarTrigger />}
      options={
        <Button variant="ghost" size="icon-sm" aria-label="Thread options">
          <MobileIcon name="dots-horizontal" />
        </Button>
      }
      tabs={mobileThreadPanes.filter((pane) => openTabs.includes(pane.id))}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onCloseTab={closeTab}
      tabMenu={
        <MobileTabDrawer
          title={threadTitle}
          trigger={<MobileOpenTabTrigger />}
          panes={mobileThreadPanes.map((pane) => ({
            ...pane,
            open: openTabs.includes(pane.id),
          }))}
          sideThreads={0}
          terminals={{
            status: machine?.live ? "Awake" : "Asleep",
            live: machine?.live ?? false,
          }}
          onOpenPane={openPane}
          onOpenSideThreads={() => {}}
          onNewTerminal={() => {}}
        />
      }
      composer={
        <>
          <MobileComposer
            onCommand={runCommand}
            onSend={(text) =>
              void send({
                text,
                mentions: [],
                files: [],
              } satisfies ComposerPayload)
            }
            addMenu={
              <MobileAddDrawer
                trigger={<MobileComposerAddTrigger />}
                onSelect={() => {}}
              />
            }
            modelMenu={
              <MobileModelDrawer
                sections={sections}
                selectedId={modelId}
                groupLabel="By provider"
                trigger={
                  <MobileComposerModelTrigger label={model?.name ?? "Model"} />
                }
                onSelect={setModelId}
                onOpenSettings={() => {}}
                onGroupBy={() => {}}
              />
            }
          />
          {machine && (
            <ComposerFooter
              machine={
                <MobileMachineDrawer
                  name={machine.name}
                  live={machine.live}
                  actions={[
                    {
                      id: "move-to-cloud",
                      label: "Move to cloud",
                      icon: "cloud",
                    },
                  ]}
                  trigger={
                    <FooterTrigger
                      aria-label="Machine"
                      icon={<MobileIcon name="macbook" />}
                      color={machine.live ? "success" : "neutral"}
                    >
                      {machine.name}
                    </FooterTrigger>
                  }
                  onAction={() => {}}
                />
              }
            />
          )}
        </>
      }
    >
      {activeTab === CHAT_TAB
        ? (chat ?? (
            <ThreadMessageActions orgId={orgId} jamId={threadId}>
              <JamChat
                data-thread-id={threadId}
                jamId={threadId}
                rows={timeline.rows}
                initialLoading={timeline.loading}
                onStartReached={
                  timeline.hasOlder ? timeline.loadOlder : undefined
                }
                className="flex min-h-0 flex-1 flex-col"
              />
            </ThreadMessageActions>
          ))
        : null}
    </MobileThreadView>
  );
}
