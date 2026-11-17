import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "@/styles.css";
import type { FileId } from "@/data/api/schemas/files";
import { UploadSendFailure } from "../../upload-send-failure";
import { AttachmentStrip } from "../attachment-strip";
import type { AttachmentEntry } from "../attachments";
import { AttachmentDropOverlay } from "../drop-overlay";

/*
 * Dev-only harness (not a route, not in the build): open
 * /src/features/composer/attachments/preview/index.html?state=<state> on the
 * dev server. States: uploading, settled, failed, files-2, single, drag-over,
 * send-failure.
 */

const ready = (
  localId: string,
  name: string,
  mediaType: string,
  sizeBytes: number,
): AttachmentEntry => ({
  localId,
  name,
  mediaType,
  sizeBytes,
  status: {
    phase: "ready",
    ref: { fileId: `file_${localId}` as FileId, name, mediaType, sizeBytes },
  },
});

const failed = (entry: AttachmentEntry, message: string): AttachmentEntry => ({
  ...entry,
  status: { phase: "failed", message },
});

const screenshot = ready("1", "screenshot.png", "image/png", 107_520);
const report = ready("2", "report.csv", "text/csv", 26);
const notes = ready("3", "notes.md", "text/markdown", 22);
const spec = ready("4", "spec.pdf", "application/pdf", 45);
const four = [screenshot, report, notes, spec];

const states: Record<string, ReadonlyArray<AttachmentEntry>> = {
  settled: four,
  uploading: [
    { ...screenshot, status: { phase: "uploading" } },
    { ...report, status: { phase: "uploading", progress: 42 } },
    { ...notes, status: { phase: "uploading", progress: 100 } },
    spec,
  ],
  failed: four.map((entry) => failed(entry, "Upload failed: network error")),
  "files-2": [spec, screenshot],
  single: [screenshot],
  "drag-over": [],
  "send-failure": [],
};

function Preview() {
  const state =
    new URLSearchParams(window.location.search).get("state") ?? "settled";
  const [entries, setEntries] = useState(states[state] ?? four);
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-(--radius-card) bg-card p-3 shadow-composer">
        <div className="min-h-16 p-1 text-base text-muted-foreground-3">
          Ask anything, / for commands, @ for context
        </div>
        <AttachmentStrip
          entries={entries}
          onRemove={(id) =>
            setEntries((all) => all.filter((e) => e.localId !== id))
          }
        />
        {state === "send-failure" && (
          <UploadSendFailure
            failure="Upload failed: network error"
            onRetry={() => undefined}
            onEdit={() => undefined}
          />
        )}
      </div>
      <AttachmentDropOverlay open={state === "drag-over"} />
    </div>
  );
}

const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <StrictMode>
      <Preview />
    </StrictMode>,
  );
