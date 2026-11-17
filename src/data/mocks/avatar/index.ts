import { Effect, Ref } from "effect";
import { Organization } from "../../api/schemas/organization.ts";
import { fields, MockDb, newId } from "../db/MockDb.ts";
import { isoMinutesAgo, people } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleAvatar, sampleUpload } from "./fixtures.ts";

type AvatarRow = {
  readonly orgId: string;
  readonly url: string;
  readonly mimeType: string;
  readonly size: number;
  readonly updatedAt: string;
  readonly updatedBy: string;
};

export const AvatarMock = mockGroup("avatar", (handlers) =>
  Effect.gen(function* () {
    const { orgState } = yield* MockDb;
    const avatar = yield* Ref.make<AvatarRow | null>(sampleAvatar);
    const upload = yield* Ref.make({ ...sampleUpload });

    return handlers
      .handle("updateAvatar", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const next: AvatarRow = {
            orgId: sampleAvatar.orgId,
            url:
              typeof input.url === "string"
                ? input.url
                : `https://static.example.com/orgs/acme/avatar-${newId("img")}.png`,
            mimeType:
              typeof input.mimeType === "string" ? input.mimeType : "image/png",
            size:
              typeof input.size === "number" ? input.size : sampleAvatar.size,
            updatedAt: isoMinutesAgo(0),
            updatedBy: people.alex.id,
          };
          yield* Ref.set(avatar, next);
          const state = orgState;
          if (state) {
            yield* Ref.set(state.avatarUrl, next.url);
            yield* Ref.update(state.organizations, (rows) =>
              rows.map((row) =>
                row.id === sampleAvatar.orgId
                  ? new Organization({ ...row, avatarUrl: next.url })
                  : row,
              ),
            );
          }
          return { ...next, ok: true };
        }),
      )
      .handle("removeAvatar", () =>
        Effect.gen(function* () {
          yield* Ref.set(avatar, null);
          const state = orgState;
          if (state) {
            yield* Ref.set(state.avatarUrl, null);
            yield* Ref.update(state.organizations, (rows) =>
              rows.map((row) =>
                row.id === sampleAvatar.orgId
                  ? new Organization({ ...row, avatarUrl: null })
                  : row,
              ),
            );
          }
          return { ok: true, avatarUrl: null };
        }),
      )
      .handle("presignAvatarUpload", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const next = {
            ...sampleUpload,
            fileKey: `orgs/acme/${String(input.fileName ?? "avatar.png")}`,
            mimeType:
              typeof input.contentType === "string"
                ? input.contentType
                : sampleUpload.mimeType,
            expiresAt: isoMinutesAgo(-30),
          };
          yield* Ref.set(upload, next);
          return next;
        }),
      );
  }),
);
