import { Effect, Ref } from "effect";
import { fields, newId, notFoundNamed } from "../db/MockDb.ts";
import { isoMinutesAgo, world } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type PaperEmbed,
  samplePaperEmbed,
  samplePaperFiles,
} from "./fixtures.ts";

export const PaperMock = mockGroup("paper", (handlers) =>
  Effect.gen(function* () {
    const embeds = yield* Ref.make<PaperEmbed[]>([{ ...samplePaperEmbed }]);

    return handlers
      .handle("mintPaperEmbed", ({ params, payload }) => {
        const input = fields(payload);
        const thread = Object.values(world.threads).find(
          (row) => row.id === params.jamId,
        );
        if (!thread) return notFoundNamed("thread", params.jamId);
        return Effect.gen(function* () {
          const rows = yield* Ref.get(embeds);
          const embed = {
            ...samplePaperEmbed,
            id: newId("paper_embed"),
            threadId: thread.id,
            fileId:
              typeof input.fileId === "string"
                ? input.fileId
                : samplePaperEmbed.fileId,
            permission:
              typeof input.permission === "string"
                ? input.permission
                : samplePaperEmbed.permission,
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.set(embeds, [...rows, embed]);
          return embed;
        });
      })
      .handle("listPaperFiles", ({ params }) => {
        const thread = Object.values(world.threads).find(
          (row) => row.id === params.jamId,
        );
        if (!thread) return notFoundNamed("thread", params.jamId);
        return Effect.succeed(samplePaperFiles);
      });
  }),
);
