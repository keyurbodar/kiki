# Settings nav entries

Append-only registry. Each settings page adds one file here, named after its route below `/settings/` with slashes turned into dashes (`general.ts`, `org-members.ts`, `notifications-email.ts`), exporting `entry: SettingsNavEntry`. `../registry.ts` collects every file with `import.meta.glob`, so two packages never edit the same file to add nav items.

The entries mirror Capy's settings catalog (the `e9` array in Capy's index chunk) one for one: the same pages, titles, nav labels, icons, keywords and searchable rows, in the same order. Settings search (`../search.ts`) reads the `rows`; a row's `id` is also the anchor id of that setting on its page, so pages must render `<SettingsSection id=…>` or a row with that `id` for search results to scroll to it.

```ts
import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "general",
  label: "General",
  to: "/settings/general",
  section: "personal",
  order: 0,
  icon: "settings-gear-1",
  rows: [{ id: "sidebar", title: "Sidebar", keywords: "customize nav" }],
};
```

## Sections

Sidebar groups, in this order (Capy's `SettingsSidebar` group list):

| `section`      | Group label    | `aria-label`           |
| -------------- | -------------- | ---------------------- |
| `personal`     | none           | Settings               |
| `agent`        | Agent          | Agent settings         |
| `review`       | Review         | Review settings        |
| `organization` | Organization   | Organization settings  |
| `search`       | not in sidebar | (settings search only) |

## Order

`order` is the page's position in Capy's catalog times ten, global across sections. The sidebar sorts by section, then `order`; search results list pages by `order` alone, which interleaves the search-only pages the way Capy does. A new page takes a free value between its neighbours.

| order | file                      | label               | section      |
| ----- | ------------------------- | ------------------- | ------------ |
| 0     | `general.ts`              | General             | personal     |
| 10    | `appearance.ts`           | Appearance          | personal     |
| 20    | `profile.ts`              | Profile             | personal     |
| 30    | `security.ts`             | Security            | personal     |
| 40    | `referrals.ts`            | Referrals           | personal     |
| 50    | `experiments.ts`          | Experiments         | personal     |
| 60    | `notifications.ts`        | Notifications       | personal     |
| 70    | `notifications-email.ts`  | Email               | search       |
| 80    | `notifications-device.ts` | This device         | search       |
| 90    | `notifications-slack.ts`  | Slack               | search       |
| 100   | `shortcuts.ts`            | Shortcuts           | personal     |
| 110   | `models.ts`               | Models              | personal     |
| 120   | `projects.ts`             | Projects & setup    | personal     |
| 130   | `mcp.ts`                  | MCP & plugins       | personal     |
| 140   | `integrations.ts`         | Integrations        | personal     |
| 150   | `cloud-credentials.ts`    | Cloud credentials   | personal     |
| 160   | `api.ts`                  | API                 | personal     |
| 170   | `devices.ts`              | Devices             | personal     |
| 180   | `integrations-slack.ts`   | Slack               | search       |
| 190   | `instructions.ts`         | Instructions        | agent        |
| 200   | `skills.ts`               | Skills              | agent        |
| 210   | `threads.ts`              | Threads             | agent        |
| 220   | `git.ts`                  | Git & pull requests | agent        |
| 230   | `review-repositories.ts`  | Repositories        | review       |
| 240   | `review-agent-config.ts`  | Agent config        | review       |
| 250   | `org-general.ts`          | General             | organization |
| 260   | `org-identity.ts`         | Identity & access   | organization |
| 270   | `org-issue-states.ts`     | Issue states        | organization |
| 280   | `org-members.ts`          | Members             | organization |
| 290   | `org-billing.ts`          | Billing             | organization |
| 300   | `org-usage.ts`            | Usage               | organization |
| 310   | `org-activity.ts`         | Activity            | organization |
| 320   | `org-audit-log.ts`        | Audit log           | organization |

## Flags and visibility

Every page shows in the sidebar for its section; Capy gates no sidebar item. Row-level visibility in search follows Capy: `desktopOnly`, `desktopHandoffOnly`, `desktopKeepAwakeOnly`, `desktopLoginItemOnly`, `desktopMacOnly`, `sponsoredGrantOnly`, `creditSourcesOnly`, and `hiddenWhenExperimentPaused: "memory"` on the Experiments page's Memory row (Capy hides it while the memory experiment is paused). Capy's catalog has no Memory, Import or Capy page: `/settings/import` is not-found, `/settings/capy` redirects to threads or git, and Memory lives at `/memory` outside settings.
