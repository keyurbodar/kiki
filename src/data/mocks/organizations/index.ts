import { DateTime, Effect, Ref } from "effect";
import { Forbidden } from "../../api/schemas/errors.ts";
import { OrgId } from "../../api/schemas/ids.ts";
import {
  JoinableOrganization,
  MyInvitation,
} from "../../api/schemas/invitation.ts";
import { MockDb, missing } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleOrganizations } from "./fixtures.ts";

export const OrganizationsMock = mockGroup("organizations", (handlers) =>
  Effect.gen(function* () {
    const { myInvitations, joinableOrganizations } = yield* MockDb;

    return handlers
      .handle("list", () => Effect.succeed(sampleOrganizations))
      .handle("get", ({ params }) => {
        const organization = sampleOrganizations.find(
          (candidate) => candidate.id === params.orgId,
        );
        return organization
          ? Effect.succeed(organization)
          : Effect.fail(new Forbidden({}));
      })
      .handle("listMyInvitations", () =>
        Effect.map(Ref.get(myInvitations), (rows) =>
          rows.map(
            (row) =>
              new MyInvitation({
                ...row,
                orgId: OrgId.make(row.orgId),
                invitedAt: DateTime.makeUnsafe(row.invitedAt),
              }),
          ),
        ),
      )
      .handle("listJoinableOrganizations", () =>
        Effect.map(Ref.get(joinableOrganizations), (rows) =>
          rows.map(
            (row) =>
              new JoinableOrganization({
                ...row,
                orgId: OrgId.make(row.orgId),
              }),
          ),
        ),
      )
      .handle("joinByDomain", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(joinableOrganizations);
          const row = rows.find(
            (candidate) => candidate.orgId === params.orgId,
          );
          if (!row)
            return yield* missing("joinableOrganizations", params.orgId);
          yield* Ref.set(
            joinableOrganizations,
            rows.filter((candidate) => candidate !== row),
          );
          return { id: row.orgId, name: row.orgName };
        }),
      );
  }),
);
