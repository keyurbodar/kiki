import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import {
  AnnouncementKey,
  AnnouncementList,
  AnnouncementListInclude,
  AnnouncementState,
  RecordAnnouncementRequest,
} from "../schemas/announcement.ts";

export class AnnouncementsGroup extends HttpApiGroup.make("announcements").add(
  HttpApiEndpoint.get("list", "/me/announcements", {
    query: { include: Schema.optional(AnnouncementListInclude) },
    success: AnnouncementList,
  }),
  HttpApiEndpoint.post("record", "/me/announcements/:key", {
    params: { key: AnnouncementKey },
    payload: RecordAnnouncementRequest,
    success: AnnouncementState,
  }),
) {}
