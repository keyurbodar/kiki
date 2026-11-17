import type { ComponentProps } from "react";

export type VideoPlayerProps = ComponentProps<"div">;

export function VideoPlayer(props: VideoPlayerProps) {
  return <div data-slot="video-player" {...props} />;
}

export type VideoPlayerBarProps = ComponentProps<"div">;

export function VideoPlayerBar(props: VideoPlayerBarProps) {
  return <div data-slot="video-player-bar" {...props} />;
}

export type VideoVolumeProps = ComponentProps<"div">;

export function VideoVolume(props: VideoVolumeProps) {
  return <div data-slot="video-volume" {...props} />;
}
