import { Effect, Ref } from "effect";
import { Forbidden } from "../../api/schemas/errors.ts";
import { Organization } from "../../api/schemas/organization.ts";
import { fields } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleOrganizations } from "./fixtures.ts";

export const OrganizationsMock = mockGroup("organizations", (handlers) =>
  Effect.gen(function* () {
    const organizations = yield* Ref.make(sampleOrganizations);
    return handlers
      .handle("list", () => Ref.get(organizations))
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const organization = (yield* Ref.get(organizations)).find(
            (candidate) => candidate.id === params.orgId,
          );
          return organization ?? (yield* Effect.fail(new Forbidden({})));
        }),
      )
      .handle("listMyInvitations", () => Effect.succeed([]))
      .handle("listJoinableOrganizations", () => Effect.succeed([]))
      .handle("create", ({ payload }) => {
        const name =
          typeof payload === "object" &&
          payload !== null &&
          "name" in payload &&
          typeof payload.name === "string"
            ? payload.name
            : "Workspace";
        return Effect.succeed({ id: "org_sample_new", name });
      })
      .handle("setSharing", ({ payload }) => Effect.succeed(payload))
      .handle("setPullGuides", ({ params, payload }) => {
        const enabled = fields(payload).enabled === true;
        return Ref.update(organizations, (rows) =>
          rows.map((row) =>
            row.id === params.orgId
              ? new Organization({ ...row, pullGuidesEnabled: enabled })
              : row,
          ),
        ).pipe(Effect.as({ enabled }));
      });
  }),
);
