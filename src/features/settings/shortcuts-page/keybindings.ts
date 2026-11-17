export type KeybindingCommand = {
  command: string;
  label: string;
  defaults: readonly string[];
  contextual?: boolean;
};

export type KeybindOverrides = Record<string, string[] | null>;

export const commandCatalog: ReadonlyArray<KeybindingCommand> = [
  {
    command: "commandMenu.toggle",
    label: "Open command menu",
    defaults: ["mod+k"],
  },
  { command: "sidebar.toggle", label: "Toggle sidebar", defaults: ["mod+b"] },
  {
    command: "sidebar.mode",
    label: "Switch Captains and Threads",
    defaults: ["alt+s"],
    contextual: true,
  },
  {
    command: "pane.toggle",
    label: "Toggle right pane",
    defaults: ["mod+shift+b"],
  },
  {
    command: "pane.fullscreen",
    label: "Toggle pane full screen",
    defaults: ["ctrl+shift+f"],
    contextual: true,
  },
  {
    command: "thread.stop",
    label: "Stop run",
    defaults: ["mod+."],
    contextual: true,
  },
  {
    command: "composer.attach",
    label: "Upload attachment",
    defaults: ["mod+/"],
    contextual: true,
  },
  {
    command: "composer.voice",
    label: "Voice input",
    defaults: ["alt+m"],
    contextual: true,
  },
  { command: "thread.new", label: "New thread", defaults: ["mod+shift+o"] },
  { command: "settings.open", label: "Open settings", defaults: ["mod+,"] },
  { command: "browser.open", label: "Open browser", defaults: ["mod+shift+l"] },
  { command: "diffs.open", label: "Open diffs", defaults: ["mod+shift+g"] },
  {
    command: "sideThread.new",
    label: "New side thread",
    defaults: ["mod+shift+s"],
    contextual: true,
  },
  {
    command: "composer.focus",
    label: "Focus composer",
    defaults: ["mod+i"],
    contextual: true,
  },
  {
    command: "selection.comment",
    label: "Comment on selected text",
    defaults: ["mod+shift+m"],
    contextual: true,
  },
  {
    command: "request.allow",
    label: "Allow request",
    defaults: ["mod+enter"],
    contextual: true,
  },
  {
    command: "request.submit",
    label: "Submit request",
    defaults: ["mod+enter"],
    contextual: true,
  },
  { command: "shell.focus", label: "Focus terminal", defaults: [] },
  { command: "shell.new", label: "New terminal", defaults: [] },
  {
    command: "shell.find",
    label: "Find in terminal",
    defaults: ["mod+f"],
    contextual: true,
  },
  { command: "editor.open", label: "Open in editor", defaults: ["mod+o"] },
  {
    command: "preview.copy",
    label: "Copy preview image",
    defaults: ["mod+c"],
    contextual: true,
  },
  {
    command: "preview.download",
    label: "Download preview image",
    defaults: ["mod+s"],
    contextual: true,
  },
  {
    command: "media.sendComments",
    label: "Send media comments",
    defaults: ["mod+enter"],
    contextual: true,
  },
  {
    command: "file.save",
    label: "Save file",
    defaults: ["mod+s"],
    contextual: true,
  },
  { command: "files.search", label: "Search files", defaults: ["mod+p"] },
  {
    command: "pull.copyLink",
    label: "Copy pull request link",
    defaults: ["mod+shift+,"],
  },
  {
    command: "pullTab.overview",
    label: "Show pull request overview",
    defaults: ["mod+alt+1"],
    contextual: true,
  },
  {
    command: "pullTab.guide",
    label: "Show pull request guide",
    defaults: ["mod+alt+2"],
    contextual: true,
  },
  {
    command: "pullTab.diff",
    label: "Show pull request diff",
    defaults: ["mod+alt+3"],
    contextual: true,
  },
  {
    command: "paneTab.previous",
    label: "Previous thread tab",
    defaults: ["mod+alt+shift+arrowleft"],
  },
  {
    command: "paneTab.next",
    label: "Next thread tab",
    defaults: ["mod+alt+shift+arrowright"],
  },
  {
    command: "paneTab.back",
    label: "Back to opening tab",
    defaults: ["backspace"],
    contextual: true,
  },
  {
    command: "thread.previous",
    label: "Previous sidebar thread",
    defaults: ["mod+alt+arrowup"],
  },
  {
    command: "thread.next",
    label: "Next sidebar thread",
    defaults: ["mod+alt+arrowdown"],
  },
  {
    command: "thread.jump",
    label: "Jump to sidebar thread 1\u20139",
    defaults: ["alt+digit"],
    contextual: true,
  },
  {
    command: "commandMenu.actions",
    label: "Thread actions",
    defaults: ["mod+."],
    contextual: true,
  },
  {
    command: "list.next",
    label: "Next item in list",
    defaults: ["j"],
    contextual: true,
  },
  {
    command: "list.previous",
    label: "Previous item in list",
    defaults: ["k"],
    contextual: true,
  },
  {
    command: "list.check",
    label: "Select item in list",
    defaults: ["x"],
    contextual: true,
  },
  {
    command: "menu.markUnread",
    label: "Mark as unread",
    defaults: ["u"],
    contextual: true,
  },
  {
    command: "menu.archive",
    label: "Archive or unarchive",
    defaults: ["a"],
    contextual: true,
  },
  {
    command: "menu.settle",
    label: "Settle or un-settle",
    defaults: ["s"],
    contextual: true,
  },
  {
    command: "menu.delete",
    label: "Delete",
    defaults: ["d"],
    contextual: true,
  },
  {
    command: "issue.status",
    label: "Change status",
    defaults: ["s"],
    contextual: true,
  },
  {
    command: "issue.priority",
    label: "Change priority",
    defaults: ["p"],
    contextual: true,
  },
  {
    command: "issue.assignee",
    label: "Change assignees",
    defaults: ["a"],
    contextual: true,
  },
  {
    command: "issue.labels",
    label: "Change labels",
    defaults: ["l"],
    contextual: true,
  },
  {
    command: "pull.openGitHub",
    label: "Open in GitHub",
    defaults: ["o g"],
    contextual: true,
  },
  { command: "history.back", label: "Back", defaults: ["mod+["] },
  { command: "history.forward", label: "Forward", defaults: [] },
  { command: "tab.new", label: "New tab", defaults: ["mod+t"] },
  { command: "tab.close", label: "Close tab", defaults: ["mod+w"] },
  {
    command: "tab.closeOthers",
    label: "Close other tabs",
    defaults: ["mod+alt+w"],
  },
  {
    command: "tab.reopen",
    label: "Reopen closed tab",
    defaults: ["mod+shift+t"],
  },
  { command: "tab.pin", label: "Pin tab", defaults: ["ctrl+shift+p"] },
  {
    command: "tab.copyUrl",
    label: "Copy tab URL",
    defaults: ["mod+l", "mod+shift+c"],
  },
  {
    command: "tab.next",
    label: "Next tab",
    defaults: ["ctrl+tab", "mod+alt+arrowright"],
  },
  {
    command: "tab.previous",
    label: "Previous tab",
    defaults: ["ctrl+shift+tab", "mod+alt+arrowleft"],
  },
  {
    command: "tab.select",
    label: "Jump to tab 1\u20139",
    defaults: ["mod+digit"],
  },
];

