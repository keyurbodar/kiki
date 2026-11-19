import { createContext, useContext } from "react";
import type { AttachmentEntry } from "@/features/thread/attachment-gallery";
import type { PaneTab } from "@/features/thread-panes/tab-strip";

/**
 * Opens a tab in the thread panel from inside a pane. The panel owns the strip,
 * so a tree row or a row in the overview reaches it through this context rather
 * than through props threaded down every pane.
 */
export type PaneSessionControls = {
  openTab: (tab: PaneTab) => void;
};

export const PaneSessionContext = createContext<
  PaneSessionControls | undefined
>(undefined);

export function usePaneSession(): PaneSessionControls {
  return useContext(PaneSessionContext) ?? { openTab: () => undefined };
}

/**
 * Opens a message's file in the panel, which is what a file card does in Capy.
 * Media tiles keep the lightbox; this is the card beside them.
 */
export function useAttachmentOpener(): (entry: AttachmentEntry) => void {
  const { openTab } = usePaneSession();
  return (entry) =>
    openTab({
      kind: "attachment",
      id: entry.file.fileId,
      name: entry.file.name,
      ...(entry.title === undefined ? {} : { title: entry.title }),
    });
}
