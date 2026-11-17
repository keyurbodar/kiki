import { createContext, type ReactNode, useContext } from "react";
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

export type MediaLightboxSlots<Entry> = {
  entries: Entry[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onEscape: () => boolean;
  renderMedia: (entry: Entry) => ReactNode;
  renderThumbnail: (entry: Entry) => ReactNode;
  renderActions: (entry: Entry) => ReactNode;
  aside: ReactNode;
};

export type MediaCommentLightboxProps<Entry extends { key: string }> = {
  entries: Entry[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  targetOf: (entry: Entry) => MediaCommentTarget | undefined;
  renderMedia: (entry: Entry) => ReactNode;
  renderThumbnail: (entry: Entry) => ReactNode;
  renderActions?: (entry: Entry) => ReactNode;
  composer?: MediaCommentHome;
  home?: MediaCommentHome;
  sent?: { comments: MediaCommentSent[]; at?: number };
  lightbox: (slots: MediaLightboxSlots<Entry>) => ReactNode;
};

export function MediaCommentLightbox<Entry extends { key: string }>({
  entries,
  index,
  onIndexChange,
  onClose,
  targetOf,
  renderMedia,
  renderThumbnail,
  renderActions,
  composer,
  home,
  sent,
  lightbox,
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
  return (
    <MediaCommentSessionContext.Provider value={active}>
      <MediaFrameActionsContext.Provider value={frameActions}>
        {lightbox({
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
              <MediaCommentLayer
                key={entry.key}
                session={active}
                target={target}
              >
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
              {active === undefined ? null : (
                <MediaCommentTools session={active} />
              )}
              {renderActions?.(entry)}
            </>
          ),
          aside: active?.panelOpen ? (
            <MediaCommentPanel session={active} />
          ) : null,
        })}
      </MediaFrameActionsContext.Provider>
    </MediaCommentSessionContext.Provider>
  );
}
