import { lazy } from "react";
import { usePaneSession } from "@/features/thread/thread-view/pane-session-context";
import { definePane, type PaneProps } from "../registry";

/** The file view brings `@pierre/diffs` and `@pierre/trees` with it, so it
 * loads when the pane opens rather than with the shell. */
const FilesView = lazy(() =>
  import("@/features/thread-panes/files-view").then((module) => ({
    default: module.FilesView,
  })),
);

function FilesPane({ threadId, focus, onFocus }: PaneProps) {
  const { openTab } = usePaneSession();
  return (
    <FilesView
      jamId={threadId}
      focus={focus}
      onFocus={onFocus}
      onOpenMachineFile={(target) =>
        openTab({
          kind: "file",
          path: target.path,
          machineId: target.machineId,
          jamId: target.jamId,
        })
      }
    />
  );
}

export const entry = definePane({
  id: "files",
  label: "Files",
  order: 20,
  component: FilesPane,
});
