import { cx } from "class-variance-authority";
import { type ReactNode, useMemo } from "react";
import { Markdown } from "@/components/markdown";
import { MarkdownComponentsProvider } from "@/components/markdown/components";
import { chipPreviewCardClass, chipTooltipClass } from "../classes";
import {
  type ChipIssue,
  type ChipTask,
  type ChipThread,
  type MarkdownChipsContextValue,
  MarkdownChipsProvider,
} from "../context";
import {
  sampleChipsContext,
  sampleIssues,
  sampleNow,
  samplePulls,
  sampleTasks,
  sampleThreads,
} from "../fixtures";
import { markdownChipComponents } from "../markdown-chips";
import {
  IssuePreview,
  PullRequestHoverPanel,
  TaskPreview,
  ThreadChipPreview,
} from "../previews";

const SAMPLE_THREAD: ChipThread = {
  id: "jam_sample_00",
  code: "ACME-1",
  title: "Sample thread",
  status: "idle",
  projectId: "prj_acme",
};

const SAMPLE_ISSUE: ChipIssue = {
  code: "ISS-1",
  title: "Sample issue",
  status: "todo",
  priority: "normal",
  visibility: "shared",
  assignee: null,
};

const SAMPLE_TASK: ChipTask = {
  id: "task_sample_00",
  localIndex: 1,
  title: "Sample subagent",
  status: "idle",
  queuedSince: null,
  lastActivityAt: null,
  createdAt: "2026-11-17T08:00:00.000Z",
};

const markdownLines = [
  "Shipped in #42 and #38, blocked on acme/api#7.",
  "Picked up from ACME-9, tracked in ISS-4, handed to Subagent 3.",
  "Files: src/app/main.tsx:12 and node_modules/, drive:notes/plan.md",
  "[the fix](https://github.com/acme/api/pull/7) and [plan](drive://project-acme/notes/plan.md)",
  "[stream.ts](src/app/stream.ts) [run](https://github.com/acme/web/commit/abc1234)",
];

function StateGlyph() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden
      className="size-(--icon-xs) shrink-0 text-progress"
    >
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M7 2v5h5" stroke="currentColor" strokeWidth="1.25" fill="none" />
    </svg>
  );
}

function PriorityGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="size-(--icon-xs) shrink-0 text-muted-foreground-1"
    >
      {[0, 1, 2].map((bar) => (
        <rect
          key={bar}
          x={2 + bar * 4.5}
          y={10 - bar * 3.5}
          width="3"
          height={4 + bar * 3.5}
          rx="1"
          fill="currentColor"
          opacity={bar < 1 ? 1 : 0.25}
        />
      ))}
    </svg>
  );
}

function Card({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground-2">
        {title}
      </span>
      <div
        data-panel={title.toLowerCase().replaceAll(" ", "-")}
        className={cx(chipPreviewCardClass, className)}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Dev-only specimen for the markdown chips (B6): the real markdown pipeline
 * with the chips plug-in, plus each hover surface rendered open, so
 * kiki-verify can compare computed styles with the Doop frames.
 */
export function ChipsPreview() {
  const context = useMemo<MarkdownChipsContextValue>(
    () => ({
      ...sampleChipsContext,
      renderIssueState: () => <StateGlyph />,
      renderIssuePriority: () => <PriorityGlyph />,
    }),
    [],
  );
  return (
    <MarkdownChipsProvider value={context}>
      <MarkdownComponentsProvider value={markdownChipComponents}>
        <div className="min-h-screen bg-background p-8 text-foreground">
          <div className="mx-auto flex max-w-4xl flex-col gap-8">
            <section className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground-2">
                Markdown chips
              </span>
              <div data-panel="markdown" className="text-sm">
                {markdownLines[0]}
                {markdownLines.slice(1).map((line) => (
                  <Markdown key={line} text={line} />
                ))}
                <Markdown key={markdownLines[0]} text={markdownLines[0]} />
              </div>
            </section>
            <div className="flex flex-wrap items-start gap-8">
              <Card title="Pull hover" className="w-96">
                <PullRequestHoverPanel
                  prs={samplePulls.slice(0, 2)}
                  multirepo
                />
              </Card>
              <Card title="Thread hover" className="w-96">
                <ThreadChipPreview thread={sampleThreads[0] ?? SAMPLE_THREAD} />
              </Card>
              <Card title="Issue hover" className="w-80">
                <IssuePreview issue={sampleIssues[0] ?? SAMPLE_ISSUE} />
              </Card>
              <Card title="Subagent hover">
                <TaskPreview
                  task={sampleTasks[0] ?? SAMPLE_TASK}
                  now={sampleNow}
                />
              </Card>
            </div>
            <section className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground-2">
                Tooltip
              </span>
              <div
                data-panel="tooltip"
                className={cx(chipTooltipClass, "w-fit")}
              >
                src/app/main.tsx:12
              </div>
            </section>
          </div>
        </div>
      </MarkdownComponentsProvider>
    </MarkdownChipsProvider>
  );
}
