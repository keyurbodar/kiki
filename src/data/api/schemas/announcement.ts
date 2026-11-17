import { Schema } from "effect";
import { Timestamp } from "./ids.ts";

export const AnnouncementKey = Schema.String.annotate({
  identifier: "AnnouncementKey",
});

export const AnnouncementPlatform = Schema.Literals(["web", "desktop"]);

export const AnnouncementOs = Schema.Literals(["darwin", "win32", "linux"]);

export const AnnouncementAction = Schema.Literals([
  "seen",
  "clicked",
  "dismissed",
]);
export type AnnouncementAction = typeof AnnouncementAction.Type;

export const AnnouncementListInclude = Schema.Literals(["releases"]);

export class AnnouncementState extends Schema.Class<AnnouncementState>(
  "AnnouncementState",
)({
  seenAt: Schema.NullOr(Timestamp),
  clickedAt: Schema.NullOr(Timestamp),
  dismissedAt: Schema.NullOr(Timestamp),
}) {}

export class Announcement extends Schema.Class<Announcement>("Announcement")({
  key: AnnouncementKey,
  publishedAt: Timestamp,
  platforms: Schema.NullOr(Schema.Array(AnnouncementPlatform)),
  os: Schema.NullOr(Schema.Array(AnnouncementOs)),
  state: AnnouncementState,
}) {}

export class AnnouncementList extends Schema.Class<AnnouncementList>(
  "AnnouncementList",
)({
  announcements: Schema.Array(Announcement),
}) {}

export const RecordAnnouncementRequest = Schema.Struct({
  action: AnnouncementAction,
}).annotate({ identifier: "RecordAnnouncementRequest" });
