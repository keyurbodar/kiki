export const driveTiers = [
  "free",
  "credits",
  "lite",
  "pro",
  "max",
  "enterprise",
] as const;

export type DriveTier = (typeof driveTiers)[number];
export type UpgradeTier = "lite" | "pro" | "max";

export const driveTierNames: Record<DriveTier, string | undefined> = {
  free: "Free",
  credits: undefined,
  lite: "Lite",
  pro: "Pro",
  max: "Max",
  enterprise: "Enterprise",
};

export const upgradeTierNames: Record<UpgradeTier, string> = {
  lite: "Lite",
  pro: "Pro",
  max: "Max",
};

export const driveStorageGb: Record<DriveTier, number> = {
  free: 1,
  credits: 10,
  lite: 10,
  pro: 25,
  max: 50,
  enterprise: 50,
};

export type DriveFacts = {
  usedBytes: number;
  limitBytes: number;
  tier: DriveTier | null;
};

const isTier = (value: unknown): value is DriveTier =>
  typeof value === "string" && value in driveTierNames;

export function driveFacts(value: unknown): DriveFacts | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const facts = value as Record<string, unknown>;
  if (
    typeof facts.usedBytes !== "number" ||
    typeof facts.limitBytes !== "number"
  )
    return undefined;
  return {
    usedBytes: facts.usedBytes,
    limitBytes: facts.limitBytes,
    tier: isTier(facts.tier) ? facts.tier : null,
  };
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1,
  );
  const size = bytes / 1024 ** (index + 1);
  return `${size >= 10 ? Math.round(size) : size.toFixed(1)} ${units[index]}`;
}

export const driveUsage = (facts: DriveFacts) =>
  `${formatBytes(facts.usedBytes)} of ${formatBytes(facts.limitBytes)}`;

export function driveUsageOnPlan(facts: DriveFacts) {
  const plan = facts.tier === null ? undefined : driveTierNames[facts.tier];
  return `${driveUsage(facts)}${plan === undefined ? "" : ` on ${plan}`}`;
}

const storageBytes = (tier: DriveTier) => driveStorageGb[tier] * 1024 ** 3;

export function recommendedDriveTier(
  facts: DriveFacts,
): UpgradeTier | undefined {
  if (facts.tier === null || storageBytes(facts.tier) !== facts.limitBytes)
    return undefined;
  return (["lite", "pro", "max"] as const).find(
    (tier) => storageBytes(tier) > facts.limitBytes,
  );
}

export const opensPaywall = (tier: DriveTier) =>
  tier === "free" || tier === "lite";
