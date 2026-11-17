import { isoMinutesAgo, people } from "../fixtures/world.ts";

/** Offline thumbnails so the appearance screens render without the network. */
const gradient = (from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="160" height="90" fill="url(#g)"/></svg>`,
  )}`;

export const sampleWallpapers = [
  {
    id: "wp_sample_dunes",
    name: "Dunes",
    url: "https://static.example.com/wallpapers/dunes.png",
    thumbnailUrl: gradient("#a0522d", "#f2c48d"),
    mimeType: "image/png",
    size: 2_048_000,
    uploadedBy: people.alex.id,
    isBackground: true,
    createdAt: isoMinutesAgo(7 * 24 * 60),
  },
  {
    id: "wp_sample_harbor",
    name: "Harbor",
    url: "https://static.example.com/wallpapers/harbor.png",
    thumbnailUrl: gradient("#0f4c5c", "#5fb3a1"),
    mimeType: "image/png",
    size: 1_531_000,
    uploadedBy: people.sam.id,
    isBackground: false,
    createdAt: isoMinutesAgo(2 * 24 * 60),
  },
] as const;
