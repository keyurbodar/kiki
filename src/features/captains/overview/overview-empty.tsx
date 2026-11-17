import { cx } from "class-variance-authority";
import captainArt from "@/assets/brand/illustrations/captain.svg?url";
import {
  OverviewEmpty,
  OverviewSurfaceRow,
  overviewEmptyMark,
} from "@/components/captain-overview";
import { captainAvatarUrl } from "@/primitives/captain-avatar";
import { Icon } from "@/primitives/icon";
import { useCaptain, useCaptainDrive, useCaptainOrgId } from "./use-captain";

export type CaptainOverviewEmptyProps = {
  orgId?: string;
  jamId: string;
  onOpenIssues: () => void;
  onOpenDrive: () => void;
};

/**
 * What a Captain's overview shows before it has crew or files: its avatar,
 * then rows into Issues and Drive.
 */
export function CaptainOverviewEmpty({
  orgId: orgIdProp,
  jamId,
  onOpenIssues,
  onOpenDrive,
}: CaptainOverviewEmptyProps) {
  const orgId = useCaptainOrgId(orgIdProp);
  const captain = useCaptain(orgId, jamId);
  const { drive } = useCaptainDrive(orgId, jamId);
  const files = drive?.files.length ?? 0;
  const avatar = captain?.avatar;

  const mark =
    avatar === undefined ? (
      <img
        src={captainArt}
        alt="Overview is empty"
        draggable={false}
        className={cx("h-24 select-none", overviewEmptyMark)}
      />
    ) : avatar.image !== undefined ? (
      <img
        src={avatar.image}
        alt=""
        draggable={false}
        className={cx(
          "size-24 rounded-(--radius-sm) object-cover select-none",
          overviewEmptyMark,
        )}
      />
    ) : avatar.kind === "preset" ? (
      <img
        src={captainAvatarUrl(avatar.value)}
        alt=""
        draggable={false}
        className={cx("h-24 select-none", overviewEmptyMark)}
      />
    ) : (
      <span
        role="img"
        aria-label={captain?.name}
        className={cx("text-7xl leading-none", overviewEmptyMark)}
      >
        {avatar.value}
      </span>
    );

  return (
    <OverviewEmpty mark={mark}>
      <OverviewSurfaceRow
        icon={<Icon name="ticket" />}
        label="Issues"
        detail="Nothing needs you yet"
        onOpen={onOpenIssues}
      />
      <OverviewSurfaceRow
        icon={<Icon name="folder-1" />}
        label="Drive"
        value={files > 0 && String(files)}
        detail={files === 0 ? "No files yet" : undefined}
        onOpen={onOpenDrive}
      />
    </OverviewEmpty>
  );
}
