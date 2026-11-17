import { DateTime } from "effect";
import { ServiceUserDetail } from "../../api/schemas/api-keys.ts";
import { ProjectId, ServiceUserId, UserId } from "../../api/schemas/ids.ts";
import {
  isoMinutesAgo,
  people,
  projects,
  serviceUsers as worldServiceUsers,
} from "../fixtures/world.ts";

const day = 24 * 60;
const at = (iso: string) => DateTime.makeUnsafe(iso);

/** The world's service users, with the access fields the detail page needs. */
export const sampleServiceUsers = [
  ...worldServiceUsers.map(
    (row) =>
      new ServiceUserDetail({
        id: ServiceUserId.make(row.id),
        name: row.name,
        description: row.description,
        icon: "code",
        role: "read_write",
        projectAccessMode: "allowlist",
        projectIds: [
          ProjectId.make(projects.web.id),
          ProjectId.make(projects.api.id),
        ],
        model: null,
        monthlySpendCapCredits: 50_000,
        subscriptionOwnerUserId: null,
        subscriptionServices: [],
        createdByUserId: UserId.make(row.createdBy),
        disabledAt: null,
        createdAt: at(row.createdAt),
        updatedAt: at(row.createdAt),
      }),
  ),
  new ServiceUserDetail({
    id: ServiceUserId.make("svc_sample_triage"),
    name: "Triage bot",
    description: null,
    icon: null,
    role: "admin",
    projectAccessMode: "all_org_projects",
    projectIds: [],
    model: null,
    monthlySpendCapCredits: null,
    subscriptionOwnerUserId: null,
    subscriptionServices: [],
    createdByUserId: UserId.make(people.alex.id),
    disabledAt: at(isoMinutesAgo(4 * day)),
    createdAt: at(isoMinutesAgo(60 * day)),
    updatedAt: at(isoMinutesAgo(4 * day)),
  }),
];
