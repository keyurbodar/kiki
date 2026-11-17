import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Kbd } from "@/primitives/kbd";
import {
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  autoSpeed,
  formatMediaTime,
  formatSpeed,
  hasAudio,
  isOwnKey,
  posterSrc,
  stepSpeed,
  useVideoHandoff,
  useVideoSpeed,
  useVideoVolume,
  VIDEO_SPEEDS,
  VOLUME_STEP,
  videoKeyAction,
  volumeFromSlider,
} from "./video-player-state";

/** inline: a card under a message; overlay: floating bar in the lightbox. */
export type VideoPlayerRegister = "inline" | "overlay";

export type VideoPlayerProps = Omit<ComponentProps<"div">, "children"> & {
  src: string;
  /** Accessible name, used in every control's label ("Play {label}"). */
  label: string;
  register?: VideoPlayerRegister;
  autoPlay?: boolean;
  /** "none" drops the attribute for hosts without CORS headers. */
  crossOrigin?: "anonymous" | "use-credentials" | "none";
  /** Shows the Expand button; called after the player hands its time off. */
  onExpand?: () => void;
  onFailed?: () => void;
  videoClassName?: string;
  /** Rendered instead of the player once the video fails to load. */
  fallback?: ReactNode;
  /** Extra marks drawn on the scrub track (e.g. comment pins). */
  markers?: ReactNode;
};

const thumb = (fraction: number) =>
  `calc(${fraction} * (100% - 0.75rem) + 0.375rem)`;

const rangeInput =
  "absolute inset-0 w-full cursor-pointer opacity-0 focus-visible:outline-none disabled:cursor-default";

export type VideoTrackProps = {
  fraction: number;
  buffered?: number;
  className?: string;
  children?: ReactNode;
};

/** Scrub and volume track: buffered and played fills under a round thumb. */
export function VideoTrack({
  fraction,
  buffered,
  className,
  children,
}: VideoTrackProps) {
  return (
    <span
      className={cx(
        "relative flex h-5 min-w-0 items-center rounded-full has-[:focus-visible]:outline-ring-inset pointer-coarse:h-11",
        className,
      )}
    >
      <span className="relative h-1 w-full overflow-hidden rounded-full bg-secondary">
        {buffered === undefined ? null : (
          <span
            className="absolute inset-y-0 left-0 bg-muted-foreground-3"
            style={{ width: `${buffered * 100}%` }}
          />
        )}
        <span
          className="absolute inset-y-0 left-0 bg-foreground"
          style={{ width: `${fraction * 100}%` }}
        />
      </span>
      {children}
      <span
        className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-plate"
        style={{ left: thumb(fraction) }}
      />
    </span>
  );
}

