/** Slash commands the composer menu lists, from Capy's composer command menu. */
export type ComposerCommand = {
  id: string;
  label: string;
  icon: string;
  /** Typed form, shown on the right; commands without one open a submenu. */
  slash?: string;
};

export const composerCommands: ReadonlyArray<ComposerCommand> = [
  { id: "plan", label: "Plan mode", icon: "plan", slash: "/plan" },
  { id: "model", label: "Model", icon: "agent" },
  { id: "reasoning", label: "Reasoning", icon: "brain" },
  { id: "fast", label: "Fast", icon: "speed-middle", slash: "/fast" },
  { id: "new", label: "New thread", icon: "plus", slash: "/new" },
  { id: "subscriber", label: "Add subscriber", icon: "bell" },
  { id: "compact", label: "Compact", icon: "minimize-45", slash: "/compact" },
  { id: "side", label: "New side thread", icon: "side-thread", slash: "/side" },
  {
    id: "fork",
    label: "Fork with full context",
    icon: "branch-simple",
    slash: "/fork",
  },
  {
    id: "fork-summary",
    label: "Fork with summary",
    icon: "branch-simple",
    slash: "/fork-summary",
  },
  { id: "skills", label: "Skills", icon: "books" },
];

/** What @ can reference, from Capy's mention menu. */
export type MentionCategory = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export const mentionCategories: ReadonlyArray<MentionCategory> = [
  {
    id: "people",
    label: "People",
    description: "Tag someone in the org",
    icon: "people",
  },
  {
    id: "captains",
    label: "Captains",
    description: "Hand work to a Captain and its crew",
    icon: "crown",
  },
  {
    id: "threads",
    label: "Threads",
    description: "Reference another thread",
    icon: "thread",
  },
  {
    id: "pulls",
    label: "Pull requests",
    description: "Open and recent pull requests",
    icon: "pull-request",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Skills available to the agent",
    icon: "sparkle",
  },
  {
    id: "plugins",
    label: "Plugins",
    description: "Plugins available to the agent",
    icon: "plugin-1",
  },
  {
    id: "subagents",
    label: "Subagents",
    description: "Agents this thread spawns",
    icon: "subagents",
  },
  {
    id: "devices",
    label: "Devices",
    description: "Paired computers Capy can use",
    icon: "devices",
  },
  {
    id: "files",
    label: "Files",
    description: "Files and folders on the device",
    icon: "files",
  },
];

export type ComposerMenuState =
  | { kind: "none" }
  | { kind: "command"; query: string }
  | { kind: "mention"; query: string; start: number };

/** Which menu the text before the caret opens: a leading "/word" or a trailing "@word". */
export function composerMenuFor(text: string): ComposerMenuState {
  const command = /^\/(\S*)$/.exec(text);
  if (command) return { kind: "command", query: command[1] ?? "" };
  const mention = /(^|\s)@(\S*)$/.exec(text);
  if (mention)
    return {
      kind: "mention",
      query: mention[2] ?? "",
      start: mention.index + (mention[1] ?? "").length,
    };
  return { kind: "none" };
}

export const filterCommands = (query: string) => {
  const needle = query.toLowerCase();
  return composerCommands.filter(
    (command) =>
      command.label.toLowerCase().includes(needle) ||
      command.id.includes(needle),
  );
};

export const filterMentions = (query: string) => {
  const needle = query.toLowerCase();
  return mentionCategories.filter((category) =>
    category.label.toLowerCase().includes(needle),
  );
};
