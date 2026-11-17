import { DateTime } from "effect";
import {
  ApiKey,
  type ApiKeyId,
  ApiKeyPrivateProject,
} from "../../api/schemas/api-keys.ts";
import {
  ProjectId,
  type ServiceUserId,
  UserId,
} from "../../api/schemas/ids.ts";
import {
  apiKeys as worldApiKeys,
  isoMinutesAgo,
  projects,
  viewer,
} from "../fixtures/world.ts";

const day = 24 * 60;
const at = (iso: string) => DateTime.makeUnsafe(iso);

/** Capy shows the first five characters and the last four of the token. */
export const tokenHintFor = (token: string) => `${token.slice(0, 5)}…${token.slice(-4)}`;

/** World keys act as their creator (human principal). */
export const worldKeys = worldApiKeys.map(
  (key) =>
    new ApiKey({
      id: key.id as ApiKeyId,
      name: key.name,
      tokenHint: tokenHintFor(key.prefix),
      principalKind: "human",
      principalUserId: UserId.make(key.createdBy),
      expiresAt: null,
      revokedAt: key.revokedAt === null ? null : at(key.revokedAt),
      createdByUserId: UserId.make(key.createdBy),
      createdAt: at(key.createdAt),
      privateProjects: [],
    }),
);

/** Keys that exercise the service-user, expiry and private-project states. */
export const serviceKeys = (releaseBot: ServiceUserId) => [
  new ApiKey({
    id: "key_sample_deploy" as ApiKeyId,
    name: "Deploy workflow",
    tokenHint: "capy_…7c2d",
    principalKind: "service",
    principalUserId: releaseBot,
    expiresAt: at(isoMinutesAgo(-60 * day)),
    revokedAt: null,
    createdByUserId: UserId.make(viewer.id),
    createdAt: at(isoMinutesAgo(12 * day)),
    privateProjects: [
      new ApiKeyPrivateProject({
        projectId: ProjectId.make(projects.web.id),
        carried: true,
      }),
      new ApiKeyPrivateProject({
        projectId: ProjectId.make(projects.docs.id),
        carried: false,
      }),
    ],
  }),
  new ApiKey({
    id: "key_sample_local" as ApiKeyId,
    name: "Local scripts",
    tokenHint: "capy_…e81f",
    principalKind: "human",
    principalUserId: UserId.make(viewer.id),
    expiresAt: at(isoMinutesAgo(2 * day)),
    revokedAt: null,
    createdByUserId: UserId.make(viewer.id),
    createdAt: at(isoMinutesAgo(92 * day)),
    privateProjects: [],
  }),
];
