import type { ComposerCommand } from "@/components/composer";
import { Icon, type IconId } from "@/primitives/icon";

/**
 * What a surface can run when a `/` command is picked. A surface that leaves a
 * handler out does not list that row: Capy's thread menu holds ten commands, kiki
 * lists the ones it runs, and an absent row never claims a feature exists.
 */
export type ComposerCommandHandlers = {
  /**
   * Start a fresh new thread: leave the current thread for `/new`, or reset the
   * draft on the composer that is already starting one.
   */
  newThread: () => void;
  /** Compacts the thread's context and leaves a marker in its timeline. */
  compact?: () => void;
  /**
   * Forks the thread and opens the fork: `copy` carries the full transcript,
   * `summary` carries a written summary of it.
   */
  fork?: (mode: ForkMode) => void;
};

export type ForkMode = "copy" | "summary";

type Capability = {
  readonly name: string;
  readonly label: string;
  readonly icon: IconId;
  readonly searchTerms?: ReadonlyArray<string>;
} /** A row that types its command into the composer for the user to send. */ & (
  | { readonly text: string }
  /** A row that runs what the surface provides, or nothing when it provides none. */
  | {
      readonly run: (
        handlers: ComposerCommandHandlers,
      ) => (() => void) | undefined;
    }
);

/**
 * Capy's thread commands in Capy's order — Plan mode, Model, Reasoning, New
 * thread, Add subscriber, Compact, New side thread, Fork with full context, Fork
 * with summary, Skills — keeping only the ones kiki can run, at their own
 * position (KIKI-23 measured the order from Capy's capture).
 *
 * Left out on purpose: Model and Reasoning choose a model, which kiki displays
 * and cannot set; Add subscriber and New side thread have no endpoint in our
 * contract; Skills arrives as its own row from the composer's skills source.
 */
export const composerCommandCapabilities: ReadonlyArray<Capability> = [
  {
    name: "plan",
    label: "Plan mode",
    icon: "list-bullets",
    text: "/plan ",
    searchTerms: ["plan first", "explore", "ask questions", "approve"],
  },
  {
    name: "new",
    label: "New thread",
    icon: "plus-medium",
    run: (handlers) => handlers.newThread,
  },
  {
    name: "compact",
    label: "Compact",
    icon: "minimize-45",
    run: (handlers) => handlers.compact,
  },
  {
    name: "fork",
    label: "Fork with full context",
    icon: "branch",
    searchTerms: ["copy", "duplicate"],
    run: (handlers) =>
      handlers.fork === undefined ? undefined : () => handlers.fork?.("copy"),
  },
  {
    name: "fork-summary",
    label: "Fork with summary",
    icon: "branch-simple",
    searchTerms: ["summary", "fork"],
    run: (handlers) =>
      handlers.fork === undefined
        ? undefined
        : () => handlers.fork?.("summary"),
  },
];

/** The typed form of a command, which is also what a surface reports back. */
export type ComposerCommandId =
  (typeof composerCommandCapabilities)[number]["name"];

/** The `/` menu for one surface, from the commands it can actually run. */
export const composerCommands = (
  handlers: ComposerCommandHandlers,
): ComposerCommand[] => {
  const commands: ComposerCommand[] = [];
  for (const capability of composerCommandCapabilities) {
    const icon = <Icon name={capability.icon} size="sm" />;
    const searchTerms = capability.searchTerms?.slice() ?? [];
    if ("text" in capability) {
      commands.push({
        kind: "insert",
        name: capability.name,
        label: capability.label,
        icon,
        searchTerms,
        text: capability.text,
      });
      continue;
    }
    const run = capability.run(handlers);
    if (run === undefined) continue;
    commands.push({
      kind: "action",
      name: capability.name,
      label: capability.label,
      icon,
      searchTerms,
      run,
    });
  }
  return commands;
};
