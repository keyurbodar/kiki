export type MemoryScope =
  | "personal"
  | "project-user"
  | "project"
  | "everywhere";

export type MemoryTopic = {
  volumeId: string;
  path: string;
  title: string;
  description: string;
  body: string;
  scope: MemoryScope;
  source: string | null;
  statedBy: string | null;
  lastConfirmed: string | null;
  projectId: string | null;
  repositories: readonly string[];
  digest: string;
  canWrite: boolean;
};

export type MemoryPageRow = {
  scanned: number;
  skipped: number;
  nextCursor: string | null;
  items: readonly MemoryTopic[];
};

export type MemoryDraft = {
  topic: MemoryTopic;
  title: string;
  description: string;
  body: string;
};

export type MemoryLocation = {
  file?: string;
  volume?: string;
  where?: string;
  who?: string;
};

export type MemorySort = {
  column: "title" | "who" | "where" | "source" | "confirmed";
  direction: "ascending" | "descending";
};

export type MemoryResult = {
  volumeId: string;
  path: string;
  sourceVersionId: string;
  digest: string;
};
