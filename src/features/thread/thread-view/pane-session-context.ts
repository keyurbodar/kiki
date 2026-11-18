import { createContext, useContext } from "react";
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
