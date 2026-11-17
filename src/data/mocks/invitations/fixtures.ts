import { isoMinutesAgo, orgId, people } from "../fixtures/world.ts";

export const invitationHistory = [
  {
    id: "inv_hist_taylor_accepted",
    email: "taylor@example.com",
    role: "member",
    invitedBy: people.sam.id,
    status: "accepted",
    createdAt: isoMinutesAgo(5 * 24 * 60),
    resolvedAt: isoMinutesAgo(4 * 24 * 60),
  },
] as const;

export const invitationDefaults = {
  orgId,
  role: "member",
  expiresInDays: 7,
  invitedBy: people.alex.id,
} as const;
