import { DateTime, Effect, Ref } from "effect";
import {
  FileId,
  FileUploadTarget,
  FileUploadTargets,
  FileUrl,
} from "../../api/schemas/files.ts";
import { fields, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type FileVersionRow,
  initialFiles,
  initialVersions,
  machineFile,
} from "./fixtures.ts";

/**
 * Capy's client treats an upload URL on a `.invalid` host as a local upload:
 * it skips the PUT and simulates progress instead (see
 * features/composer/attachments). The mock hands out those URLs.
 */
export const mockUploadHost = "uploads.capy.invalid";

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const FilesMock = mockGroup("files", (handlers) =>
  Effect.gen(function* () {
    const filesRef = yield* Ref.make([...initialFiles]);
    const versionsRef = yield* Ref.make<ReadonlyArray<FileVersionRow>>([
      ...initialVersions,
    ]);
    const machineFilesRef = yield* Ref.make<Readonly<Record<string, string>>>(
      {},
    );

    const findFile = (fileId: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(filesRef);
        const row = rows.find((candidate) => candidate.id === fileId);
        if (!row) {
          return yield* Effect.die(
            new Error(`files.threadFiles: no row ${fileId}`),
          );
        }
        return row;
      });

    const fileUrl = (jamId: string, fileId: string) => {
      const input = `${jamId}/${fileId}`;
      const encoded = input.replaceAll("/", "%2F");
      return `https://${mockUploadHost}/jams/${encoded}`;
    };

    return handlers
      .handle("upload", ({ payload }) =>
        Effect.succeed(
          new FileUploadTargets({
            targets: payload.files.map(() => {
              const fileId = FileId.make(newId("file"));
              return new FileUploadTarget({
                fileId,
                url: `https://${mockUploadHost}/${fileId}`,
              });
            }),
          }),
        ),
      )
      .handle("pendingPreview", ({ params }) =>
        Effect.succeed(
          new FileUrl({
            url: `https://${mockUploadHost}/${params.fileId}/preview`,
          }),
        ),
      )
      .handle("write", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const row = {
            id: params.fileId,
            path: text(input.path) ?? `files/${params.fileId}.txt`,
            content: text(input.content) ?? "",
            mediaType: text(input.mediaType) ?? "text/plain",
            updatedAt: DateTime.formatIso(minutesAgo(0)),
            updatedBy: text(input.updatedBy) ?? "user_sample_alex",
          };
          const rows = yield* Ref.get(filesRef);
          yield* Ref.set(
            filesRef,
            rows.some((candidate) => candidate.id === row.id)
              ? rows.map((candidate) =>
                  candidate.id === row.id ? row : candidate,
                )
              : [...rows, row],
          );
          const version = {
            id: newId("fver"),
            fileId: row.id,
            version:
              (yield* Ref.get(versionsRef)).filter(
                (candidate) => candidate.fileId === row.id,
              ).length + 1,
            content: row.content,
            createdAt: row.updatedAt,
            createdBy: row.updatedBy,
          };
          yield* Ref.update(versionsRef, (all) => [version, ...all]);
          return row;
        }),
      )
      .handle("url", ({ params }) =>
        Effect.gen(function* () {
          yield* findFile(params.fileId);
          return {
            url: fileUrl(params.jamId, params.fileId),
            expiresAt: DateTime.formatIso(minutesAgo(-60)),
          };
        }),
      )
      .handle("versions", ({ params }) =>
        findFile(params.fileId).pipe(
          Effect.flatMap(() =>
            Effect.gen(function* () {
              const rows = yield* Ref.get(versionsRef);
              return rows.filter((row) => row.fileId === params.fileId);
            }),
          ),
        ),
      )
      .handle("read", ({ params, query }) =>
        Effect.gen(function* () {
          const input = fields(query);
          const machineFiles = yield* Ref.get(machineFilesRef);
          return {
            jamId: params.jamId,
            path: text(input.path) ?? machineFile.path,
            content: machineFiles[params.jamId] ?? machineFile.content,
            mediaType: machineFile.mediaType,
          };
        }),
      )
      .handle("writeMachine", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const content = text(input.content) ?? "";
          yield* Ref.update(machineFilesRef, (rows) => ({
            ...rows,
            [params.jamId]: content,
          }));
          return {
            ok: true,
            jamId: params.jamId,
            path: text(input.path) ?? machineFile.path,
            content,
            updatedAt: DateTime.formatIso(minutesAgo(0)),
          };
        }),
      );
  }),
);
