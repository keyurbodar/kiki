export const deviceCompletionKinds = ["mention", "error"] as const;

export type DeviceCompletionKind = (typeof deviceCompletionKinds)[number];

export const completionKinds = [...deviceCompletionKinds, "pr_merged"] as const;

export type CompletionKind = (typeof completionKinds)[number];

export const completionKindLabels: Record<CompletionKind, string> = {
  mention: "Mentioned you",
  error: "Failed",
  pr_merged: "PR merged",
};

export const notificationOrigins = [
  "web",
  "slack",
  "linear",
  "github",
  "api",
  "capy",
  "automation",
] as const;

export type NotificationOrigin = (typeof notificationOrigins)[number];

export const notificationOriginLabels: Record<NotificationOrigin, string> = {
  web: "Web and desktop",
  slack: "Slack",
  linear: "Linear",
  github: "GitHub",
  api: "API",
  capy: "Started by Capy",
  automation: "Automations",
};

export const isOriginOnByDefault = (origin: string) => origin === "web";

export function enabledKindsSummary(labels: readonly string[]) {
  if (labels.length === 0) return "Off";
  if (labels.length === deviceCompletionKinds.length)
    return "Enabled for all completions";
  const shown = labels.slice(0, 2).map((label) => label.toLowerCase());
  const others = labels.length - shown.length;
  return `Enabled for ${shown.join(", ")}${others > 0 ? `, ${others} other${others === 1 ? "" : "s"}` : ""}`;
}
