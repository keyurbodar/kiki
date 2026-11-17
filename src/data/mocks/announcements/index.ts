import { Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { announcementOrgId, sampleAnnouncements } from "./fixtures.ts";

export const AnnouncementsMock = mockGroup("announcements", (handlers) =>
  Effect.gen(function* () {
    const records = yield* Ref.make<ReadonlyArray<Record<string, unknown>>>([]);

    return handlers
      .handle("list", () =>
        Effect.gen(function* () {
          const seen = yield* Ref.get(records);
          return [
            ...sampleAnnouncements.map((announcement) => ({
              ...announcement,
              seenAt:
                seen.find((row) => row.key === announcement.key)?.seenAt ??
                null,
            })),
            ...seen.filter(
              (row) =>
                !sampleAnnouncements.some(
                  (announcement) => announcement.key === row.key,
                ),
            ),
          ];
        }),
      )
      .handle("record", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const row = {
            id: newId("ann"),
            key: params.key,
            title: String(input.title ?? params.key),
            body: String(input.body ?? ""),
            ctaLabel:
              typeof input.ctaLabel === "string" ? input.ctaLabel : null,
            ctaUrl: typeof input.ctaUrl === "string" ? input.ctaUrl : null,
            seenAt: isoMinutesAgo(0),
            orgId: announcementOrgId,
          };
          yield* Ref.update(records, (all) => [
            ...all.filter((existing) => existing.key !== params.key),
            row,
          ]);
          return { ok: true, key: params.key, id: row.id };
        }),
      );
  }),
);
