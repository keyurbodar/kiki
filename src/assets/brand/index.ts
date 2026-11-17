import appleTouchIcon from "./app/apple-touch-icon.png";
import badgeNeutralDark from "./app/badge/neutral-dark.svg";
import badgeNeutralLight from "./app/badge/neutral-light.svg";
import favicon from "./app/favicon.png";
import faviconSvg from "./app/favicon.svg";
import appIcon192 from "./app/icons/app-192.png";
import appIcon512 from "./app/icons/app-512.png";
import appIcon512Maskable from "./app/icons/app-512-maskable.png";
import appIcon from "./app-icon.png";
import capyMarkAvatar from "./avatars/capy-mark-ffffff.png";
import bite from "./illustrations/bite.svg";
import build from "./illustrations/build.svg";
import captain from "./illustrations/captain.svg";
import capySpring from "./illustrations/capy_spring.svg";
import capySleeping from "./illustrations/capy-sleeping.webp";
import detective from "./illustrations/detective.svg";
import gift from "./illustrations/gift.svg";
import hanging from "./illustrations/hanging.svg";
import peer from "./illustrations/peer.svg";
import review from "./illustrations/review.svg";
import sail from "./illustrations/sail.svg";
import sit from "./illustrations/sit.svg";
import sleep from "./illustrations/sleep.svg";
import wordmarkSprite from "./wordmark.svg";

export { wordmarkSprite };

/** The welcome-page app icon (Capy's /assets/app-icon.png). */
export const APP_ICON = appIcon;

/** Files Capy serves from its public root, keyed by their public path. */
export const APP_ASSETS = {
  "/favicon.svg": faviconSvg,
  "/favicon.png": favicon,
  "/apple-touch-icon.png": appleTouchIcon,
  "/icons/app-192.png": appIcon192,
  "/icons/app-512.png": appIcon512,
  "/icons/app-512-maskable.png": appIcon512Maskable,
  "/badge/neutral-light.svg": badgeNeutralLight,
  "/badge/neutral-dark.svg": badgeNeutralDark,
  "/avatars/slack/capy-mark-ffffff.png": capyMarkAvatar,
  "/capy-sleeping.webp": capySleeping,
} as const;

/** Capybara pose illustrations, keyed the way Capy's bundle keys them. */
export const CAPY_ILLUSTRATIONS = {
  bite,
  build,
  captain,
  capySpring,
  detective,
  gift,
  hanging,
  peer,
  review,
  sail,
  sit,
  sleep,
} as const;
export type CapyIllustrationName = keyof typeof CAPY_ILLUSTRATIONS;
export const CAPY_ILLUSTRATION_NAMES = Object.keys(
  CAPY_ILLUSTRATIONS,
) as CapyIllustrationName[];

export const CAPY_SLEEPING = capySleeping;

const byName = (files: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(files)
      .map(([path, url]) => [
        path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf(".")),
        url,
      ])
      .sort(([a = ""], [b = ""]) => a.localeCompare(b)),
  );

/** Onboarding and desktop-app art, keyed by file name (light/dark pairs share a stem). */
export const ONBOARDING_IMAGES: Record<string, string> = byName(
  import.meta.glob<string>("./onboarding/*.webp", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);

/** Changelog ("What's new") images, keyed by Capy's version-prefixed name. */
export const ANNOUNCEMENT_IMAGES: Record<string, string> = byName(
  import.meta.glob<string>("./announcements/*.webp", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);

/** Device frames used by the mobile/desktop previews. */
export const DEVICE_FRAMES: Record<string, string> = byName(
  import.meta.glob<string>("./devices/*.webp", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);

/** Integration setup guide screenshots (Slack, Tailscale). */
export const GUIDE_IMAGES: Record<string, string> = byName(
  import.meta.glob<string>("./guides/*.png", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);
