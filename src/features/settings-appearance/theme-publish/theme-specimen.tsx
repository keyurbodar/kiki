import type { ReactNode } from "react";
import type { Palette } from "../model/palette";
import { ThemePreview } from "../theme-preview";

const cx = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

const LIFT =
  "transition-transform duration-150 ease-out group-hover:-translate-y-1 motion-reduce:transition-none";

/** Capy's specimen frame: a 16:10 tile, the wallpaper behind when there is one. */
export const specimenFrameClass = (wallpaper: boolean) =>
  wallpaper
    ? "aspect-[16/10]"
    : "flex aspect-[16/10] items-end justify-center px-[8%] pt-[8%]";

export function SpecimenFrame({
  image,
  className,
  children,
}: {
  image?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx(
        "relative isolate overflow-hidden rounded-(--radius-panel) border-[length:--spacing(0.125)] border-border-1 bg-secondary [&>:not(img)]:relative",
        className,
      )}
    >
      {image !== undefined && (
        <img
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {children}
    </div>
  );
}

function SpecimenWindow({
  palette,
  dark,
  className,
}: {
  palette: Palette;
  dark: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "relative aspect-video w-full overflow-hidden rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-1",
        className,
      )}
    >
      <span className="absolute inset-0 flex">
        <ThemePreview
          source={{ kind: "palette", palette }}
          side={dark ? "dark" : "light"}
        />
      </span>
    </div>
  );
}

/** The app window drawn in a theme's palette, docked to the frame's bottom or floating over a wallpaper. */
export function ThemeSpecimen({
  palette,
  dark,
  wallpaper,
  lift = false,
}: {
  palette: Palette;
  dark: boolean;
  wallpaper: boolean;
  lift?: boolean;
}) {
  if (wallpaper)
    return (
      <div className="size-full">
        <div
          className={cx(
            "absolute right-[5%] bottom-[6%] w-[40%]",
            lift && LIFT,
          )}
        >
          <SpecimenWindow
            palette={palette}
            dark={dark}
            className="shadow-overlay"
          />
        </div>
      </div>
    );
  return (
    <SpecimenWindow
      palette={palette}
      dark={dark}
      className={cx("rounded-b-none border-b-0 shadow-overlay", lift && LIFT)}
    />
  );
}
