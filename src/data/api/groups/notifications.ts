import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { InferredMethod } from "../annotations.ts";
import { Undecoded } from "../undecoded.ts";

export class NotificationsGroup extends HttpApiGroup.make("notifications").add(
  HttpApiEndpoint.get("list", "/me/notifications", {
    success: Undecoded,
  }).annotate(InferredMethod, true),
  HttpApiEndpoint.get("unreadCount", "/me/notifications/unread-count", {
    success: Undecoded,
  }).annotate(InferredMethod, true),
) {}
