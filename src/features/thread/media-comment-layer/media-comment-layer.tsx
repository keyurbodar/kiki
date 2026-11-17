import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import {
  AnnotateToggle,
  AnnotationComposer,
  AnnotationGroup,
  AnnotationHint,
  AnnotationPanel,
  AnnotationPin,
  AnnotationRegion,
  AnnotationRow,
  AnnotationSend,
} from "@/components/annotation";
import {
  blobFromThumb,
  boxFrom,
  canvasBlob,
  captionFor,
  captureFrame,
  commentMeta,
  DRAG_THRESHOLD,
  frameExcerpt,
  frameGroups,
  frameLabel,
  type MediaCommentDeliver,
  type MediaCommentDraft,
  type MediaCommentSent,
  type MediaCommentTarget,
  type MediaMark,
  markOrigin,
  mediaCommentStore,
  mediaSize,
  mentionLabel,
  noteLines,
  numberIn,
  percentOf,
  primaryColor,
  renderMarks,
  sameFrame,
  selectionFile,
  thumbnail,
} from "./media-comments";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

type Media = HTMLImageElement | HTMLVideoElement;

type LiveMark = { fileId: string; mark: MediaMark; time?: number };

type VideoState = { time: number; paused: boolean; duration: number };

const seek = (video: HTMLVideoElement, time: number) => {
  video.autoplay = false;
  video.pause();
  video.currentTime = time;
};

const editableSelector =
  "input, textarea, select, [contenteditable='true'], [contenteditable='plaintext-only']";

export type MediaCommentSessionOptions = {
  queueKey?: string;
  targets: Array<MediaCommentTarget | undefined>;
  index: number;
  onIndexChange: (index: number) => void;
  deliver?: MediaCommentDeliver;
  onSent?: () => void;
  sent?: { comments: MediaCommentSent[]; at?: number };
};

