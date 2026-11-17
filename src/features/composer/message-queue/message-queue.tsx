import type { ComponentProps } from "react";

export type MessageQueueProps = ComponentProps<"div">;

export function MessageQueue(props: MessageQueueProps) {
  return <div {...props} />;
}

export type QueuedMarkerProps = ComponentProps<"div">;

export function QueuedMarker(props: QueuedMarkerProps) {
  return <div data-slot="queued-marker" {...props} />;
}
