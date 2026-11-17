import { isoMinutesAgo, people, threads } from "../fixtures/world.ts";

export interface ThreadFile {
  readonly id: string;
  readonly path: string;
  readonly content: string;
  readonly mediaType: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
}

export interface FileVersionRow {
  readonly id: string;
  readonly fileId: string;
  readonly version: number;
  readonly content: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export const initialFiles: ReadonlyArray<ThreadFile> = [
  {
    id: "file_sample_checkout",
    path: "src/checkout/retry.ts",
    content: "export const maxRetries = 2;\n",
    mediaType: "text/typescript",
    updatedAt: isoMinutesAgo(6),
    updatedBy: people.sam.id,
  },
  {
    id: "file_sample_notes",
    path: "notes/release-2.4.md",
    content: "Release 2.4 ships the checkout retry.\n",
    mediaType: "text/markdown",
    updatedAt: isoMinutesAgo(30),
    updatedBy: people.alex.id,
  },
];

export const initialVersions: ReadonlyArray<FileVersionRow> = [
  {
    id: "fver_sample_checkout_2",
    fileId: "file_sample_checkout",
    version: 2,
    content: "export const maxRetries = 2;\n",
    createdAt: isoMinutesAgo(6),
    createdBy: people.sam.id,
  },
  {
    id: "fver_sample_checkout_1",
    fileId: "file_sample_checkout",
    version: 1,
    content: "export const maxRetries = 1;\n",
    createdAt: isoMinutesAgo(60),
    createdBy: people.alex.id,
  },
  {
    id: "fver_sample_notes_1",
    fileId: "file_sample_notes",
    version: 1,
    content: "Release 2.4 ships the checkout retry.\n",
    createdAt: isoMinutesAgo(30),
    createdBy: people.alex.id,
  },
];

export const machineFile = {
  path: "AGENTS.md",
  content: "# Acme workspace\n\nUse bun for all package commands.\n",
  mediaType: "text/markdown",
};

export const defaultThreadId = threads.checkoutTest.id;
