import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles.css";
import type { GalleryEntry } from "@/components/media-gallery";
import type { FileId } from "@/data/api/schemas/files";
import { applyColorMode } from "@/tokens/theme";
import { AttachmentGallery, AudioCard, FileCard } from "../attachment-gallery";
import clipUrl from "./samples/clip.wav";
import panelUrl from "./samples/panel.png";
import squareUrl from "./samples/square.png";
import tallUrl from "./samples/tall.png";
import thumbUrl from "./samples/thumb.png";
import wideUrl from "./samples/wide.png";
import wideTwoUrl from "./samples/wide-two.png";

/*
 * Dev-only harness (not a route, not in the build): open
 * /src/features/thread/attachment-gallery/preview/index.html?state=<state> on
 * a dev server. States: single, pair, three, four, six, seven, files, audio,
 * pending, compact, unavailable, loading. Every sample is generated art, not a
 * capture.
 */

const image = (
  id: string,
  name: string,
  url: string,
  width: number,
  height: number,
): GalleryEntry => ({
  file: {
    fileId: `file_${id}` as FileId,
    name,
    mediaType: "image/png",
    sizeBytes: 248_320,
    width,
    height,
  },
  url,
});

const wide = (id: string) =>
  image(id, `${id}-screenshot.png`, wideUrl, 960, 540);
const wideTwo = (id: string) =>
  image(id, `${id}-map.png`, wideTwoUrl, 960, 540);
const tall = (id: string) => image(id, `${id}-page.png`, tallUrl, 540, 960);
const square = (id: string) => image(id, `${id}-logo.png`, squareUrl, 720, 720);
const panel = (id: string) => image(id, `${id}-panel.png`, panelUrl, 1200, 600);
const thumb = (id: string) => image(id, `${id}-thumb.png`, thumbUrl, 640, 480);

const doc = (
  id: string,
  name: string,
  mediaType: string,
  url?: string,
): GalleryEntry => ({
  file: {
    fileId: `file_${id}` as FileId,
    name,
    mediaType,
    sizeBytes: 48_512,
  },
  url,
});

const audioEntry = (): GalleryEntry => ({
  file: {
    fileId: "file_audio" as FileId,
    name: "standup-clip.wav",
    mediaType: "audio/wav",
    sizeBytes: 88_244,
    transcript:
      "Short record of the sync: the gallery keeps its own layout, the lightbox owns the overlay, and the audio card carries its transcript underneath the seek bar.",
  },
  url: clipUrl,
});

const states: Record<string, ReadonlyArray<GalleryEntry>> = {
  single: [wide("a")],
  pair: [wide("a"), tall("b")],
  three: [wide("a"), square("b"), wideTwo("c")],
  four: [wide("a"), wideTwo("b"), square("c"), tall("d")],
  six: [
    wide("a"),
    wideTwo("b"),
    square("c"),
    panel("d"),
    tall("e"),
    thumb("f"),
  ],
  seven: [
    wide("a"),
    wideTwo("b"),
    square("c"),
    panel("d"),
    tall("e"),
    thumb("f"),
    image("g", "g-wide.png", wideUrl, 960, 540),
  ],
  files: [
    doc("doc1", "pull-request-notes.md", "text/markdown", wideUrl),
    doc("doc2", "usage-by-day.csv", "text/csv", wideTwoUrl),
    doc("doc3", "brief.pdf", "application/pdf", panelUrl),
  ],
  // no video asset on the device: the tile takes its failure path, which still
  // exercises the mixed grid's geometry and the +N count
  mixed: [
    wide("a"),
    wideTwo("b"),
    {
      file: {
        fileId: "file_clip" as FileId,
        name: "walkthrough.mp4",
        mediaType: "video/mp4",
        sizeBytes: 1_204_224,
        width: 1920,
        height: 1080,
      },
      url: clipUrl,
    },
    square("d"),
    panel("e"),
    tall("f"),
    thumb("g"),
  ],
  audio: [audioEntry()],
  pending: [wide("a"), doc("doc1", "pull-request-notes.md", "text/markdown")],
  compact: [
    wide("a"),
    square("b"),
    doc("doc1", "pull-request-notes.md", "text/markdown"),
  ],
  unavailable: [
    { ...wide("a"), url: undefined, unavailable: true },
    { ...square("b"), url: undefined, unavailable: true },
  ],
  loading: [
    { ...wide("a"), url: undefined },
    { ...square("b"), url: undefined },
  ],
};

const params = new URLSearchParams(location.search);
applyColorMode(params.get("scheme") === "light" ? "light" : "dark");
const state = params.get("state") ?? "four";
const entries = states[state] ?? states.four;

function Harness() {
  return (
    <div className="flex min-h-dvh flex-col gap-8 p-8">
      <p className="text-2xs text-muted-foreground-2">
        attachment-gallery · {state}
      </p>
      <AttachmentGallery
        entries={entries}
        variant={state === "compact" ? "compact" : "full"}
        pending={state === "pending"}
      />
      {state === "audio" ? <AudioCard entry={audioEntry()} /> : null}
      {state === "files" ? (
        <div className="flex flex-wrap gap-1.5">
          {states.files.map((entry) => (
            <FileCard key={entry.file.fileId} entry={entry} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
