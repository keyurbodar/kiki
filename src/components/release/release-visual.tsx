import { type CSSProperties, useEffect, useRef } from "react";
import type { ReleaseVisual as ReleaseVisualData } from "./releases";

const assets = import.meta.glob<string>("./assets/*", {
  eager: true,
  query: "?url",
  import: "default",
});

export const releaseAssetUrl = (file: string) => assets[`./assets/${file}`];

export type ReleaseArtworkProps = {
  visual: ReleaseVisualData;
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function ReleaseArtwork({
  visual,
  animate = false,
  className,
  style,
}: ReleaseArtworkProps) {
  const src = releaseAssetUrl(visual.file);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (element === null) return;
    if (animate) element.play().catch(() => {});
    else element.pause();
  }, [animate]);
  if (visual.kind === "video")
    return (
      <video
        ref={video}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className={className}
        style={style}
      />
    );
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={className}
      style={style}
    />
  );
}
