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
