/** Capy's project icon set, in the order the picker lays it out. */
export const projectIcons = [
  "folder-open",
  "folders",
  "folder-shared",
  "folder-upload",
  "file-text",
  "files",
  "code",
  "code-brackets",
  "console",
  "globe",
  "home",
  "star",
  "pin",
  "bell",
  "clock",
  "shield",
  "people",
  "puzzle",
  "chart-1",
  "line-chart-1",
  "key-1",
  "search-menu",
  "calendar-clock",
  "images-1",
] as const;

export type ProjectIconName = (typeof projectIcons)[number];

export const projectEmojis = [
  "🚀",
  "🌱",
  "🔭",
  "🧭",
  "🛠️",
  "🧪",
  "📦",
  "🗂️",
  "🧩",
  "🪄",
  "🌍",
  "⚡",
  "🎛️",
  "📐",
  "🕹️",
  "🧠",
  "🔧",
  "☁️",
  "🪧",
  "🎯",
  "🧱",
  "🛰️",
  "🧵",
  "🪟",
] as const;

/** Icons that are not part of the default set stay at the front of the recent list. */
export const maxRecentIcons = 21;

export const recentIcons = (
  current: string,
  history: ReadonlyArray<string>,
): ReadonlyArray<string> => {
  if (history.includes(current)) return history.slice(0, maxRecentIcons);
  return [current, ...history.filter((icon) => icon !== current)].slice(
    0,
    maxRecentIcons,
  );
};

export const randomIcon = (
  icons: ReadonlyArray<string>,
  pick: () => number = Math.random,
) => icons[Math.floor(pick() * icons.length)] ?? icons[0] ?? "";

export const randomEmoji = (
  emojis: ReadonlyArray<string>,
  pick: () => number = Math.random,
) => emojis[Math.floor(pick() * emojis.length)] ?? emojis[0] ?? "";
