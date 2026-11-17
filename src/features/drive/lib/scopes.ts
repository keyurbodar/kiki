import type { DriveScopeFields, DriveTarget } from "./mount";

export interface DriveScopeSummary extends DriveScopeFields {
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly headUpdatedAt: Date | null;
}

export interface DriveScopeRow {
  readonly key: string;
  readonly label: string;
  readonly scopeLabel: string;
  readonly personal: boolean;
  readonly summary: DriveScopeSummary;
  readonly target: DriveTarget;
}

export interface DriveScopeNames {
  readonly organizationName?: string;
  readonly userId?: string;
  readonly projects: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly automations: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly captains: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
}

const noScope: DriveScopeFields = {
  projectId: null,
  userId: null,
  automationId: null,
  captainJamId: null,
};

const emptySummary = (scope: DriveScopeFields): DriveScopeSummary => ({
  ...scope,
  fileCount: 0,
  totalBytes: 0,
  headUpdatedAt: null,
});

const sameScope = (a: DriveScopeFields, b: DriveScopeFields) =>
  a.projectId === b.projectId &&
  a.userId === b.userId &&
  a.automationId === b.automationId &&
  a.captainJamId === b.captainJamId;

const organizationRow = (
  names: DriveScopeNames,
  summary: DriveScopeSummary,
): DriveScopeRow => ({
  key: "organization",
  label: names.organizationName ?? "Organization",
  scopeLabel: "Every thread in the organization",
  personal: false,
  summary,
  target: { kind: "organization" },
});

const personalRow = (summary: DriveScopeSummary): DriveScopeRow => ({
  key: "personal",
  label: "Your drive",
  scopeLabel: "Only your threads",
  personal: true,
  summary,
  target: { kind: "personal" },
});

/** One row per summary the viewer can name; unknown projects and automations drop out. */
export function scopeRows(
  summaries: ReadonlyArray<DriveScopeSummary>,
  names: DriveScopeNames,
): Array<DriveScopeRow> {
  return summaries.flatMap((summary): Array<DriveScopeRow> => {
    if (sameScope(summary, noScope)) return [organizationRow(names, summary)];
    if (summary.captainJamId !== null) {
      const jamId = summary.captainJamId;
      return [
        {
          key: `captain:${jamId}`,
          label: names.captains.find((c) => c.id === jamId)?.name ?? "Captain",
          scopeLabel: "This Captain and its crew",
          personal: false,
          summary,
          target: { kind: "captain", jamId },
        },
      ];
    }
    if (summary.automationId !== null) {
      const automation = names.automations.find(
        (a) => a.id === summary.automationId,
      );
      if (automation === undefined) return [];
      return [
        {
          key: `automation:${automation.id}`,
          label: automation.name,
          scopeLabel: "This automation's runs",
          personal: false,
          summary,
          target: { kind: "automation", automationId: automation.id },
        },
      ];
    }
    if (summary.projectId !== null) {
      const project = names.projects.find((p) => p.id === summary.projectId);
      if (project === undefined) return [];
      const personal = summary.userId !== null;
      return [
        {
          key: `project:${project.id}:${personal ? "personal" : "shared"}`,
          label: personal ? `Your drive in ${project.name}` : project.name,
          scopeLabel: personal
            ? `Your threads in ${project.name}`
            : `Every thread in ${project.name}`,
          personal,
          summary,
          target: { kind: "project", projectId: project.id, personal },
        },
      ];
    }
    return summary.userId !== null && summary.userId === names.userId
      ? [personalRow(summary)]
      : [];
  });
}

/** Every row the drive root lists: organization and personal always, then the rest. */
export function directoryRows(
  summaries: ReadonlyArray<DriveScopeSummary>,
  names: DriveScopeNames,
): Array<DriveScopeRow> {
  const personalScope =
    names.userId === undefined
      ? undefined
      : { ...noScope, userId: names.userId };
  return [
    organizationRow(
      names,
      summaries.find((s) => sameScope(s, noScope)) ?? emptySummary(noScope),
    ),
    ...(personalScope === undefined
      ? []
      : [
          personalRow(
            summaries.find((s) => sameScope(s, personalScope)) ??
              emptySummary(personalScope),
          ),
        ]),
    ...scopeRows(summaries, names).filter(
      (row) => row.key !== "organization" && row.key !== "personal",
    ),
  ];
}

export const driveOrderings = ["updated", "name", "files", "size"] as const;
export type DriveOrdering = (typeof driveOrderings)[number];

export const driveOrderingLabels: Record<DriveOrdering, string> = {
  updated: "Updated at",
  name: "Alphabetical",
  files: "File count",
  size: "Size",
};

export const compareRows =
  (ordering: DriveOrdering) => (a: DriveScopeRow, b: DriveScopeRow) => {
    const byName = a.label.localeCompare(b.label) || a.key.localeCompare(b.key);
    if (ordering === "name") return byName;
    if (ordering === "files")
      return b.summary.fileCount - a.summary.fileCount || byName;
    if (ordering === "size")
      return b.summary.totalBytes - a.summary.totalBytes || byName;
    return (
      (b.summary.headUpdatedAt?.getTime() ?? 0) -
        (a.summary.headUpdatedAt?.getTime() ?? 0) || byName
    );
  };
