import { FilesView } from "@/features/thread-panes/files-view";
import { definePane, type PaneProps } from "../registry";

function FilesPane({ threadId }: PaneProps) {
  return <FilesView jamId={threadId} />;
}

export const entry = definePane({
  id: "files",
  label: "Files",
  order: 20,
  component: FilesPane,
});
