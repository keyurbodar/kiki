import { Schema } from "effect";
import { KeyValueStore } from "effect/persistence";
import { Atom } from "effect/reactivity";
import type { Project } from "@/data/api/schemas/project";

const storage = Atom.runtime(
  KeyValueStore.layerStorage(() => globalThis.localStorage),
);

const orgIdList = (key: string) =>
  Atom.kvs({
    runtime: storage,
    key,
    schema: Schema.Array(Schema.String),
    defaultValue: (): ReadonlyArray<string> => [],
  });

export const homeWelcomeDismissedAtom = orgIdList(
  "capy-web:home-welcome-dismissed",
);

export const homeJoinedAtom = orgIdList("capy-web:home-joined");

export const hasRepositories = (project: Project) =>
  !project.deleted && project.repos.length > 0;

export type WelcomeInput = {
  orgId: string | undefined;
  projects: ReadonlyArray<Project> | undefined;
  hasDraft: boolean;
  dismissed: ReadonlyArray<string>;
  joined: ReadonlyArray<string>;
};

export const shouldShowWelcome = ({
  orgId,
  projects,
  hasDraft,
  dismissed,
  joined,
}: WelcomeInput) =>
  orgId !== undefined &&
  projects !== undefined &&
  !hasDraft &&
  !dismissed.includes(orgId) &&
  (joined.includes(orgId) || projects.filter(hasRepositories).length === 0);

export const welcomeProjects = ({
  orgId,
  projects,
  joined,
}: Pick<WelcomeInput, "orgId" | "projects" | "joined">) =>
  orgId !== undefined && joined.includes(orgId)
    ? (projects ?? []).filter(hasRepositories)
    : [];
