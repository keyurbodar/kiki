import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { useState } from "react";
import { JamId, OrgId } from "@/data/api/schemas/ids";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { projectsAtom } from "@/data/atoms/projects";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { toast } from "@/primitives/toaster";
import {
  linkedThreadIds,
  newestOwnThread,
  type OwnedThread,
  type PanelPull,
  type PullPanelSelection,
  pullThreadTitle,
  triggerSelection,
} from "./selection";

const value = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

const pullThreadsAtom = Atom.family((key: string) => {
  const [orgId = "", pullId = ""] = key.split("|");
  return ApiClient.query("pulls", "threads", {
    params: { orgId, pullId },
    reactivityKeys: [`pull:${pullId}`],
    timeToLive: "30 seconds",
  });
});

const threadAtom = Atom.family((key: string) => {
  const [orgId = "", jamId = ""] = key.split("|");
  return ApiClient.query("jams", "get", {
    params: { orgId: OrgId.make(orgId), jamId: JamId.make(jamId) },
    timeToLive: queryTimeToLive,
  });
});

const panelSelectionAtom = Atom.family((key: string) =>
  Atom.make((get): PullPanelSelection => {
    const [pullId, threadId, projectId] = JSON.parse(key) as [
      string,
      string | null,
      string | null,
    ];
    const orgId = value(get(organizationsAtom))?.[0]?.id;
    const userId = value(get(currentUserAtom))?.id;
    if (orgId === undefined || userId === undefined) return null;
    const linked = get(pullThreadsAtom(`${orgId}|${pullId}`));
    const projects = value(get(projectsAtom(orgId))) ?? [];
    const threads = linkedThreadIds(value(linked), threadId).map((jamId) =>
      get(threadAtom(`${orgId}|${jamId}`)),
    );
    const loading = threads.some(
      (result) => result.waiting || AsyncResult.isInitial(result),
    );
    return triggerSelection({
      ownThreadId: loading
        ? undefined
        : newestOwnThread(
            threads.flatMap((result) => {
              const thread = value(result) as Partial<OwnedThread> | undefined;
              return thread?.id !== undefined &&
                thread.userId !== undefined &&
                thread.createdAt !== undefined
                ? [thread as OwnedThread]
                : [];
            }),
            userId,
          ),
      pending: !AsyncResult.isSuccess(linked),
      chatable:
        projectId !== null &&
        projects.some((project) => project.id === projectId),
    });
  }),
);

const createThreadAtom = ApiClient.mutation("jams", "create");
const linkThreadAtom = ApiClient.mutation("pulls", "linkThread");

export function useActiveOrgId() {
  return value(useAtomValue(organizationsAtom))?.[0]?.id;
}

export function usePullThreadSelection(pull: PanelPull): PullPanelSelection {
  return useAtomValue(
    panelSelectionAtom(
      JSON.stringify([pull.id, pull.threadId, pull.projectId]),
    ),
  );
}

export function useStartPullChat(
  pull: PanelPull,
  onCreated: (jamId: string) => void,
) {
  const orgId = useActiveOrgId();
  const createThread = useAtomSet(createThreadAtom, { mode: "promise" });
  const linkThread = useAtomSet(linkThreadAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);

  const link = async (jamId: string) => {
    if (orgId === undefined) return;
    try {
      await linkThread({
        params: { orgId, pullId: pull.id },
        payload: { jamId },
        reactivityKeys: [`pull:${orgId}`, `pull:${pull.id}`],
      });
    } catch (error) {
      console.error(`Failed to link ${jamId} to ${pull.id}`, error);
    }
  };

  const start = async (message: string) => {
    if (orgId === undefined || pull.projectId === null) return false;
    setBusy(true);
    let jamId: string;
    try {
      const created = (await createThread({
        params: { orgId, projectId: pull.projectId },
        payload: {
          title: pullThreadTitle(pull),
          message,
          branches: { [pull.repo]: pull.headRef },
        },
      })) as { id: string };
      jamId = created.id;
    } catch (error) {
      toast.error("Failed to start thread", {
        description: error instanceof Error ? error.message : undefined,
      });
      setBusy(false);
      return false;
    }
    onCreated(jamId);
    await link(jamId);
    setBusy(false);
    return true;
  };

  return { start, busy, ready: orgId !== undefined && pull.projectId !== null };
}
