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

`registry.ts` collects this folder with `import.meta.glob`, so adding a renderer never touches a shared list. A type with no file renders nothing. Two files for the same type throw at load.
