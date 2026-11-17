import { isoMinutesAgo, people } from "../fixtures/world.ts";

export const sampleWallpapers = [
  {
    id: "wp_sample_dunes",
    name: "Dunes",
    url: "https://static.example.com/wallpapers/dunes.png",
    thumbnailUrl: "https://static.example.com/wallpapers/dunes-thumb.png",
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
    thumbnailUrl: "https://static.example.com/wallpapers/harbor-thumb.png",
    mimeType: "image/png",
    size: 1_531_000,
    uploadedBy: people.sam.id,
    isBackground: false,
    createdAt: isoMinutesAgo(2 * 24 * 60),
  },
] as const;