export const commandLabels: Record<string, string> = Object.fromEntries(
  commandCatalog.map((c) => [c.command, c.label]),
);

export const desktopCommands = new Set([
  "history.back",
  "history.forward",
  "tab.new",
  "tab.close",
  "tab.closeOthers",
  "tab.reopen",
  "tab.pin",
  "tab.copyUrl",
  "tab.next",
  "tab.previous",
  "tab.select",
]);

const bareKeyCommands = new Set([
  "list.next",
  "list.previous",
  "list.check",
  "menu.markUnread",
  "menu.archive",
  "menu.settle",
  "menu.delete",
  "paneTab.back",
  "issue.status",
  "issue.priority",
  "issue.assignee",
  "issue.labels",
]);
const backspaceCommands = new Set(["paneTab.back"]);
export const sequenceCommands = new Set(["pull.openGitHub"]);
export const digitCommands = new Set(["thread.jump", "tab.select"]);
const browserReserved = new Set([
  "mod+n",
  "mod+shift+n",
  "mod+t",
  "mod+shift+t",
  "mod+w",
  "mod+shift+w",
  "mod+q",
  "mod+l",
  "mod+r",
  "mod+shift+r",
]);
const navigationKeys = new Set([
  "enter",
  " ",
  "tab",
  "escape",
  "backspace",
  "delete",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "home",
  "end",
  "pageup",
  "pagedown",
]);

