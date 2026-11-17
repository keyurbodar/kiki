# Settings nav entries

Append-only registry. Each settings page adds one file here, named after its route (`general.ts`, `org-members.ts`), exporting `entry: SettingsNavEntry`. `../registry.ts` collects every file with `import.meta.glob`, so two packages never edit the same file to add nav items.

```ts
import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "general",
  label: "General",
  to: "/settings/general",
  section: "account",
  order: 0,
};
```

C1 sets the section ids and order values from Capy's settings nav and documents them here.
