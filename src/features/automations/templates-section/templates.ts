import {
  type Trigger,
  type TriggerStatus,
  triggerStatus,
} from "../automations-list/triggers";

export type TemplateTrigger = Trigger & {
  readonly conditions?: Readonly<Record<string, ReadonlyArray<string>>>;
  readonly runWhen?: string;
};

export type AutomationTemplate = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly instructions: string;
  readonly triggers: ReadonlyArray<TemplateTrigger>;
  readonly requiredFields: ReadonlyArray<{
    readonly trigger: number;
    readonly field: string;
    readonly label: string;
  }>;
};

export const automationTemplates: ReadonlyArray<AutomationTemplate> = [
  {
    id: "slack-customer-bug-triage",
    name: "Slack customer bug triage",
    description:
      "Detect customer bug reports in Slack, investigate impact, and prepare a verified fix path",
    instructions:
      "Triage the Slack report as a customer-facing bug signal. Use the Slack event context, attachments, linked logs, and attached repositories to decide whether this is a reproducible product defect. Identify severity, affected surface, likely owner, reproduction steps, and the smallest safe fix path. If the evidence is strong, implement a focused fix and open a PR; otherwise produce a concise triage note with the exact missing evidence. Do not post back to the customer Slack thread unless the automation instructions are later customized to explicitly do so.",
    triggers: [
      {
        type: "slack",
        event: "message",
        conditions: { channels: [] },
        runWhen:
          "Run when a customer reports a credible product bug, regression, crash, data issue, or broken workflow. Skip support questions, feature requests, status pings, and general feedback without a concrete failure.",
      },
    ],
    requiredFields: [],
  },
  {
    id: "slack-support-question-triage",
    name: "Slack support question triage",
    description:
      "Classify technical Slack questions and draft answers grounded in repository context",
    instructions:
      "Research the Slack question using the event context, attached repositories, and available documentation. Draft a direct support-ready answer with relevant implementation details, file or API references when useful, and any caveats. If the question exposes a product or docs gap, call that out separately with a recommended follow-up. Do not post back to Slack unless the automation instructions are later customized to explicitly do so.",
    triggers: [
      {
        type: "slack",
        event: "message",
        conditions: { channels: [] },
        runWhen:
          "Run when a human asks a technical product, integration, API, configuration, or implementation question that needs repository or documentation investigation. Skip bug reports, account/billing questions, and casual discussion.",
      },
    ],
    requiredFields: [],
  },
  {
    id: "linear-issue-to-pr",
    name: "Linear issue to PR",
    description:
      "Turn implementation-ready Linear issues into scoped pull requests",
    instructions:
      "Read the Linear issue, description, labels, priority, linked discussions, and attached repository context. Confirm the expected behavior in the codebase, implement the smallest complete change, run relevant checks, and prepare a pull request that links back to the issue. If the issue lacks acceptance criteria or depends on product decisions, leave a concise implementation plan and the exact questions needed before coding.",
    triggers: [
      {
        type: "linear",
        event: "issue_created",
        conditions: { teams: [] },
        runWhen:
          "Run for implementation-ready engineering issues with enough acceptance criteria to begin work.",
      },
    ],
    requiredFields: [],
  },
  {
    id: "sentry-issue-investigation",
    name: "Sentry issue investigation",
    description:
      "Investigate new or regressed Sentry issues and prepare verified fixes",
    instructions:
      "Investigate the Sentry issue using the event payload, stack trace, release/environment data, suspect commits, and attached repositories. Identify impact, likely root cause, affected code path, and whether this is new, regressed, or already known. Implement and verify a focused fix when confidence is high; otherwise produce a concise investigation note with the missing evidence and recommended owner.",
    triggers: [
      {
        type: "sentry",
        event: "issue_lifecycle",
        conditions: {
          projects: [],
          actions: ["created", "unresolved"],
          levels: ["error", "fatal"],
        },
        runWhen:
          "Run when the issue has enough stack trace or event context to investigate a product defect. Skip noisy low-severity events without actionable code context.",
      },
    ],
    requiredFields: [
      { trigger: 0, field: "projects", label: "Sentry project" },
    ],
  },
  {
    id: "weekly-dependency-updates",
    name: "Weekly dependency updates",
    description: "Prepare small, safe dependency updates on a weekly cadence",
    instructions:
      "Review outdated dependencies, release notes, lockfile changes, and relevant security advisories. Apply a small compatible batch of high-value updates, prioritize security and low-risk patch/minor releases, avoid unrelated major upgrades unless explicitly safe, run the relevant install/build/test checks, and summarize changed packages, risk, verification, and deferred upgrades.",
    triggers: [{ type: "schedule", cron: "0 9 * * 1", timezone: "UTC" }],
    requiredFields: [],
  },
  {
    id: "custom-webhook-triage",
    name: "Custom webhook triage",
    description:
      "Classify and triage arbitrary external events through a secure webhook",
    instructions:
      "Inspect the incoming webhook payload, headers, source system, and event fields. Determine whether it needs engineering triage, identify urgency and ownership, correlate it with repository context when possible, and produce a concise triage report with recommended next actions. If the payload is malformed, incomplete, or unactionable, explain what is missing rather than starting speculative work.",
    triggers: [
      {
        type: "incoming_webhook",
        conditions: {},
        runWhen:
          "Run when the webhook payload represents an actionable incident, bug, support escalation, release signal, or engineering task. Skip heartbeats, acknowledgements, analytics noise, and malformed payloads.",
      },
    ],
    requiredFields: [],
  },
];

/** A template ships only when every one of its triggers has shipped. */
export const templateStatus = (template: AutomationTemplate): TriggerStatus =>
  template.triggers.every((trigger) => triggerStatus(trigger) === "shipped")
    ? "shipped"
    : "coming_soon";

/** The shipped template with this id, for the editor's ?template= search param. */
export const findTemplate = (id: string | undefined) =>
  automationTemplates.find(
    (template) => template.id === id && templateStatus(template) === "shipped",
  );
