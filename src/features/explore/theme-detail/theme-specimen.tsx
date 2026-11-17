import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import {
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cx } from "./class-names";
import type { ThemePalette } from "./types";
import { themeWallpaperAtom, wallpaperKey, wallpaperSource } from "./wallpaper";

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

export const ThemePreviewSlotContext = createContext<ComponentType | null>(
  null,
);

function useStageScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const measure = () => setScale(element.clientWidth / STAGE_WIDTH);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, scale] as const;
}

export type ThemeSpecimenProps = {
  palette: ThemePalette;
  dark: boolean;
  className?: string;
};

export function ThemeSpecimen({
  palette,
  dark,
  className,
}: ThemeSpecimenProps) {
  const [ref, scale] = useStageScale();
  const Slot = useContext(ThemePreviewSlotContext);
  return (
    <div
      ref={ref}
      aria-hidden
      className={cx(
        "relative w-full overflow-hidden rounded-(--radius-card) border-(length:--border-width-hairline) border-border-1",
        className,
      )}
      style={{ aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}` }}
    >
      <div
        inert
        data-theme-preview={dark ? "dark" : "light"}
        data-color-theme="explore-preview"
        style={{
          ...palette,
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `scale(${scale})`,
        }}
        className={cx(
          dark && "dark",
          "pointer-events-none absolute top-0 left-0 origin-top-left select-none",
        )}
      >
        {scale > 0 && Slot !== null && <Slot />}
      </div>
    </div>
  );
}

export const themeStageClassName = (wallpaper: boolean) =>
  wallpaper
    ? "aspect-[16/10]"
    : "flex aspect-[16/10] items-end justify-center px-[8%] pt-[8%]";

export type ThemeStageProps = {
  wallpaper: boolean;
  palette: ThemePalette;
  dark: boolean;
  lift?: boolean;
};

export function ThemeStage({
  wallpaper,
  palette,
  dark,
  lift,
}: ThemeStageProps) {
  const liftClassName =
    lift === true &&
    "transition-transform duration-150 ease-out group-hover:-translate-y-1 motion-reduce:transition-none";
  if (wallpaper)
    return (
      <div className="size-full">
        <div
          className={cx(
            "absolute right-[5%] bottom-[6%] w-[40%]",
            liftClassName,
          )}
        >
          <ThemeSpecimen
            palette={palette}
            dark={dark}
            className="shadow-overlay"
          />
        </div>
      </div>
    );
  return (
    <ThemeSpecimen
      palette={palette}
      dark={dark}
      className={cx("rounded-b-none border-b-0 shadow-overlay", liftClassName)}
    />
  );
}

export type WallpaperFrameProps = {
  image: string | undefined;
  className?: string;
  children?: ReactNode;
};

export function WallpaperFrame({
  image,
  className,
  children,
}: WallpaperFrameProps) {
  return (
    <div
      className={cx(
        "relative isolate overflow-hidden rounded-(--radius-panel) border-(length:--border-width-hairline) border-border-1 bg-secondary [&>:not(img)]:relative",
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

export function useInView() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element === null || visible) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);
  return [ref, visible] as const;
}

export function useThemeWallpaper(slug: string, versionId: string | null) {
  const result = useAtomValue(
    themeWallpaperAtom(wallpaperKey(slug, versionId)),
  );
  return wallpaperSource(Option.getOrUndefined(AsyncResult.value(result)));
}