function Tip({
  label,
  shortcut,
  trigger,
}: {
  label: string;
  shortcut?: string;
  trigger: ComponentProps<typeof TooltipTrigger>["render"];
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      <TooltipContent>
        {label}
        {shortcut === undefined ? null : <Kbd>{shortcut}</Kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

export type VideoPlayerBarProps = ComponentProps<"div">;

export function VideoPlayerBar(props: VideoPlayerBarProps) {
  return <div data-slot="video-player-bar" {...props} />;
}

export type VideoVolumeProps = ComponentProps<"div">;

export function VideoVolume(props: VideoVolumeProps) {
  return <div data-slot="video-volume" {...props} />;
}

/** Capy's shared/video-player: native <video> with a custom control bar. */
export function VideoPlayer({
  src,
  label,
  register = "inline",
  autoPlay = false,
  crossOrigin = "anonymous",
  onExpand,
  onFailed,
  videoClassName,
  className,
  fallback,
  markers,
  onKeyDown,
  ...props
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState<number>();
  const [failed, setFailed] = useState(false);
  const [speedPreference, setSpeedPreference] = useVideoSpeed();
  const [volume, setVolume] = useVideoVolume();
  const [handoff, setHandoff] = useVideoHandoff();
  const [audio, setAudio] = useState(false);
  const speed =
    speedPreference === "auto" ? autoSpeed(duration) : speedPreference;

  useEffect(() => {
    if (ref.current !== null) ref.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const video = ref.current;
    if (video === null) return;
    video.volume = volume.level;
    video.muted = volume.muted;
  }, [volume.level, volume.muted]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-probe audio whenever the source changes
  useEffect(() => {
    const video = ref.current;
    setAudio(
      video !== null &&
        video.readyState >= HTMLMediaElement.HAVE_METADATA &&
        hasAudio(video),
    );
  }, [src]);

  useEffect(() => {
    if (!autoPlay) return;
    const frame = requestAnimationFrame(() =>
      ref.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [autoPlay]);

  if (failed && fallback !== undefined) return fallback;

  const fraction =
    duration === undefined || duration === 0 ? 0 : Math.min(1, time / duration);
  const silent = !audio || volume.muted || volume.level === 0;

  const seek = (to: number) => {
    const video = ref.current;
    if (video === null || duration === undefined) return;
    video.currentTime = Math.max(0, Math.min(duration, to));
    setTime(video.currentTime);
  };
  const toggle = () => {
    const video = ref.current;
    if (video === null) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };
  const toggleMute = () =>
    setVolume({
      level: volume.level === 0 ? 1 : volume.level,
      muted: !silent,
    });
  const changeVolume = (value: number) =>
    setVolume(volumeFromSlider(value, volume.level));

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      isOwnKey(event.target, event.key)
    )
      return;
    const action = videoKeyAction(event.key, { audio, duration });
    if (action === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat && event.key === " ") return;
    if (action.type === "toggle") toggle();
    else if (action.type === "seekBy")
      seek((ref.current?.currentTime ?? time) + action.seconds);
    else if (action.type === "seekTo") seek(action.fraction * (duration ?? 0));
    else if (action.type === "speed")
      setSpeedPreference(stepSpeed(speed, action.delta));
    else if (action.type === "mute") toggleMute();
    else changeVolume((silent ? 0 : volume.level) + action.delta * VOLUME_STEP);
  };

  const now = formatMediaTime(time * 1000);
  const total = formatMediaTime((duration ?? 0) * 1000);
  const playLabel = playing ? "Pause" : "Play";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the player root carries the keyboard shortcuts, as in Capy
    <div
      data-slot="video-player"
      onKeyDown={handleKeyDown}
      className={cx(
        "flex min-w-0 flex-col",
        register === "overlay"
          ? "pointer-events-none items-center gap-3 *:pointer-events-auto"
          : "overflow-hidden rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-button shadow-plate",
        className,
      )}
      {...props}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: agent-posted recordings carry no caption track */}
      <video
        ref={ref}
        src={autoPlay ? src : posterSrc(src)}
        crossOrigin={crossOrigin === "none" ? undefined : crossOrigin}
        aria-label={label}
        tabIndex={0}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        className={cx(
          "block cursor-pointer bg-secondary outline-none focus-visible:outline-ring-inset",
          register === "overlay" && "rounded-(--radius-card)",
          videoClassName,
        )}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          setTime(event.currentTarget.currentTime);
          if (!audio && hasAudio(event.currentTarget)) setAudio(true);
        }}
        onProgress={(event) => {
          const ranges = event.currentTarget.buffered;
          setBuffered(ranges.length === 0 ? 0 : ranges.end(ranges.length - 1));
        }}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          video.playbackRate = speed;
          video.volume = volume.level;
          video.muted = volume.muted;
          if (hasAudio(video)) setAudio(true);
          if (
            register === "overlay" &&
            handoff !== null &&
            handoff.src === src
          ) {
            video.currentTime = handoff.time;
            setHandoff(null);
          }
        }}
        onDurationChange={(event) =>
          setDuration(
            Number.isFinite(event.currentTarget.duration)
              ? event.currentTarget.duration
              : undefined,
          )
        }
        onError={() => {
          setFailed(true);
          onFailed?.();
        }}
      />
      <VideoPlayerBar
        className={cx(
          "@container/player flex min-w-0 items-center gap-1.5",
          register === "overlay"
            ? "w-full max-w-xl rounded-(--radius) border-(length:--border-width-hairline) border-border-2 bg-popover px-1 py-0.5 shadow-overlay"
            : "border-t-(length:--border-width-hairline) border-border-2 px-1 py-0.5",
        )}
      >
        <Tip
          label={playLabel}
          shortcut="K"
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${playLabel} ${label}`}
              disabled={failed}
              onClick={toggle}
            >
              <Icon name={playing ? "pause" : "play"} />
            </Button>
          }
        />
        <span className="shrink-0 text-xs text-muted-foreground-1 tabular-nums">
          {now}
          <span className="text-muted-foreground-3 @max-xs/player:hidden">
            {" "}
            / {total}
          </span>
        </span>
        <VideoTrack
          fraction={fraction}
          buffered={duration ? Math.min(1, buffered / duration) : 0}
          className="flex-1"
        >
          <input
            type="range"
            aria-label={`Seek ${label}`}
            aria-valuetext={`${now} of ${total}`}
            min={0}
            max={duration ?? 0}
            step={0.1}
            value={time}
            disabled={duration === undefined}
            onChange={(event) => seek(Number(event.currentTarget.value))}
            className={rangeInput}
          />
          {markers}
        </VideoTrack>
        {audio ? (
          <VideoVolume className="flex shrink-0 items-center gap-1">
            <Tip
              label={silent ? "Unmute" : "Mute"}
              shortcut="M"
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${silent ? "Unmute" : "Mute"} ${label}`}
                  disabled={failed}
                  onClick={toggleMute}
                >
                  <Icon
                    name={
                      silent
                        ? "volume-off"
                        : volume.level < 0.5
                          ? "volume-half"
                          : "volume-full"
                    }
                  />
                </Button>
              }
            />
            <VideoTrack
              fraction={silent ? 0 : volume.level}
              className="w-16 @max-sm/player:hidden"
            >
              <input
                type="range"
                aria-label={`Volume ${label}`}
                aria-valuetext={
                  silent ? "Muted" : `${Math.round(volume.level * 100)}%`
                }
                min={0}
                max={1}
                step={0.05}
                value={silent ? 0 : volume.level}
                disabled={failed}
                onChange={(event) =>
                  changeVolume(Number(event.currentTarget.value))
                }
                className={rangeInput}
              />
            </VideoTrack>
          </VideoVolume>
        ) : null}
        <ResponsiveMenu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="xs"
                aria-label={`Playback speed, ${speedPreference === "auto" ? "auto " : ""}${formatSpeed(speed)}`}
              />
            }
          >
            <span className="tabular-nums">
              {speedPreference === "auto" ? (
                <span className="@max-sm/player:hidden">Auto </span>
              ) : null}
              {formatSpeed(speed)}
            </span>
            <Icon name="chevron-down-small" />
          </MenuTrigger>
          <MenuContent align="end" side="top" className="w-44">
            <MenuGroup>
              <MenuLabel>Speed</MenuLabel>
              <ResponsiveMenuItem onClick={() => setSpeedPreference("auto")}>
                <span className="flex-1">Auto</span>
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
                  {formatSpeed(autoSpeed(duration))}
                </span>
                {speedPreference === "auto" ? (
                  <Icon
                    name="checkmark-1"
                    className="size-(--icon-sm) shrink-0 text-foreground"
                  />
                ) : null}
              </ResponsiveMenuItem>
            </MenuGroup>
            <MenuSeparator />
            {VIDEO_SPEEDS.map((option) => (
              <ResponsiveMenuItem
                key={option}
                onClick={() => setSpeedPreference(option)}
              >
                <span className="flex-1 tabular-nums">
                  {formatSpeed(option)}
                </span>
                {speedPreference === option ? (
                  <Icon
                    name="checkmark-1"
                    className="size-(--icon-sm) shrink-0 text-foreground"
                  />
                ) : null}
              </ResponsiveMenuItem>
            ))}
          </MenuContent>
        </ResponsiveMenu>
        {onExpand === undefined ? null : (
          <Tip
            label="Expand"
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Expand ${label}`}
                onClick={() => {
                  const video = ref.current;
                  video?.pause();
                  if (video !== null)
                    setHandoff({ src, time: video.currentTime });
                  onExpand();
                }}
              >
                <Icon name="expand-45" />
              </Button>
            }
          />
        )}
      </VideoPlayerBar>
    </div>
  );
}
