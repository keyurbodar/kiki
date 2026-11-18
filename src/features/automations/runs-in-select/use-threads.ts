import { useAtomValue } from "@effect/atom-react";
import type { OrgId, ProjectId } from "@/data/api/schemas/ids";
import { projectsAtom } from "@/data/atoms/projects";
import { useThreadsAtom } from "@/data/atoms/threads";
import { resultValue, useOrgId } from "../automation-editor/use-org";
import { type ThreadRef, threadCode } from "./runs-in";

export type ProjectThread = ThreadRef & { personal: boolean };

export function useProjectThreads(
  projectId: string | undefined,
): ReadonlyArray<ProjectThread> {
  const orgId = (useOrgId() ?? "") as OrgId;
  const projects = resultValue(useAtomValue(projectsAtom(orgId))) ?? [];
  const page = resultValue(
    useAtomValue(
      useThreadsAtom(
        orgId,
        projectId === undefined ? undefined : (projectId as ProjectId),
      ),
    ),
  );
  return (page?.items ?? []).map((thread) => ({
    id: thread.id,
    title: thread.title,
    code: threadCode(thread, projects),
    archived: thread.archived,
    personal: thread.personal,
  }));
}
