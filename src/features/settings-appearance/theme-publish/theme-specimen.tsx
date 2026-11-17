import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Palette } from "../model/palette";
import { paletteStyle } from "../model/palette";
import {
  SPECIMEN_HEIGHT,
  SPECIMEN_WIDTH,
  SpecimenApp,
} from "../theme-preview/specimen-app";

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

/**
 * The app laid out at its real size and scaled into the window, so the theme is
 * seen styling the live messages, the panel card and the sidebar rows.
 */
function SpecimenWindow({
  palette,
  dark,
  className,
}: {
  palette: Palette;
  dark: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const measure = () => setScale(element.clientWidth / SPECIMEN_WIDTH);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-color-theme="editor-preview"
      data-theme-preview={dark ? "dark" : "light"}
      style={paletteStyle(palette) as CSSProperties}
      className={cx(
        "relative aspect-video w-full overflow-hidden rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-1",
        dark && "dark",
        className,
      )}
    >
      <span
        aria-hidden
        inert
        style={{
          width: SPECIMEN_WIDTH,
          height: SPECIMEN_HEIGHT,
          transform: `scale(${scale})`,
        }}
        className="pointer-events-none absolute top-0 left-0 flex origin-top-left select-none"
      >
        <SpecimenApp />
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