export function useMediaCommentSession({
  queueKey,
  targets,
  index,
  onIndexChange,
  deliver,
  onSent,
  sent: sentProp,
}: MediaCommentSessionOptions) {
  const queues = useSyncExternalStore(
    mediaCommentStore.subscribe,
    mediaCommentStore.get,
    mediaCommentStore.get,
  );
  const enabled = queueKey !== undefined;
  const items = useMemo(
    () => (queueKey === undefined ? [] : (queues[queueKey]?.items ?? [])),
    [queues, queueKey],
  );
  const frames = useRef(new Map<string, Promise<Blob>>());
  const [marking, setMarkingState] = useState(false);
  const dismissed = useRef<PointerEvent | null>(null);
  const [live, setLive] = useState<LiveMark | null>(null);
  const [boxOpen, setBoxOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [hovered, setHovered] = useState<string | undefined>();
  const [selected, setSelected] = useState<number | undefined>(sentProp?.at);
  const sent = sentProp?.comments ?? [];
  const sentNumber = (i: number) => sent[i]?.number ?? i + 1;
  const groups = frameGroups(items);
  const numberOf = (item: MediaCommentDraft) => numberIn(groups, item);
  const [attached, setAttached] = useState<{
    fileId: string;
    media: Media;
  } | null>(null);
  const [video, setVideo] = useState<VideoState>({
    time: 0,
    paused: true,
    duration: 0,
  });
  const resumeRef = useRef<HTMLVideoElement | null>(null);
  const target = targets[index];
  const media =
    attached !== null && attached.fileId === target?.fileId
      ? attached.media
      : null;

  const resume = () => {
    const paused = resumeRef.current;
    resumeRef.current = null;
    if (paused !== null && paused === media && paused.paused)
      paused.play().catch(() => {});
  };

  const update = (
    change: (items: MediaCommentDraft[]) => MediaCommentDraft[],
  ) => {
    if (queueKey !== undefined) mediaCommentStore.update(queueKey, change);
  };

  const reset = () => {
    setLive(null);
    setBoxOpen(false);
    setEditing(null);
  };

  useEffect(() => {
    if (!(media instanceof HTMLVideoElement)) return;
    const sync = () =>
      setVideo({
        time: media.currentTime,
        paused: media.paused,
        duration: Number.isFinite(media.duration) ? media.duration : 0,
      });
    const onPlay = () => {
      sync();
      resumeRef.current = null;
      setLive(null);
      setBoxOpen(false);
      setEditing(null);
    };
    const onSeeking = () =>
      setLive((current) =>
        current === null ||
        current.time === undefined ||
        Math.abs(current.time - media.currentTime) <= 0.05
          ? current
          : null,
      );
    const events = [
      "timeupdate",
      "pause",
      "seeked",
      "durationchange",
      "loadedmetadata",
    ];
    sync();
    for (const event of events) media.addEventListener(event, sync);
    media.addEventListener("play", onPlay);
    media.addEventListener("seeking", onSeeking);
    return () => {
      for (const event of events) media.removeEventListener(event, sync);
      media.removeEventListener("play", onPlay);
      media.removeEventListener("seeking", onSeeking);
    };
  }, [media]);

  if (live === null && (boxOpen || editing !== null)) {
    setBoxOpen(false);
    setEditing(null);
  }

  const editingItem = items.find((item) => item.id === editing);
  const editingTime = editingItem?.time;
  useEffect(() => {
    if (media instanceof HTMLVideoElement && editingTime !== undefined)
      seek(media, editingTime);
  }, [media, editingTime]);

  const selectedSent = selected === undefined ? undefined : sent[selected];
  const targetFileId = target?.fileId;
  const selectedTime =
    selectedSent === undefined || selectedSent.fileId !== targetFileId
      ? undefined
      : selectedSent.time;
  useEffect(() => {
    if (media instanceof HTMLVideoElement && selectedTime !== undefined)
      seek(media, selectedTime);
  }, [media, selectedTime]);

  const [seenFileId, setSeenFileId] = useState(targetFileId);
  if (seenFileId !== targetFileId) {
    setSeenFileId(targetFileId);
    if (live !== null && live.fileId !== targetFileId) reset();
  }

  const attach = useCallback(
    (fileId: string, element: Media | null) =>
      setAttached((current) =>
        element === null
          ? current?.fileId === fileId
            ? null
            : current
          : current?.media === element
            ? current
            : { fileId, media: element },
      ),
    [],
  );

  const sendable = queueKey !== undefined && deliver !== undefined;
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);

  const send = (mode: "send" | "insert" = "send") => {
    if (
      sendingRef.current ||
      queueKey === undefined ||
      deliver === undefined ||
      items.length === 0
    )
      return;
    sendingRef.current = true;
    setSending(true);
    const batch = items;
    const color = primaryColor(document.body);
    Promise.all(
      groups.map(async (group) => {
        const first = group[0];
        if (first === undefined) throw new Error("Empty frame group");
        const rows = group.map((item) => ({
          number: numberOf(item),
          mark: item.mark,
          note: item.note,
        }));
        const stored = await frames.current
          .get(first.id)
          ?.catch(() => undefined);
        const base = stored ?? (await blobFromThumb(first.thumb));
        const blob =
          first.unit === undefined
            ? base
            : await renderMarks(
                base,
                rows.map((row) => ({ mark: row.mark, n: row.number })),
                color,
                first.unit,
                first.width,
              );
        const id = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
        const file = selectionFile(blob, id);
        return {
          file,
          line: {
            mention: {
              kind: "excerpt" as const,
              id: `preview:${queueKey}:${id}`,
              label: mentionLabel(frameLabel(first), group.length),
              text: frameExcerpt(first, rows, file.name),
            },
            text: noteLines(rows),
          },
        };
      }),
    )
      .then(
        (prepared) =>
          deliver(
            prepared.map((entry) => entry.file),
            prepared.map((entry) => entry.line),
            mode,
          ),
        () => {
          toast.error("Could not prepare the frames");
          return false;
        },
      )
      .then((delivered) => {
        sendingRef.current = false;
        setSending(false);
        if (!delivered) return;
        update((current) => current.filter((item) => !batch.includes(item)));
        for (const item of batch) frames.current.delete(item.id);
        reset();
        resume();
        onSent?.();
      });
  };

  const setMarking = (on: boolean) => {
    setMarkingState(on);
    if (on) setHidden(false);
    else {
      reset();
      resume();
    }
  };

  const hasTarget = target !== undefined;
  const hasContent =
    items.length > 0 || sent.length > 0 || (marking && hasTarget);

  const select = (i: number) => {
    const comment = sent[i];
    if (comment === undefined) return;
    setSelected(i);
    setHidden(false);
    if (
      comment.fileId === targetFileId &&
      comment.time !== undefined &&
      media instanceof HTMLVideoElement
    )
      seek(media, comment.time);
    const next = targets.findIndex((t) => t?.fileId === comment.fileId);
    if (next !== -1 && next !== index) onIndexChange(next);
  };

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "[" || event.key === "]") {
      if (sent.length === 0) return;
      event.preventDefault();
      const count = sent.length;
      const step = event.key === "]" ? 1 : -1;
      select(
        selected === undefined
          ? step === 1
            ? 0
            : count - 1
          : (selected + step + count) % count,
      );
      return;
    }
    if (event.key.toLowerCase() !== "c") return;
    event.preventDefault();
    if (event.shiftKey) setHidden(!hidden && hasContent);
    else if (hasTarget) setMarking(!marking);
  });

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(editableSelector) !== null
      )
        return;
      onKey(event);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [enabled]);

  const current = live ?? {
    fileId: targetFileId,
    time: media instanceof HTMLVideoElement ? video.time : undefined,
  };
  const liveNumber =
    editingItem === undefined
      ? (groups.find(
          (group) =>
            group[0] !== undefined &&
            group[0].unit !== undefined &&
            sameFrame(group[0], current),
        )?.length ?? 0) + 1
      : numberOf(editingItem);

  const draw = (mark: MediaMark) => {
    if (target === undefined) return;
    setEditing(null);
    setBoxOpen(true);
    setLive({
      fileId: target.fileId,
      mark,
      time: media instanceof HTMLVideoElement ? media.currentTime : undefined,
    });
  };

  const add = (note: string) => {
    if (live === null || media === null || target === undefined) return;
    if (editing !== null) {
      update((current) =>
        current.map((item) => (item.id === editing ? { ...item, note } : item)),
      );
      reset();
      resume();
      return;
    }
    const canvas = captureFrame(media);
    const id = crypto.randomUUID();
    const size = mediaSize(media);
    update((current) => [
      ...current,
      {
        id,
        fileId: target.fileId,
        file: target.file,
        kind: target.kind,
        time: live.time,
        ...size,
        mark: live.mark,
        note,
        thumb: thumbnail(canvas),
        attachment: target.attachment,
        unit: Math.max(1, size.width / Math.max(1, media.offsetWidth)),
      },
    ]);
    const frame = canvasBlob(canvas);
    frames.current.set(id, frame);
    frame.catch(() => toast.error("Could not keep the full-size frame"));
    reset();
    resume();
  };

  const edit = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (item === undefined) return;
    const next = targets.findIndex((t) => t?.fileId === item.fileId);
    if (next === -1) return;
    if (next !== index) onIndexChange(next);
    setSeenFileId(item.fileId);
    setLive({ fileId: item.fileId, mark: item.mark, time: item.time });
    setEditing(id);
    setBoxOpen(true);
  };

  const remove = (id: string) => {
    update((current) => current.filter((item) => item.id !== id));
    frames.current.delete(id);
    if (editing === id) reset();
  };

  const copyFrame = (withMark: boolean) => {
    if (media === null) return;
    const canvas = captureFrame(
      media,
      withMark && live !== null
        ? {
            mark: live.mark,
            n: liveNumber,
            color: primaryColor(media.parentElement ?? document.body),
          }
        : undefined,
    );
    navigator.clipboard
      .write([new ClipboardItem({ "image/png": canvasBlob(canvas) })])
      .then(
        () => toast.success("Frame copied"),
        () => toast.error("Could not copy the frame"),
      );
  };

  const handleEscape = () => {
    if (boxOpen) {
      setBoxOpen(false);
      if (editing !== null) reset();
      resume();
      return true;
    }
    if (live === null) {
      if (!marking) return false;
      setMarkingState(false);
      return true;
    }
    setLive(null);
    resume();
    return true;
  };

  return {
    enabled,
    sendable,
    sending,
    send,
    items,
    target,
    media,
    video,
    marking,
    sent,
    sentNumber,
    numberOf,
    groups,
    selected,
    select,
    panelOpen: !hidden && hasContent,
    hovered,
    hover: (key: string, on: boolean) =>
      setHovered((current) =>
        on ? key : current === key ? undefined : current,
      ),
    hide: () => setHidden(true),
    dismissed,
    live,
    liveNumber,
    boxOpen,
    editing,
    editable: (fileId: string) => targets.some((t) => t?.fileId === fileId),
    attach,
    setMarking,
    pauseForMark: () => {
      if (media instanceof HTMLVideoElement && !media.paused) {
        media.pause();
        resumeRef.current = media;
      }
    },
    draw,
    closeBox: (event?: PointerEvent) => {
      dismissed.current = event ?? null;
      reset();
      resume();
    },
    add,
    edit,
    remove,
    copyFrame,
    escape: handleEscape,
  };
}

