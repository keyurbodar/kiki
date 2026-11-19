/**
 * The events each integration trigger can fire on, with Capy's labels. Both the
 * automations list and the editor read this one table, so a trigger added in
 * the editor is named the same way in the list.
 */
export const eventLabels: Partial<
  Record<string, Readonly<Record<string, string>>>
> = {
  github: {
    draft_opened: "Draft pull request opened",
    pull_request_opened: "Pull request opened",
    pull_request_pushed: "Pull request updated",
    pull_request_merged: "Pull request merged",
    comment: "Comment created",
    branch_push: "Branch pushed",
    label_change: "Label changed",
    checks: "Check completed",
    issue_comment: "Issue comment created",
    pull_request_review_comment: "Review comment created",
    pull_request_review_submitted: "Review submitted",
    pull_request_review_thread: "Review thread changed",
    workflow_run: "Workflow run completed",
  },
  slack: {
    message: "Message posted",
    reaction: "Reaction added",
    channel_created: "Channel created",
  },
  sentry: {
    issue_lifecycle: "Issue changed",
    any_issue: "Issue received",
    event_alert: "Event alert triggered",
  },
  linear: {
    issue_created: "Issue created",
    status_changed: "Issue status changed",
    end_cycle: "Cycle ended",
  },
};

export type EventOption = { value: string; label: string };

/** The events a trigger type can fire on, in the order Capy lists them. */
export const eventOptions = (type: string): ReadonlyArray<EventOption> =>
  Object.entries(eventLabels[type] ?? {}).map(([value, label]) => ({
    value,
    label,
  }));

export type EventLeaf = { event: string; label: string };

export type EventGroup = {
  label: string;
  leaves: ReadonlyArray<EventLeaf>;
};

/**
 * How Capy's add-trigger menu groups an integration's events, leaf labels
 * included. The menu offers these, not `eventLabels`: a submenu reads
 * "Pull request · Merged", where the list row needs "Pull request merged".
 */
export const eventGroups: Partial<Record<string, ReadonlyArray<EventGroup>>> = {
  github: [
    {
      label: "Pull request",
      leaves: [
        { event: "draft_opened", label: "Draft opened" },
        { event: "pull_request_opened", label: "Opened" },
        { event: "pull_request_pushed", label: "Pushed" },
        { event: "pull_request_merged", label: "Merged" },
      ],
    },
    {
      label: "Comments and reviews",
      leaves: [
        { event: "comment", label: "Comment created" },
        { event: "issue_comment", label: "Issue comment created" },
        {
          event: "pull_request_review_comment",
          label: "Review comment created",
        },
        { event: "pull_request_review_submitted", label: "Review submitted" },
        { event: "pull_request_review_thread", label: "Review thread changed" },
      ],
    },
    {
      label: "Repository",
      leaves: [
        { event: "branch_push", label: "Branch pushed" },
        { event: "label_change", label: "Label changed" },
        { event: "checks", label: "Check completed" },
        { event: "workflow_run", label: "Workflow run completed" },
      ],
    },
  ],
  slack: [
    { label: "Messages", leaves: [{ event: "message", label: "Posted" }] },
    { label: "Reactions", leaves: [{ event: "reaction", label: "Added" }] },
  ],
  sentry: [
    {
      label: "Issues",
      leaves: [
        { event: "issue_lifecycle", label: "Changed" },
        { event: "any_issue", label: "Received" },
      ],
    },
    {
      label: "Alerts",
      leaves: [{ event: "event_alert", label: "Event alert triggered" }],
    },
  ],
  linear: [
    {
      label: "Issues",
      leaves: [
        { event: "issue_created", label: "Created" },
        { event: "status_changed", label: "Status changed" },
      ],
    },
    { label: "Cycles", leaves: [{ event: "end_cycle", label: "Ended" }] },
  ],
};

export type EventStatus = "shipped" | "coming_soon";

/**
 * Which events a trigger can actually be created for. Capy ships every Sentry
 * event and Slack's channel-created behind a `Coming soon` badge, so the menu
 * shows them disabled rather than hiding a trigger type it may later open.
 */
export const eventStatus = (type: string, event: string): EventStatus =>
  type === "sentry" || (type === "slack" && event === "channel_created")
    ? "coming_soon"
    : "shipped";
