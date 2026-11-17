import { useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import {
  SideThreadsPane,
  useSideThreads,
} from "@/features/thread-panes/threads-pane";
import { definePane, type PaneProps } from "../registry";

function ThreadsPane({ threadId }: PaneProps) {
  const navigate = useNavigate();
  const organizations =
    Option.getOrUndefined(AsyncResult.value(useAtomValue(organizationsAtom))) ??
    [];
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const sideThreads = useSideThreads(orgId ?? "", threadId);
  return (
    <SideThreadsPane
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
  );
}

export const entry = definePane({
  id: "threads",
  label: "Threads",
  order: 40,
  component: ThreadsPane,
});