export type MediaCommentSession = ReturnType<typeof useMediaCommentSession>;

export const MediaCommentSessionContext = createContext<
  MediaCommentSession | undefined
>(undefined);

export const useMediaCommentSessionContext = () =>
  useContext(MediaCommentSessionContext);

function MarkHandle({
  x,
  y,
  round = false,
}: {
  x: string;
  y: string;
  round?: boolean;
}) {
  return (
    <span
      className={cx(
        "pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 border-(length:--annotation-stroke) border-primary bg-overlay-fg",
        round ? "rounded-full" : "rounded-(--radius-inner)",
      )}
      style={{ left: x, top: y }}
    />
  );
}

export type MediaMarkViewProps = {
  mark: MediaMark;
  n?: number;
  width: number;
  height: number;
  unit: number;
  live: boolean;
  active?: boolean;
  label?: string;
  onOpen?: () => void;
  onHover?: (hovering: boolean) => void;
  onAnchor?: (element: HTMLElement | null) => void;
  onRegion?: (element: HTMLSpanElement | null) => void;
};

export function MediaMarkView({
  mark,
  n,
  width,
  height,
  unit,
  live,
  active = false,
  label = "Edit comment",
  onOpen,
  onHover,
  onAnchor,
  onRegion,
}: MediaMarkViewProps) {
  const px = (value: number) => percentOf(value, width);
  const py = (value: number) => percentOf(value, height);
  const [ox, oy] = markOrigin(mark);
  const pin =
    n === undefined ? null : (
      <AnnotationPin
        ref={onAnchor}
        n={n}
        x={px(ox)}
        y={py(oy)}
        active={active || live}
        label={label}
        onOpen={onOpen}
        onHover={onHover}
      />
    );
  if (mark.kind === "box") {
    const corners: Array<[number, number]> = [
      [mark.x, mark.y],
      [mark.x + mark.w, mark.y],
      [mark.x, mark.y + mark.h],
      [mark.x + mark.w, mark.y + mark.h],
    ];
    return (
      <>
        <AnnotationRegion
          ref={onRegion}
          active={active}
          style={{
            left: px(mark.x),
            top: py(mark.y),
            width: px(mark.w),
            height: py(mark.h),
          }}
        />
        {live
          ? corners.map(([x, y]) => (
              <MarkHandle key={`${x}:${y}`} x={px(x)} y={py(y)} />
            ))
          : null}
        {pin}
      </>
    );
  }
  if (mark.kind === "arrow") {
    const angle = Math.atan2(mark.y2 - mark.y1, mark.x2 - mark.x1);
    const head = 12 * unit;
    const tip = (offset: number) =>
      `${mark.x2 - head * Math.cos(angle + offset)},${mark.y2 - head * Math.sin(angle + offset)}`;
    return (
      <>
        <svg
          data-slot="media-mark"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full overflow-visible text-primary"
          aria-hidden
        >
          <line
            x1={mark.x1}
            y1={mark.y1}
            x2={mark.x2 - head * 0.6 * Math.cos(angle)}
            y2={mark.y2 - head * 0.6 * Math.sin(angle)}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <polygon
            points={`${mark.x2},${mark.y2} ${tip(0.45)} ${tip(-0.45)}`}
            fill="currentColor"
          />
        </svg>
        {live ? (
          <>
            <MarkHandle x={px(mark.x1)} y={py(mark.y1)} round />
            <MarkHandle x={px(mark.x2)} y={py(mark.y2)} round />
          </>
        ) : null}
        {pin}
      </>
    );
  }
  return pin;
}

