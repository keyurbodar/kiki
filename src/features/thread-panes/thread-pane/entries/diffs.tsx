import { lazy } from "react";
import { definePane } from "../registry";

/** The diff stack (`@pierre/diffs`, its worker pool) is the heaviest pane code
 * and nothing outside this pane needs it, so it loads when the pane opens. */
const DiffsView = lazy(() =>
  import("@/features/thread-panes/diffs-view").then((module) => ({
    default: module.DiffsView,
  })),
);

export const entry = definePane({
  id: "diffs",
  label: "Diffs",
  order: 30,
  component: DiffsView,
});
