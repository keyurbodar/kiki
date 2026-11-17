import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect, useState } from "react";
import { ProjectSelect } from "@/components/project-select";
import {
  type BranchSelection,
  RepoBranchSelect,
} from "@/components/repo-branch-select";
import {
  type RunOnDevice,
  type RunOnEntry,
  type RunOnPlacement,
  RunOnSelect,
  toRunOnEntries,
} from "@/components/run-on-select";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

type Open = "project" | "machine" | "branch" | "repos" | "none";
type Search = { mode: ColorMode; open: Open; device: "cloud" | "laptop" };

const opens: readonly Open[] = [
  "project",
  "machine",
  "branch",
  "repos",
  "none",
];

export const Route = createFileRoute("/__new-thread-selects")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
    open: opens.includes(search.open as Open) ? (search.open as Open) : "none",
    device: search.device === "laptop" ? "laptop" : "cloud",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: NewThreadSelectsHarness,
});

const orgId = "org_sample_acme" as OrgId;
const userId = "user_sample_alex";

const sampleDevices: RunOnDevice[] = [
  {
    id: "device_sample_laptop",
    name: "alex-laptop",
    description: null,
    hardware: { formFactor: "laptop", chip: "Apple M4" },
    ownerName: "Alex Morgan",
    userId,
    access: "private",
    revokedAt: null,
    connected: true,
    lastConnectedAt: new Date(),
    createdAt: new Date(0),
    workspaces: [
      { root: "/Users/alex/code/web", repos: ["acme/web"], branch: "main" },
    ],
  },
];

const singleRepo = {
  repos: [
    {
      repoFullName: "acme/web",
      baseBranch: "main",
      position: 0,
      verificationSource: "installation",
      mode: "primary",
    },
  ],
} as unknown as Pick<Project, "repos">;

const multiRepo = {
  repos: [
    { repoFullName: "acme/api", baseBranch: "main" },
    { repoFullName: "acme/shared", baseBranch: "main" },
  ],
} as unknown as Pick<Project, "repos">;

const sampleBranches = {
  "acme/web": ["main", "release", "fix-login"],
  "acme/api": ["main", "staging"],
  "acme/shared": ["main"],
};

function NewThreadSelectsHarness() {
  const { mode, open, device } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  const entries = toRunOnEntries(sampleDevices, userId, ["acme/web"]);
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [machine, setMachine] = useState<RunOnEntry | null>(
    device === "laptop" ? (entries[0] ?? null) : null,
  );
  const [placement, setPlacement] = useState<RunOnPlacement>("worktree");
  const [selection, setSelection] = useState<BranchSelection>({});

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-3xl flex-col gap-2">
        <div className="flex min-w-0 items-center gap-3 px-4 text-sm font-medium text-foreground">
          <ProjectSelect
            orgId={orgId}
            value={project}
            onValueChange={setProject}
            defaultOpen={open === "project"}
          />
          <RunOnSelect
            devices={entries}
            value={machine}
            onChange={setMachine}
            placement={machine === null ? null : placement}
            onPlacementChange={setPlacement}
            onExistingPick={() => setPlacement("worktree")}
            defaultOpen={open === "machine"}
          />
          <div className="ml-auto flex items-center gap-3">
            <RepoBranchSelect
              project={singleRepo}
              selection={selection}
              onSelectionChange={setSelection}
              branches={sampleBranches}
              defaultOpen={open === "branch"}
            />
            <RepoBranchSelect
              project={multiRepo}
              selection={selection}
              onSelectionChange={setSelection}
              branches={sampleBranches}
              defaultOpen={open === "repos"}
            />
          </div>
        </div>
        <div className="h-28 rounded-xl border border-border-1 bg-card" />
      </div>
    </div>
  );
}
