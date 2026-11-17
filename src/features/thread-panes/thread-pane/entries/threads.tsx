import { useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { selectedOrgIdAtom } from "@/data/atoms/session";
import {
  SideThreadsPage,
  useSideThreads,
} from "@/features/thread-panes/threads-pane";
import { definePane, type PaneProps } from "../registry";

function ThreadsPane({ threadId }: PaneProps) {
  const navigate = useNavigate();
  const orgId = useAtomValue(selectedOrgIdAtom) ?? "";
  const sideThreads = useSideThreads(orgId, threadId);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SideThreadsPage
        sideThreads={sideThreads}
        onOpen={(entry) =>
          void navigate({
            to: "/thread/$threadId",
            params: { threadId: entry.id },
          })
        }
        onBack={() =>
          void navigate({ to: "/thread/$threadId", params: { threadId } })
        }
      />
    </div>
  );
}

export const entry = definePane({
  id: "threads",
  label: "Threads",
  order: 40,
  component: ThreadsPane,
});
