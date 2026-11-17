import type { ReactNode } from "react";
import { OverviewSection } from "@/components/captain-overview";
import type { CrewThread } from "./captain-data";
import { CrewThreadRow } from "./crew-thread-row";
import { useCaptain, useCaptainCrew, useCaptainOrgId } from "./use-captain";

export type CaptainCrewSectionProps = {
  orgId?: string;
  jamId: string;
  activeThreadId?: string | null;
  now?: Date;
  onOpenThread: (threadId: string) => void;
  onMessageThread?: (thread: CrewThread) => void;
  onArchiveThread?: (thread: CrewThread) => void;
  renderThreadPreview?: (thread: CrewThread) => ReactNode;
};

/** The "Threads" block of a Captain's overview: its crew, busiest first. */
export function CaptainCrewSection({
  orgId: orgIdProp,
  jamId,
  activeThreadId = null,
  now = new Date(),
  onOpenThread,
  onMessageThread,
  onArchiveThread,
  renderThreadPreview,
}: CaptainCrewSectionProps) {
  const orgId = useCaptainOrgId(orgIdProp);
  const captain = useCaptain(orgId, jamId);
  const crew = useCaptainCrew(orgId, jamId);
  if (crew === undefined || crew.length === 0) return null;
  return (
    <OverviewSection
      jamId={jamId}
      sectionId="threads"
      label="Threads"
      count={String(crew.length)}
      rows={crew.map((thread) => (
        <CrewThreadRow
          key={thread.id}
          orgId={orgId}
          captainJamId={jamId}
          captainName={captain?.name}
          thread={thread}
          active={thread.id === activeThreadId}
          now={now}
          onOpen={onOpenThread}
          onMessage={onMessageThread}
          onArchive={onArchiveThread}
          preview={renderThreadPreview}
        />
      ))}
    />
  );
}
