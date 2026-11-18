import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import type { ComposerPayload } from "@/components/composer";
import type { MachineSize } from "@/components/plan-picker/plan-catalog";
import type {
  JamId,
  OrgId,
  ThreadFolderId,
  ThreadTagId,
} from "@/data/api/schemas/ids";
import { reactivityKeys } from "@/data/atoms/conventions";
import {
  addToFolderAtom,
  assignTagAtom,
  pinThreadsAtom,
  threadOrganizationKeys,
} from "@/data/atoms/threadOrganization";
import { ApiClient } from "@/data/client/ApiClient";
import { toast } from "@/primitives/toaster";
import type { OrganizeDraft } from "./organize-menu";

const createJam = ApiClient.mutation("jams", "create");
const createProjectlessJam = ApiClient.mutation("jams", "createProjectless");

export type StartThreadTarget = {
  orgId: OrgId;
  projectId?: string;
  payload: ComposerPayload;
  /** The machine size the footer's menu picked; the project's default when absent. */
  machineSize?: MachineSize;
  /** The folder, tags and pin the footer's organize rows hold for the draft. */
  organize?: OrganizeDraft;
};

/** The id of a jam the A3 client returned undecoded. */
export const jamIdOf = (created: unknown) => {
  if (typeof created !== "object" || created === null) return undefined;
  const id = (created as { id?: unknown }).id;
  return typeof id === "string" ? id : undefined;
};

/** The first line of a draft, as the thread's starting title. */
export const draftTitle = (text: string) => {
  const line = text.split("\n")[0]?.trim() ?? "";
  return line === "" ? undefined : line.slice(0, 80);
};

/**
 * `/new`'s submit: creates the thread the composer's text will start, then
 * opens it. The message itself is `POST jams/:jamId/message`, which the thread
 * lane owns, so the draft rides along as the thread's title for now.
 */
export function useStartThread() {
  const navigate = useNavigate();
  const create = useAtomSet(createJam, { mode: "promise" });
  const createProjectless = useAtomSet(createProjectlessJam, {
    mode: "promise",
  });
  const pin = useAtomSet(pinThreadsAtom, { mode: "promise" });
  const moveToFolder = useAtomSet(addToFolderAtom, { mode: "promise" });
  const assignTag = useAtomSet(assignTagAtom, { mode: "promise" });

  /** Capy's organize picks land on the jam once it exists; each one stands alone. */
  const applyOrganize = (
    orgId: OrgId,
    threadId: string,
    organize: OrganizeDraft,
  ) => {
    const jamIds = [threadId as unknown as JamId];
    const keys = threadOrganizationKeys(orgId);
    const attempts = [
      ...(organize.pinned
        ? [
            pin({
              params: { orgId },
              payload: { jamIds },
              reactivityKeys: keys,
            }),
          ]
        : []),
      ...organize.folderIds.map((folderId) =>
        moveToFolder({
          params: { orgId, folderId: folderId as unknown as ThreadFolderId },
          payload: { jamIds },
          reactivityKeys: keys,
        }),
      ),
      ...organize.tagIds.map((tagId) =>
        assignTag({
          params: { orgId, tagId: tagId as unknown as ThreadTagId },
          payload: { jamIds },
          reactivityKeys: keys,
        }),
      ),
    ];
    return Promise.all(
      attempts.map((attempt) => attempt.catch(() => undefined)),
    );
  };

  return async ({
    orgId,
    projectId,
    payload,
    machineSize,
    organize,
  }: StartThreadTarget) => {
    const title = draftTitle(payload.text);
    const body = machineSize === undefined ? { title } : { title, machineSize };
    try {
      const created =
        projectId === undefined
          ? await createProjectless({
              params: { orgId },
              payload: body,
              reactivityKeys: [reactivityKeys.threads(orgId)],
            })
          : await create({
              params: { orgId, projectId },
              payload: body,
              reactivityKeys: [reactivityKeys.threads(orgId)],
            });
      const threadId = jamIdOf(created);
      if (threadId === undefined) {
        toast.error("Could not start the thread");
        return false;
      }
      if (organize !== undefined)
        await applyOrganize(orgId, threadId, organize);
      await navigate({ to: "/thread/$threadId", params: { threadId } });
      return true;
    } catch {
      toast.error("Could not start the thread");
      return false;
    }
  };
}
