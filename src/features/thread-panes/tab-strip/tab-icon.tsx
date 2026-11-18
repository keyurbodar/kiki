import type { ReactNode } from "react";
import { Icon } from "@/primitives/icon";
import {
  BranchGlyph,
  ChatBubbleGlyph,
  CircleDashedGlyph,
  ConsoleGlyph,
  DisplayGlyph,
  FilesGlyph,
  GlobeGlyph,
  ListBulletsGlyph,
  PhoneGlyph,
  PullRequestGlyph,
  SetupGlyph,
} from "./glyphs";
import type { PaneTab } from "./tabs";

/** Capy's icon for a tab kind, as the strip and the open-a-tab menu show it. */
export function tabIcon(tab: PaneTab): ReactNode {
  switch (tab.kind) {
    case "chat":
      return <ChatBubbleGlyph />;
    case "overview":
      return <ListBulletsGlyph />;
    case "diffs":
      return <BranchGlyph />;
    case "files":
      return <FilesGlyph />;
    case "setup":
      return <SetupGlyph />;
    case "captain_issues":
    case "issue":
      return <CircleDashedGlyph />;
    case "phone":
      return <PhoneGlyph />;
    case "shell":
      return <ConsoleGlyph />;
    case "desktop":
      return <DisplayGlyph />;
    case "service_preview":
    case "browser":
      return <GlobeGlyph />;
    case "pr":
      return <PullRequestGlyph />;
    case "task":
    case "side_thread":
      return <ChatBubbleGlyph />;
    case "side_thread_draft":
      return null;
    case "paper":
    case "file":
    case "drive_file":
    case "attachment":
      return <Icon name="file-text" size="sm" />;
  }
}
