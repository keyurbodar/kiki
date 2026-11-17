export const QUIT_THREAD_LIMIT = 5;

export type QuitThread = {
  id: string;
  title: string | null;
  sortActivityAt: Date;
  pullCount: number;
};

export type QuitView =
  | { tier: "checking" }
  | { tier: "idle" }
  | { tier: "unknown" }
  | { tier: "busy"; threads: QuitThread[] };

export type DeviceThreads =
  | { kind: "loading" }
  | { kind: "failure" }
  | { kind: "success"; threads: QuitThread[] };

export function quitView(devices: DeviceThreads[]): QuitView {
  const threads = devices
    .flatMap((device) => (device.kind === "success" ? device.threads : []))
    .toSorted(
      (a, b) => b.sortActivityAt.getTime() - a.sortActivityAt.getTime(),
    );
  if (threads.length > 0) return { tier: "busy", threads };
  if (devices.some((device) => device.kind === "failure")) {
    return { tier: "unknown" };
  }
  if (devices.every((device) => device.kind === "success")) {
    return { tier: "idle" };
  }
  return { tier: "checking" };
}

export function readQuitThreads(value: unknown): QuitThread[] {
  const list = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null && "threads" in value
      ? (value as { threads: unknown }).threads
      : [];
  if (!Array.isArray(list)) return [];
  return list.flatMap((item): QuitThread[] => {
    if (typeof item !== "object" || item === null) return [];
    const { id, title, sortActivityAt, pullCount } = item as Record<
      string,
      unknown
    >;
    if (typeof id !== "string") return [];
    const at = new Date(
      typeof sortActivityAt === "string" || typeof sortActivityAt === "number"
        ? sortActivityAt
        : Number.NaN,
    );
    return [
      {
        id,
        title: typeof title === "string" ? title : null,
        sortActivityAt: Number.isNaN(at.getTime()) ? new Date(0) : at,
        pullCount: typeof pullCount === "number" ? pullCount : 0,
      },
    ];
  });
}

export type DeviceNoun = "Mac" | "PC" | "computer";

export function deviceNoun(platform: string | undefined): DeviceNoun {
  if (platform === undefined) return "computer";
  if (platform === "darwin" || /mac/i.test(platform)) return "Mac";
  if (platform === "win32" || /win/i.test(platform)) return "PC";
  return "computer";
}

export function quitTitle(view: QuitView, noun: DeviceNoun): string {
  if (view.tier === "idle") return `Quit Capy? This ${noun} goes offline`;
  if (view.tier !== "busy") return "Quit Capy?";
  const count = view.threads.length;
  return `Quit Capy? ${count} ${count === 1 ? "thread is" : "threads are"} working on this ${noun}`;
}

export function quitDescription(view: QuitView, noun: DeviceNoun): string {
  switch (view.tier) {
    case "idle":
      return `Threads can't use this ${noun}'s folders until you open Capy again. Nothing is running here right now.`;
    case "busy":
      return `Quitting interrupts ${view.threads.length === 1 ? "it" : "them"} mid-turn. Threads show this ${noun} as unavailable until you open Capy again.`;
    case "unknown":
      return `Couldn't check what's running on this ${noun}. Quitting interrupts any thread working here mid-turn.`;
    case "checking":
      return `Checking what's running on this ${noun}`;
  }
}

export function shortAge(at: Date, now: Date): string {
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - at.getTime()) / 60_000),
  );
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
