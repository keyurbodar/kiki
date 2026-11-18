import {
  type ChipPull,
  type ChipThread,
  type MarkdownChipsContextValue,
  pullKey,
} from "@/components/markdown-chips";
import { threadCode } from "@/components/thread-preview";
import type { ThreadCard } from "@/data/api/schemas/thread";

/**
 * What the transcript knows about the references in its own text: every thread
 * the org lists, keyed by the code people type (KIKI-12), and every pull those
 * threads carry, keyed `owner/repo#N`. Without this a code stays plain text and
 * a pull stays an external link.
 */

export type ThreadChipsInput = {
  /** The org's threads, as the sidebar already holds them. */
  threads: ReadonlyArray<ThreadCard>;
  /** Project id to its code, so a thread number becomes a code people can type. */
  projectCodes: ReadonlyMap<string, string>;
  /** The thread being read; its own pulls name the repository bare `#N` refers to. */
  currentThreadId: string;
};

export type ThreadChips = Pick<
  MarkdownChipsContextValue,
  "threads" | "pullRequests" | "repository"
>;

const chipStatus = (status: ThreadCard["status"]): ChipThread["status"] =>
  status === "archived" ? "done" : status;

const chipPull = (pull: ThreadCard["pulls"][number]): ChipPull => ({
  repo: pull.repo,
  number: pull.number,
  state: pull.state,
  title: pull.title,
  url: pull.url,
  additions: pull.additions,
  deletions: pull.deletions,
  author: pull.author,
  authorAvatarUrl: pull.authorAvatarUrl,
});

export const threadChips = ({
  threads,
  projectCodes,
  currentThreadId,
}: ThreadChipsInput): ThreadChips => {
  const byCode = new Map<string, ChipThread>();
  const pulls = new Map<string, ChipPull>();
  let repository: string | undefined;
  for (const thread of threads) {
    const code = threadCode(
      thread,
      thread.projectId === null
        ? undefined
        : projectCodes.get(thread.projectId),
    );
    if (code !== null)
      byCode.set(code, {
        id: thread.id,
        code,
        title: thread.title,
        status: chipStatus(thread.status),
        archived: thread.archived,
        projectId: thread.projectId,
      });
    for (const pull of thread.pulls)
      pulls.set(pullKey(pull.repo, pull.number), chipPull(pull));
    if (thread.id === currentThreadId && thread.pulls[0] !== undefined)
      repository = thread.pulls[0].repo;
  }
  return { threads: byCode, pullRequests: pulls, repository };
};
