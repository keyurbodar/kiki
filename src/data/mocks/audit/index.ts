import { Effect, Ref } from "effect";
import { fields, MockDb } from "../db/MockDb.ts";
import { people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleAuditEvents } from "./fixtures.ts";

type AuditEvent = {
  readonly id: string;
  readonly orgId: string;
  readonly action: string;
  readonly actorId: string;
  readonly actorEmail: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly ipAddress: string;
  readonly createdAt: string;
};

const queryText = (query: unknown, key: string) => {
  const value = fields(query)[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
};

export const AuditMock = mockGroup("audit", (handlers) =>
  Effect.gen(function* () {
    const { members } = yield* MockDb;
    const events =
      yield* Ref.make<ReadonlyArray<AuditEvent>>(sampleAuditEvents);

    return handlers.handle("list", ({ params, query }) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(events);
        const search = queryText(query, "q")?.toLowerCase();
        const action = queryText(query, "action");
        const actorId = queryText(query, "actorId");
        const targetType = queryText(query, "targetType");
        const cursor = queryText(query, "cursor");
        const limit = Number(queryText(query, "limit") ?? rows.length);
        const matching = rows.filter((row) => {
          if (row.orgId !== params.orgId) return false;
          if (action && row.action !== action) return false;
          if (actorId && row.actorId !== actorId) return false;
          if (targetType && row.targetType !== targetType) return false;
          return !search
            ? true
            : `${row.action} ${row.targetName} ${row.actorEmail}`
                .toLowerCase()
                .includes(search);
        });
        const after = cursor
          ? matching.findIndex((row) => row.id === cursor) + 1
          : 0;
        const page = matching.slice(after, after + limit);
        const next =
          after + limit < matching.length ? (page.at(-1)?.id ?? null) : null;
        return {
          events: page,
          items: page,
          cursor: next,
          actors: (yield* Ref.get(members)).map((member) => ({
            id: member.id,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
          })),
          viewerId: people.alex.id,
        };
      }),
    );
  }),
);
