import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import { idleAtom } from "@/data/atoms/idle";
import { threadAtom, threadKey } from "@/data/atoms/jams";
import { projectsAtom } from "@/data/atoms/projects";
import {
  automationAtom,
  automationKey,
} from "@/features/automations/automation-editor/atoms";
import type { DriveMount } from "../lib/mount";
import { useDriveSession } from "./use-drive-session";

const idleProjects = idleAtom<readonly Project[]>();
const idleUnknown = idleAtom<unknown>();

const stringField = (value: unknown, field: "name" | "title") => {
  if (typeof value !== "object" || value === null) return undefined;
  const found = (value as Record<string, unknown>)[field];
  return typeof found === "string" && found !== "" ? found : undefined;
};

/**
 * The owner names a drive trail prints: the organization's name, and the
 * captain thread's title, the automation's name or the project's name for the
 * scopes that are owned by one. Without these the trail prints the scope's kind.
 */
export function useDriveTrailNames(mount: DriveMount): {
  readonly orgId: OrgId | undefined;
  readonly names: {
    readonly organization: string | undefined;
    readonly captain: string | undefined;
    readonly automation: string | undefined;
    readonly project: string | undefined;
  };
} {
  const session = useDriveSession();
  const orgId = session.orgId as OrgId | undefined;
  const thread = useAtomValue(
    orgId !== undefined && mount.kind === "captain"
      ? threadAtom(threadKey(orgId, mount.jamId as JamId))
      : idleUnknown,
  );
  const automation = useAtomValue(
    orgId !== undefined && mount.kind === "automation"
      ? automationAtom(automationKey(orgId, mount.automationId))
      : idleUnknown,
  );
  const projects = useAtomValue(
    orgId !== undefined && mount.kind === "project"
      ? projectsAtom(orgId)
      : idleProjects,
  );
  const projectId = mount.kind === "project" ? mount.projectId : undefined;
  const project =
    AsyncResult.isSuccess(projects) && projectId !== undefined
      ? projects.value.find((each) => each.id === projectId)?.name
      : undefined;
  return {
    orgId,
    names: {
      organization: session.organizationName,
      captain: stringField(
        Option.getOrUndefined(AsyncResult.value(thread)),
        "title",
      ),
      automation: stringField(
        Option.getOrUndefined(AsyncResult.value(automation)),
        "name",
      ),
      project,
    },
  };
}