type Placement = {
  left: number;
  top: number;
  width: number;
  height: number;
  mediaWidth: number;
  mediaHeight: number;
};

type Drag = { x: number; y: number; cx: number; cy: number; mark: MediaMark };

const samePlacement = (a: Placement | null, b: Placement | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height &&
    a.mediaWidth === b.mediaWidth &&
    a.mediaHeight === b.mediaHeight);

const buttonSelector =
  "input, textarea, select, button, a[href], [role='button'], [role='menuitem'], [role='option'], [contenteditable='true'], [contenteditable='plaintext-only']";

function useMediaPlacement(
  hostRef: RefObject<HTMLDivElement | null>,
  fileId: string,
  attach: MediaCommentSession["attach"],
) {
  const [placement, setPlacement] = useState<Placement | null>(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (host === null) return;
    let observed: Element | null = null;
    const measure = () => {
      const media = host.querySelector<Media>("img, video");
      if (media !== observed) {
        if (observed !== null) resize.unobserve(observed);
        if (media !== null) resize.observe(media);
        observed = media;
      }
      const size = media === null ? null : mediaSize(media);
      const hostBox = host.getBoundingClientRect();
      const mediaBox = media?.getBoundingClientRect();
      const scale =
        host.offsetWidth === 0 ? 1 : hostBox.width / host.offsetWidth;
      const next =
        media === null ||
        size === null ||
        mediaBox === undefined ||
        size.width === 0 ||
        media.offsetWidth === 0
          ? null
          : {
              left: (mediaBox.left - hostBox.left) / scale,
              top: (mediaBox.top - hostBox.top) / scale,
              width: media.offsetWidth,
              height: media.offsetHeight,
              mediaWidth: size.width,
              mediaHeight: size.height,
            };
      setPlacement((current) =>
        samePlacement(current, next) ? current : next,
      );
      attach(fileId, next === null ? null : media);
    };
    const resize = new ResizeObserver(() => measure());
    measure();
    const mutations = new MutationObserver(measure);
    mutations.observe(host, { childList: true, subtree: true });
    host.addEventListener("load", measure, true);
    host.addEventListener("loadedmetadata", measure, true);
    return () => {
      resize.disconnect();
      mutations.disconnect();
      host.removeEventListener("load", measure, true);
      host.removeEventListener("loadedmetadata", measure, true);
      attach(fileId, null);
    };
  }, [hostRef, attach, fileId]);
  return placement;
}

