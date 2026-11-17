import type { Intent } from "@/primitives/intent";

export interface PublicationVersion {
  readonly id: string;
  readonly version: number;
  readonly createdAt: string;
  readonly reviewed: boolean;
  readonly removed: boolean;
}

export interface ThemePublication {
  readonly themeId: string;
  readonly slug: string;
  readonly listed: boolean;
  readonly withdrawn: boolean;
  readonly removed: boolean;
  readonly removedReason?: string | null;
  readonly adds: number;
  readonly versions: ReadonlyArray<PublicationVersion>;
}

export interface PublicationStatus {
  readonly label: string;
  readonly color: Intent;
  readonly note: string;
}

export interface ReviewStep {
  readonly label: string;
  readonly note: string;
  readonly state: "done" | "current" | "failed";
}

export const THEMES_PER_PAGE = 12;

export const submittedDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const addsNote = (adds: number) =>
  adds === 0
    ? "Not added yet"
    : `Added ${adds === 1 ? "once" : `${adds} times`}`;

export const publicationStatus = (
  publication: ThemePublication | undefined,
): PublicationStatus => {
  if (publication === undefined)
    return {
      label: "Not published",
      color: "neutral",
      note: "Only you can see it",
    };
  if (publication.removed)
    return {
      label: "Removed",
      color: "danger",
      note: "Capy took it out of Explore",
    };
  if (publication.withdrawn)
    return {
      label: "Unpublished",
      color: "neutral",
      note: "Not in Explore, copies people added stay",
    };
  const latest = publication.versions[0];
  if (latest?.removed === true)
    return {
      label: "Not approved",
      color: "danger",
      note: publication.removedReason ?? "Capy didn't approve this version",
    };
  if (latest?.reviewed === true)
    return {
      label: "Approved",
      color: "success",
      note: addsNote(publication.adds),
    };
  return {
    label: "In review",
    color: "warning",
    note: publication.listed
      ? "The approved version stays in Explore until Capy approves this one"
      : "In Explore once Capy approves it",
  };
};

export const reviewSteps = (
  publication: ThemePublication,
): ReadonlyArray<ReviewStep> => {
  const latest = publication.versions[0];
  if (latest === undefined) return [];
  const review: ReviewStep = publication.removed
    ? {
        label: "Removed by Capy",
        note: publication.removedReason ?? "It no longer appears in Explore",
        state: "failed",
      }
    : latest.removed
      ? {
          label: "Not approved",
          note: publication.removedReason ?? "Capy didn't approve this version",
          state: "failed",
        }
      : latest.reviewed
        ? { label: "Approved by Capy", note: "In Explore", state: "done" }
        : {
            label: "Waiting for approval",
            note: "Capy approves each version before it goes in Explore",
            state: "current",
          };
  return [
    {
      label: `Submitted version ${latest.version}`,
      note: submittedDate.format(new Date(latest.createdAt)),
      state: "done",
    },
    review,
  ];
};

export const listedVersionId = (publication: ThemePublication | undefined) =>
  publication?.versions.find((version) => version.reviewed)?.id;

export const publicationsFrom = (
  value: unknown,
): ReadonlyMap<string, ThemePublication> => {
  const rows = Array.isArray(value)
    ? value
    : (value as { publications?: unknown } | null)?.publications;
  return new Map(
    (Array.isArray(rows) ? (rows as ReadonlyArray<ThemePublication>) : [])
      .filter((row) => Array.isArray(row.versions))
      .map((row) => [row.themeId, row]),
  );
};

export const pageCount = (themes: number) =>
  Math.max(1, Math.ceil(themes / THEMES_PER_PAGE));
