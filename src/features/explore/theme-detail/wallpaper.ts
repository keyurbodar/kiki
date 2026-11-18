import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

const imageType = (bytes: Uint8Array) => {
  if (bytes[0] === 137 && bytes[1] === 80) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216) return "image/jpeg";
  if (bytes[0] === 82 && bytes[1] === 73) return "image/webp";
  if (bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70) return "image/gif";
  return "image/svg+xml";
};

/** One object URL per response, so a re-render does not mint another. */
const objectUrls = new WeakMap<Uint8Array, string>();

export const imageObjectUrl = (bytes: Uint8Array) => {
  const cached = objectUrls.get(bytes);
  if (cached !== undefined) return cached;
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: imageType(bytes) }),
  );
  objectUrls.set(bytes, url);
  return url;
};

export const wallpaperSource = (body: unknown): string | undefined => {
  if (body instanceof Uint8Array) return imageObjectUrl(body);
  if (typeof body === "string" && body !== "") return body;
  if (typeof body === "object" && body !== null && "url" in body) {
    const { url } = body as { url?: unknown };
    if (typeof url === "string" && url !== "") return url;
  }
  return undefined;
};

export const wallpaperKey = (slug: string, versionId: string | null) =>
  `${slug}@${versionId ?? ""}`;

/** A listing without a wallpaper has nothing to read, so it gets an empty atom. */
const NO_WALLPAPER = Atom.make(undefined);

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

export const wallpaperAtomFor = (
  slug: string | null,
  versionId: string | null,
) =>
  slug === null
    ? NO_WALLPAPER
    : themeWallpaperAtom(wallpaperKey(slug, versionId));
