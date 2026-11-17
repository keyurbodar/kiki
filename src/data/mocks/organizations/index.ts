import { Effect } from "effect";
import { Forbidden } from "../../api/schemas/errors.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleOrganizations } from "./fixtures.ts";

export const OrganizationsMock = mockGroup("organizations", (handlers) =>
  Effect.succeed(
    handlers
      .handle("list", () => Effect.succeed(sampleOrganizations))
      .handle("get", ({ params }) => {
        const organization = sampleOrganizations.find(
          (candidate) => candidate.id === params.orgId,
        );
        return organization
          ? Effect.succeed(organization)
          : Effect.fail(new Forbidden({}));
      })
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
      .handle("setSharing", ({ payload }) => Effect.succeed(payload)),
  ),
);
