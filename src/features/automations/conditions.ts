/**
 * The filters an event trigger can carry, with Capy's field vocabulary: which
 * fields a given integration event offers, what each one is called in a chip,
 * and how a chip summarises the values chosen for it.
 */

export type ConditionOption = { value: string; label: string };

export type ConditionField = {
  key: string;
  /** The noun a chip and its menu use: "repository", "PR author". */
  label: string;
  /** What the chip reads before the values: "in", "by", "with". */
  prefix: string;
  /** The value picker. Free text when absent. */
  picker?: "emoji" | "members";
  hint?: string;
};

const fields: Readonly<Record<string, ConditionField>> = {
  repositories: { key: "repositories", label: "repository", prefix: "in" },
  branches: { key: "branches", label: "branch", prefix: "on" },
  authors: {
    key: "authors",
    label: "PR author",
    prefix: "by",
    picker: "members",
  },
  actors: { key: "actors", label: "actor", prefix: "by" },
  users: { key: "users", label: "user", prefix: "from" },
  channels: { key: "channels", label: "channel", prefix: "in" },
  reactions: {
    key: "reactions",
    label: "reaction",
    prefix: "with",
    picker: "emoji",
  },
  projects: { key: "projects", label: "project", prefix: "in" },
  teams: { key: "teams", label: "team", prefix: "in" },
  contains: { key: "contains", label: "phrase", prefix: "contains" },
  excludes: { key: "excludes", label: "phrase", prefix: "excludes" },
};

const githubFields: Readonly<Record<string, ReadonlyArray<string>>> = {
  draft_opened: ["repositories", "authors"],
  pull_request_opened: ["repositories", "authors"],
  pull_request_pushed: ["repositories", "authors"],
  pull_request_merged: ["repositories", "authors"],
  comment: ["repositories", "actors"],
  issue_comment: ["repositories", "actors"],
  pull_request_review_comment: ["repositories", "actors"],
  pull_request_review_submitted: ["repositories", "actors"],
  pull_request_review_thread: ["repositories", "actors"],
  label_change: ["repositories", "actors"],
  branch_push: ["repositories", "branches", "actors"],
  checks: ["repositories"],
  workflow_run: ["repositories"],
};

const fieldKeys = (
  type: string,
  event: string | undefined,
): ReadonlyArray<string> => {
  if (type === "github") return githubFields[event ?? ""] ?? [];
  if (type === "slack")
    return event === "reaction"
      ? ["users", "channels", "reactions"]
      : ["users", "channels"];
  if (type === "sentry") return ["projects"];
  if (type === "linear") return ["teams"];
  if (type === "incoming_webhook") return ["contains", "excludes"];
  return [];
};

/** The filters this event offers, in the order Capy lists them. */
export const conditionFields = (
  type: string,
  event: string | undefined,
): ReadonlyArray<ConditionField> =>
  fieldKeys(type, event).flatMap((key) => {
    const field = fields[key];
    return field === undefined ? [] : [field];
  });

/**
 * The fields a row shows even when empty, so a trigger always reads "in any
 * repository · by anyone" rather than nothing at all.
 */
export const primaryFields = (
  type: string,
  event: string | undefined,
): ReadonlyArray<ConditionField> => {
  const all = conditionFields(type, event);
  const primary = all.slice(0, 2);
  const reactions = all.find((field) => field.key === "reactions");
  return reactions === undefined || primary.includes(reactions)
    ? primary
    : [...primary, reactions];
};

const plural = (noun: string) => {
  if (/[^aeiou]y$/.test(noun)) return `${noun.slice(0, -1)}ies`;
  if (/(s|x|ch|sh)$/.test(noun)) return `${noun}es`;
  return `${noun}s`;
};

export const conditionPlural = (label: string) => plural(label);

const anyoneFields = ["users", "authors", "actors"];

/** What a chip reads for the values chosen: "anyone", "acme/web", "3 labels". */
export const conditionSummary = (
  field: ConditionField,
  values: ReadonlyArray<string>,
  label: (value: string) => string = (value) => value,
): string => {
  if (values.length === 0)
    return anyoneFields.includes(field.key) ? "anyone" : `any ${field.label}`;
  if (values.length <= 2) return values.map(label).join(", ");
  return `${values.length} ${plural(field.label)}`;
};

export const conditionSearchLabel = (field: ConditionField) =>
  `Search or add ${field.label}`;

/** The event a webhook's conditions narrow, which Capy calls a request. */
export const patternSubject = (type: string) =>
  type === "slack" ? "message" : "body";

/** Every condition on a trigger, as field/value pairs, in field order. */
export const conditionEntries = (
  conditions: Readonly<Record<string, ReadonlyArray<string>>>,
) => Object.entries(conditions).flatMap(([key, values]) => ({ key, values }));

/** A member of the org the authors chip can suggest, by GitHub login. */
export const memberLogins = (
  value: unknown,
): ReadonlyArray<ConditionOption> => {
  const rows = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null
      ? ((value as { members?: unknown }).members ?? [])
      : [];
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (typeof row !== "object" || row === null) return [];
    const entry = row as {
      githubLogin?: unknown;
      name?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      email?: unknown;
    };
    const login =
      typeof entry.githubLogin === "string" ? entry.githubLogin.trim() : "";
    if (login === "") return [];
    const full = [entry.firstName, entry.lastName]
      .filter((part): part is string => typeof part === "string")
      .join(" ")
      .trim();
    const name = typeof entry.name === "string" ? entry.name : full;
    const email = typeof entry.email === "string" ? entry.email : "";
    return [{ value: login, label: name === "" ? email || login : name }];
  });
};
