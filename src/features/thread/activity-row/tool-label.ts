import type { ActivityRow } from "@/data/events";

type ToolRow = Extract<typeof ActivityRow.Type, { kind: "tool" }>;
type Phase = ToolRow["phase"];

const TENSES: ReadonlyArray<readonly [string, string, string]> = [
  ["Add", "Adding", "Added"],
  ["Approve", "Approving", "Approved"],
  ["Audit", "Auditing", "Audited"],
  ["Authenticate", "Authenticating", "Authenticated"],
  ["Build", "Building", "Built"],
  ["Cancel", "Cancelling", "Cancelled"],
  ["Capture", "Capturing", "Captured"],
  ["Check", "Checking", "Checked"],
  ["Close", "Closing", "Closed"],
  ["Compile", "Compiling", "Compiled"],
  ["Confirm", "Confirming", "Confirmed"],
  ["Copy", "Copying", "Copied"],
  ["Create", "Creating", "Created"],
  ["Delete", "Deleting", "Deleted"],
  ["Download", "Downloading", "Downloaded"],
  ["Downscale", "Downscaling", "Downscaled"],
  ["Enter", "Entering", "Entered"],
  ["Fetch", "Fetching", "Fetched"],
  ["Find", "Finding", "Found"],
  ["Fix", "Fixing", "Fixed"],
  ["Format", "Formatting", "Formatted"],
  ["Forward", "Forwarding", "Forwarded"],
  ["Generate", "Generating", "Generated"],
  ["Inspect", "Inspecting", "Inspected"],
  ["Install", "Installing", "Installed"],
  ["List", "Listing", "Listed"],
  ["Load", "Loading", "Loaded"],
  ["Log", "Logging", "Logged"],
  ["Mark", "Marking", "Marked"],
  ["Merge", "Merging", "Merged"],
  ["Move", "Moving", "Moved"],
  ["Probe", "Probing", "Probed"],
  ["Publish", "Publishing", "Published"],
  ["Push", "Pushing", "Pushed"],
  ["Read", "Reading", "Read"],
  ["Record", "Recording", "Recorded"],
  ["Remove", "Removing", "Removed"],
  ["Rename", "Renaming", "Renamed"],
  ["Render", "Rendering", "Rendered"],
  ["Retag", "Retagging", "Retagged"],
  ["Retarget", "Retargeting", "Retargeted"],
  ["Run", "Running", "Ran"],
  ["Save", "Saving", "Saved"],
  ["Search", "Searching", "Searched"],
  ["Sign", "Signing", "Signed"],
  ["Size", "Sizing", "Sized"],
  ["Stage", "Staging", "Staged"],
  ["Start", "Starting", "Started"],
  ["Stop", "Stopping", "Stopped"],
  ["Sync", "Syncing", "Synced"],
  ["Test", "Testing", "Tested"],
  ["Unlock", "Unlocking", "Unlocked"],
  ["Update", "Updating", "Updated"],
  ["Upload", "Uploading", "Uploaded"],
  ["Verify", "Verifying", "Verified"],
  ["Wait", "Waiting", "Waited"],
  ["Watch", "Watching", "Watched"],
  ["Write", "Writing", "Wrote"],
];

const VERBS = new Map(
  TENSES.flatMap(([bare, present, past]) =>
    [bare, present, past].map(
      (word) => [word, { bare, present, past }] as const,
    ),
  ),
);

const GENERIC = new Set([
  "run command",
  "running command",
  "running bash command",
  "running the command",
  "executing command",
]);

const ENV_PREFIX =
  /^(?:(?:cd|export)\s+(?:"[^"]*"|'[^']*'|[^\s"';&])+\s*(?:&&|;)\s*|[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|[^\s"'])*\s+)+/;

const COMMAND_CHARS = 40;

export const ASK_LABELS = {
  waiting: "Waiting on you",
  added: "Added",
  done: "Done",
  answered: "Answered",
  expired: "Expired",
  pending: "Pending",
  sent: "Sent",
  declined: "Declined",
} as const;

export function inflect(text: string, phase: Phase, bare = false) {
  const [first = "", ...rest] = text.split(" ");
  const verb = VERBS.get(first);
  if (verb === undefined) return text;
  const head = bare
    ? verb.bare
    : phase === "failed"
      ? `Couldn't ${verb.bare.toLowerCase()}`
      : phase === "done"
        ? verb.past
        : verb.present;
  return [head, ...rest].join(" ");
}

export function byPhase(phase: Phase, present: string, past: string) {
  if (phase === "done") return past;
  if (phase !== "failed") return present;
  const [first = "", ...rest] = present.split(" ");
  const verb = VERBS.get(first);
  return verb === undefined
    ? past
    : [`Couldn't ${verb.bare.toLowerCase()}`, ...rest].join(" ");
}

export function toolDescription(
  description: string | undefined,
  command?: string,
) {
  const text = description?.trim();
  if (text === undefined || text === "") return undefined;
  const lower = text.toLowerCase();
  if (GENERIC.has(lower)) return undefined;
  if (command !== undefined && lower === command.trim().toLowerCase())
    return undefined;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export function shortenCommand(command: string) {
  const flat = command.replace(/\s+/g, " ").trim();
  const bare = flat.replace(ENV_PREFIX, "") || flat;
  return bare.length > COMMAND_CHARS
    ? `${bare.slice(0, COMMAND_CHARS - 1).trimEnd()}…`
    : bare;
}

const field = (args: unknown, key: string) => {
  if (typeof args !== "object" || args === null) return undefined;
  const value = (args as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
};

export function commandOf(row: ToolRow) {
  return field(row.args, "command") ?? field(row.call?.input, "command");
}

const numberField = (value: unknown, key: string) => {
  if (typeof value !== "object" || value === null) return undefined;
  const found = (value as Record<string, unknown>)[key];
  return typeof found === "number" && Number.isFinite(found)
    ? found
    : undefined;
};

/** The exit code a shell call settled with, when it reported one. */
export function exitCodeOf(row: ToolRow) {
  return numberField(row.result?.data, "exit_code");
}

const executionOf = (row: ToolRow) =>
  field(row.args, "execution") ?? field(row.call?.input, "execution");

export function toolLabel(row: ToolRow) {
  const phase = row.phase === "forming" ? "running" : row.phase;
  if (row.toolName === "execute")
    return byPhase(phase, "Running a script", "Ran a script");
  if (row.toolName === "end_turn")
    return byPhase(phase, "Ending the turn", "Ended the turn");
  const command = commandOf(row);
  const description = toolDescription(field(row.args, "description"), command);
  const exitCode = exitCodeOf(row);
  const failed = phase === "failed" && exitCode !== undefined && exitCode !== 0;
  const label = failed
    ? `${description === undefined ? "Command" : inflect(description, phase, true)} failed (exit ${exitCode})`
    : description !== undefined
      ? inflect(description, phase)
      : command !== undefined
        ? shortenCommand(command)
        : row.toolName;
  const execution = executionOf(row);
  return execution === "detached" || execution === "background"
    ? `${label} (${execution})`
    : label;
}
