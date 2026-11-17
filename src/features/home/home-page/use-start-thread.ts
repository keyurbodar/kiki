import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ComposerPayload } from "@/components/composer";
import type { MachineSize } from "@/components/plan-picker/plan-catalog";
import type { OrgId } from "@/data/api/schemas/ids";
import { reactivityKeys } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

const createJam = ApiClient.mutation("jams", "create");
const createProjectlessJam = ApiClient.mutation("jams", "createProjectless");

export type StartThreadTarget = {
  orgId: OrgId;
  projectId?: string;
  payload: ComposerPayload;
  /** The machine size the footer's menu picked; the project's default when absent. */
  machineSize?: MachineSize;
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

  return async ({
    orgId,
    projectId,
    payload,
    machineSize,
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
      await navigate({ to: "/thread/$threadId", params: { threadId } });
      return true;
    } catch {
      toast.error("Could not start the thread");
      return false;
    }
  };
}
