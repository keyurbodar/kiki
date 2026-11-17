import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "general",
  label: "General",
  to: "/settings/general",
  section: "personal",
  order: 0,
  icon: "settings-gear-1",
  rows: [
    {
      id: "sidebar",
      title: "Sidebar",
      keywords:
        "customize nav navigation order hide show reorder more projects threads",
    },
    {
      id: "desktop-handoff",
      title: "Open links in desktop app",
      keywords:
        "desktop native mac app links handoff redirect automatic browser",
      desktopHandoffOnly: true,
    },
    {
      id: "scroll-new-messages-to-top",
      title: "Scroll new messages to top",
      keywords:
        "chat scroll anchor pin send message top bottom follow auto-scroll",
    },
    {
      id: "reuse-thread-tab",
      title: "Switch to existing thread tab",
      keywords: "desktop tabs duplicate reuse focus open thread",
      desktopOnly: true,
    },
    {
      id: "open-preview-links-in",
      title: "Open preview links in",
      keywords: "desktop preview links pane system browser capysandbox port",
      desktopOnly: true,
    },
    {
      id: "open-links-in",
      title: "Open external links in",
      keywords:
        "desktop links system browser capy browser pane external vercel url open",
      desktopOnly: true,
    },
    {
      id: "open-files-in",
      title: "Open files in",
      keywords:
        "desktop editor ide vscode vs code cursor zed windsurf jetbrains intellij default app open file folder",
      desktopOnly: true,
    },
    {
      id: "browser-search-engine",
      title: "Search engine",
      keywords: "desktop browser omnibox search engine google duckduckgo bing",
      desktopOnly: true,
    },
    {
      id: "start-at-login",
      title: "Start at login",
      keywords:
        "desktop app launch startup login item menu bar background tray",
      desktopLoginItemOnly: true,
    },
    {
      id: "start-at-login-window",
      title: "At login",
      keywords:
        "desktop app launch startup login hidden minimized window tray menu bar background",
      desktopLoginItemOnly: true,
    },
    {
      id: "menu-bar",
      title: "Show in menu bar",
      win32Title: "Show in system tray",
      keywords:
        "desktop app tray system tray menu bar icon counts show hide close background",
      desktopLoginItemOnly: true,
    },
    {
      id: "menu-bar-org",
      title: "Menu bar organization",
      win32Title: "System tray organization",
      keywords:
        "desktop app tray system tray menu bar organization org threads counts",
      desktopLoginItemOnly: true,
    },
    {
      id: "menu-bar-item",
      title: "Menu bar item",
      keywords: "desktop app tray menu bar icon counts badge face",
      desktopLoginItemOnly: true,
      desktopMacOnly: true,
    },
    {
      id: "submit-on-enter",
      title: "Enter behavior",
      keywords:
        "enter send keyboard composer submit interrupt queue steer newline",
    },
    {
      id: "submit-on-mod-enter",
      title: "⌘/Ctrl+Enter behavior",
      keywords:
        "enter send keyboard composer submit interrupt queue steer follow-up",
    },
    {
      id: "submit-on-alt-enter",
      title: "⌥/Alt+Enter behavior",
      keywords:
        "option alt enter send keyboard composer submit interrupt queue steer",
    },
    {
      id: "voice-microphone",
      title: "Microphone",
      keywords:
        "microphone mic voice input dictation transcription audio device lid closed",
    },
  ],
};