function useSpaceHeld(enabled: boolean) {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const down = (event: KeyboardEvent) => {
      if (event.key !== " ") return;
      if (
        event.target instanceof Element &&
        event.target.closest(buttonSelector) !== null
      )
        return;
      event.preventDefault();
      setHeld(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === " ") setHeld(false);
    };
    const blur = () => setHeld(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [enabled]);
  return held;
}

const visibleAt = (
  item: { fileId: string; time?: number },
  fileId: string,
  video: VideoState,
) =>
  item.fileId === fileId &&
  (item.time === undefined ||
    (video.paused && Math.abs(item.time - video.time) <= 0.05));

export type MediaCommentLayerProps = {
  session: MediaCommentSession;
  target: MediaCommentTarget;
  children: ReactNode;
};

export function MediaCommentLayer({
  session,
  target,
  children,
}: MediaCommentLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const fileId = target.fileId;
  const placement = useMediaPlacement(hostRef, fileId, session.attach);
  const [layerWidth, setLayerWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const width = layerRef.current?.getBoundingClientRect().width ?? null;
    setLayerWidth((current) => (current === width ? current : width));
  });
  const [drag, setDrag] = useState<Drag | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [region, setRegion] = useState<HTMLSpanElement | null>(null);
  const current = session.target?.fileId === fileId;
  const spaceHeld = useSpaceHeld(current && target.kind === "image");
  const marking = current && session.marking && !spaceHeld;
  const live = current && session.live?.fileId === fileId ? session.live : null;

  const drafts = session.items.flatMap((item) =>
    item.id === session.editing || !visibleAt(item, fileId, session.video)
      ? []
      : [{ item, n: session.numberOf(item) }],
  );
  const sentHere = session.sent.flatMap((comment, position) =>
    visibleAt(comment, fileId, session.video) ? [{ comment, position }] : [],
  );
  const unit =
    placement === null || layerWidth === null || layerWidth === 0
      ? 1
      : placement.mediaWidth / layerWidth;
  const liveMark = drag?.mark ?? live?.mark;
  const composerOpen = current && drag === null && session.boxOpen;
  const editingNote = session.items.find(
    (item) => item.id === session.editing,
  )?.note;

  const pointAt = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const w = placement?.mediaWidth ?? 0;
    const h = placement?.mediaHeight ?? 0;
    return {
      x: Math.max(0, Math.min(w, ((event.clientX - box.left) / box.width) * w)),
      y: Math.max(0, Math.min(h, ((event.clientY - box.top) / box.height) * h)),
    };
  };

  return (
    <div ref={hostRef} className="relative">
      {children}
      {placement === null ? null : (
        <div
          ref={layerRef}
          data-slot="media-comment-layer"
          className="absolute"
          style={{
            left: placement.left,
            top: placement.top,
            width: placement.width,
            height: placement.height,
            pointerEvents: marking ? "auto" : "none",
            cursor: marking ? "crosshair" : undefined,
            touchAction: marking ? "none" : undefined,
          }}
          onPointerDown={(event) => {
            if (event.nativeEvent === session.dismissed.current) {
              event.stopPropagation();
              event.preventDefault();
              return;
            }
            if (!marking || event.button !== 0 || event.pointerType === "touch")
              return;
            event.stopPropagation();
            event.preventDefault();
            event.currentTarget.setPointerCapture?.(event.pointerId);
            session.pauseForMark();
            const start = pointAt(event);
            setDrag({
              ...start,
              cx: event.clientX,
              cy: event.clientY,
              mark: { kind: "pin", ...start },
            });
          }}
          onPointerMove={(event) => {
            if (drag === null) return;
            event.stopPropagation();
            const moved =
              Math.abs(event.clientX - drag.cx) > DRAG_THRESHOLD ||
              Math.abs(event.clientY - drag.cy) > DRAG_THRESHOLD;
            setDrag({
              ...drag,
              mark: moved
                ? boxFrom(drag, pointAt(event))
                : { kind: "pin", x: drag.x, y: drag.y },
            });
          }}
          onPointerUp={(event) => {
            if (drag === null) return;
            event.stopPropagation();
            session.draw(drag.mark);
            setDrag(null);
          }}
          onPointerCancel={() => setDrag(null)}
        >
          {sentHere.map(({ comment, position }) => (
            <MediaMarkView
              key={`sent-${position}`}
              mark={comment.mark}
              n={session.sentNumber(position)}
              width={comment.width}
              height={comment.height}
              unit={unit * (comment.width / placement.mediaWidth)}
              live={false}
              active={
                session.selected === position ||
                session.hovered === `sent-${position}`
              }
              onOpen={() => session.select(position)}
              onHover={(on) => session.hover(`sent-${position}`, on)}
              label="Show sent comment"
            />
          ))}
          {drafts.map(({ item, n }) => (
            <MediaMarkView
              key={item.id}
              mark={item.mark}
              n={n}
              width={placement.mediaWidth}
              height={placement.mediaHeight}
              unit={unit}
              live={false}
              active={session.hovered === item.id}
              onOpen={marking ? () => session.edit(item.id) : undefined}
              onHover={(on) => session.hover(item.id, on)}
            />
          ))}
          {liveMark === undefined ? null : (
            <MediaMarkView
              mark={liveMark}
              n={
                (drag === null &&
                  (session.boxOpen || session.editing !== null)) ||
                drag?.mark.kind === "pin" ||
                liveMark.kind === "pin"
                  ? session.liveNumber
                  : undefined
              }
              width={placement.mediaWidth}
              height={placement.mediaHeight}
              unit={unit}
              live
              onAnchor={setAnchor}
              onRegion={setRegion}
            />
          )}
        </div>
      )}
      {composerOpen && anchor !== null && live !== null ? (
        <AnnotationComposer
          key={session.editing ?? "new"}
          anchor={anchor}
          region={live.mark.kind === "box" ? region : null}
          n={session.liveNumber}
          caption={captionFor(target, live.time)}
          initialValue={editingNote ?? ""}
          placeholder={
            target.kind === "video"
              ? "Comment on this frame"
              : "Comment on this image"
          }
          editing={session.editing !== null}
          onSubmit={(note) => session.add(note)}
          onClose={(event) => session.closeBox(event)}
          onRemove={
            session.editing === null
              ? undefined
              : () => {
                  if (session.editing !== null) session.remove(session.editing);
                }
          }
        />
      ) : null}
    </div>
  );
}

