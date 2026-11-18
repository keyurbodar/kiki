import { Effect, Ref } from "effect";
import {
  fields,
  MockDb,
  newId,
  notFound,
  notFoundNamed,
  type Row,
} from "../db/MockDb.ts";
import { isoMinutesAgo, people, projects, threads } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  captainAccess,
  captainCard,
  captainFace,
  captainMembers,
  promoteProjects,
  sampleImages,
} from "./fixtures.ts";

type CaptainRow = Row<"captains">;
type Image = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly uploadedBy: string;
  readonly createdAt: string;
};

const asText = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const asString = (value: unknown) => String(value ?? "");

export const CaptainsMock = mockGroup("captains", (handlers) =>
  Effect.gen(function* () {
    const { captains, members, threadFolders } = yield* MockDb;
    const images = yield* Ref.make<ReadonlyArray<Image>>([...sampleImages]);
    const captainImages = yield* Ref.make<Readonly<Record<string, string>>>({});
    const access = yield* Ref.make<Readonly<Record<string, string>>>({
      ...captainAccess,
    });
    const memberIds = yield* Ref.make<
      Readonly<Record<string, ReadonlyArray<string>>>
    >({
      ...captainMembers,
    });
    const hidden = yield* Ref.make<Readonly<Record<string, boolean>>>({});

    const findCaptain = (id: string) =>
      Effect.gen(function* () {
        const captain = (yield* Ref.get(captains)).find((row) => row.id === id);
        if (!captain) return yield* notFound("captains", id);
        return captain;
      });

    const findThread = (id: string) =>
      Effect.gen(function* () {
        const thread = Object.values(threads).find((row) => row.id === id);
        if (!thread) return yield* notFoundNamed("thread", id);
        return thread;
      });

    const captainDetail = (captain: CaptainRow) =>
      Effect.gen(function* () {
        const imageId = (yield* Ref.get(captainImages))[captain.id];
        const image = (yield* Ref.get(images)).find(
          (row) => row.id === imageId,
        );
        const owner = (yield* Ref.get(members)).find(
          (row) => row.id === captain.ownerId,
        );
        const index = (yield* Ref.get(captains)).findIndex(
          (row) => row.id === captain.id,
        );
        return {
          ...captain,
          face: captainFace(captain, Math.max(0, index)),
          imageUrl: image?.url ?? null,
          hidden: (yield* Ref.get(hidden))[captain.id] ?? false,
          access: (yield* Ref.get(access))[captain.id] ?? "org",
          memberIds: (yield* Ref.get(memberIds))[captain.id] ?? [],
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : null,
        };
      });

    return handlers
      .handle("uploadImage", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const image: Image = {
            id: newId("img"),
            name: asText(input.name, "Captain image"),
            url: asText(
              input.url,
              "https://images.example.com/acme/captain.png",
            ),
            uploadedBy: people.alex.id,
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(images, (rows) => [...rows, image]);
          if (typeof input.jamId === "string") {
            yield* Ref.update(captainImages, (rows) => ({
              ...rows,
              [input.jamId as string]: image.id,
            }));
          }
          return image;
        }),
      )
      .handle("listLibrary", () => Ref.get(images))
      .handle("uploadLibraryImage", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const image: Image = {
            id: newId("img"),
            name: asText(input.name, "Library image"),
            url: asText(
              input.url,
              "https://images.example.com/acme/library.png",
            ),
            uploadedBy: people.alex.id,
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(images, (rows) => [...rows, image]);
          return image;
        }),
      )
      .handle("removeLibraryImage", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(images);
          if (!rows.some((row) => row.id === params.imageId)) {
            return yield* Effect.die(
              new Error(`MockDb.captainImages: no row ${params.imageId}`),
            );
          }
          yield* Ref.set(
            images,
            rows.filter((row) => row.id !== params.imageId),
          );
          return { ok: true, imageId: params.imageId };
        }),
      )
      .handle("list", () =>
        Ref.get(captains).pipe(Effect.map((rows) => rows.map(captainCard))),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const captain = {
            id: newId("jam_cap"),
            name: asText(input.name, "New Captain"),
            alias: asText(input.alias, "new-captain"),
            description: asText(
              input.description,
              "A new Captain for the team.",
            ),
            ownerId: asText(input.ownerId, people.alex.id),
            projectId: asText(input.projectId, projects.web.id),
            crew: Array.isArray(input.crew) ? input.crew.map(asString) : [],
            createdAt: isoMinutesAgo(0),
          };
          yield* Ref.update(captains, (rows) => [...rows, captain]);
          yield* Ref.update(memberIds, (rows) => ({
            ...rows,
            [captain.id]: [captain.ownerId],
          }));
          return yield* captainDetail(captain);
        }),
      )
      .handle("get", ({ params }) =>
        findCaptain(params.jamId).pipe(Effect.flatMap(captainDetail)),
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* findCaptain(params.jamId);
          const input = fields(payload);
          const updated = {
            ...current,
            ...(typeof input.name === "string" ? { name: input.name } : {}),
            ...(typeof input.alias === "string" ? { alias: input.alias } : {}),
            ...(typeof input.description === "string"
              ? { description: input.description }
              : {}),
            ...(typeof input.projectId === "string"
              ? { projectId: input.projectId }
              : {}),
          };
          yield* Ref.update(captains, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return yield* captainDetail(updated);
        }),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          yield* Ref.set(
            captains,
            (yield* Ref.get(captains)).filter((row) => row.id !== captain.id),
          );
          return { ok: true, jamId: captain.id };
        }),
      )
      .handle("setCaptainAccess", ({ params, payload }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          const value = asText(fields(payload).access, "org");
          yield* Ref.update(access, (rows) => ({
            ...rows,
            [captain.id]: value,
          }));
          return { jamId: captain.id, access: value };
        }),
      )
      .handle("crew", ({ params }) =>
        findCaptain(params.jamId).pipe(
          Effect.flatMap((captain) =>
            Effect.forEach(captain.crew, (id) => findThread(id)),
          ),
        ),
      )
      .handle("joinCrew", ({ params, payload }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          const payloadFields = fields(payload);
          const threadId = asText(
            payloadFields.threadId ?? payloadFields.thread_id,
            threads.checkoutTest.id,
          );
          yield* findThread(threadId);
          yield* Ref.update(captains, (rows) =>
            rows.map((row) =>
              row.id === captain.id && !row.crew.includes(threadId)
                ? { ...row, crew: [...row.crew, threadId] }
                : row,
            ),
          );
          return { ok: true, jamId: captain.id, threadId };
        }),
      )
      .handle("leaveCrew", ({ params }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          yield* Ref.update(captains, (rows) =>
            rows.map((row) =>
              row.id === captain.id
                ? {
                    ...row,
                    crew: row.crew.filter((id) => id !== params.threadId),
                  }
                : row,
            ),
          );
          return { ok: true, jamId: captain.id, threadId: params.threadId };
        }),
      )
      .handle("moveCrew", ({ params, payload }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          const targetId = asText(fields(payload).jamId, captain.id);
          const target = yield* findCaptain(targetId);
          yield* Ref.update(captains, (rows) =>
            rows.map((row) => {
              if (row.id === captain.id) {
                return {
                  ...row,
                  crew: row.crew.filter((id) => id !== params.threadId),
                };
              }
              if (row.id === target.id && !row.crew.includes(params.threadId)) {
                return { ...row, crew: [...row.crew, params.threadId] };
              }
              return row;
            }),
          );
          return { ok: true, fromJamId: captain.id, toJamId: target.id };
        }),
      )
      .handle("demote", ({ params }) =>
        findCaptain(params.jamId).pipe(
          Effect.flatMap((captain) =>
            Effect.gen(function* () {
              const thread = yield* findThread(
                captain.crew[0] ?? threads.checkoutTest.id,
              );
              yield* Ref.set(
                captains,
                (yield* Ref.get(captains)).filter(
                  (row) => row.id !== captain.id,
                ),
              );
              return { ok: true, captainId: captain.id, threadId: thread.id };
            }),
          ),
        ),
      )
      .handle("setCaptainHidden", ({ params, payload }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          const value = fields(payload).hidden === true;
          yield* Ref.update(hidden, (rows) => ({
            ...rows,
            [captain.id]: value,
          }));
          return { jamId: captain.id, hidden: value };
        }),
      )
      .handle("leaveCaptain", ({ params }) =>
        findCaptain(params.jamId).pipe(
          Effect.flatMap((captain) =>
            Ref.update(memberIds, (rows) => ({
              ...rows,
              [captain.id]: (rows[captain.id] ?? []).filter(
                (id) => id !== people.alex.id,
              ),
            })).pipe(Effect.as({ ok: true, jamId: captain.id })),
          ),
        ),
      )
      .handle("addCaptainMembers", ({ params, payload }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          const input = fields(payload);
          const ids = Array.isArray(input.memberIds)
            ? input.memberIds.map(asString)
            : typeof input.memberId === "string"
              ? [input.memberId]
              : [];
          yield* Ref.update(memberIds, (rows) => ({
            ...rows,
            [captain.id]: [...new Set([...(rows[captain.id] ?? []), ...ids])],
          }));
          return { jamId: captain.id, memberIds: ids };
        }),
      )
      .handle("removeCaptainMembers", ({ params, query }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          const raw = query.memberId ?? query.memberIds ?? [];
          const ids = Array.isArray(raw) ? raw.map(asString) : [asString(raw)];
          yield* Ref.update(memberIds, (rows) => ({
            ...rows,
            [captain.id]: (rows[captain.id] ?? []).filter(
              (id) => !ids.includes(id),
            ),
          }));
          return { jamId: captain.id, memberIds: ids };
        }),
      )
      .handle("setCaptainOwner", ({ params, payload }) =>
        Effect.gen(function* () {
          const captain = yield* findCaptain(params.jamId);
          const ownerId = asText(fields(payload).ownerId, people.sam.id);
          yield* Ref.update(captains, (rows) =>
            rows.map((row) =>
              row.id === captain.id ? { ...row, ownerId } : row,
            ),
          );
          return { jamId: captain.id, ownerId };
        }),
      )
      .handle("promoteFolder", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const rows = yield* Ref.get(threadFolders);
          const folder = rows.find(
            (row) => row.id === asString(input.folderId ?? input.folder_id),
          );
          const source = folder ?? rows[0];
          if (!source) {
            return yield* Effect.die(
              new Error("MockDb.threadFolders: no rows"),
            );
          }
          const captain = {
            id: newId("jam_cap"),
            name: source.name,
            alias: source.name.toLowerCase().replaceAll(" ", "-"),
            description: `Promoted from the ${source.name} folder.`,
            ownerId: people.alex.id,
            projectId: projects.web.id,
            crew: [],
            createdAt: isoMinutesAgo(0),
            preview: `Promoted from the ${source.name} folder.`,
            hasUnreads: false,
            crewMentionCount: 0,
          };
          yield* Ref.update(captains, (rows) => [...rows, captain]);
          return yield* captainDetail(captain);
        }),
      )
      .handle("promoteThread", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const thread = yield* findThread(
            asText(input.threadId ?? input.thread_id, threads.checkoutTest.id),
          );
          const project = promoteProjects.find(
            (row) => row.id === thread.projectId,
          );
          const captain = {
            id: newId("jam_cap"),
            name: thread.title,
            alias: thread.title.toLowerCase().replaceAll(" ", "-"),
            description: `Promoted from thread #${thread.number}.`,
            ownerId: people.alex.id,
            projectId: project?.id ?? projects.web.id,
            crew: [thread.id],
            createdAt: isoMinutesAgo(0),
            preview: `Promoted from thread #${thread.number}.`,
            hasUnreads: false,
            crewMentionCount: 0,
          };
          yield* Ref.update(captains, (rows) => [...rows, captain]);
          return yield* captainDetail(captain);
        }),
      );
  }),
);
