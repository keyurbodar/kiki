export type WebhookGroupSelector =
  | { readonly body_pointer: string }
  | { readonly header: string };

export type WebhookRuleCondition =
  | { readonly body_pointer: string; readonly equals: string }
  | { readonly header: string; readonly equals: string };

export type WebhookGroupRule = {
  readonly when?: ReadonlyArray<WebhookRuleCondition>;
  readonly group_by: "all" | ReadonlyArray<WebhookGroupSelector>;
};

export type WebhookCoalescingConfig = {
  readonly rules: ReadonlyArray<WebhookGroupRule>;
  readonly max_events: number;
  readonly max_wait_seconds: number;
  readonly quiet_period_seconds?: number;
};

export const defaultWebhookCoalescing: WebhookCoalescingConfig = {
  rules: [{ group_by: "all" }],
  max_events: 20,
  max_wait_seconds: 60,
};

const inRange = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max;

const validRule = (rule: WebhookGroupRule) =>
  (rule.when === undefined ||
    (rule.when.length >= 1 && rule.when.length <= 4)) &&
  (rule.group_by === "all" ||
    (rule.group_by.length >= 1 && rule.group_by.length <= 4));

export function validateWebhookCoalescing(
  value: WebhookCoalescingConfig | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  if (!inRange(value.max_wait_seconds, 1, 3600))
    return "Wait time must be a whole number from 1 to 3600 seconds";
  if (!inRange(value.max_events, 2, 100))
    return "Event limit must be a whole number from 2 to 100";
  const quiet = value.quiet_period_seconds;
  const valid =
    value.rules.length >= 1 &&
    value.rules.length <= 8 &&
    value.rules.every(validRule) &&
    (quiet === undefined ||
      (inRange(quiet, 1, 3600) && quiet <= value.max_wait_seconds));
  return valid ? undefined : "Check the batching settings";
}