const sentRows = (sent: MediaCommentSent[]) =>
  sent.map((comment, position) => ({
    comment,
    position,
    key: `sent-${position}`,
  }));

export type MediaCommentMarkerProps = Omit<
  ComponentProps<"span">,
  "children"
> & {
  at: number;
};

export function MediaCommentMarker({
  at,
  className,
  style,
  ...props
}: MediaCommentMarkerProps) {
  return (
    <span
      data-slot="media-comment-marker"
      className={cx(
        "pointer-events-none absolute top-1/2 h-2.5 w-(--media-comment-marker-w) -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-1 ring-popover",
        className,
      )}
      style={{ ...style, left: percentOf(Math.min(1, at), 1) }}
      {...props}
    />
  );
}

export type MediaCommentMarkerPendingProps = Omit<
  ComponentProps<"span">,
  "children"
> & { at: number };

export function MediaCommentMarkerPending({
  at,
  className,
  style,
  ...props
}: MediaCommentMarkerPendingProps) {
  return (
    <span
      data-slot="media-comment-marker-pending"
      className={cx(
        "pointer-events-none absolute top-1/2 size-(--media-comment-marker-pending) -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary",
        className,
      )}
      style={{ ...style, left: percentOf(Math.min(1, at), 1) }}
      {...props}
    />
  );
}

