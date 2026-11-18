import { cva, type VariantProps } from "class-variance-authority";
import BACKGROUNDS from "./backgrounds.json";

const presetFiles = import.meta.glob<string>(
  "../../assets/brand/avatars/capy-avatar-*.png",
  { eager: true, query: "?url", import: "default" },
);

/** Capy's Captain avatar presets, in Capy's order (there is no capy-avatar-4). */
export const CAPTAIN_AVATARS = [
  "capy-avatar-1",
  "capy-avatar-2",
  "capy-avatar-3",
  "capy-avatar-5",
  "capy-avatar-6",
  "capy-avatar-7",
  "capy-avatar-8",
] as const;
export type CaptainAvatarPreset = (typeof CAPTAIN_AVATARS)[number];

/**
 * Capy's named background colours. These are stored data (the avatar's
 * `background` field holds the value), so they live in JSON, not tokens.
 */
export const CAPTAIN_AVATAR_BACKGROUNDS: ReadonlyArray<{
  label: string;
  value: string;
}> = BACKGROUNDS;

export type CaptainAvatarValue = {
  kind: "preset" | "emoji";
  /** A preset id for `preset`, the emoji itself for `emoji`. */
  value: string;
  /** Any CSS colour; normally one of CAPTAIN_AVATAR_BACKGROUNDS. */
  background: string;
  /** An uploaded image; wins over `value`. */
  image?: string;
};

/** URL of a preset's image (Capy serves them at /avatars/<id>.png). */
export function captainAvatarUrl(preset: string): string {
  return presetFiles[`../../assets/brand/avatars/${preset}.png`] ?? "";
}

/** Capy's deterministic preset for a seed string (sum of char codes mod the preset count). */
export function captainAvatarForSeed(seed: string): string {
  const sum = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
  return captainAvatarUrl(CAPTAIN_AVATARS[sum % CAPTAIN_AVATARS.length] ?? "");
}

const pick = <T,>(items: ReadonlyArray<T>, random: () => number): T =>
  items[Math.floor(random() * items.length)] as T;

/** The avatar a Captain starts with: capy-avatar-1 on the "None" background. */
export const DEFAULT_CAPTAIN_AVATAR: CaptainAvatarValue = {
  kind: "preset",
  value: CAPTAIN_AVATARS[0],
  background: CAPTAIN_AVATAR_BACKGROUNDS[0]?.value ?? "",
};

/** A new Captain's avatar: a random preset on a random palette colour, "None" excluded. */
export function randomCaptainAvatar(
  random: () => number = Math.random,
): CaptainAvatarValue {
  return {
    kind: "preset",
    value: pick(CAPTAIN_AVATARS, random),
    background: pick(CAPTAIN_AVATAR_BACKGROUNDS.slice(1), random).value,
  };
}

export const captainAvatarVariants = cva(
  "flex shrink-0 items-center justify-center overflow-hidden leading-none",
  {
    variants: {
      size: {
        "2xs": "size-2.5 rounded-(--radius-inner) text-plan-chip",
        compact: "size-5 rounded-(--radius-inner) text-xs",
        xs: "size-4 rounded-(--radius-inner) text-2xs",
        sm: "size-6 rounded-(--radius-inner) text-xs",
        base: "size-8 rounded-(--radius-sm) text-sm",
        xl: "size-12 rounded-(--radius-sm) text-2xl",
        "2xl": "size-20 rounded-(--radius-sm) text-4xl",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

export type CaptainAvatarProps = VariantProps<typeof captainAvatarVariants> & {
  avatar: CaptainAvatarValue;
  /** The Captain's name, read out as the image label. */
  name: string;
  className?: string;
};

export function CaptainAvatar({
  avatar,
  name,
  size,
  className,
}: CaptainAvatarProps) {
  const src =
    avatar.image ??
    (avatar.kind === "preset" ? captainAvatarUrl(avatar.value) : undefined);
  return (
    <span
      role="img"
      aria-label={name}
      data-slot="captain-avatar"
      data-size={size ?? "sm"}
      className={captainAvatarVariants({ size, className })}
      style={{ background: avatar.background }}
    >
      {src === undefined ? (
        avatar.value
      ) : (
        <img
          src={src}
          alt=""
          draggable={false}
          className="size-full object-cover select-none"
        />
      )}
    </span>
  );
}