const modifiers = ["mod", "ctrl", "meta", "alt", "shift"] as const;
type Modifier = (typeof modifiers)[number];
export type Chord = { key: string } & Record<Modifier, boolean>;

const keyAliases: Record<string, string> = {
  space: " ",
  plus: "+",
  esc: "escape",
};

export function parseChord(text: string): Chord | null {
  const parts = text
    .toLowerCase()
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
  const keys = parts.filter(
    (p) => !(modifiers as readonly string[]).includes(p),
  );
  const [key] = keys;
  if (key === undefined || keys.length !== 1) return null;
  return {
    key: keyAliases[key] ?? key,
    mod: parts.includes("mod"),
    ctrl: parts.includes("ctrl"),
    meta: parts.includes("meta"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
  };
}

export function parseBinding(text: string): Chord[] | null {
  const chords = text
    .trim()
    .replace(/\s*\+\s*/g, "+")
    .split(/\s+/)
    .map(parseChord);
  if (chords.length > 2 || chords.some((c) => c === null)) return null;
  return chords.filter((c): c is Chord => c !== null);
}

export function normalizeBinding(text: string): string | null {
  const chords = parseBinding(text);
  if (chords === null) return null;
  return chords
    .map((c) => {
      const key = c.key === " " ? "space" : c.key === "+" ? "plus" : c.key;
      return [...modifiers.filter((m) => c[m]), key].join("+");
    })
    .join(" ");
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return /mac|iphone|ipad|ipod/i.test(
    nav.userAgentData?.platform ?? nav.platform,
  );
}

const keyGlyphs: Record<string, string> = {
  " ": "Space",
  escape: "Esc",
  enter: "↵",
  backspace: "⌫",
  arrowup: "Up",
  arrowdown: "Down",
  arrowleft: "Left",
  arrowright: "Right",
  digit: "1–9",
};

const keyGlyph = (key: string) =>
  key.length === 1
    ? key.toUpperCase()
    : (keyGlyphs[key] ?? key.charAt(0).toUpperCase() + key.slice(1));

export function bindingGlyphs(
  binding: string,
  mac = isMacPlatform(),
): string[] | null {
  const chords = parseBinding(binding);
  if (chords === null) return null;
  return chords.flatMap((c) => {
    const meta = c.meta || (c.mod && mac);
    const ctrl = c.ctrl || (c.mod && !mac);
    const mods = mac
      ? [ctrl && "⌃", c.alt && "⌥", c.shift && "⇧", meta && "⌘"]
      : [ctrl && "Ctrl", c.alt && "Alt", c.shift && "Shift", meta && "Meta"];
    return [
      ...mods.filter((m): m is string => typeof m === "string"),
      keyGlyph(c.key),
    ];
  });
}

export type KeyEventLike = {
  key: string;
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

const codeKeys: Record<string, string> = {
  BracketLeft: "[",
  BracketRight: "]",
  Backquote: "`",
};
const shiftedCodes: Record<string, string> = {
  Minus: "-",
  Equal: "=",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Semicolon: ";",
  Quote: "'",
  Backslash: "\\",
};

function codeKey(code: string) {
  const letter = /^Key([A-Z])$/.exec(code)?.[1];
  if (letter) return letter.toLowerCase();
  return /^Digit([0-9])$/.exec(code)?.[1] ?? codeKeys[code] ?? null;
}

export function captureBinding(
  event: KeyEventLike,
  mac = isMacPlatform(),
): string | null {
  const lower = event.key.toLowerCase();
  const deadOrAlt =
    lower === "dead" || (event.altKey && /^[^\x20-\x7e]$/u.test(lower));
  const key =
    event.code === "Backquote"
      ? "`"
      : ((deadOrAlt
          ? (codeKey(event.code) ?? shiftedCodes[event.code])
          : undefined) ??
        (event.shiftKey ? shiftedCodes[event.code] : undefined) ??
        lower);
  if (key === "meta" || key === "control" || key === "alt" || key === "shift")
    return null;
  const parts: string[] = [];
  if (mac ? event.metaKey : event.ctrlKey) parts.push("mod");
  if (mac && event.ctrlKey) parts.push("ctrl");
  if (!mac && event.metaKey) parts.push("meta");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  parts.push(key === " " ? "space" : key === "+" ? "plus" : key);
  return normalizeBinding(parts.join("+"));
}

export function captureDigitBinding(
  event: KeyEventLike,
  mac = isMacPlatform(),
): string | null {
  const binding = captureBinding(event, mac);
  if (binding === null) return null;
  const chord = parseChord(binding);
  if (!chord) return null;
  const digit =
    /^Digit([1-9])$/.exec(event.code)?.[1] ??
    (/^[1-9]$/.test(chord.key) ? chord.key : null);
  if (digit === null) return binding;
  return normalizeBinding(
    [...modifiers.filter((m) => chord[m]), "digit"].join("+"),
  );
}

export function reservedReason(
  command: string,
  binding: string,
): string | null {
  if (
    !desktopCommands.has(command) &&
    binding.split(" ").some((c) => browserReserved.has(c))
  )
    return `${binding} is reserved by the browser`;
  const chords = parseBinding(binding);
  const last = chords?.at(-1);
  if (!chords || !last) return "Invalid shortcut";
  if (chords.length > 1) {
    if (!sequenceCommands.has(command))
      return `${binding} cannot be a key sequence`;
    if (chords.some((c) => c.key === "digit"))
      return `${binding} cannot use the 1–9 number range`;
    if (chords.some((c) => navigationKeys.has(c.key)))
      return `${binding} is reserved for list and menu navigation`;
    return null;
  }
  if (digitCommands.has(command) && last.key !== "digit")
    return `${binding} needs a number key (1–9)`;
  if (!digitCommands.has(command) && last.key === "digit")
    return `${binding} cannot use the 1–9 number range`;
  const bare = !last.mod && !last.ctrl && !last.meta && !last.alt;
  if (bare && !bareKeyCommands.has(command) && !sequenceCommands.has(command))
    return `${binding} needs a modifier key`;
  if (
    bare &&
    navigationKeys.has(last.key) &&
    !(last.key === "backspace" && backspaceCommands.has(command))
  )
    return `${binding} is reserved for list and menu navigation`;
  return null;
}

export type EffectiveBinding = {
  key: string;
  command: string;
  contextual: boolean;
};

export function effectiveBindings(
  overrides: KeybindOverrides | undefined,
): EffectiveBinding[] {
  return commandCatalog.flatMap((c) => {
    const override = overrides?.[c.command];
    const keys =
      override === undefined
        ? c.defaults
        : override === null
          ? []
          : override.flatMap((k) => {
              const normal = normalizeBinding(k);
              return normal === null ||
                reservedReason(c.command, normal) !== null
                ? []
                : [normal];
            });
    return keys.map((key) => ({
      key,
      command: c.command,
      contextual: c.contextual === true,
    }));
  });
}

function chordVariants(chord: Chord, mac: boolean, leader?: Chord): string[] {
  const mods = [
    chord.meta || (chord.mod && mac),
    chord.ctrl || (chord.mod && !mac),
    chord.alt,
    chord.shift,
  ].join("|");
  const prefix =
    leader === undefined ? "" : `${chordVariants(leader, mac).join(",")} `;
  const keys =
    chord.key === "digit"
      ? Array.from({ length: 9 }, (_, i) => `${i + 1}`)
      : [chord.key];
  return keys.map((k) => `${prefix}${k}|${mods}`);
}

export function conflictReason(
  binding: string,
  command: string,
  bindings: EffectiveBinding[],
  mac = isMacPlatform(),
): string | null {
  const normal = normalizeBinding(binding);
  if (normal === null) return "Invalid shortcut";
  const reserved = reservedReason(command, normal);
  if (reserved !== null) return reserved;
  const chords = parseBinding(normal);
  const last = chords?.at(-1);
  if (!chords || !last) return "Invalid shortcut";
  const mine = new Set(
    chordVariants(last, mac, chords.length > 1 ? chords[0] : undefined),
  );
  const desktop = desktopCommands.has(command);
  for (const other of bindings) {
    if (
      other.command === command ||
      other.contextual ||
      desktopCommands.has(other.command) !== desktop
    )
      continue;
    const theirs = parseBinding(other.key);
    const theirLast = theirs?.at(-1);
    if (
      theirs &&
      theirLast &&
      chordVariants(
        theirLast,
        mac,
        theirs.length > 1 ? theirs[0] : undefined,
      ).some((v) => mine.has(v))
    )
      return `${normal} conflicts with ${commandLabels[other.command]}`;
  }
  return null;
}
