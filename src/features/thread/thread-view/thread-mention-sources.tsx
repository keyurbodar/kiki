import type { MentionSource } from "@/components/composer";
import type { ThreadCard } from "@/data/api/schemas/thread";
import { Icon } from "@/primitives/icon";

/** Capy's first mention category, fed by the org's own threads. */
export const threadMentionSources = (
  threads: ReadonlyArray<ThreadCard>,
  currentThreadId: string,
): MentionSource[] => {
  const items = threads
    .filter((thread) => thread.id !== currentThreadId && !thread.archived)
    .map((thread) => ({
      kind: "thread" as const,
      id: thread.id,
      label: thread.title ?? "Untitled thread",
    }));
  if (items.length === 0) return [];
  return [
    {
      category: "threads",
      kind: "thread",
      label: "Threads",
      description: "Reference another thread",
      icon: () => <Icon name="chat-bubbles" />,
      initial: () => items,
      search: (term) => {
        const needle = term.trim().toLowerCase();
        return items.filter((item) =>
          item.label.toLowerCase().includes(needle),
        );
      },
    },
  ];
};
