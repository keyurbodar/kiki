import { useAtomSet } from "@effect/atom-react";
import type { Project } from "@/data/api/schemas/project";
import { ApiClient } from "@/data/client/ApiClient";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { toast } from "sonner";
import {
  visibleWelcomeProjects,
  welcomeActionLabel,
} from "./welcome";

const ensureProjectAtom = ApiClient.mutation("projects", "create");
const projectlessJamAtom = ApiClient.mutation("jams", "createProjectless");

export type HomeWelcomeProps = {
  orgId: string;
  projects: ReadonlyArray<Project>;
  projectless: boolean;
  onPick: (project: Project) => void;
  onStart: (project?: Project) => void;
};

export function HomeWelcome({
  orgId,
  projects,
  projectless,
  onPick,
  onStart,
}: HomeWelcomeProps) {
  const ensureProject = useAtomSet(ensureProjectAtom, { mode: "promise" });
  const createProjectless = useAtomSet(projectlessJamAtom, {
    mode: "promise",
  });
  const shown = visibleWelcomeProjects(projects);
  const withoutRepo = async () => {
    if (projectless) {
      onStart();
      return;
    }
    try {
      const project = await ensureProject({
        params: { orgId },
        payload: { name: "Home", code: "HOME", repos: [] },
        reactivityKeys: [`projects:${orgId}`],
      });
      onStart(project as Project);
    } catch {
      toast.error("Could not start without a repository, try again");
    }
  };
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
      {shown.length > 0 ? (
        shown.map((project) => (
          <Button
            key={project.id}
            variant="outline"
            size="sm"
            onClick={() => onPick(project)}
          >
            <Icon name="folder" size="sm" />
            {project.name}
          </Button>
        ))
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              createProjectless({
                params: { orgId },
                payload: { name: "Home", code: "HOME", repos: [] },
              }).catch(() =>
                toast.error("Could not start without a repository, try again"),
              )
            }
          >
            <Icon name="folder" size="sm" />
            Add project
          </Button>
          <Button variant="outline" size="sm" onClick={withoutRepo}>
            <Icon name="cloud" size="sm" />
            {welcomeActionLabel(projectless)}
          </Button>
        </>
      )}
    </div>
  );
}
