export type PushSupport = "supported" | "install" | "unsupported";

export function pushSupport(): PushSupport {
  if (
    typeof window === "undefined" ||
    (window as { capyDesktop?: unknown }).capyDesktop !== undefined
  )
    return "unsupported";
  if ("serviceWorker" in navigator && "PushManager" in window)
    return "supported";
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  return ios && !standalone ? "install" : "unsupported";
}

export function pushDeviceLabel(
  userAgent: string,
  maxTouchPoints: number,
): string {
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Browser";
  const os = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent) ||
        (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android"
        : /Macintosh/.test(userAgent)
          ? "Mac"
          : /Windows/.test(userAgent)
            ? "Windows"
            : /Linux/.test(userAgent)
              ? "Linux"
              : "this device";
  return `${browser} on ${os}`;
}

export const currentPushDeviceLabel = () =>
  pushDeviceLabel(navigator.userAgent, navigator.maxTouchPoints);

export async function unsubscribeBrowserPush() {
  if (pushSupport() !== "supported") return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  await subscription?.unsubscribe();
}
