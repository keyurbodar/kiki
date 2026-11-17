export type PullPanelSelection =
  | { kind: "thread"; jamId: string }
  | { kind: "chat" }
  | null;

export type PanelPull = {
  id: string;
  number: number;
  title: string;
  repo: string;
  headRef: string;
  projectId: string | null;
  threadId: string | null;
};

export type PullChatMention = {
  kind: "pr";
  id: string;
  label: string;
  start: number;
  end: number;
  text: string;
};

export type PullChatDraft = {
  text: string;
  mentions: PullChatMention[];
  files: [];
};

export function selectionFromSearch(search: {
  thread?: string;
  chat?: string;
}): PullPanelSelection {
  if (search.thread !== undefined) {
    return { kind: "thread", jamId: search.thread };
  }
  return search.chat === "true" ? { kind: "chat" } : null;
}

export function linkedThreadIds(
  linked: unknown,
  fallback: string | null,
): string[] {
  if (!Array.isArray(linked)) return fallback === null ? [] : [fallback];
  return linked.flatMap((row: unknown) => {
    if (typeof row === "string") return [row];
    if (typeof row === "object" && row !== null && "id" in row) {
      return typeof row.id === "string" ? [row.id] : [];
    }
    return [];
  });
}

export type OwnedThread = {
  id: string;
  userId: string;
  createdAt: string | Date;
};

export function newestOwnThread(
  threads: readonly OwnedThread[],
  userId: string,
): string | null {
  const time = (thread: OwnedThread) => new Date(thread.createdAt).getTime();
  return (
    threads
      .filter((thread) => thread.userId === userId)
      .toSorted((a, b) => time(b) - time(a))[0]?.id ?? null
  );
}

export function triggerSelection({
  ownThreadId,
  pending,
  chatable,
}: {
  ownThreadId: string | null | undefined;
  pending: boolean;
  chatable: boolean;
}): PullPanelSelection {
  if (ownThreadId === undefined) return null;
  if (ownThreadId !== null) return { kind: "thread", jamId: ownThreadId };
  if (pending) return null;
  return chatable ? { kind: "chat" } : null;
}

export const pullThreadTitle = (pull: Pick<PanelPull, "number" | "title">) =>
  `#${pull.number} ${pull.title}`;

export function pullChatDraft(pull: PanelPull): PullChatDraft {
  const label = pullThreadTitle(pull);
  const text = `@${label}`;
  return {
    text: `${text} `,
    mentions: [
      {
        kind: "pr",
        id: `${pull.repo.toLowerCase()}#${pull.number}`,
        label,
        start: 0,
        end: text.length,
        text,
      },
    ],
    files: [],
  };
}

export const pullChatSubtitle = (pull: Pick<PanelPull, "repo" | "number">) =>
  `${pull.repo.split("/").at(-1) ?? pull.repo}#${pull.number}`;
