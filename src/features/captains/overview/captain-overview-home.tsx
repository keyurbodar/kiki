import { useNavigate } from "@tanstack/react-router";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { CaptainCrewSection } from "./crew-section";
import { CaptainDriveSection } from "./drive-section";
import { CaptainOverviewEmpty } from "./overview-empty";
import { useCaptainCrew, useCaptainDrive } from "./use-captain";

/**
 * A Captain's overview, mounted where a Captain is read: the Overview pane of
 * its own thread. The crew and drive sections already carried their own empty
 * copy, but nothing rendered them — a Captain with no crew and no files had no
 * page at all. This is that page: the empty state while both are empty, then
 * the sections once either has something.
 */
export function CaptainOverviewHome({ jamId }: { jamId: string }) {
  const navigate = useNavigate();
  const { crew } = useCaptainCrew(undefined, jamId);
  const { drive } = useCaptainDrive(undefined, jamId);
  const empty = (crew?.length ?? 0) === 0 && (drive?.files.length ?? 0) === 0;

  const openDrive = (file?: string) => {
    void navigate({
      to: "/drive/captain/$jamId",
      params: { jamId },
      search: file === undefined ? {} : { file },
    });
  };

  return (
    <div data-slot="captain-overview" className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="min-h-0 flex-1">
          <div className="flex min-h-full flex-col gap-1 p-2">
            {empty ? (
              <CaptainOverviewEmpty
                jamId={jamId}
                onOpenIssues={() => void navigate({ to: "/issues" })}
                onOpenDrive={() => openDrive()}
              />
            ) : (
              <>
                <CaptainCrewSection
                  jamId={jamId}
                  onOpenThread={(threadId) =>
                    void navigate({
                      to: "/thread/$threadId",
                      params: { threadId },
                    })
                  }
                />
                <CaptainDriveSection
                  jamId={jamId}
                  onOpenDrive={() => openDrive()}
                  onOpenFile={(path) => openDrive(path)}
                />
              </>
            )}
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
    </div>
  );
}
