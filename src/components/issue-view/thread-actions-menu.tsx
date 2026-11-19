import {
  CrossSmall,
  Crown,
  DotsHorizontal,
  issueMenuIcon,
} from "@/components/issue-parts";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuLabel,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";

/**
 * A linked thread's row actions. `Make owner` moves the thread to the front of
 * the issue's thread list, which is the same write the drag handle makes; the
 * menu opens as a drawer at phone, where that handle is the only drag path.
 */
export function ThreadActionsMenu({
  label,
  canMakeOwner,
  onMakeOwner,
  onUnlink,
}: {
  label: string;
  canMakeOwner: boolean;
  onMakeOwner: () => void;
  onUnlink: () => void;
}) {
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <button
            type="button"
            aria-label="Thread actions"
            className="kiki-thread-actions text-icon-muted hover:text-foreground"
          />
        }
      >
        <DotsHorizontal />
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent align="end" className="kiki-thread-actions-menu">
        <ResponsiveMenuLabel>{label}</ResponsiveMenuLabel>
        {canMakeOwner && (
          <ResponsiveMenuItem onClick={onMakeOwner}>
            <span className={issueMenuIcon}>
              <Crown />
            </span>
            Make owner
          </ResponsiveMenuItem>
        )}
        <ResponsiveMenuItem onClick={onUnlink}>
          <span className={issueMenuIcon}>
            <CrossSmall />
          </span>
          Unlink thread
        </ResponsiveMenuItem>
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
