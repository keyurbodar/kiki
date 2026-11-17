import {
  CAPTAIN_AVATAR_BACKGROUNDS,
  CAPTAIN_AVATARS,
  CaptainAvatar,
  type CaptainAvatarProps,
} from "./captain-avatar";

const SIZES: Array<NonNullable<CaptainAvatarProps["size"]>> = [
  "2xs",
  "xs",
  "sm",
  "base",
  "xl",
  "2xl",
];
const NONE = CAPTAIN_AVATAR_BACKGROUNDS[0]?.value ?? "";
const ORANGE = CAPTAIN_AVATAR_BACKGROUNDS[6]?.value ?? "";

export function CaptainAvatarSpecimen() {
  return (
    <div
      data-specimen="captain-avatar"
      className="flex flex-col gap-8 p-8 text-foreground"
    >
      <section className="flex gap-5">
        {CAPTAIN_AVATARS.map((preset) => (
          <CaptainAvatar
            key={preset}
            name={preset}
            size="2xl"
            avatar={{ kind: "preset", value: preset, background: NONE }}
          />
        ))}
      </section>
      <section className="grid grid-cols-11 gap-4">
        {CAPTAIN_AVATARS.flatMap((preset) =>
          CAPTAIN_AVATAR_BACKGROUNDS.map(({ label, value }) => (
            <CaptainAvatar
              key={preset + label}
              name={[preset, label].join(" ")}
              size="xl"
              avatar={{ kind: "preset", value: preset, background: value }}
            />
          )),
        )}
      </section>
      <section className="flex items-end gap-4">
        {SIZES.map((size) => (
          <CaptainAvatar
            key={size}
            name={size}
            size={size}
            avatar={{
              kind: "preset",
              value: "capy-avatar-6",
              background: ORANGE,
            }}
          />
        ))}
      </section>
    </div>
  );
}
