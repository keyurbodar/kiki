import { useEffect, useRef, useState } from "react";
import art from "@/features/onboarding/onboarding/art/sail.svg?url";
import {
  MediaCommentLayer,
  MediaCommentPanel,
  type MediaCommentTarget,
  MediaCommentTools,
  mediaCommentStore,
  useMediaCommentSession,
} from "@/features/thread/media-comment-layer";
import { TooltipProvider } from "@/primitives/tooltip";

export type AnnotationSpecimenState = "annotate" | "region" | "list";

const QUEUE = "specimen";

const target: MediaCommentTarget = {
  fileId: "specimen-image",
  file: "screenshot.png",
  kind: "image",
};

const seed = () => {
  mediaCommentStore.update(QUEUE, () => [
    {
      id: "draft-1",
      fileId: target.fileId,
      file: target.file,
      kind: "image",
      width: 122,
      height: 120,
      mark: { kind: "pin", x: 30, y: 35 },
      note: "Tighten the spacing above this heading",
      thumb: "",
      unit: 1,
    },
    {
      id: "draft-2",
      fileId: target.fileId,
      file: target.file,
      kind: "image",
      width: 122,
      height: 120,
      mark: { kind: "box", x: 62, y: 60, w: 40, h: 30 },
      note: "This card should use the muted surface",
      thumb: "",
      unit: 1,
    },
  ]);
};

export function AnnotationSpecimen({
  state,
}: {
  state: AnnotationSpecimenState;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    mediaCommentStore.update(QUEUE, () => []);
    if (state === "list") seed();
    setReady(true);
  }, [state]);
  const session = useMediaCommentSession({
    queueKey: QUEUE,
    targets: [target],
    index: 0,
    onIndexChange: () => {},
    deliver: () => true,
  });
  const marked = useRef(false);
  const { setMarking, draw, media } = session;
  useEffect(() => {
    if (!ready || marked.current) return;
    marked.current = true;
    setMarking(true);
  }, [ready, setMarking]);
  const drawn = useRef(false);
  useEffect(() => {
    if (state !== "region" || media === null || drawn.current) return;
    drawn.current = true;
    draw({ kind: "box", x: 30, y: 30, w: 40, h: 40 });
  }, [state, media, draw]);
  return (
    <TooltipProvider>
      <div
        data-slot="annotation-specimen"
        className="fixed inset-0 flex items-center justify-center bg-background"
      >
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <MediaCommentTools session={session} />
        </div>
        <MediaCommentLayer session={session} target={target}>
          <img
            src={art}
            alt=""
            width={400}
            height={400}
            className="block rounded-(--radius-card) bg-card"
          />
        </MediaCommentLayer>
        {session.panelOpen ? <MediaCommentPanel session={session} /> : null}
      </div>
    </TooltipProvider>
  );
}
