import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import {
  Composer,
  type ComposerCommand,
  type MentionItem,
  type MentionSource,
} from "@/components/composer";
import { Icon } from "@/primitives/icon";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__composer")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: ComposerHarness,
});

const threads: MentionItem[] = [
  {
    kind: "thread",
    id: "t1",
    label: "Fix flaky checkout test",
    subtitle: "acme/web",
  },
  {
    kind: "thread",
    id: "t2",
    label: "Add dark mode toggle",
    subtitle: "acme/web",
  },
  {
    kind: "thread",
    id: "t3",
    label: "Speed up CI cache",
    subtitle: "acme/api",
  },
];

const pulls: MentionItem[] = [
  {
    kind: "pull",
    id: "p1",
    label: "Retry webhook deliveries",
    subtitle: "acme/api#214",
  },
  {
    kind: "pull",
    id: "p2",
    label: "Paginate the audit log",
    subtitle: "acme/web#88",
  },
];

const source = (
  category: string,
  kind: MentionItem["kind"],
  label: string,
  icon: "chat-bubbles" | "bubble-wide",
  items: MentionItem[],
): MentionSource => ({
  category,
  kind,
  label,
  icon: () => <Icon name={icon} />,
  search: (term) =>
    items.filter((i) => i.label.toLowerCase().includes(term.toLowerCase())),
  initial: () => items,
});

const sources = [
  source("threads", "thread", "Threads", "chat-bubbles", threads),
  source("pulls", "pull", "Pull requests", "bubble-wide", pulls),
];

const commands: ComposerCommand[] = [
  {
    kind: "insert",
    name: "review",
    label: "Review changes",
    text: "Review the open changes",
  },
  {
    kind: "insert",
    name: "plan",
    label: "Plan first",
    text: "Write a plan before editing",
  },
  {
    kind: "action",
    name: "clear",
    label: "Clear context",
    run: () => undefined,
  },
];

function ComposerHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  return (
    <div className="flex min-h-dvh w-full items-start justify-center bg-background p-(--spacing-page-padding) font-sans text-foreground">
      <div className="w-full max-w-(--container-3xl)" data-harness="composer">
        <Composer
          sources={sources}
          commands={commands}
          onSubmit={() => true}
          onFilesAdded={() => undefined}
        />
      </div>
    </div>
  );
}
