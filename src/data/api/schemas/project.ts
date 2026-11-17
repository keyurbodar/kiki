import { Schema } from "effect";
import { withDefault } from "./defaults.ts";
import { ActorId, ProjectId, Timestamp, UserId } from "./ids.ts";
import { Visibility } from "./organization.ts";

export const ProjectIconName = Schema.Literals([
  "home",
  "compass",
  "globe",
  "task",
  "console",
  "files",
  "folder",
  "code",
  "puzzle",
  "star",
  "key",
  "bell",
  "people",
  "shield",
  "chart",
  "clock",
  "pin",
  "search",
]);

export const ProjectIcon = Schema.Union([ProjectIconName, Schema.String]);

export const ProjectColor = Schema.Literals([
  "default",
  "primary",
  "info",
  "success",
  "warning",
  "destructive",
  "complete",
]);
export type ProjectColor = typeof ProjectColor.Type;

export const ProjectRole = Schema.Literals(["owner", "member", "none"]);

export class ProjectRepo extends Schema.Class<ProjectRepo>("ProjectRepo")({
  repoFullName: Schema.String,
  baseBranch: Schema.String,
  position: Schema.Int,
  verificationSource: Schema.Literals(["installation", "device"]),
  mode: Schema.Literals(["primary", "lazy"]),
}) {}

export class ProjectMember extends Schema.Class<ProjectMember>("ProjectMember")(
  {
    userId: ActorId,
    kind: Schema.Literals(["human", "service"]),
    invitedBy: Schema.NullOr(ActorId),
    createdAt: Timestamp,
  },
) {}

export class Project extends Schema.Class<Project>("Project")({
  id: ProjectId,
  name: Schema.String,
  nameIsDerived: Schema.Boolean,
  description: Schema.NullOr(Schema.String),
  icon: ProjectIcon,
  color: ProjectColor,
  logoUrl: Schema.NullOr(Schema.String).pipe(withDefault(null)),
  code: Schema.String,
  tailscaleEnabled: Schema.Boolean,
  tailscaleAcceptDns: Schema.Boolean,
  deleted: Schema.Boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  repos: Schema.Array(ProjectRepo),
  visibility: Visibility.pipe(withDefault("org")),
  ownerUserId: Schema.NullOr(UserId).pipe(withDefault(null)),
  members: Schema.Array(ProjectMember).pipe(withDefault([])),
  viewerRole: ProjectRole.pipe(withDefault("none")),
  lastTouchedAt: Schema.NullOr(Timestamp).pipe(withDefault(null)),
}) {}
