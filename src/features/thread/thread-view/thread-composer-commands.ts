import type { ComposerCommand } from "@/components/composer";

/**
 * Capy's thread-level `/` menu lists ten commands; kiki implements this one.
 * A command appears here when it runs, never before.
 */
export const threadComposerCommands = (
  goToNewThread: () => void,
): ComposerCommand[] => [
  { kind: "action", name: "new", label: "New thread", run: goToNewThread },
];
