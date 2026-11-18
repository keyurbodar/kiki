# Timeline row renderers

One file per row type (`TimelineRow["type"]` in `src/data/events/rows.ts`), named after the type, for example `agent-message.tsx`. Each file exports `entry`:

```tsx
import { AgentMessage } from "@/features/thread/agent-message";
import { defineTimelineRow } from "../registry";

export const entry = defineTimelineRow({
  type: "agent-message",
  component: AgentMessage,
});
```

`registry.ts` collects this folder with `import.meta.glob`, so adding a renderer never touches a shared list. Two files for the same type throw at load.

Every type in `TIMELINE_ROW_TYPES` has a file here, and `registry.test.ts` fails when one is missing. A row Capy paints as a composer takeover instead (the desktop, terminal and feedback requests) still gets a file whose component returns null, so the absence is deliberate and visible rather than silent.
