/** What a drive page shows: one scope, as Capy's `DriveDetailPage` mounts it. */
export const driveScopes = ["organization", "personal"] as const;
export type DriveScope = (typeof driveScopes)[number];

export type DriveMount =
  | { readonly kind: "directory"; readonly scope: DriveScope }
  | { readonly kind: "captain"; readonly jamId: string }
  | { readonly kind: "automation"; readonly automationId: string }
  | {
      readonly kind: "project";
      readonly projectId: string;
      readonly scope: "shared" | "personal";
    };

/** A scope row's target on the drive root. */
export type DriveTarget =
  | { readonly kind: "organization" }
  | { readonly kind: "personal" }
  | { readonly kind: "captain"; readonly jamId: string }
  | { readonly kind: "automation"; readonly automationId: string }
  | {
      readonly kind: "project";
      readonly projectId: string;
      readonly personal: boolean;
    };

export interface DriveScopeFields {
  readonly projectId: string | null;
  readonly userId: string | null;
  readonly automationId: string | null;
  readonly captainJamId: string | null;
}

/** The exact scope a mount reads and writes. */
export function mountScope(
  mount: DriveMount,
  userId: string | undefined,
): DriveScopeFields {
  const none = {
    projectId: null,
    userId: null,
    automationId: null,
    captainJamId: null,
  };
  switch (mount.kind) {
    case "directory":
      return mount.scope === "organization"
        ? none
        : { ...none, userId: userId ?? null };
    case "captain":
      return { ...none, captainJamId: mount.jamId };
    case "automation":
      return { ...none, automationId: mount.automationId };
    case "project":
      return {
        ...none,
        projectId: mount.projectId,
        userId: mount.scope === "personal" ? (userId ?? null) : null,
      };
  }
}

/** The route a drive root row links to. */
export function targetRoute(target: DriveTarget) {
  switch (target.kind) {
    case "captain":
      return {
        to: "/drive/captain/$jamId",
        params: { jamId: target.jamId },
      } as const;
    case "automation":
      return {
        to: "/automation/$automationId/drive",
        params: { automationId: target.automationId },
      } as const;
    case "project":
      return {
        to: "/project/$projectId/drive/$scope",
        params: {
          projectId: target.projectId,
          scope: target.personal ? "personal" : "shared",
        },
      } as const;
    case "organization":
    case "personal":
      return { to: "/drive/$scope", params: { scope: target.kind } } as const;
  }
}

export interface DriveCrumb {
  readonly label: string;
  readonly route?: ReturnType<typeof targetRoute>;
  readonly to?: "/drive";
}

/** Page title and breadcrumbs for a mount, as Capy's drive trail builds them. */
export function mountTrail(
  mount: DriveMount,
  names: {
    readonly organization?: string;
    readonly captain?: string;
    readonly automation?: string;
    readonly project?: string;
  },
  withDrive: boolean,
): { title: string; crumbs: ReadonlyArray<DriveCrumb> } {
  const crumbs: Array<DriveCrumb> = withDrive
    ? [{ label: "Drive", to: "/drive" }]
    : [];
  switch (mount.kind) {
    case "directory":
      return {
        title:
          mount.scope === "organization"
            ? (names.organization ?? "Organization")
            : "Your drive",
        crumbs,
      };
    case "captain":
      return { title: names.captain ?? "Captain", crumbs };
    case "automation":
      return { title: names.automation ?? "Automation", crumbs };
    case "project":
      return mount.scope === "shared"
        ? { title: names.project ?? "Project", crumbs }
        : {
            title: "Your drive",
            crumbs: [
              ...crumbs,
              {
                label: names.project ?? "Project",
                route: targetRoute({
                  kind: "project",
                  projectId: mount.projectId,
                  personal: false,
                }),
              },
            ],
          };
  }
}
