import { createContext, type ReactNode, useContext } from "react";
import {
  MediaLightbox,
  MediaLightboxFrameContext,
  type MediaLightboxProps,
} from "@/components/media-lightbox";
import {
  MediaCommentBadge,
  type MediaCommentDeliver,
  MediaCommentLayer,
  MediaCommentPanel,
  type MediaCommentSent,
  MediaCommentSessionContext,
  type MediaCommentTarget,
  MediaCommentTools,
  useMediaCommentSession,
} from "@/features/thread/media-comment-layer";

export type MediaCommentHome = {
  queueKey?: string;
  deliver?: MediaCommentDeliver;
};

export const MediaCommentHomeContext = createContext<
  MediaCommentHome | undefined
>(undefined);

export type MediaFrameActions = { copyFrame?: () => void };

export const MediaFrameActionsContext = createContext<
  MediaFrameActions | undefined
>(undefined);

export const useMediaFrameActions = () => useContext(MediaFrameActionsContext);

type LightboxEntry = {
  key: string;
  label: string;
  kind: "image" | "video";
};

export type MediaLightboxSlots<Entry extends LightboxEntry> = {
  entries: readonly Entry[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onEscape: () => boolean;
  renderMedia: (entry: Entry) => ReactNode;
  renderThumbnail: (entry: Entry) => ReactNode;
  renderActions: (entry: Entry) => ReactNode;
  aside: ReactNode;
  overlay: ReactNode;
};

export type MediaCommentLightboxProps<Entry extends LightboxEntry> = Omit<
  MediaLightboxProps<Entry>,
  | "renderMedia"
  | "renderThumbnail"
  | "renderActions"
  | "aside"
  | "overlay"
  | "onEscape"
> & {
  targetOf: (entry: Entry) => MediaCommentTarget | undefined;
  renderMedia: (entry: Entry) => ReactNode;
  renderThumbnail: (entry: Entry) => ReactNode;
  renderActions?: (entry: Entry) => ReactNode;
  overlay?: (entry: Entry) => ReactNode;
  composer?: MediaCommentHome;
  home?: MediaCommentHome;
  sent?: { comments: MediaCommentSent[]; at?: number };
  lightbox?: (slots: MediaLightboxSlots<Entry>) => ReactNode;
};

export function MediaCommentLightbox<Entry extends LightboxEntry>({
  entries,
  index,
  onIndexChange,
  onClose,
  targetOf,
  renderMedia,
  renderThumbnail,
  renderActions,
  overlay,
  composer,
  home,
  sent,
  lightbox,
  ...rest
}: MediaCommentLightboxProps<Entry>) {
  const ambient = useContext(MediaCommentHomeContext);
  const source = composer ?? home ?? ambient;
  const session = useMediaCommentSession({
    deliver: source?.deliver,
    onSent: onClose,
    queueKey: source?.queueKey,
    targets: entries.map(targetOf),
    index,
    onIndexChange,
    sent,
  });
  const active = session.enabled ? session : undefined;
  const frameActions =
    active?.target === undefined
      ? undefined
      : {
          copyFrame:
            active.media === null ? undefined : () => active.copyFrame(false),
        };
  const close =
    composer !== undefined &&
    session.sendable &&
    session.items.length > 0 &&
    !session.sending
      ? () => session.send("insert")
      : onClose;
  const current = entries[index];
  const slots: MediaLightboxSlots<Entry> = {
    entries,
    index,
    onIndexChange,
    onClose: close,
    onEscape: session.escape,
    renderMedia: (entry) => {
      const target = targetOf(entry);
      return active === undefined || target === undefined ? (
        renderMedia(entry)
      ) : (
        <MediaCommentLayer key={entry.key} session={active} target={target}>
          {renderMedia(entry)}
        </MediaCommentLayer>
      );
    },
    renderThumbnail: (entry) => {
      const target = targetOf(entry);
      return (
        <>
          {renderThumbnail(entry)}
          {active === undefined || target === undefined ? null : (
            <MediaCommentBadge session={active} fileId={target.fileId} />
          )}
        </>
      );
    },
    renderActions: (entry) => (
      <>
        {active === undefined ? null : <MediaCommentTools session={active} />}
        {renderActions?.(entry)}
      </>
    ),
    aside: active?.panelOpen ? <MediaCommentPanel session={active} /> : null,
    overlay: current === undefined ? null : (overlay?.(current) ?? null),
  };

  return (
    <MediaCommentSessionContext.Provider value={active}>
      <MediaFrameActionsContext.Provider value={frameActions}>
        {lightbox ? (
          lightbox(slots)
        ) : (
          <MediaLightboxFrameContext.Provider value={frameActions}>
            <MediaLightbox
              {...rest}
              entries={entries}
              index={index}
              onIndexChange={slots.onIndexChange}
              onClose={slots.onClose}
              onEscape={slots.onEscape}
              renderMedia={slots.renderMedia}
              renderThumbnail={slots.renderThumbnail}
              renderActions={slots.renderActions}
              aside={slots.aside}
              overlay={slots.overlay}
            />
          </MediaLightboxFrameContext.Provider>
        )}
      </MediaFrameActionsContext.Provider>
    </MediaCommentSessionContext.Provider>
  );
}
