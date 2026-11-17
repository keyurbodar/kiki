import { DiffsView } from "@/features/thread-panes/diffs-view";
import { definePane } from "../registry";

export const entry = definePane({
  id: "diffs",
  label: "Diffs",
  order: 3,
  component: DiffsView,
});
