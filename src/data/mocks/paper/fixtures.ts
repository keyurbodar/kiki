import { isoMinutesAgo, people, threads, world } from "../fixtures/world.ts";

export interface PaperEmbed {
  readonly id: string;
  readonly threadId: string;
  readonly fileId: string;
  readonly url: string;
  readonly title: string;
  readonly permission: string;
  readonly createdById: string;
  readonly createdAt: string;
  readonly expiresAt: string | null;
}

export const samplePaperEmbed: PaperEmbed = {
  id: "paper_embed_sample_1",
  threadId: threads.checkoutTest.id,
  fileId: world.driveFiles[0].id,
  url: "https://paper.example.com/embed/checkout-retry",
  title: "Checkout retry notes",
  permission: "org",
  createdById: people.alex.id,
  createdAt: isoMinutesAgo(40),
  expiresAt: null,
};

export const samplePaperFiles = [
  {
    id: world.driveFiles[0].id,
    name: "checkout-retry.md",
    path: world.driveFiles[0].path,
    mimeType: world.driveFiles[0].mimeType,
    size: world.driveFiles[0].size,
    url: "https://paper.example.com/files/checkout-retry.md",
    updatedAt: world.driveFiles[0].updatedAt,
    updatedBy: world.driveFiles[0].updatedBy,
  },
  {
    id: world.driveFiles[2].id,
    name: "release-2.4.md",
    path: world.driveFiles[2].path,
    mimeType: world.driveFiles[2].mimeType,
    size: world.driveFiles[2].size,
    url: "https://paper.example.com/files/release-2.4.md",
    updatedAt: world.driveFiles[2].updatedAt,
    updatedBy: world.driveFiles[2].updatedBy,
  },
];
