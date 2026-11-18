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

/** `skills/<name>/SKILL.md` is how a drive scope names an installed skill. */
const skillPattern = /^skills\/([^/]+)\/SKILL\.md$/;

/** The skill names a scope's file list holds, sorted, without duplicates. */
export const skillNames = (paths: ReadonlyArray<string>) =>
  [
    ...new Set(
      paths.flatMap((path) => {
        const match = skillPattern.exec(path);
        return match?.[1] === undefined ? [] : [match[1]];
      }),
    ),
  ].sort();

/** Capy's `$` picker: the skills installed in the org's drive. */
export const skillsMentionSource = (
  paths: ReadonlyArray<string>,
): MentionSource | undefined => {
  const names = skillNames(paths);
  if (names.length === 0) return undefined;
  const items = names.map((name) => ({
    kind: "skill" as const,
    id: name,
    label: name,
  }));
  return {
    category: "skills",
    kind: "skill",
    label: "Skills",
    description: "Use a skill",
    icon: () => <Icon name="sparkle-2" />,
    initial: () => items,
    search: (term) => {
      const needle = term.trim().toLowerCase();
      return items.filter((item) => item.label.toLowerCase().includes(needle));
    },
  };
};
