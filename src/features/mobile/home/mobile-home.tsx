import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { type MobileProjectOption, MobileProjectSheet } from "../sheets";
import { MobileTopBar } from "../shell";

export type MobileHomeProps = {
  projects: ReadonlyArray<MobileProjectOption>;
  selectedProjectId?: string;
  runOn: ReactNode;
  composer: ReactNode;
  background?: ReactNode;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onManageProjects: () => void;
};

export function MobileHome({
  projects,
  selectedProjectId,
  runOn,
  composer,
  background,
  onSelectProject,
  onNewProject,
  onManageProjects,
}: MobileHomeProps) {
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-clip">
      <MobileTopBar />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:var(--gradient-panel-air)]"
      />
      {background && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {background}
        </div>
      )}
      <div className="relative flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-[44.5rem] flex-col pb-[10dvh]">
          <div className="flex min-h-8 min-w-0 items-center gap-3 pr-4 pb-1.5 pl-4">
            <MobileProjectSheet
              projects={projects}
              selectedId={selectedProjectId}
              onSelect={onSelectProject}
              onNewProject={onNewProject}
              onManageProjects={onManageProjects}
              trigger={
                <Button variant="ghost" size="auto-sm" className="w-fit">
                  <span className="min-w-0 truncate">
                    {selectedProject?.name ?? "Project"}
                  </span>
                </Button>
              }
            />
            {runOn}
          </div>
          {composer}
        </div>
      </div>
    </div>
  );
}
