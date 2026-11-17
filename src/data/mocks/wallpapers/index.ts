import { Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleWallpapers } from "./fixtures.ts";

type Wallpaper = Record<string, unknown> & {
  id: string;
  isBackground: boolean;
};

export const WallpapersMock = mockGroup("wallpapers", (handlers) =>
  Effect.gen(function* () {
    const wallpapers = yield* Ref.make<ReadonlyArray<Wallpaper>>(
      structuredClone(sampleWallpapers),
    );

    const find = (id: string) =>
      Effect.flatMap(Ref.get(wallpapers), (rows) => {
        const wallpaper = rows.find((row) => row.id === id);
        return wallpaper
          ? Effect.succeed(wallpaper)
          : Effect.die(new Error(`wallpapers: no wallpaper ${id}`));
      });

    return handlers
      .handle("list", () => Ref.get(wallpapers))
      .handle("upload", ({ payload }) => {
        const input = fields(payload);
        const wallpaper: Wallpaper = {
          id: newId("wp"),
          name: String(input.name ?? "New wallpaper"),
          url: String(
            input.url ?? "https://static.example.com/wallpapers/new.png",
          ),
          thumbnailUrl: String(
            input.thumbnailUrl ??
              "https://static.example.com/wallpapers/new-thumb.png",
          ),
          mimeType: String(input.mimeType ?? "image/png"),
          size: typeof input.size === "number" ? input.size : 0,
          uploadedBy: input.uploadedBy ?? "user_sample_alex",
          isBackground: false,
          createdAt: isoMinutesAgo(0),
        };
        return Ref.update(wallpapers, (rows) => [...rows, wallpaper]).pipe(
          Effect.as(wallpaper),
        );
      })
      .handle("remove", ({ params }) =>
        Effect.flatMap(find(params.wallpaperId), () =>
          Effect.flatMap(Ref.get(wallpapers), (rows) =>
            Ref.set(
              wallpapers,
              rows.filter((row) => row.id !== params.wallpaperId),
            ).pipe(Effect.as({ ok: true, id: params.wallpaperId })),
          ),
        ),
      )
      .handle("background", ({ params }) =>
        Effect.flatMap(find(params.wallpaperId), (selected) =>
          Effect.flatMap(Ref.get(wallpapers), (rows) => {
            const next = rows.map((row) => ({
              ...row,
              isBackground: row.id === selected.id,
            }));
            return Ref.set(wallpapers, next).pipe(Effect.as({ ok: true }));
          }),
        ),
      )
      .handle("image", ({ params }) =>
        Effect.map(find(params.wallpaperId), (wallpaper) => ({
          id: wallpaper.id,
          url: wallpaper.url,
          mimeType: wallpaper.mimeType,
          size: wallpaper.size,
        })),
      );
  }),
);
