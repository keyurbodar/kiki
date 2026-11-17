import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "devices",
  label: "Devices",
  to: "/settings/devices",
  section: "personal",
  order: 170,
  icon: "devices",
  keywords:
    "device daemon laptop desktop machine enroll link pair local folder",
  rows: [
    {
      id: "paired-devices",
      title: "Paired devices",
      keywords:
        "device paired revoke rename hostname project linked folders token",
    },
    {
      id: "cloud-checkpoints",
      title: "Cloud checkpoints",
      keywords:
        "device checkpoint cloud copy offline auto-sync continue in cloud handoff",
    },
    {
      id: "agent-moves",
      title: "Let Capy move threads between this device and the cloud",
      keywords: "device move cloud handoff agent offline continue in cloud",
    },
    {
      id: "keep-awake",
      title: "Keep awake while agents are running",
      to: "/settings/devices/this",
      keywords:
        "desktop app mac pc sleep lid closed clamshell overnight battery power caffeinate",
      desktopKeepAwakeOnly: true,
    },
  ],
};
