import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useCallback, useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { toast } from "sonner";
import { Composer } from "@/components/composer";
import { ProjectSelect } from "@/components/project-select";
import { RepoBranchSelect } from "@/components/repo-branch-select";
import { RunOnSelect } from "@/components/run-on-select";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import type { Project } from "@/data/api/schemas/project";
import { HomeWelcome } from "../home-welcome";
import { ProjectEnvironmentHint } from "../project-environment-hint";
import {
  hasRepositories,
  homeJoinedAtom,
  homeWelcomeDismissedAtom,
  shouldShowWelcome,
  welcomeProjects,
} from "./home-state";
import { startThread, type ThreadMessage } from "./start-thread";

const createJamAtom = ApiClient.mutation("jams", "create");
const createProjectAtom = ApiClient.mutation("projects", "create");

export type HomePageProps = ComponentProps<"div"> & {
  prompt?: string;
};

const asList = <A,>(result: AsyncResult.AsyncResult<unknown, unknown>) =>
  AsyncResult.isSuccess(result) && Array.isArray(result.value)
    ? (result.value as ReadonlyArray<A>)
    : [];

export function HomePage({ prompt, ...props }: HomePageProps) {
  const navigate = useNavigate();
  const organizations = asList<{ id: string }>(useAtomValue(organizationsAtom));
  const dismissed = useAtomValue(homeWelcomeDismissedAtom);
  const joined = useAtomValue(homeJoinedAtom);
  const setDismissed = useAtomSet(homeWelcomeDismissedAtom);
  const setJoined = useAtomSet(homeJoinedAtom);
  const createJam = useAtomSet(createJamAtom, { mode: "promise" });
  const createProject = useAtomSet(createProjectAtom, { mode: "promise" });

  const orgId = organizations[0]?.id;
  const projectsResult = useAtomValue(projectsAtom(orgId ?? ""));
  const projects =
    orgId === undefined ? undefined : asList<Project>(projectsResult);

  const [text, setText] = useState(prompt ?? "");
  const [project, setProject] = useState<Project | undefined>(undefined);

  useEffect(() => {
    if (prompt !== undefined) setText(prompt);
  }, [prompt]);

  const withRepositories = (projects ?? []).filter(hasRepositories);
  const realProject =
    project !== undefined && !project.deleted ? project : undefined;

  const welcome = shouldShowWelcome({
    orgId,
    projects,
    hasDraft: text.trim() !== "",
    dismissed,
    joined,
  });

  const dismissWelcome = useCallback(() => {
    if (orgId === undefined) return;
    setDismissed((ids) => (ids.includes(orgId) ? ids : [...ids, orgId]));
  }, [orgId, setDismissed]);

  const onStart = useCallback(
    async (message: ThreadMessage, chosen?: Project) => {
      if (orgId === undefined) return;
      const target = chosen ?? realProject;
      await startThread(
        {
          orgId,
          projectId: target?.id,
          needsProject: target === undefined,
          ensureProject: async (forOrg) =>
            (await createProject({
              params: { orgId: forOrg },
              payload: { name: "Home", code: "HOME", repos: [] },
              reactivityKeys: [`projects:${forOrg}`],
            })) as Project,
          create: (request) =>
            createJam({
              params: { orgId: request.params.orgId },
              payload: request.payload,
              reactivityKeys: request.reactivityKeys,
            }) as Promise<{ slack?: unknown }>,
          openThread: async (jamId) => {
            await navigate({
              to: "/thread/$threadId",
              params: { threadId: jamId },
            });
          },
          backToNew: async () => {
            await navigate({ to: "/new" });
          },
          keepDraft: (kept) => setText(kept.text),
          clearDraft: () => setText(""),
          toastError: (message, options) => toast.error(message, options),
        },
        message,
      );
      setJoined((ids) => (ids.includes(orgId) ? ids : [...ids, orgId]));
    },
    [createJam, createProject, navigate, orgId, realProject, setJoined],
  );

  void onStart;
  void setText;
  void withRepositories;

  return (
    <div
      {...props}
      data-slot="home-page"
      className={[
        "relative flex min-h-0 flex-1 flex-col overflow-clip",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        aria-hidden={true}
        className="pointer-events-none absolute inset-0 [background-image:var(--gradient-panel-air)]"
      />
      <div className="relative flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-[712px] flex-col pb-[10dvh]">
          <div className="flex min-h-8 min-w-0 items-center gap-3 pb-1.5 pl-4 pr-4">
            <ProjectSelect className="min-w-0 shrink" />
            <ProjectEnvironmentHint orgId={orgId} project={realProject} />
            <span className="ml-auto flex min-w-0 shrink items-center gap-2">
              <RepoBranchSelect className="min-w-0 shrink" />
            </span>
            <RunOnSelect className="min-w-0 shrink" />
          </div>
          <div className="relative rounded-(--radius-card)">
            <Composer />
          </div>
          {welcome ? (
            <HomeWelcome
              orgId={orgId ?? ""}
              projects={welcomeProjects({ orgId, projects, joined })}
              projectless={false}
              onPick={(picked) => {
                setProject(picked);
                dismissWelcome();
              }}
              onStart={(chosen) => {
                if (chosen !== undefined) setProject(chosen);
                dismissWelcome();
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
