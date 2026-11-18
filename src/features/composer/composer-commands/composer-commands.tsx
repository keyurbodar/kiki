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
};

type Capability = {
  /** The typed form, without the slash. */
  name: string;
  label: string;
  icon: IconId;
  handler: keyof ComposerCommandHandlers;
};

/**
 * Capy's thread commands in Capy's order — Plan mode, Model, Reasoning, New
 * thread, Add subscriber, Compact, New side thread, Fork with full context, Fork
 * with summary, Skills — keeping only the ones kiki can run, at their own
 * position (KIKI-23 measured the order from Capy's capture).
 */
export const composerCommandCapabilities = [
  {
    name: "new",
    label: "New thread",
    icon: "plus-medium",
    handler: "newThread",
  },
] as const satisfies readonly Capability[];

/** The typed form of a command, which is also what a surface reports back. */
export type ComposerCommandId =
  (typeof composerCommandCapabilities)[number]["name"];

/** The `/` menu for one surface, from the commands it can actually run. */
export const composerCommands = (
  handlers: ComposerCommandHandlers,
): ComposerCommand[] => {
  const commands: ComposerCommand[] = [];
  for (const capability of composerCommandCapabilities) {
    const run = handlers[capability.handler];
    if (run === undefined) continue;
    commands.push({
      kind: "action",
      name: capability.name,
      label: capability.label,
      icon: <Icon name={capability.icon} size="sm" />,
      run,
    });
  }
  return commands;
};
