import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "experiments",
  label: "Experiments",
  to: "/settings/experiments",
  section: "personal",
  order: 50,
  icon: "lab",
  keywords: "beta preview early access try features before they ship",
  rows: [
    {
      id: "capy-memory",
      title: "Memory",
      keywords: "capy memory remember opt in enable experiment",
      hiddenWhenExperimentPaused: "memory",
    },
  ],
};