export type MediaCommentMarkersProps = {
  session: MediaCommentSession;
  fileId: string;
};

export function MediaCommentMarkers({
  session,
  fileId,
}: MediaCommentMarkersProps) {
  const duration =
    session.target?.fileId === fileId ? session.video.duration : 0;
  if (duration === 0) return null;
  const pending =
    session.live?.fileId === fileId && session.editing === null
      ? session.live
      : null;
  return (
    <>
      {sentRows(session.sent).map(({ comment, key }) =>
        comment.fileId !== fileId || comment.time === undefined ? null : (
          <MediaCommentMarker key={key} at={comment.time / duration} />
        ),
      )}
      {session.items.map((item) =>
        item.fileId !== fileId || item.time === undefined ? null : (
          <MediaCommentMarker key={item.id} at={item.time / duration} />
        ),
      )}
      {pending?.time === undefined ? null : (
        <MediaCommentMarkerPending at={pending.time / duration} />
      )}
    </>
  );
}

export function MediaCommentTimeline({ fileId }: { fileId: string }) {
  const session = useMediaCommentSessionContext();
  return session === undefined ? null : (
    <MediaCommentMarkers session={session} fileId={fileId} />
  );
}

export function MediaCommentBadge({
  session,
  fileId,
}: {
  session: MediaCommentSession;
  fileId: string;
}) {
  const count = session.items.filter((item) => item.fileId === fileId).length;
  if (count === 0) return null;
  return (
    <span className="pointer-events-none absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-2xs leading-none font-medium text-primary-foreground tabular-nums">
      {count}
    </span>
  );
}

