import { Schema } from "effect";

export const FileId = Schema.String.pipe(Schema.brand("Core.FileId"));
export type FileId = typeof FileId.Type;

export const fileSizeLimitBytes = 262_144_000;
export const messageFilesLimitBytes = 2_147_483_648;

export const FileUploadDeclaration = Schema.Struct({
  name: Schema.String,
  mediaType: Schema.String,
  sizeBytes: Schema.Number,
}).annotate({ identifier: "FileUploadDeclaration" });
export type FileUploadDeclaration = typeof FileUploadDeclaration.Type;

export class FileUploadTarget extends Schema.Class<FileUploadTarget>(
  "FileUploadTarget",
)({
  fileId: FileId,
  url: Schema.String,
}) {}

export class FileUploadTargets extends Schema.Class<FileUploadTargets>(
  "FileUploadTargets",
)({
  targets: Schema.Array(FileUploadTarget),
}) {}

export class FileUrl extends Schema.Class<FileUrl>("FileUrl")({
  url: Schema.String,
  expiresAt: Schema.optional(Schema.String),
}) {}
