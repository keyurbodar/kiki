import { Effect, Schema, SchemaTransformation } from "effect";
import { KeyValueStore } from "effect/persistence";
import { Atom } from "effect/reactivity";
import type { DeviceCompletionKind } from "../notification-filter-rows/notification-kinds";
import { isOriginOnByDefault } from "../notification-filter-rows/notification-kinds";

export const completionSounds = [
  "chime",
  "twinkle",
  "droplet",
  "bloom",
  "trio",
  "chirp",
  "swell",
  "knock",
  "custom",
  "none",
] as const;

export type CompletionSound = (typeof completionSounds)[number];

export const completionSoundLabels: Record<CompletionSound, string> = {
  chime: "Chime",
  twinkle: "Twinkle",
  droplet: "Droplet",
  bloom: "Bloom",
  trio: "Trio",
  chirp: "Chirp",
  swell: "Swell",
  knock: "Knock",
  custom: "Custom",
  none: "None",
};

export const isCompletionSound = (value: string): value is CompletionSound =>
  (completionSounds as readonly string[]).includes(value);

const CompletionSoundSchema = Schema.String.pipe(
  Schema.decodeTo(
    Schema.Literals(completionSounds),
    SchemaTransformation.transform<CompletionSound, string>({
      decode: (value: string): CompletionSound =>
        isCompletionSound(value) ? value : "none",
      encode: (value: CompletionSound) => value,
    }),
  ),
);

export const NotificationPrefs = Schema.Struct({
  desktop: Schema.Boolean,
  asked: Schema.Boolean.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(false)),
  ),
  sound: CompletionSoundSchema,
  mention: Schema.Boolean.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(true)),
  ),
  error: Schema.Boolean.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(true)),
  ),
  origins: Schema.Record(Schema.String, Schema.Boolean).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed({})),
  ),
});

export type NotificationPrefs = typeof NotificationPrefs.Type;

export const defaultNotificationPrefs = (): NotificationPrefs => ({
  desktop: true,
  asked: false,
  sound: "none",
  mention: true,
  error: true,
  origins: {},
});

const localStorageRuntime = Atom.runtime(
  KeyValueStore.layerStorage(() => globalThis.localStorage),
);

export const notificationPrefsAtom = Atom.kvs({
  runtime: localStorageRuntime,
  key: "capy-web:notification-prefs",
  schema: NotificationPrefs,
  defaultValue: defaultNotificationPrefs,
});

export const isKindEnabled = (
  prefs: NotificationPrefs,
  kind: DeviceCompletionKind,
) => prefs[kind] === true;

export const isOriginEnabled = (prefs: NotificationPrefs, origin: string) =>
  prefs.origins[origin] ?? isOriginOnByDefault(origin);

export const customSoundMaxBytes = 2 * 1024 * 1024;

const soundKey = "capy-web:notification-sound";
const soundDatabase = "capy-web-notifications";
const soundStore = "sound";

const openSoundDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(soundDatabase, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(soundStore);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open storage"));
  });

export async function saveCustomSound(sound: Blob | null) {
  const db = await openSoundDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(soundStore, "readwrite");
    const store = transaction.objectStore(soundStore);
    if (sound === null) store.delete(soundKey);
    else store.put(sound, soundKey);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Could not save the sound"));
  });
  db.close();
}

export async function readCustomSound() {
  const db = await openSoundDatabase();
  const value = await new Promise<unknown>((resolve, reject) => {
    const request = db
      .transaction(soundStore, "readonly")
      .objectStore(soundStore)
      .get(soundKey);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not read the sound"));
  });
  db.close();
  return value instanceof Blob ? value : null;
}

export const customSoundName = (sound: Blob) =>
  sound instanceof File ? sound.name : "Custom sound";

let playing: HTMLAudioElement | null = null;

export async function playCompletionSound(sound: CompletionSound) {
  if (sound === "none") return;
  const blob = sound === "custom" ? await readCustomSound() : null;
  if (sound === "custom" && blob === null) return;
  const url =
    blob === null ? `/sounds/cuelume/${sound}.wav` : URL.createObjectURL(blob);
  playing?.pause();
  const audio = new Audio(url);
  playing = audio;
  audio.volume = 0.8;
  const release = () => {
    if (playing === audio) playing = null;
    if (blob !== null) URL.revokeObjectURL(url);
  };
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("error", release, { once: true });
  audio.addEventListener("pause", release, { once: true });
  await audio.play().catch(release);
}

export type DesktopNotificationAccess =
  | "unknown"
  | "granted"
  | "denied"
  | "not-determined"
  | "alerts-off";

type CapyDesktopNotifications = {
  access?: () => Promise<DesktopNotificationAccess>;
  requestAccess?: () => Promise<DesktopNotificationAccess>;
  openSettings?: () => void;
  show: (notification: { title: string; body: string; href: string }) => void;
};

export const desktopNotifications = (): CapyDesktopNotifications | undefined =>
  (
    globalThis as {
      capyDesktop?: { notifications?: CapyDesktopNotifications };
    }
  ).capyDesktop?.notifications;

export const isDesktopApp = () =>
  (globalThis as { capyDesktop?: unknown }).capyDesktop !== undefined;

export type BrowserNotificationPermission =
  | NotificationPermission
  | "unsupported";

export const browserNotificationPermission =
  (): BrowserNotificationPermission =>
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission;

export const requestBrowserNotificationPermission =
  async (): Promise<NotificationPermission> =>
    typeof Notification === "undefined"
      ? "denied"
      : Notification.permission === "default"
        ? Notification.requestPermission()
        : Notification.permission;

export type SystemNotification = {
  title: string;
  body: string;
  href: string;
  tag: string;
};

export function showSystemNotification(
  notification: SystemNotification,
  open: (href: string) => void,
): Promise<boolean> {
  const desktop = desktopNotifications();
  if (desktop !== undefined) {
    desktop.show({
      title: notification.title,
      body: notification.body,
      href: notification.href,
    });
    return Promise.resolve(true);
  }
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  )
    return Promise.resolve(false);
  return Promise.resolve()
    .then(
      () =>
        new Notification(notification.title, {
          body: notification.body,
          tag: notification.tag,
          silent: true,
        }),
    )
    .then(
      (shown) => {
        shown.onclick = () => {
          window.focus();
          open(notification.href);
          shown.close();
        };
        return true;
      },
      () =>
        ("serviceWorker" in navigator
          ? navigator.serviceWorker.getRegistration("/sw.js")
          : Promise.resolve(undefined)
        )
          .then(
            (registration) =>
              registration
                ?.showNotification(notification.title, {
                  body: notification.body,
                  tag: notification.tag,
                  data: { href: notification.href },
                  icon: "/icons/app-192.png",
                  badge: "/badge/neutral-light.svg",
                  silent: true,
                })
                .then(() => true) ?? false,
          )
          .catch(() => false),
    );
}
