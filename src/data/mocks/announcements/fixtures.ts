import { isoMinutesAgo, orgId } from "../fixtures/world.ts";

export const sampleAnnouncements = [
  {
    id: "ann_sample_dark_mode",
    key: "dark-mode-in-settings",
    title: "Dark mode is in Settings",
    body: "Switch the app appearance from Settings → Appearance. The change syncs to your devices.",
    ctaLabel: "Open appearance",
    ctaUrl: "/settings/appearance",
    createdAt: isoMinutesAgo(6 * 24 * 60),
  },
  {
    id: "ann_sample_push",
    key: "push-notifications",
    title: "Get notified when a run finishes",
    body: "Turn on push notifications to hear about finished threads and pull request reviews.",
    ctaLabel: "Review notification settings",
    ctaUrl: "/settings/notifications",
    createdAt: isoMinutesAgo(2 * 24 * 60),
  },
  {
    id: "ann_sample_themes",
    key: "community-themes",
    title: "Explore community themes",
    body: "Browse shared themes and publish your own from Appearance.",
    ctaLabel: "Browse themes",
    ctaUrl: "/explore/themes",
    createdAt: isoMinutesAgo(8 * 60),
  },
] as const;

export const announcementOrgId = orgId;
