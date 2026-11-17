import { isoMinutesAgo, org, people } from "../fixtures/world.ts";

export const sampleAvatar = {
  orgId: org.id,
  url: "https://static.example.com/orgs/acme/avatar.png",
  mimeType: "image/png",
  size: 18_432,
  updatedAt: isoMinutesAgo(6 * 24 * 60),
  updatedBy: people.sam.id,
};

export const sampleUpload = {
  uploadUrl: "https://uploads.example.com/org-avatar/acme",
  fileKey: "orgs/acme/avatar.png",
  method: "PUT" as const,
  mimeType: "image/png",
  headers: { "Content-Type": "image/png" },
  expiresAt: isoMinutesAgo(-30),
};
