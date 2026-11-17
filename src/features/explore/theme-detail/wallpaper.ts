import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

const imageType = (bytes: Uint8Array) => {
  if (bytes[0] === 137 && bytes[1] === 80) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216) return "image/jpeg";
  if (bytes[0] === 82 && bytes[1] === 73) return "image/webp";
  if (bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70) return "image/gif";
  return "image/svg+xml";
};

export const imageDataUrl = (bytes: Uint8Array) =>
  `data:${imageType(bytes)};base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))}`;

export const wallpaperSource = (body: unknown): string | undefined => {
  if (body instanceof Uint8Array) return imageDataUrl(body);
  if (typeof body === "string" && body !== "") return body;
  return undefined;
};

export const wallpaperKey = (slug: string, versionId: string | null) =>
  `${slug}@${versionId ?? ""}`;

export const themeWallpaperAtom = Atom.family((key: string) => {
  const at = key.lastIndexOf("@");
  const slug = key.slice(0, at);
  const versionId = key.slice(at + 1);
  return ApiClient.query("explorePublic", "wallpaperImage", {
    params: { slug },
    query: versionId === "" ? {} : { versionId },
    timeToLive: "1 hour",
  });
});
