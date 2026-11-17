import { useState } from "react";
import { OverviewSection } from "@/components/captain-overview";
import { Icon } from "@/primitives/icon";
import { type CaptainDriveFile, recentDriveFiles } from "./captain-data";
import { useCaptainDrive, useCaptainOrgId } from "./use-captain";

/** Tiles the drive strip shows at first, and adds per "Show more". */
export const driveStripStep = 10;

export type CaptainDriveSectionProps = {
  orgId?: string;
  jamId: string;
  onOpenDrive: () => void;
  onOpenFile: (path: string) => void;
};

function DriveTile({
  file,
  onOpen,
}: {
  file: CaptainDriveFile;
  onOpen: (path: string) => void;
}) {
  const name = file.path.split("/").at(-1) ?? file.path;
  return (
    <button
      type="button"
      data-slot="captain-drive-tile"
      title={file.path}
      onClick={() => onOpen(file.path)}
      className="flex aspect-[3/4] w-25 shrink-0 cursor-pointer snap-start flex-col justify-end gap-1 self-start overflow-hidden rounded-(--radius-card) border-(length:--border-width-hairline) border-border-2 bg-card p-2 text-left outline-none transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset"
    >
      <Icon name="file-text" size="sm" className="text-muted-foreground-3" />
      <span className="line-clamp-2 text-2xs break-all text-foreground">
        {name}
      </span>
    </button>
  );
}

/** The "Drive" block of a Captain's overview: its newest files as tiles. */
export function CaptainDriveSection({
  orgId: orgIdProp,
  jamId,
  onOpenDrive,
  onOpenFile,
}: CaptainDriveSectionProps) {
  const orgId = useCaptainOrgId(orgIdProp);
  const { drive } = useCaptainDrive(orgId, jamId);
  const [limit, setLimit] = useState(driveStripStep);
  const files = drive?.files ?? [];
  if (drive == null || files.length === 0) return null;
  const { shown, total } = recentDriveFiles(files, limit);

  return (
    <OverviewSection
      jamId={jamId}
      sectionId="files"
      label="Drive"
      count={String(files.length)}
      open={{ label: "Open drive", onOpen: onOpenDrive }}
      rows={[
        <div
          key="recent"
          className="scrollbar-hide scroll-fade-x flex snap-x gap-2 overflow-x-auto px-2 pt-1 pb-0.5 scroll-px-2 [--scroll-fade-ramp:--spacing(6)]"
        >
          {shown.map((file) => (
            <DriveTile key={file.path} file={file} onOpen={onOpenFile} />
          ))}
          {total > shown.length && (
            <button
              type="button"
              aria-label="Show more recent files"
              onClick={() => setLimit(limit + driveStripStep)}
              className="flex aspect-[3/4] w-25 shrink-0 cursor-pointer snap-start flex-col items-center justify-center gap-1 self-start rounded-(--radius-card) border-(length:--border-width-hairline) border-dashed border-border-3 text-2xs text-muted-foreground-2 outline-none transition-colors duration-100 hover:bg-secondary hover:text-foreground focus-visible:outline-ring-inset"
            >
              <Icon name="square-plus" className="size-4" />
              Show more
            </button>
          )}
        </div>,
      ]}
    />
  );
}
