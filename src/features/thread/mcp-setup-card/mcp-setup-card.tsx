import type { ComponentProps } from "react";

export type McpSetupCardProps = ComponentProps<"div">;

export function McpSetupCard(props: McpSetupCardProps) {
  return <div {...props} />;
}

export type McpSetupLineProps = ComponentProps<"div">;

export function McpSetupLine(props: McpSetupLineProps) {
  return <div data-slot="mcp-setup-line" {...props} />;
}
