export type DeviceAttempt = {
  readonly attemptId: string;
  readonly userCode: string;
  readonly verificationUri: string;
  readonly intervalSeconds: number;
};

export type DevicePoll = {
  readonly status: "pending" | "connected" | "denied" | "expired" | "failed";
};

const field = (raw: unknown, key: string) =>
  raw !== null && typeof raw === "object"
    ? (raw as Record<string, unknown>)[key]
    : undefined;

const text = (raw: unknown, ...keys: ReadonlyArray<string>) => {
  for (const key of keys) {
    const value = field(raw, key);
    if (typeof value === "string") return value;
  }
  return undefined;
};

const pollStatuses: Readonly<Record<string, DevicePoll["status"]>> = {
  pending: "pending",
  connected: "connected",
  approved: "connected",
  denied: "denied",
  rejected: "denied",
  expired: "expired",
  failed: "failed",
};

export const readDeviceAttempt = (raw: unknown): DeviceAttempt => ({
  attemptId: text(raw, "attemptId") ?? "",
  userCode: text(raw, "userCode") ?? "",
  verificationUri: text(raw, "verificationUri", "verificationUrl") ?? "",
  intervalSeconds: Number(field(raw, "intervalSeconds") ?? 5),
});

export const readDevicePoll = (raw: unknown): DevicePoll => ({
  status: pollStatuses[text(raw, "status") ?? ""] ?? "pending",
});
