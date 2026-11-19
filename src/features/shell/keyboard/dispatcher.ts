import {
  commandCatalog,
  type KeyEventLike,
  matchesBinding,
} from "@/features/settings/shortcuts-page/keybindings";
import { currentBindings } from "./store";

/** Return `false` to let the next scope handle the event. */
export type CommandHandler = (event: KeyboardEvent) => unknown;

export type CommandHandlers = Record<string, CommandHandler>;

export type CommandScopeOptions = {
  /** Read at event time; a scope whose guard fails is skipped. */
  when?: () => boolean;
  /**
   * Run in the capture phase, ahead of a focused widget that consumes the key
   * itself (the composer editor stops Alt+Arrow before it bubbles).
   */
  capture?: boolean;
};

type CommandScope = {
  commands: CommandHandlers;
  options: CommandScopeOptions;
};

const editableCommands = new Set(
  commandCatalog.filter((row) => row.inEditable).map((row) => row.command),
);

/** Within each list the newest scope wins, so a surface registered later outranks the shell. */
const globalScopes: CommandScope[] = [];
const captureScopes: CommandScope[] = [];

const EDITABLE_TAGS = new Set(["input", "textarea", "select"]);

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target.isContentEditable ||
    target.closest("[contenteditable=true]") !== null
  )
    return target !== document.body;
  return EDITABLE_TAGS.has(target.tagName.toLowerCase());
}

/**
 * The command this scope runs for the key, or null. A scope answers with the
 * last row it can actually run, so two contextual rows printed on one chord — a
 * menu's `a` and an issue row's `a` — do not shadow each other across scopes
 * that cannot act: whichever surface is open runs its own row.
 */
function scopeCommand(
  scope: CommandScope,
  event: KeyboardEvent,
): string | null {
  const bindings = currentBindings();
  for (let index = bindings.length - 1; index >= 0; index -= 1) {
    const binding = bindings[index];
    if (binding === undefined) continue;
    if (scope.commands[binding.command] === undefined) continue;
    if (matchesBinding(event as unknown as KeyEventLike, binding.key))
      return binding.command;
  }
  return null;
}

function runScope(scope: CommandScope, event: KeyboardEvent): boolean {
  if (scope.options.when && !scope.options.when()) return false;
  const command = scopeCommand(scope, event);
  if (command === null) return false;
  if (isEditableTarget(event.target) && !editableCommands.has(command))
    return false;
  const handler = scope.commands[command];
  if (handler === undefined) return false;
  if (handler(event) === false) return false;
  event.preventDefault();
  return true;
}

function runScopes(
  scopes: readonly CommandScope[],
  event: KeyboardEvent,
): boolean {
  for (let index = scopes.length - 1; index >= 0; index -= 1) {
    const scope = scopes[index];
    if (scope !== undefined && runScope(scope, event)) return true;
  }
  return false;
}

function dispatchCapture(event: KeyboardEvent) {
  if (isIgnored(event)) return;
  runScopes(captureScopes, event);
}

function dispatchBubble(event: KeyboardEvent) {
  if (isIgnored(event) || event.defaultPrevented) return;
  runScopes(globalScopes, event);
}

function isIgnored(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.repeat || event.isComposing) return true;
  return (
    event.target instanceof Element &&
    event.target.closest("[data-keybinding-capture]") !== null
  );
}

let listening = false;
function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("keydown", dispatchCapture, true);
  window.addEventListener("keydown", dispatchBubble);
}

/**
 * Whether a scope would handle this keydown, for widgets that consume keys
 * themselves and have to ask before doing so.
 */
export function hasCommandForKeyDown(event: KeyboardEvent): boolean {
  const scopes = [...globalScopes, ...captureScopes];
  return scopes.some(
    (scope) =>
      (!scope.options.when || scope.options.when()) &&
      scopeCommand(scope, event) !== null,
  );
}

/**
 * Registers one surface's commands. The returned function unregisters them,
 * which every caller wires to its own unmount.
 */
export function registerCommands(
  commands: CommandHandlers,
  options: CommandScopeOptions = {},
): () => void {
  listen();
  const scope: CommandScope = { commands, options };
  const scopes = options.capture ? captureScopes : globalScopes;
  scopes.push(scope);
  return () => {
    const index = scopes.lastIndexOf(scope);
    if (index !== -1) scopes.splice(index, 1);
  };
}
