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
    [bare, present, past].map((word) => [word, { bare, present, past }] as const),
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

export function inflect(text: string, phase: Phase) {
  const [first = "", ...rest] = text.split(" ");
  const verb = VERBS.get(first);
  if (verb === undefined) return text;
  const head =
    phase === "failed"
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

export function describe(description: string | undefined, command?: string) {
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

export function toolLabel(row: ToolRow) {
  const phase = row.phase === "forming" ? "running" : row.phase;
  if (row.toolName === "execute")
    return byPhase(phase, "Running a script", "Ran a script");
  const command = commandOf(row);
  const description = describe(field(row.args, "description"), command);
  if (description !== undefined) return inflect(description, phase);
  if (command !== undefined) return shortenCommand(command);
  return row.toolName;
}
