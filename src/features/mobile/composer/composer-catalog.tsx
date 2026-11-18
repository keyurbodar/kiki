import type {
  ComposerCommand,
  ComposerMentionKind,
  MentionSource,
} from "@/components/composer";
import {
  type ComposerCommandId,
  composerCommands as sharedComposerCommands,
} from "@/features/composer/composer-commands";
import { MobileIcon } from "../thread/mobile-icon";

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

/** The phone's `/` menu, from the commands every surface shares. */
export const composerCommands = (
  onRun: (command: ComposerCommandId) => void,
): ComposerCommand[] =>
  sharedComposerCommands({ newThread: () => onRun("new") });

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
