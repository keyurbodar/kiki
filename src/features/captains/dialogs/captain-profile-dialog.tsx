import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import type { JamId } from "@/data/api/schemas/ids";
import { idleAtom } from "@/data/atoms/idle";
import { projectsAtom } from "@/data/atoms/projects";
import { captainAtom } from "@/features/captains/overview/captain-data";
import { CaptainDialog } from "./captain-dialog";
import { captainProfileOf } from "./captain-profile";
import { useCurrentUserId, useOrgId } from "./session";

export type CaptainProfileDialogProps = {
  jamId: JamId;
  onClose: () => void;
};

const noDetail = idleAtom<unknown>();
const noProjects = idleAtom<unknown>();

/**
 * What the sidebar's Captain row opens under Profile: Capy's Captain dialog on
 * the Captain's own page, read from the Captain's record rather than the row's
 * card so the dialog can edit every field it shows.
 */
export function CaptainProfileDialog({
  jamId,
  onClose,
}: CaptainProfileDialogProps) {
  const orgId = useOrgId();
  const userId = useCurrentUserId();
  const detail = Option.getOrUndefined(
    AsyncResult.value(
      useAtomValue(orgId === undefined ? noDetail : captainAtom(orgId, jamId)),
    ),
  );
  const projects = Option.getOrUndefined(
    AsyncResult.value(
      useAtomValue(orgId === undefined ? noProjects : projectsAtom(orgId)),
    ),
  );
  const draft = captainProfileOf(detail, {
    ...(userId === undefined ? {} : { userId }),
  });
  const projectName = Array.isArray(projects)
    ? projects.find((project) => project.id === draft?.projectId)?.name
    : undefined;
  const profile =
    draft === undefined || projectName === undefined
      ? draft
      : { ...draft, projectName };
  if (orgId === undefined || profile === undefined) return null;
  return (
    <CaptainDialog
      request={{ kind: "edit", jamId, entry: "profile", profile }}
      onClose={onClose}
    />
  );
}
