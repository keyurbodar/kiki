import { lazy } from "react";
import { definePane, type PaneProps } from "../registry";

/** The file view brings `@pierre/diffs` and `@pierre/trees` with it, so it
 * loads when the pane opens rather than with the shell. */
const FilesView = lazy(() =>
  import("@/features/thread-panes/files-view").then((module) => ({
    default: module.FilesView,
  })),
);

function FilesPane({ threadId }: PaneProps) {
  return <FilesView jamId={threadId} />;
}

export const entry = definePane({
  id: "files",
  label: "Files",
  order: 20,
  component: FilesPane,
});
