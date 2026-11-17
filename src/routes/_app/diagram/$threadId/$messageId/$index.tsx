import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/not-found-page";
import {
  DIAGRAM_PREVIEW_ID,
  DiagramWindowScreen,
  RichContentPreview,
} from "@/features/thread/diagram-window";

export const Route = createFileRoute(
  "/_app/diagram/$threadId/$messageId/$index",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { threadId, messageId, index } = Route.useParams();
  if (threadId === DIAGRAM_PREVIEW_ID)
    return <RichContentPreview view={messageId} index={Number(index)} />;
  if (!/^\d{1,4}$/.test(index) || !/^[A-Za-z0-9_-]{1,128}$/.test(messageId))
    return <NotFoundPage />;
  return (
    <DiagramWindowScreen
      threadId={threadId}
      messageId={messageId}
      index={Number(index)}
    />
  );
}
