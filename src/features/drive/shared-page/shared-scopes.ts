export interface ShareScopeRef {
  readonly projectId: string | null;
  readonly userId: string | null;
  readonly automationId: string | null;
  readonly captainJamId: string | null;
}

export interface ShareScopeContext {
  readonly organizationName: string | undefined;
  readonly userId: string | undefined;
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

const scopeName = (
  share: ShareScopeRef,
  context: ShareScopeContext,
): string | undefined => {
  if (
    share.projectId === null &&
    share.userId === null &&
    share.automationId === null &&
    share.captainJamId === null
  )
    return context.organizationName ?? "Organization";
  if (share.captainJamId !== null)
    return (
      context.captains.find((captain) => captain.id === share.captainJamId)
        ?.name ?? "Captain"
    );
  if (share.automationId !== null)
    return context.automations.find(
      (automation) => automation.id === share.automationId,
    )?.name;
  if (share.projectId !== null) {
    const project = context.projects.find(
      (candidate) => candidate.id === share.projectId,
    );
    if (project === undefined) return undefined;
    return share.userId === null
      ? project.name
      : `Your drive in ${project.name}`;
  }
  return share.userId !== null && share.userId === context.userId
    ? "Your drive"
    : undefined;
};

export const shareScopeLabel = (
  share: ShareScopeRef,
  context: ShareScopeContext,
) =>
  scopeName(share, context) ??
  (share.captainJamId === null
    ? share.automationId === null
      ? share.projectId === null
        ? "Another drive"
        : "A deleted project"
      : "A deleted automation"
    : "Captain");

export type ShareOpenTarget =
  | {
      readonly to: "/drive/$scope";
      readonly params: { readonly scope: string };
    }
  | {
      readonly to: "/project/$projectId/drive/$scope";
      readonly params: { readonly projectId: string; readonly scope: string };
    }
  | {
      readonly to: "/automation/$automationId/drive";
      readonly params: { readonly automationId: string };
    }
  | {
      readonly to: "/drive/captain/$jamId";
      readonly params: { readonly jamId: string };
    };

export const shareOpenTarget = (share: ShareScopeRef): ShareOpenTarget => {
  if (share.captainJamId !== null)
    return {
      to: "/drive/captain/$jamId",
      params: { jamId: share.captainJamId },
    };
  if (share.automationId !== null)
    return {
      to: "/automation/$automationId/drive",
      params: { automationId: share.automationId },
    };
  if (share.projectId !== null)
    return {
      to: "/project/$projectId/drive/$scope",
      params: {
        projectId: share.projectId,
        scope: share.userId === null ? "shared" : "personal",
      },
    };
  return {
    to: "/drive/$scope",
    params: { scope: share.userId === null ? "organization" : "personal" },
  };
};

export const matchesShareSearch = (
  values: ReadonlyArray<string>,
  query: string,
) => values.some((value) => value.toLowerCase().includes(query));

const units: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

export const formatChanged = (iso: string, now: number) => {
  const seconds = Math.round((Date.parse(iso) - now) / 1e3);
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size)
      return format.format(Math.round(seconds / size), unit);
  }
  return "just now";
};
