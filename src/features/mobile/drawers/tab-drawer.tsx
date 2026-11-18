import { type ReactElement, useState } from "react";
import { MobileIcon } from "../thread/mobile-icon";
import {
  MobileDrawer,
  MobileDrawerItem,
  MobileDrawerLabel,
  MobileDrawerSearch,
  MobileDrawerSeparator,
  matchesQuery,
} from "./mobile-drawer";

export type MobileTabPane = {
  id: string;
  label: string;
  icon: string;
  /** Already open as a tab; shows a check. */
  open: boolean;
};

export type MobileTabDrawerProps = {
  /** Thread title, the drawer's heading. */
  title: string;
  panes: ReadonlyArray<MobileTabPane>;
  /** Captain threads list their crew's threads and pull requests. */
  crew?: { threads: number; pullRequests: number };
  /** The thread's side threads, with the titles they carry. */
  sideThreads: ReadonlyArray<{ id: string; title: string | null }>;
  terminals: { status: string; live: boolean };
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenPane: (id: string) => void;
  onOpenCrewThreads?: () => void;
  onOpenPullRequests?: () => void;
  onOpenSideThread: (id: string) => void;
  onNewTerminal: () => void;
};

function Count({ value }: { value: number }) {
  return (
    <>
      <span className="max-w-32 min-w-0 truncate">{value}</span>
      <MobileIcon
        name="chevron-right"
        className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
      />
    </>
  );
}

/** "Open a tab": every pane the thread can show, plus crew, side threads and terminals. */
export function MobileTabDrawer({
  title,
  panes,
  crew,
  sideThreads,
  terminals,
  trigger,
  open,
  onOpenChange,
  onOpenPane,
  onOpenCrewThreads,
  onOpenPullRequests,
  onOpenSideThread,
  onNewTerminal,
}: MobileTabDrawerProps) {
  const [query, setQuery] = useState("");
  const visible = panes.filter((pane) => matchesQuery(pane.label, query));
  return (
    <MobileDrawer
      label="Open a tab"
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <MobileDrawerLabel>{title}</MobileDrawerLabel>
      <MobileDrawerSearch
        label="Search tabs"
        placeholder="Search"
        value={query}
        onValueChange={setQuery}
      />
      <MobileDrawerSeparator />
      {visible.map((pane) => (
        <MobileDrawerItem
          key={pane.id}
          icon={<MobileIcon name={pane.icon} />}
          label={pane.label}
          trailing={
            pane.open ? (
              <MobileIcon
                name="checkmark-1"
                className="size-(--icon-sm) shrink-0 text-foreground"
              />
            ) : undefined
          }
          onClick={() => onOpenPane(pane.id)}
        />
      ))}
      {query === "" && (
        <>
          <MobileDrawerSeparator />
          {crew && (
            <>
              <MobileDrawerLabel>Crew</MobileDrawerLabel>
              <MobileDrawerItem
                icon={<MobileIcon name="bubble-text" />}
                label="All threads"
                trailing={<Count value={crew.threads} />}
                onClick={onOpenCrewThreads}
              />
              <MobileDrawerSeparator />
              <MobileDrawerItem
                icon={<MobileIcon name="pull-request" />}
                label="Pull requests"
                trailing={<Count value={crew.pullRequests} />}
                onClick={onOpenPullRequests}
              />
            </>
          )}
          <MobileDrawerItem
            icon={<MobileIcon name="side-thread" />}
            label="Side threads"
            trailing={<Count value={sideThreads.length} />}
          />
          {sideThreads.map((sideThread) => (
            <MobileDrawerItem
              key={sideThread.id}
              label={sideThread.title ?? "Untitled side thread"}
              onClick={() => onOpenSideThread(sideThread.id)}
            />
          ))}
          <MobileDrawerSeparator />
          <MobileDrawerLabel className="gap-2">
            <span className="min-w-0 flex-1 truncate">Terminals</span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={
                  terminals.live
                    ? "size-1.5 shrink-0 rounded-full bg-success"
                    : "size-1.5 shrink-0 rounded-full bg-muted-foreground-3"
                }
              />
              {terminals.status}
            </span>
          </MobileDrawerLabel>
          <MobileDrawerItem
            icon={<MobileIcon name="plus" />}
            label="New terminal"
            onClick={onNewTerminal}
          />
        </>
      )}
    </MobileDrawer>
  );
}
