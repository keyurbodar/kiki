import { useAtomValue } from "@effect/atom-react";
import { DateTime, Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import type { SidebarProject } from "@/components/sidebar-threads";
import type { CaptainCard } from "@/data/api/schemas/captain";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import type { ThreadCard } from "@/data/api/schemas/thread";
import type { ThreadFolder } from "@/data/api/schemas/threadOrganization";
import { captainsAtom } from "@/data/atoms/captains";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom, selectedOrgIdAtom } from "@/data/atoms/session";
import { folderBoardAtom, foldersAtom } from "@/data/atoms/threadOrganization";
import { allThreadsAtom } from "@/data/atoms/threads";
import type {
  SidebarSource,
  SourceCaptain,
  SourceFolder,
  SourceThread,
} from "./build-view";

type LiveData = {
  threads: readonly ThreadCard[];
  folders: readonly ThreadFolder[];
  board: readonly { folder: ThreadFolder; items: readonly ThreadCard[] }[];
  captains: readonly CaptainCard[];
  projects: readonly Project[];
};

const idle = <A>(empty: A) => Atom.make(AsyncResult.success<A>(empty));

const idleThreadsAtom = idle<ThreadCard[]>([]);
const idleFoldersAtom = idle<ReadonlyArray<ThreadFolder>>([]);
const idleBoardAtom = idle<
  ReadonlyArray<{ folder: ThreadFolder; items: ReadonlyArray<ThreadCard> }>
>([]);
const idleCaptainsAtom = idle<ReadonlyArray<CaptainCard>>([]);
const idleProjectsAtom = idle<ReadonlyArray<Project>>([]);

const resultValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

const toDate = (value: ThreadCard["createdAt"]) => DateTime.toDate(value);

/** Ask payloads are untyped in the data layer; the sidebar draws only their text. */
export const askText = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.text === "string") return record.text;
  if (typeof record.prompt === "string") return record.prompt;
  return null;
};

export function mapThread(card: ThreadCard): SourceThread {
  const machine = card.primaryMachine;
  const record =
    typeof machine === "object" && machine !== null
      ? (machine as Record<string, unknown>)
      : undefined;
  const kind = record?.kind;
  return {
    id: card.id,
    title: card.title,
    status: card.status,
    needsYou: card.needsYou,
    ask: askText(card.ask),
    hasUnreads: card.hasUnreads,
    projectId: card.projectId,
    machine:
      kind === "cloud" || kind === "device"
        ? {
            kind,
            name:
              typeof record?.name === "string"
                ? record.name
                : kind === "cloud"
                  ? "Cloud"
                  : "Device",
          }
        : null,
    settled: card.settledAt != null,
    createdAt: toDate(card.createdAt),
    updatedAt: toDate(card.updatedAt),
    card,
    description: card.preview,
  };
}

/** Pins live on ThreadCard, so the pinned system folder is derived from them. */
export function mapPinnedFolder(threads: readonly ThreadCard[]): SourceFolder {
  return {
    id: "pinned",
    name: null,
    systemKind: "pinned",
    threadIds: threads
      .filter((thread) => thread.pinned)
      .map((thread) => thread.id),
  };
}

export function mapFolder(
  folder: ThreadFolder,
  threadIds: readonly string[] = [],
): SourceFolder {
  return {
    id: folder.id,
    name: folder.name,
    systemKind: folder.systemKind,
    threadIds: [...threadIds],
  };
}

export function mapFolders(
  folders: readonly ThreadFolder[],
  board: readonly { folder: ThreadFolder; items: readonly ThreadCard[] }[],
): SourceFolder[] {
  const byFolder = new Map(
    board.map(
      (section) =>
        [section.folder.id, section.items.map((thread) => thread.id)] as const,
    ),
  );
  return folders.map((folder) =>
    mapFolder(folder, byFolder.get(folder.id) ?? []),
  );
}

export function mapCaptain(card: CaptainCard, position: number): SourceCaptain {
  return {
    id: card.id,
    name: card.face.name,
    avatar: card.face.avatar,
    status: card.status,
    needsYou: card.needsYou,
    ask: askText(card.ask),
    preview: card.preview,
    hasUnreads: card.hasUnreads,
    crewMentionCount: card.crewMentionCount,
    position,
    createdAt: toDate(card.createdAt),
    updatedAt: toDate(card.updatedAt),
  };
}

export function mapProject(project: Project): SidebarProject {
  return {
    id: project.id,
    name: project.name,
    logoUrl: project.logoUrl ?? null,
  };
}

/** Pure source assembly, separate from the hook so it can be tested without a registry. */
export function toSidebarSource(data: LiveData, now: Date): SidebarSource {
  return {
    now,
    activeId: null,
    projects: data.projects.map(mapProject),
    folders: [
      mapPinnedFolder(data.threads),
      ...mapFolders(data.folders, data.board),
    ],
    threads: data.threads.map(mapThread),
    captains: data.captains.map(mapCaptain),
  };
}

/**
 * The five list atoms the sidebar reads. Until the org is known every one of
 * them is an idle atom holding an empty result, because subscribing with an
 * empty org id issues five requests that are guaranteed to fail and Effect's
 * HttpApiClient deduplicates each failure by structurally hashing its whole
 * error graph — seconds of CPU per mount in a route tree.
 */
export const sidebarAtoms = (orgId: OrgId | undefined) => {
  const threads: Atom.Atom<AsyncResult.AsyncResult<ThreadCard[], unknown>> =
    orgId === undefined
      ? idleThreadsAtom
      : allThreadsAtom(orgId, { archived: false, excludeFiled: false });
  const folders: Atom.Atom<
    AsyncResult.AsyncResult<ReadonlyArray<ThreadFolder>, unknown>
  > = orgId === undefined ? idleFoldersAtom : foldersAtom(orgId);
  const board: Atom.Atom<
    AsyncResult.AsyncResult<
      ReadonlyArray<{
        folder: ThreadFolder;
        items: ReadonlyArray<ThreadCard>;
      }>,
      unknown
    >
  > = orgId === undefined ? idleBoardAtom : folderBoardAtom(orgId);
  const captains: Atom.Atom<
    AsyncResult.AsyncResult<ReadonlyArray<CaptainCard>, unknown>
  > = orgId === undefined ? idleCaptainsAtom : captainsAtom(orgId);
  const projects: Atom.Atom<
    AsyncResult.AsyncResult<ReadonlyArray<Project>, unknown>
  > = orgId === undefined ? idleProjectsAtom : projectsAtom(orgId);
  return { threads, folders, board, captains, projects };
};

export function useLiveSidebarSource(now: Date): SidebarSource | null {
  const organizations = resultValue(useAtomValue(organizationsAtom));
  const selectedOrgId = useAtomValue(selectedOrgIdAtom);
  const orgId: OrgId | undefined =
    organizations?.find((organization) => organization.id === selectedOrgId)
      ?.id ?? organizations?.[0]?.id;

  const atoms = sidebarAtoms(orgId);
  const threads = resultValue(useAtomValue(atoms.threads));
  const folders = resultValue(useAtomValue(atoms.folders));
  const board = resultValue(useAtomValue(atoms.board));
  const captains = resultValue(useAtomValue(atoms.captains));
  const projects = resultValue(useAtomValue(atoms.projects));

  if (
    orgId === undefined ||
    threads === undefined ||
    folders === undefined ||
    board === undefined ||
    captains === undefined ||
    projects === undefined
  )
    return null;

  return toSidebarSource({ threads, folders, board, captains, projects }, now);
}
