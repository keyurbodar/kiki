import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

const announcementTimeToLive = "1 hour";

export const announcementsAtom = Atom.family((userId: string) =>
  ApiClient.query("announcements", "list", {
    query: { include: "releases" },
    reactivityKeys: [`user_announcement:${userId}`],
    timeToLive: announcementTimeToLive,
  }),
);

export const recordAnnouncementAtom = ApiClient.mutation(
  "announcements",
  "record",
);

export const announcementReactivityKey = (userId: string) =>
  `user_announcement:${userId}`;
