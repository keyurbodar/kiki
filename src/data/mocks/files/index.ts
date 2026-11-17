import { Effect } from "effect";
import {
  FileId,
  FileUploadTarget,
  FileUploadTargets,
  FileUrl,
} from "../../api/schemas/files.ts";
import { newId } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";

/**
 * Capy's client treats an upload URL on a `.invalid` host as a local upload:
 * it skips the PUT and simulates progress instead (see
 * features/composer/attachments). The mock hands out those URLs.
 */
export const mockUploadHost = "uploads.capy.invalid";

export const FilesMock = mockGroup("files", (handlers) =>
  Effect.succeed(
    handlers
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
      ),
  ),
);
