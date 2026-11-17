import type { ComponentProps } from "react";
import { Icon } from "@/primitives/icon";

export type DriveReference = {
  location: string;
  path: string;
  version: number | string;
  title?: string;
};

export const driveReferenceName = (reference: DriveReference) =>
  reference.title ?? reference.path.split("/").at(-1) ?? reference.path;

const DRIVE_CARD =
  "group flex h-12 w-60 max-w-full cursor-pointer items-center gap-2 rounded-(--radius-card) border-hairline border-border-2 bg-button py-1.5 pr-2 pl-1.5 text-left shadow-plate transition-colors duration-fast hover:bg-button-hover focus-visible:outline-ring-inset";
const DRIVE_CARD_MARK =
  "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-(--radius) bg-secondary text-icon-muted";

export type DriveReferenceCardsProps = Omit<
  ComponentProps<"div">,
  "children"
> & {
  references?: readonly DriveReference[];
  locationLabel?: (location: string) => string | undefined;
  openDriveFile?: (reference: DriveReference) => (() => void) | undefined;
};

export function DriveReferenceCards({
  references = [],
  locationLabel,
  openDriveFile,
  className,
  ...props
}: DriveReferenceCardsProps) {
  return (
    <div
      data-slot="drive-references"
      className={["flex max-w-full flex-wrap gap-1.5", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {references.map((reference) => {
        const name = driveReferenceName(reference);
        const open = openDriveFile?.(reference);
        return (
          <button
            key={`${reference.location}/${reference.path}@${reference.version}`}
            type="button"
            aria-label={`Open ${name}`}
            title={reference.path}
            disabled={open === undefined}
            onClick={open}
            className={`${DRIVE_CARD} disabled:cursor-default disabled:hover:bg-button`}
          >
            <span className={DRIVE_CARD_MARK}>
              <Icon name="file-text" className="size-(--icon-base)" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="mask-fade-r overflow-hidden text-sm font-medium whitespace-nowrap [--mask-fade-ramp:--spacing(2)]">
                {name}
              </span>
              <span className="truncate text-2xs text-muted-foreground-2">
                {locationLabel?.(reference.location) ?? reference.location}
              </span>
            </span>
            {open !== undefined && (
              <Icon
                name="square-arrow-top-right"
                className="size-(--icon-sm) shrink-0 text-icon-muted opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
