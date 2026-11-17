export type DriveLocation =
  | { kind: "captain"; jamId: string }
  | { kind: "project"; projectId: string; scope: "shared" | "personal" }
  | { kind: "organization" }
  | { kind: "personal" }
  | { kind: "automation"; automationId: string };

export const driveLocationKey = (location: DriveLocation): string => {
  switch (location.kind) {
    case "captain":
      return `captain:${location.jamId}`;
    case "project":
      return `project:${location.projectId}:${location.scope}`;
    default:
      return location.kind;
  }
};

export const threadDriveLocations = (
  captainJamId: string | null | undefined,
  projectId: string | null,
): DriveLocation[] => [
  ...(captainJamId ? [{ kind: "captain" as const, jamId: captainJamId }] : []),
  ...(projectId === null
    ? []
    : [{ kind: "project" as const, projectId, scope: "shared" as const }]),
  { kind: "organization" },
  { kind: "personal" },
];
