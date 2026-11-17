import { cx } from "class-variance-authority";
import {
  APP_ICON,
  CAPY_ILLUSTRATIONS,
  type CapyIllustrationName,
} from "@/assets/brand";

export type CapyIllustrationProps = {
  name: CapyIllustrationName;
  className?: string;
  alt?: string;
};

/** One of Capy's capybara pose illustrations, drawn as Capy draws them: a non-draggable img. */
export function CapyIllustration({
  name,
  className,
  alt = "",
}: CapyIllustrationProps) {
  return (
    <img
      src={CAPY_ILLUSTRATIONS[name]}
      alt={alt}
      draggable={false}
      data-slot="capy-illustration"
      data-illustration={name}
      className={cx("shrink-0 select-none", className)}
    />
  );
}

type MarkProps = { className?: string };

/** Capy's Captain glyph (captain.svg), the fallback for a Captain without an avatar. */
export const CaptainMark = ({ className }: MarkProps) => (
  <CapyIllustration name="captain" className={className} />
);

/** Capy's build glyph (build.svg). */
export const BuildMark = ({ className }: MarkProps) => (
  <CapyIllustration name="build" className={className} />
);

/** Capy's review glyph (review.svg). */
export const ReviewMark = ({ className }: MarkProps) => (
  <CapyIllustration name="review" className={className} />
);

/** The welcome-page app icon: a rounded square plate with the icon inside. */
export function AppIcon({ className }: MarkProps) {
  return (
    <div
      data-slot="app-icon"
      className={cx("size-16 rounded-[22.5%] shadow-(--sh-sheet)", className)}
    >
      <img
        src={APP_ICON}
        alt="Capy"
        draggable={false}
        className="size-16 select-none"
      />
    </div>
  );
}
