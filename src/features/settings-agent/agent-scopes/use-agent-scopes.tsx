import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import {
  type AgentContextPartKind,
  type Captain,
  captainsAtom,
  type DriveScope,
  driveScopeFilesKey,
} from "@/data/atoms/agent-context";
import { projectsAtom } from "@/data/atoms/projects";
import {
  currentUserAtom,
  organizationsAtom,
  useActiveOrgId,
} from "@/data/atoms/session";
import { Icon } from "@/primitives/icon";
import {
  CaptainAvatar,
  ProjectGlyph,
  type ScopeProject,
} from "./project-glyph";

/** One drive scope whose AGENTS.md and skills Capy loads, as Capy's settings list it. */
export type AgentScope = {
  key: string;
  icon: ReactNode;
  name: string;
  kind: string;
  title: string;
  audience: string;
  scope: DriveScope;
  /** Capy's context-part kind for this scope's instructions line. */
  part: AgentContextPartKind;
  filtersKey: string;
  captain?: string;
  readOnly?: boolean;
};

const idleAtom = Atom.make(AsyncResult.initial(true));

const idle = <A,>() =>
  idleAtom as unknown as Atom.Atom<AsyncResult.AsyncResult<A, unknown>>;

export const resultValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

/** The signed-in organization: the one the viewer selected, else the first they belong to. */
export function useAgentOrg() {
  const organizations = resultValue(useAtomValue(organizationsAtom));
  const activeOrgId = useActiveOrgId();
  const org = organizations?.find(
    (candidate) => candidate.id === activeOrgId,
  );
  return { org, orgId: org?.id };
}

export type AgentScopeInputs = {
  orgId: string;
  orgName: string;
  userId: string | undefined;
  project: ScopeProject | undefined;
  captains: ReadonlyArray<Captain>;
};

/** Capy's scope order: organization, project, you, you in the project, then the project's captains. */
export const buildAgentScopes = ({
  orgId,
  orgName,
  userId,
  project,
  captains,
}: AgentScopeInputs): AgentScope[] => {
  const scope = (
    key: string,
    value: DriveScope,
    rest: Omit<AgentScope, "key" | "scope" | "filtersKey">,
  ) => ({
    key,
    scope: value,
    filtersKey: driveScopeFilesKey(orgId, value),
    ...rest,
  });
  return [
    scope(
      "org",
      {},
      {
        part: "org",
        icon: <Icon name="buildings" />,
        name: orgName,
        kind: "Organization",
        title: "Organization instructions",
        audience: `Every thread in ${orgName}`,
      },
    ),
    ...(project === undefined
      ? []
      : [
          scope(
            "project",
            { projectId: project.id },
            {
              part: "project",
              icon: <ProjectGlyph project={project} />,
              name: project.name,
              kind: "Project",
              title: `${project.name} instructions`,
              audience: `Every thread in ${project.name}`,
            },
          ),
        ]),
    ...(userId === undefined
      ? []
      : [
          scope(
            "user",
            { userId },
            {
              part: "user",
              icon: <Icon name="user" />,
              name: "You",
              kind: "Every project",
              title: "Your instructions",
              audience: "Every thread you start, in every project",
            },
          ),
        ]),
    ...(userId === undefined || project === undefined
      ? []
      : [
          scope(
            "project-user",
            { projectId: project.id, userId },
            {
              part: "project-user",
              icon: <Icon name="user" />,
              name: `You in ${project.name}`,
              kind: "Only you, only here",
              title: `Your instructions in ${project.name}`,
              audience: `Threads you start in ${project.name}`,
            },
          ),
        ]),
    ...captains
      .filter(
        (captain) => project !== undefined && captain.projectId === project.id,
      )
      .map((captain) =>
        scope(
          `captain:${captain.id}`,
          { captainJamId: captain.id },
          {
            part: "captain",
            icon: <CaptainAvatar captain={captain} size="xs" />,
            name: captain.name,
            kind: "Captain",
            title: captain.name,
            audience: `${captain.name} and its crew`,
            captain: captain.name,
            readOnly: captain.ownerId !== userId,
          },
        ),
      ),
  ];
};

/** Capy's `useAgentScopes`: the project picker state and the scopes for that project. */
export function useAgentScopes() {
  const { org, orgId } = useAgentOrg();
  const user = resultValue(useAtomValue(currentUserAtom));
  const projects =
    resultValue(
      useAtomValue(
        orgId === undefined
          ? idle<ReadonlyArray<ScopeProject>>()
          : projectsAtom(orgId),
      ),
    ) ?? [];
  const captains =
    resultValue(
      useAtomValue(
        orgId === undefined
          ? idle<ReadonlyArray<Captain>>()
          : captainsAtom(orgId),
      ),
    ) ?? [];
  const [projectId, setProjectId] = useState<string>();
  const project =
    projects.find((candidate) => candidate.id === projectId) ?? projects[0];
  const scopes =
    orgId === undefined
      ? []
      : buildAgentScopes({
          orgId,
          orgName: org?.name ?? "Organization",
          userId: user?.id,
          project,
          captains,
        });
  return {
    orgId,
    projects,
    project,
    setProjectId,
    scopes,
    ready: org !== undefined && user !== undefined,
  };
}
