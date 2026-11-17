import { useSyncExternalStore } from "react";

/** Capy's playback speeds, in menu order. */
export const VIDEO_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8] as const;

export type VideoSpeed = (typeof VIDEO_SPEEDS)[number];
export type VideoSpeedPreference = VideoSpeed | "auto";
export type VideoVolumeState = { level: number; muted: boolean };

export const VIDEO_SPEED_KEY = "capy-web:video-speed";
export const VIDEO_VOLUME_KEY = "capy-web:video-volume";

/** Seconds skipped by ArrowLeft/ArrowRight and J/L. */
export const SEEK_SHORT = 5;
export const SEEK_LONG = 10;
/** Volume change per ArrowUp/ArrowDown. */
export const VOLUME_STEP = 0.1;

const AUTO_SPEEDS: ReadonlyArray<readonly [number, VideoSpeed]> = [
  [30, 1],
  [90, 2],
  [300, 4],
];

/** Auto speed picks faster playback for longer recordings. */
export const autoSpeed = (duration: number | undefined): VideoSpeed =>
  duration === undefined
    ? 1
    : (AUTO_SPEEDS.find(([limit]) => duration <= limit)?.[1] ?? 8);

export const formatSpeed = (speed: number) => `${speed}×`;

/** m:ss from milliseconds, as Capy's media clocks show it. */
export function formatMediaTime(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Seeks to the first frame so the poster isn't blank before play. */
export const posterSrc = (src: string) => `${src}#t=0.001`;

type AudioProbe = HTMLVideoElement & {
  mozHasAudio?: boolean;
  audioTracks?: { length: number };
  webkitAudioDecodedByteCount?: number;
};

export const hasAudio = (video: HTMLVideoElement) => {
  const probe = video as AudioProbe;
  return (
    probe.mozHasAudio === true ||
    (probe.audioTracks?.length ?? 0) > 0 ||
    (probe.webkitAudioDecodedByteCount ?? 0) > 0
  );
};

export const stepSpeed = (current: number, delta: number): VideoSpeed => {
  const index = VIDEO_SPEEDS.indexOf(current as VideoSpeed);
  return VIDEO_SPEEDS[
    Math.min(VIDEO_SPEEDS.length - 1, Math.max(0, index + delta))
  ] as VideoSpeed;
};

/** Volume slider value to stored state: zero mutes and keeps the last level. */
export function volumeFromSlider(
  value: number,
  previous: number,
): VideoVolumeState {
  const level = Math.max(0, Math.min(1, Math.round(value * 100) / 100));
  return level === 0
    ? { level: previous, muted: true }
    : { level, muted: false };
}

/** Keys the player handles itself; inputs, buttons and menus keep theirs. */
export const isOwnKey = (target: EventTarget | null, key: string) =>
  target instanceof Element &&
  (((key === " " || key === "Enter") &&
    target.closest('button, a[href], [role="menuitem"]') !== null) ||
    (key.startsWith("Arrow") &&
      target.closest("[data-slot='video-volume'] input, [role='menu']") !==
        null));

export type VideoKeyAction =
  | { type: "toggle" }
  | { type: "seekBy"; seconds: number }
  | { type: "seekTo"; fraction: number }
  | { type: "speed"; delta: number }
  | { type: "mute" }
  | { type: "volume"; delta: number };

/** Capy's player shortcuts: Space/K, arrows, J/L, [ ], M and 0-9. */
export function videoKeyAction(
  key: string,
  { audio, duration }: { audio: boolean; duration: number | undefined },
): VideoKeyAction | undefined {
  const k = key.toLowerCase();
  if (k === " " || k === "k") return { type: "toggle" };
  if (k === "arrowleft") return { type: "seekBy", seconds: -SEEK_SHORT };
  if (k === "arrowright") return { type: "seekBy", seconds: SEEK_SHORT };
  if (k === "j") return { type: "seekBy", seconds: -SEEK_LONG };
  if (k === "l") return { type: "seekBy", seconds: SEEK_LONG };
  if (k === "[") return { type: "speed", delta: -1 };
  if (k === "]") return { type: "speed", delta: 1 };
  if (k === "m" && audio) return { type: "mute" };
  if (k === "arrowup" && audio) return { type: "volume", delta: 1 };
  if (k === "arrowdown" && audio) return { type: "volume", delta: -1 };
  if (/^[0-9]$/.test(k) && duration !== undefined)
    return { type: "seekTo", fraction: Number(k) / 10 };
  return undefined;
}

function store<T>(read: () => T, write?: (value: T) => void) {
  const listeners = new Set<() => void>();
  let cached = read();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return {
    get: () => cached,
    set(value: T) {
      cached = value;
      write?.(value);
      for (const listener of listeners) listener();
    },
    subscribe,
    refresh() {
      cached = read();
    },
  };
}

function readStorage<T>(
  key: string,
  parse: (value: unknown) => T | undefined,
  fallback: T,
): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return parse(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {}
}

export const parseSpeed = (value: unknown): VideoSpeedPreference | undefined =>
  value === "auto" || VIDEO_SPEEDS.includes(value as VideoSpeed)
    ? (value as VideoSpeedPreference)
    : undefined;

export const parseVolume = (value: unknown): VideoVolumeState | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const { level, muted } = value as Record<string, unknown>;
  return typeof level === "number" &&
    level >= 0 &&
    level <= 1 &&
    typeof muted === "boolean"
    ? { level, muted }
    : undefined;
};

const speedStore = store<VideoSpeedPreference>(
  () => readStorage(VIDEO_SPEED_KEY, parseSpeed, "auto"),
  (value) => writeStorage(VIDEO_SPEED_KEY, value),
);

const DEFAULT_VOLUME: VideoVolumeState = { level: 1, muted: false };

const volumeStore = store<VideoVolumeState>(
  () => readStorage(VIDEO_VOLUME_KEY, parseVolume, DEFAULT_VOLUME),
  (value) => writeStorage(VIDEO_VOLUME_KEY, value),
);

/** Where an inline player left off when it expanded into the lightbox. */
export type VideoHandoff = { src: string; time: number };
const handoffStore = store<VideoHandoff | null>(() => null);

export function resetVideoPreferences() {
  speedStore.refresh();
  volumeStore.refresh();
  handoffStore.set(null);
}

const use = <T>(s: ReturnType<typeof store<T>>, server: T) =>
  useSyncExternalStore(s.subscribe, s.get, () => server);

export const useVideoSpeed = () =>
  [use(speedStore, "auto" as VideoSpeedPreference), speedStore.set] as const;

export const useVideoVolume = () =>
  [use(volumeStore, DEFAULT_VOLUME), volumeStore.set] as const;

export const useVideoHandoff = () =>
  [use(handoffStore, null), handoffStore.set] as const;
