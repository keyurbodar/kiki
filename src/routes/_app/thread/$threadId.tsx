import { Menu } from "@base-ui/react/menu";
import { createFileRoute } from "@tanstack/react-router";
import { RoutePlaceholder } from "@/components/route-placeholder";
import {
  AllThreadsPage,
  CaptainIssuesPane,
  SideThreadsPage,
} from "@/features/thread-panes/threads-pane";
import { searchParams } from "@/lib/search-params";

export const Route = createFileRoute("/_app/thread/$threadId")({
  validateSearch: searchParams(["pane"]),
  component: RouteComponent,
});

function Popup({ left, children }: { left: number; children: React.ReactNode }) {
  return (
    <Menu.Root open modal={false}>
      <Menu.Trigger
        aria-label="Open tab"
        style={{ position: "fixed", left, top: 49, width: 1, height: 1, opacity: 0 }}
      />
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={0}>
          <Menu.Popup className="flex w-80 flex-col rounded-lg border border-border-1 bg-popover p-1 text-foreground shadow-lg outline-none">
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function RouteComponent() {
  const { threadId } = Route.useParams();
  const { pane } = Route.useSearch() as { pane?: string };
  if (pane === "side")
    return (
      <Popup left={406}>
        <SideThreadsPage sideThreads={[]} onOpen={() => {}} onBack={() => {}} onNewSideThread={() => {}} newSideThreadShortcut="⇧⌘S" />
      </Popup>
    );
  if (pane === "all")
    return (
      <Popup left={176}>
        <AllThreadsPage threads={[]} onOpen={() => {}} onBack={() => {}} />
      </Popup>
    );
  if (pane === "captain_issues")
    return (
      <div className="fixed top-[44px] right-2 bottom-2 flex w-[512px] flex-col bg-panel">
        <CaptainIssuesPane threadId={threadId} />
      </div>
    );
  return <RoutePlaceholder title="Threads" path="/thread/$threadId" />;
}
