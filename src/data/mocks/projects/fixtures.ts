import { DateTime } from "effect";
import { CAPY_ILLUSTRATIONS } from "@/assets/brand";
import { ProjectId, UserId } from "../../api/schemas/ids.ts";
import {
  Project,
  type ProjectColor,
  ProjectRepo,
} from "../../api/schemas/project.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { people, projects as worldProjects } from "../fixtures/world.ts";

/** Capy's own art stand-ins for a project logo; the sidebar chip renders this image. */
const projectLogos = [
  CAPY_ILLUSTRATIONS.peer,
  CAPY_ILLUSTRATIONS.build,
  CAPY_ILLUSTRATIONS.review,
  CAPY_ILLUSTRATIONS.detective,
] as const;

const project = (options: {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly icon: string;
  readonly color: ProjectColor;
  readonly repos: ReadonlyArray<string>;
  readonly visibility?: "org" | "private";
  readonly ownerUserId?: string;
  readonly deleted?: boolean;
  readonly touchedMinutesAgo: number;
  readonly logoIndex?: number;
}) =>
  new Project({
    id: ProjectId.make(options.id),
    name: options.name,
    nameIsDerived: false,
    description: null,
    icon: options.icon,
    color: options.color,
    logoUrl:
      options.logoIndex === undefined
        ? null
        : (projectLogos[options.logoIndex] ?? null),
    code: options.code,
    tailscaleEnabled: false,
    tailscaleAcceptDns: false,
    deleted: options.deleted ?? false,
    createdAt: minutesAgo(60 * 24 * 60),
    updatedAt: minutesAgo(options.touchedMinutesAgo),
    repos: options.repos.map(
      (repoFullName, position) =>
        new ProjectRepo({
          repoFullName,
          baseBranch: "main",
          position,
          verificationSource: "installation",
          mode: position === 0 ? "primary" : "lazy",
        }),
    ),
    visibility: options.visibility ?? "org",
    ownerUserId:
      options.ownerUserId === undefined
        ? null
        : UserId.make(options.ownerUserId),
    members: [],
    viewerRole: "member",
    lastTouchedAt: minutesAgo(options.touchedMinutesAgo),
  });

export const sampleProjects = [
  project({
    id: worldProjects.web.id,
    name: worldProjects.web.name,
    code: worldProjects.web.code,
    icon: "globe",
    color: "primary",
    repos: worldProjects.web.repos,
    touchedMinutesAgo: 12,
  }),
  project({
    id: worldProjects.api.id,
    name: worldProjects.api.name,
    code: worldProjects.api.code,
    icon: "console",
    color: "info",
    repos: worldProjects.api.repos,
    touchedMinutesAgo: 240,
  }),
  project({
    id: worldProjects.docs.id,
    name: worldProjects.docs.name,
    code: worldProjects.docs.code,
    icon: "files",
    color: "success",
    repos: worldProjects.docs.repos,
    logoIndex: 2,
    touchedMinutesAgo: 60 * 24 * 3,
  }),
  project({
    id: worldProjects.hiring.id,
    name: worldProjects.hiring.name,
    code: worldProjects.hiring.code,
    icon: "people",
    color: "warning",
    repos: worldProjects.hiring.repos,
    visibility: "private",
    ownerUserId: people.sam.id,
    touchedMinutesAgo: 60 * 24 * 2,
  }),
  project({
    id: worldProjects.old.id,
    name: worldProjects.old.name,
    code: worldProjects.old.code,
    icon: "clock",
    color: "default",
    repos: worldProjects.old.repos,
    deleted: true,
    touchedMinutesAgo: 60 * 24 * 40,
  }),
];

export const projectJson = (value: Project) => ({
  id: value.id,
  name: value.name,
  nameIsDerived: value.nameIsDerived,
  description: value.description,
  icon: value.icon,
  color: value.color,
  logoUrl: value.logoUrl,
  code: value.code,
  tailscaleEnabled: value.tailscaleEnabled,
  tailscaleAcceptDns: value.tailscaleAcceptDns,
  deleted: value.deleted,
  createdAt: DateTime.formatIso(value.createdAt),
  updatedAt: DateTime.formatIso(value.updatedAt),
  repos: value.repos.map((repo) => ({
    repoFullName: repo.repoFullName,
    baseBranch: repo.baseBranch,
    position: repo.position,
    verificationSource: repo.verificationSource,
    mode: repo.mode,
  })),
  visibility: value.visibility,
  ownerUserId: value.ownerUserId,
  members: value.members.map((member) => ({
    userId: member.userId,
    kind: member.kind,
    invitedBy: member.invitedBy,
    createdAt: DateTime.formatIso(member.createdAt),
  })),
  viewerRole: value.viewerRole,
  lastTouchedAt: value.lastTouchedAt
    ? DateTime.formatIso(value.lastTouchedAt)
    : null,
});

export const sampleProjectJson = sampleProjects.map(projectJson);

export const defaultProjectOwners = [
  people.alex.id,
  people.sam.id,
  people.priya.id,
] as const;
