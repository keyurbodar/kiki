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
      }),
  ),
);
