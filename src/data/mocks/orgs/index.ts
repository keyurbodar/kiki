import { DateTime, Effect, Ref } from "effect";
import { Forbidden } from "../../api/schemas/errors.ts";
import { Organization } from "../../api/schemas/organization.ts";
import { fields, MockDb } from "../db/MockDb.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { org } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleOrgDeleted } from "./fixtures.ts";

export const OrgsMock = mockGroup("orgs", (handlers) =>
  Effect.gen(function* () {
    const { members, orgState } = yield* MockDb;
    const deleted = yield* Ref.make<ReadonlyArray<Record<string, unknown>>>([]);
    const name = yield* Ref.make<string>(org.name);

    return handlers
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          if (params.orgId !== org.id)
            return yield* Effect.fail(new Forbidden({}));
          const input = fields(payload);
          const next = typeof input.name === "string" ? input.name : org.name;
          yield* Ref.set(name, next);
          if (orgState) {
            yield* Ref.set(orgState.name, next);
            yield* Ref.update(orgState.organizations, (rows) =>
              rows.map((row) =>
                row.id === org.id
                  ? new Organization({
                      ...row,
                      name: next,
                      updatedAt: fixtureNow,
                    })
                  : row,
              ),
            );
          }
          return {
            id: org.id,
            name: next,
            slug:
              typeof input.slug === "string"
                ? input.slug
                : next.toLowerCase().replaceAll(" ", "-"),
            issuePrefix:
              typeof input.issuePrefix === "string"
                ? input.issuePrefix
                : org.issuePrefix,
            memberCount: (yield* Ref.get(members)).length,
            updatedAt: DateTime.formatIso(fixtureNow),
          };
        }),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          if (params.orgId !== org.id)
            return yield* Effect.fail(new Forbidden({}));
          const row = {
            ...sampleOrgDeleted,
            deletedAt: DateTime.formatIso(fixtureNow),
            name: yield* Ref.get(name),
          };
          yield* Ref.update(deleted, (rows) => [...rows, row]);
          return { ...row, ok: true };
        }),
      );
  }),
);
