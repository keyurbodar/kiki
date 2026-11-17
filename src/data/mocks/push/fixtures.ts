import { devices, isoMinutesAgo, people } from "../fixtures/world.ts";

export const sampleSubscriptions = [
  {
    id: "push_sub_laptop",
    deviceId: devices[0].id,
    endpoint: "https://push.example.com/subscriptions/laptop",
    keys: { p256dh: "sample-public-key-laptop", auth: "sample-auth-laptop" },
    ownerId: people.alex.id,
    platform: "web",
    enabled: true,
    createdAt: isoMinutesAgo(9 * 24 * 60),
  },
  {
    id: "push_sub_buildbox",
    deviceId: devices[1].id,
    endpoint: "https://push.example.com/subscriptions/buildbox",
    keys: {
      p256dh: "sample-public-key-buildbox",
      auth: "sample-auth-buildbox",
    },
    ownerId: people.sam.id,
    platform: "web",
    enabled: false,
    createdAt: isoMinutesAgo(3 * 24 * 60),
  },
] as const;

export const samplePushSettings = {
  enabled: true,
  sound: "chime",
  threadReplies: true,
  pullReviews: true,
  machineAlerts: false,
  updatedAt: isoMinutesAgo(60),
} as const;