export function MediaCommentTools({
  session,
}: {
  session: MediaCommentSession;
}) {
  if (session.target === undefined) return null;
  return (
    <AnnotateToggle
      on={session.marking}
      hint="Click to pin, drag to box"
      className="pointer-coarse:hidden"
      onToggle={() => session.setMarking(!session.marking)}
    />
  );
}

export function MediaCommentPanel({
  session,
}: {
  session: MediaCommentSession;
}) {
  const { items, sent } = session;
  const showDrafts = sent.length === 0 || items.length > 0 || session.marking;
  const files = new Set([...sent, ...items].map((entry) => entry.file)).size;
  const multi = session.groups.length > 1;
  return (
    <AnnotationPanel
      count={sent.length + items.length}
      onHide={session.hide}
      className="absolute top-16 right-4 max-h-[calc(50dvh-6rem)] w-80 max-sm:inset-x-3 max-sm:top-auto max-sm:bottom-3 max-sm:max-h-[calc(50dvh-3rem)] max-sm:w-auto max-sm:origin-bottom"
      footer={
        session.sendable && items.length > 0 ? (
          <AnnotationSend
            count={items.length}
            sending={session.sending}
            action="media.sendComments"
            onSend={() => session.send()}
          />
        ) : null
      }
    >
      {sent.length > 0 ? (
        <AnnotationGroup label={showDrafts ? "Sent" : undefined}>
          {sentRows(sent).map(({ comment, position: i, key }) => (
            <AnnotationRow
              key={key}
              n={session.sentNumber(i)}
              note={comment.note}
              meta={commentMeta(comment, files)}
              active={session.selected === i || session.hovered === `sent-${i}`}
              selectLabel="Show comment"
              onSelect={() => session.select(i)}
              onHover={(on) => session.hover(`sent-${i}`, on)}
            />
          ))}
        </AnnotationGroup>
      ) : null}
      {showDrafts
        ? session.groups.map((group) => (
            <AnnotationGroup
              key={group[0]?.id}
              label={
                multi && group[0] !== undefined
                  ? (commentMeta(group[0], files) ?? group[0].file)
                  : sent.length > 0
                    ? "Drafts"
                    : undefined
              }
            >
              {group.map((item) => (
                <AnnotationRow
                  key={item.id}
                  n={session.numberOf(item)}
                  note={item.note}
                  active={
                    session.editing === item.id || session.hovered === item.id
                  }
                  selectLabel="Edit comment"
                  onSelect={
                    session.editable(item.fileId)
                      ? () => session.edit(item.id)
                      : undefined
                  }
                  onHover={(on) => session.hover(item.id, on)}
                  onRemove={() => session.remove(item.id)}
                />
              ))}
            </AnnotationGroup>
          ))
        : null}
      {showDrafts && items.length === 0 ? (
        <AnnotationHint>Click to pin, drag to box</AnnotationHint>
      ) : null}
    </AnnotationPanel>
  );
}

export type MediaCommentOpenProps = ComponentProps<"div">;

export function MediaCommentOpen(props: MediaCommentOpenProps) {
  return <div data-slot="media-comment-open" {...props} />;
}

export type MediaCommentRowProps = ComponentProps<"div">;

export function MediaCommentRow(props: MediaCommentRowProps) {
  return <div data-slot="media-comment-row" {...props} />;
}
