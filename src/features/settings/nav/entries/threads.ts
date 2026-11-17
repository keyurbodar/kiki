import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "threads",
  label: "Threads",
  to: "/settings/threads",
  section: "agent",
  order: 210,
  icon: "bubble-2",
  keywords: "agent behavior thread title archive subagent",
  rows: [
    {
      id: "title-instructions",
      title: "Title instructions",
      keywords:
        "thread title naming generate custom prompt rename organization",
    },
    {
      id: "title-triggers",
      title: "Regenerate the title when",
      keywords:
        "thread title regenerate rename trigger pull request first run automatic",
    },
    {
      id: "archive-idle-threads",
      title: "Archive idle threads",
      keywords:
        "thread archive auto automatic idle inactive old stale clean up days hide",
    },
    {
      id: "task-concurrent-limit",
      title: "Concurrent subagents",
      keywords: "task subagent concurrent parallel limit cap fan-out thread",
    },
    {
      id: "task-nested-depth",
      title: "Nested subagent depth",
      keywords: "task subagent depth nesting limit cap fan-out",
    },
  ],
};
