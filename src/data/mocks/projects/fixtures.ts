import { ProjectId } from "../../api/schemas/ids.ts";
import {
  Project,
  type ProjectColor,
  ProjectRepo,
} from "../../api/schemas/project.ts";
import { minutesAgo } from "../fixtures/time.ts";

const project = (options: {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly icon: string;
  readonly color: ProjectColor;
  readonly repos: ReadonlyArray<string>;
  readonly deleted?: boolean;
  readonly touchedMinutesAgo: number;
}) =>
  new Project({
    id: ProjectId.make(options.id),
    name: options.name,
    nameIsDerived: false,
    description: null,
    icon: options.icon,
    color: options.color,
    logoUrl: null,
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
    visibility: "org",
    ownerUserId: null,
    members: [],
    viewerRole: "member",
    lastTouchedAt: minutesAgo(options.touchedMinutesAgo),
  });

export const sampleProjects = [
  project({
    id: "proj_sample_web",
    name: "Web app",
    code: "WEB",
    icon: "globe",
    color: "primary",
    repos: ["acme/web"],
    touchedMinutesAgo: 12,
  }),
  project({
    id: "proj_sample_api",
    name: "API",
    code: "API",
    icon: "console",
    color: "info",
    repos: ["acme/api", "acme/shared"],
    touchedMinutesAgo: 240,
  }),
  project({
    id: "proj_sample_docs",
    name: "Docs",
    code: "DOC",
    icon: "files",
    color: "success",
    repos: ["acme/docs"],
    touchedMinutesAgo: 60 * 24 * 3,
  }),
  project({
    id: "proj_sample_old",
    name: "Legacy site",
    code: "OLD",
    icon: "clock",
    color: "default",
    repos: ["acme/legacy-site"],
    deleted: true,
    touchedMinutesAgo: 60 * 24 * 40,
  }),
];
