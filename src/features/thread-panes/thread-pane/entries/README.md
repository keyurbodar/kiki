# Thread pane kinds

One file per pane kind (overview, files, diffs, browser, ...), named after its id. Each file exports `entry`:

```tsx
import { OverviewPane } from "@/features/thread-panes/overview-pane";
import { definePane } from "../registry";

export const entry = definePane({
  id: "overview",
  label: "Overview",
  order: 0,
  component: OverviewPane,
});
```

`id` is the value of the thread route's `pane` search param. `registry.ts` collects this folder with `import.meta.glob`, sorted by `order`, so a new pane never edits a shared list.
