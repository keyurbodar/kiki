import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";
import type { PaneTabKind } from "@/features/thread-panes/tab-strip";

/**
 * What each tab kind says when the panel has nothing to paint for it. A blank
 * panel reads as a bug rather than as a state, so a kind without a body says
 * what it is and where it lives instead.
 */
const notices: Partial<Record<PaneTabKind, { line: string; sub: string }>> = {
  drive_file: {
    line: "This drive file opens in Drive",
    sub: "Drive files are read in the Drive page, not in the thread panel",
  },
  side_thread_draft: {
    line: "This side thread has not started",
    sub: "Send its first message to open the side thread",
  },
  task: {
    line: "Subagent threads open on their own thread",
    sub: "Pick the subagent in the thread's tab menu to read its transcript",
  },
  side_thread: {
    line: "Side threads open on their own thread",
    sub: "Pick the side thread in the thread's tab menu to read it",
  },
  phone: {
    line: "This phone is not attached to the thread",
    sub: "Attach a phone from the tab menu to mirror its screen",
  },
  paper: {
    line: "This Paper file cannot be opened here",
    sub: "Paper needs a connected session to embed the canvas",
  },
  desktop: {
    line: "Desktop is not available in this build",
    sub: "The panel shows the thread's files, diffs and previews",
  },
  shell: {
    line: "This terminal is not available in this build",
    sub: "The panel shows the thread's files, diffs and previews",
  },
};

const fallback = {
  line: "This panel is empty",
  sub: "The tab opened without a body",
};

export function PaneNotice({ kind }: { kind: PaneTabKind }) {
  const notice = notices[kind] ?? fallback;
  return (
    <div data-slot="pane-notice" data-pane-kind={kind}>
      <PreviewEmptyState
        art={previewArt.hanging}
        line={notice.line}
        sub={notice.sub}
      />
    </div>
  );
}
