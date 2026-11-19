/**
 * The shortcuts this build prints but cannot run yet, each with the surface it
 * would need. The coverage test fails if a printed shortcut is neither bound by
 * a surface nor listed here, so a label that does nothing cannot ship quietly.
 */
export const unboundCommands: Record<string, string> = {
  "composer.voice":
    "No transcription backend, so the composer never renders a voice control to start",
  "request.allow": "The access-request card submits from its own button",
  "request.submit": "The request form submits from its own button",
  "shell.focus":
    "Keyur scoped the terminal tab out of this work; no terminal exists to focus",
  "shell.new":
    "Keyur scoped the terminal tab out of this work; no terminal exists to open",
  "shell.find": "The terminal pane renders no find bar",
  "editor.open":
    "Opening a machine file in a desktop editor needs the machine API",
  "preview.copy":
    "The image preview has no focused-preview state to scope the shortcut to",
  "preview.download":
    "The image preview has no focused-preview state to scope the shortcut to",
  "media.sendComments":
    "The media comment layer keeps queued comments in local state",
  "file.save": "The file view is read-only; there is no edit buffer to save",
  "files.search":
    "The files pane searches inside its own toolbar, not from a shell-level command",
  "pull.copyLink":
    "There is no pull request page with a selected pull; copy link lives on each list row's menu",
  "pullTab.overview":
    "The pulls surface has list rows only, with no detail tabs",
  "pullTab.guide": "The pulls surface has list rows only, with no detail tabs",
  "pullTab.diff": "The pulls surface has list rows only, with no detail tabs",
  "pull.openGitHub":
    "A two-key sequence has no matcher yet, and the column holds no pull request row",
  "paneTab.back":
    "The pane session keeps no record of the tab a tab was opened from",
  "commandMenu.actions":
    "The thread row menu opens from its own trigger; nothing tracks a selected row",
  "list.next": "Thread, issue and pull lists have no roving selection to move",
  "list.previous":
    "Thread, issue and pull lists have no roving selection to move",
  "list.check":
    "Thread, issue and pull lists have no roving selection to check",
  "menu.markUnread":
    "The thread row menu opens from its own trigger; nothing tracks a selected row",
  "menu.archive":
    "The thread row menu opens from its own trigger; nothing tracks a selected row",
  "menu.settle":
    "The thread row menu opens from its own trigger; nothing tracks a selected row",
  "menu.delete":
    "The thread row menu opens from its own trigger; nothing tracks a selected row",
  "issue.status": "The issues list has no selected issue and no status menu",
  "issue.priority":
    "The issues list has no selected issue and no priority menu",
  "issue.assignee":
    "The issues list has no selected issue and no assignee menu",
  "issue.labels": "The issues list has no selected issue and no label menu",
  "tab.new": "The desktop app's browser-style tabs have no strip in this build",
  "tab.closeOthers":
    "The desktop app's browser-style tabs have no strip in this build",
  "tab.pin": "The desktop app's browser-style tabs have no strip in this build",
  "tab.copyUrl":
    "The desktop app's browser-style tabs have no strip in this build",
  "tab.next":
    "The desktop app's browser-style tabs have no strip in this build",
  "tab.previous":
    "The desktop app's browser-style tabs have no strip in this build",
  "tab.select":
    "The desktop app's browser-style tabs have no strip in this build",
};
