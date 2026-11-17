import { Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { samplePublications, sampleThemes } from "./fixtures.ts";

type Theme = Record<string, unknown> & {
  id: string;
  name: string;
  ownerId: unknown;
  published: boolean;
  version: number;
  updatedAt: string;
};

/** The appearance editor's fields (light/dark palettes, effect, background). */
const paletteFields = (input: Record<string, unknown>) =>
  Object.fromEntries(
    ["light", "dark", "effect", "background"].flatMap((key) =>
      key in input ? [[key, input[key]]] : [],
    ),
  );

export const ThemesMock = mockGroup("themes", (handlers) =>
  Effect.gen(function* () {
    const themes = yield* Ref.make<ReadonlyArray<Theme>>(
      structuredClone(sampleThemes),
    );
    const publications = yield* Ref.make<
      ReadonlyArray<Record<string, unknown>>
    >(structuredClone(samplePublications));

    const find = (id: string) =>
      Effect.flatMap(Ref.get(themes), (rows) => {
        const theme = rows.find((row) => row.id === id);
        return theme
          ? Effect.succeed(theme)
          : Effect.die(new Error(`themes: no theme ${id}`));
      });

    const put = (theme: Theme) =>
      Ref.update(themes, (rows) => [
        ...rows.filter((row) => row.id !== theme.id),
        theme,
      ]).pipe(Effect.as(theme));

    return handlers
      .handle("list", () => Ref.get(themes))
      .handle("create", ({ payload }) => {
        const input = fields(payload);
        const name = String(input.name ?? "New theme");
        const theme: Theme = {
          id: newId("theme"),
          name,
          slug: String(input.slug ?? name.toLowerCase().replaceAll(" ", "-")),
          ownerId: input.ownerId ?? "user_sample_alex",
          colors:
            typeof input.colors === "object" && input.colors !== null
              ? input.colors
              : {},
          fontFamily: String(input.fontFamily ?? "Inter"),
          fontSize: typeof input.fontSize === "number" ? input.fontSize : 14,
          ...paletteFields(input),
          published: false,
          version: 1,
          createdAt: isoMinutesAgo(0),
          updatedAt: isoMinutesAgo(0),
        };
        return Ref.update(themes, (rows) => [...rows, theme]).pipe(
          Effect.as(theme),
        );
      })
      .handle("update", ({ params, payload }) =>
        Effect.flatMap(find(params.themeId), (current) => {
          const input = fields(payload);
          const theme: Theme = {
            ...current,
            ...(typeof input.name === "string" ? { name: input.name } : {}),
            ...(typeof input.colors === "object" && input.colors !== null
              ? { colors: input.colors }
              : {}),
            ...(typeof input.fontFamily === "string"
              ? { fontFamily: input.fontFamily }
              : {}),
            ...(typeof input.fontSize === "number"
              ? { fontSize: input.fontSize }
              : {}),
            ...paletteFields(input),
            version: current.version + 1,
            updatedAt: isoMinutesAgo(0),
          };
          return put(theme);
        }),
      )
      .handle("remove", ({ params }) =>
        Effect.flatMap(find(params.themeId), () =>
          Effect.all(
            [
              Ref.update(themes, (rows) =>
                rows.filter((row) => row.id !== params.themeId),
              ),
              Ref.update(publications, (rows) =>
                rows.filter((row) => row.themeId !== params.themeId),
              ),
            ],
            { concurrency: 1 },
          ).pipe(Effect.as({ ok: true, id: params.themeId })),
        ),
      )
      .handle("publish", ({ params, payload }) =>
        Effect.flatMap(find(params.themeId), (current) => {
          const input = fields(payload);
          const theme: Theme = {
            ...current,
            published: true,
            version: current.version + 1,
            updatedAt: isoMinutesAgo(0),
          };
          return Effect.flatMap(Ref.get(publications), (rows) => {
            const previous = rows.find((row) => row.themeId === theme.id);
            const versions = Array.isArray(previous?.versions)
              ? (previous.versions as ReadonlyArray<unknown>)
              : [];
            const publication = {
              ...previous,
              id: previous?.id ?? newId("pub"),
              themeId: theme.id,
              name: theme.name,
              version: theme.version,
              authorId: theme.ownerId,
              status: "published",
              publishedAt: theme.updatedAt,
              note: typeof input.note === "string" ? input.note : null,
              description:
                typeof input.description === "string"
                  ? input.description
                  : null,
              slug: String(theme.slug ?? theme.id),
              listed: previous?.listed === true,
              withdrawn: false,
              removed: false,
              removedReason: null,
              adds: typeof previous?.adds === "number" ? previous.adds : 0,
              versions: [
                {
                  id: newId("ver"),
                  version: versions.length + 1,
                  createdAt: theme.updatedAt,
                  reviewed: false,
                  removed: false,
                },
                ...versions,
              ],
            };
            return Effect.all(
              [
                put(theme),
                Ref.update(publications, (current) => [
                  publication,
                  ...current.filter((row) => row.themeId !== theme.id),
                ]),
              ],
              { concurrency: 1 },
            ).pipe(Effect.as(publication));
          });
        }),
      )
      .handle("unpublish", ({ params }) =>
        Effect.flatMap(find(params.themeId), (current) => {
          const theme: Theme = {
            ...current,
            published: false,
            updatedAt: isoMinutesAgo(0),
          };
          return Effect.all(
            [
              put(theme),
              Ref.update(publications, (rows) =>
                rows.map((row) =>
                  row.themeId === params.themeId
                    ? {
                        ...row,
                        status: "unpublished",
                        listed: false,
                        withdrawn: true,
                      }
                    : row,
                ),
              ),
            ],
            { concurrency: 1 },
          ).pipe(Effect.as(theme));
        }),
      )
      .handle("publications", () => Ref.get(publications));
  }),
);
