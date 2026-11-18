import type {
  ComposerCommand,
  ComposerMentionKind,
  MentionSource,
} from "@/components/composer";
import { MobileIcon } from "../thread/mobile-icon";

/** A command the phone composer lists, from Capy's composer command menu. */
export type MobileComposerCommand = {
  id: string;
  label: string;
  icon: string;
  /** The typed form, shown on the right; commands without one open a menu. */
  slash?: string;
};

/**
 * The phone's `/` menu. Capy lists ten commands here; a row appears once kiki can
 * run it, so this list grows one implementation at a time and never ships a no-op.
 */
export const mobileComposerCommands: ReadonlyArray<MobileComposerCommand> = [
  { id: "new", label: "New thread", icon: "plus", slash: "/new" },
];

/** What @ can reference, from Capy's mention menu. */
export type MobileMentionCategory = {
  id: string;
  label: string;
  description: string;
  icon: string;
  kind: ComposerMentionKind;
};

export const mentionCategories: ReadonlyArray<MobileMentionCategory> = [
  {
    id: "people",
    label: "People",
    description: "Tag someone in the org",
    icon: "people",
    kind: "user",
  },
  {
    id: "captains",
    label: "Captains",
    description: "Hand work to a Captain and its crew",
    icon: "crown",
    kind: "captain",
  },
  {
    id: "threads",
    label: "Threads",
    description: "Reference another thread",
    icon: "thread",
    kind: "thread",
  },
  {
    id: "pulls",
    label: "Pull requests",
    description: "Open and recent pull requests",
    icon: "pull-request",
    kind: "pull",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Skills available to the agent",
    icon: "sparkle",
    kind: "skill",
  },
  {
    id: "plugins",
    label: "Plugins",
    description: "Plugins available to the agent",
    icon: "plugin-1",
    kind: "plugin",
  },
  {
    id: "subagents",
    label: "Subagents",
    description: "Agents this thread spawns",
    icon: "subagents",
    kind: "subagent",
  },
  {
    id: "devices",
    label: "Devices",
    description: "Paired computers Capy can use",
    icon: "devices",
    kind: "device",
  },
  {
    id: "files",
    label: "Files",
    description: "Files and folders on the device",
    icon: "files",
    kind: "file",
  },
];

/** The phone's `/` menu, as the shared Composer's command list. */
export const composerCommands = (
  onRun: (command: MobileComposerCommand) => void,
): ComposerCommand[] =>
  mobileComposerCommands.map((command) => ({
    kind: "action",
    name: command.slash?.slice(1) ?? command.id,
    label: command.label,
    icon: <MobileIcon name={command.icon} />,
    run: () => onRun(command),
  }));

/** The phone's `@` menu, as the shared Composer's mention sources. */
export const mentionSources = (): MentionSource[] =>
  mentionCategories.map((category) => ({
    category: category.id,
    kind: category.kind,
    label: category.label,
    description: category.description,
    icon: () => <MobileIcon name={category.icon} />,
    search: () => [],
  }));
