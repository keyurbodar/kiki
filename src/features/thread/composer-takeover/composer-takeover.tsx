import {
  ClarifyTakeover,
  type ClarifyTakeoverProps,
} from "@/features/thread/clarify-takeover";
import {
  DesktopRequestTakeover,
  type DesktopRequestTakeoverProps,
} from "@/features/thread/desktop-request";
import {
  FeedbackRequestTakeover,
  type FeedbackRequestTakeoverProps,
} from "@/features/thread/feedback-request";
import {
  McpSetupCard,
  type McpSetupCardProps,
} from "@/features/thread/mcp-setup-card";
import {
  EnvironmentRequestTakeover,
  type EnvironmentRequestTakeoverProps,
} from "@/features/thread/request-takeover";
import {
  TerminalRequestTakeover,
  type TerminalRequestTakeoverProps,
} from "@/features/thread/terminal-request";

export type ComposerTakeoverProps =
  | ({ kind: "clarify" } & ClarifyTakeoverProps)
  | ({ kind: "environment" } & EnvironmentRequestTakeoverProps)
  | ({ kind: "desktop" } & DesktopRequestTakeoverProps)
  | ({ kind: "terminal" } & TerminalRequestTakeoverProps)
  | ({ kind: "feedback" } & FeedbackRequestTakeoverProps)
  | ({ kind: "mcp-setup" } & McpSetupCardProps);

export function ComposerTakeover(props: ComposerTakeoverProps) {
  switch (props.kind) {
    case "clarify":
      return <ClarifyTakeover {...props} />;
    case "environment":
      return <EnvironmentRequestTakeover {...props} />;
    case "desktop":
      return <DesktopRequestTakeover {...props} />;
    case "terminal":
      return <TerminalRequestTakeover {...props} />;
    case "feedback":
      return <FeedbackRequestTakeover {...props} />;
    case "mcp-setup":
      return <McpSetupCard {...props} />;
  }
}
