import { captainAvatarBackgrounds } from "@/tokens/captain-avatar";

export { captainAvatarBackgrounds };

export type CaptainAvatarValue = {
  readonly kind: "preset" | "emoji";
  readonly value: string;
  readonly background: string;
  readonly image?: string;
  readonly library?: string;
};

export const captainAvatarPresets = [
  "capy-avatar-1",
  "capy-avatar-2",
  "capy-avatar-3",
  "capy-avatar-5",
  "capy-avatar-6",
  "capy-avatar-7",
  "capy-avatar-8",
] as const;

export const defaultCaptainName = "Captain";

export const captainLibraryLimit = 48;

export const sharedImageTypes = ["image/png", "image/webp"] as const;

export const sharedImageMaxBytes = 5 * 1024 * 1024;

export const captainPresetSrc = (preset: string) => `/avatars/${preset}.png`;

export function randomCaptainAvatar(random = Math.random): CaptainAvatarValue {
  const backgrounds = captainAvatarBackgrounds.slice(1);
  return {
    kind: "preset",
    value: captainAvatarPresets[
      Math.floor(random() * captainAvatarPresets.length)
    ] as string,
    background: (
      backgrounds[Math.floor(random() * backgrounds.length)] ??
      captainAvatarBackgrounds[0]
    ).value,
  };
}

export const isPaletteBackground = (background: string) =>
  captainAvatarBackgrounds.some(
    (color) => color.value.toLowerCase() === background.toLowerCase(),
  );

/** A private picture is an uploaded image that is not in the shared library. */
export const hasPrivateImage = (avatar: CaptainAvatarValue) =>
  avatar.image !== undefined && avatar.library === undefined;

export const withoutImage = (
  avatar: CaptainAvatarValue,
): CaptainAvatarValue => ({
  kind: avatar.kind,
  value: avatar.value,
  background: avatar.background,
});

export function sameAvatar(a: CaptainAvatarValue, b: CaptainAvatarValue) {
  return (
    a.kind === b.kind &&
    a.value === b.value &&
    a.background === b.background &&
    a.image === b.image &&
    a.library === b.library
  );
}
