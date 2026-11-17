import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import {
  BranchTrigger,
  ComposerFooter,
  type FooterMachine,
  MachineTrigger,
} from "@/features/composer/composer-footer";
import { ContextMeterControl } from "@/features/composer/context-meter";
import {
  MessageQueue,
  QueuedMarker,
  type QueueRowData,
} from "@/features/composer/message-queue";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__composer-footer")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: ComposerFooterHarness,
});

const worktree: FooterMachine = {
  device: {
    name: "build",
    workspaceKind: "worktree",
    connected: true,
    isThisDevice: false,
  },
  state: "running",
  color: "success",
  statusLabel: "Running",
  detail: null,
  allocation: null,
  sizeLabel: null,
  settingUp: false,
  setupDegraded: false,
  setupSteps: [],
};

const cloud: FooterMachine = {
  device: null,
  state: "asleep",
  color: "neutral",
  statusLabel: "Asleep",
  detail: "Asleep",
  allocation: {
    size: "large",
    cpuCount: 4,
    memoryBytes: 16 * 1073741824,
    diskBytes: 64 * 1073741824,
  },
  sizeLabel: "Large",
  settingUp: false,
  setupDegraded: true,
  setupSteps: [
    {
      phase: "initialize",
      status: "success",
      repoFullName: "acme/web",
      startedAt: null,
      durationMs: 42_000,
    },
  ],
};

const queued: QueueRowData[] = [
  {
    id: "evt_sample_1",
    text: "Also run the checkout tests before opening the PR",
    mentions: [],
    delivery: "queue",
    actor: { type: "user", userId: "user_alex" },
    files: [],
  },
  {
    id: "evt_sample_2",
    text: "Use the staging config for the smoke run",
    mentions: [],
    delivery: "interrupt",
    actor: { type: "user", userId: "user_sam" },
    files: [{}],
  },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card bg-composer-ground">
      <div className="flex h-(--h-control-lg) items-center rounded-card bg-card px-4 text-sm text-muted-foreground-2 shadow-card">
        Ask anything, / for commands, @ for context
      </div>
      {children}
    </div>
  );
}

function ComposerFooterHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  return (
    <div className="flex max-w-(--container-3xl) flex-col gap-10 p-(--spacing-page-padding) font-sans text-foreground">
      <section className="flex flex-col gap-2" data-harness="footer-worktree">
        <Card>
          <ComposerFooter
            machine={<MachineTrigger machine={worktree} />}
            meter={
              <ContextMeterControl
                usage={{ usedTokens: 48_200, budgetTokens: 200_000 }}
              />
            }
          />
        </Card>
      </section>
      <section className="flex flex-col gap-2" data-harness="footer-cloud">
        <Card>
          <ComposerFooter
            machine={
              <MachineTrigger
                machine={cloud}
                onWake={() => undefined}
                onRerunSetup={() => undefined}
              />
            }
            branch={
              <BranchTrigger
                repos={[
                  {
                    repo: "web",
                    repoFullName: "acme/web",
                    branch: "feat/dark-mode",
                  },
                  { repo: "api", repoFullName: "acme/api", branch: "main" },
                ]}
              />
            }
            meter={
              <ContextMeterControl
                defaultOpen
                usage={{
                  usedTokens: 184_000,
                  budgetTokens: 200_000,
                  segments: [
                    { key: "system", tokens: 6_100 },
                    { key: "tools", tokens: 9_400 },
                    { key: "rules", tokens: 1_200 },
                    { key: "skills", tokens: 2_300 },
                    { key: "mcp", tokens: 3_800 },
                    { key: "environment", tokens: 1_900 },
                    { key: "conversation", tokens: 159_300 },
                  ],
                }}
              />
            }
          />
        </Card>
      </section>
      <section className="flex flex-col gap-2" data-harness="queue">
        <MessageQueue
          rows={queued}
          viewerUserId="user_alex"
          actions={{ departing: new Map(), act: () => undefined }}
        >
          <Card>
            <ComposerFooter machine={<MachineTrigger machine={worktree} />} />
          </Card>
        </MessageQueue>
      </section>
      <section data-harness="queued-marker">
        <QueuedMarker
          queuedSince={new Date("2026-03-02T09:00:00Z")}
          now={new Date("2026-03-02T09:05:00Z")}
        />
      </section>
    </div>
  );
}
