import { Effect, Ref } from "effect";
import { MockDb } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleBots } from "./fixtures.ts";

type Bot = {
  id: string;
  name: string;
  key: string;
  description: string;
  model: string;
  status: string;
  projectIds: ReadonlyArray<string>;
  ownerId: string;
  threadIds: ReadonlyArray<string>;
  createdAt: string;
};

const queryText = (query: Record<string, unknown>, key: string) => {
  const value = query[key];
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
  return typeof value === "string" ? value : "";
};

export const FeedbackBotsMock = mockGroup("feedback-bots", (handlers) =>
  Effect.gen(function* () {
    const db = yield* MockDb;
    const bots = yield* Ref.make<ReadonlyArray<Bot>>([...sampleBots]);

    return handlers.handle("feedbackBots", ({ query }) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(bots);
        const people = yield* Ref.get(db.members);
        const search = queryText(query, "search").toLowerCase();
        const projectId = queryText(query, "projectId");
        return rows
          .filter((row) => row.name.toLowerCase().includes(search))
          .filter((row) => !projectId || row.projectIds.includes(projectId))
          .map((row) => ({
            ...row,
            owner: people.find((person) => person.id === row.ownerId) ?? {
              id: row.ownerId,
            },
          }));
      }),
    );
  }),
);
