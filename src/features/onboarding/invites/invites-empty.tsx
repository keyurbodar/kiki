import { useNavigate } from "@tanstack/react-router";
import { CAPY_ILLUSTRATIONS } from "@/assets/brand";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state";
import { Button } from "@/primitives/button";

/**
 * What `/invites` shows a person who has none: the route used to render
 * nothing at all when the org list was empty, which reads as a broken page
 * rather than as "nothing to accept".
 */
export function InvitesEmpty() {
  const navigate = useNavigate();
  return (
    <div data-slot="invites-empty" className="kiki-pane h-full">
      <PreviewEmptyState
        art={CAPY_ILLUSTRATIONS.gift}
        line="No invitations yet"
        sub="An invitation to a workspace shows up here, with its projects and threads one press away."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void navigate({ to: "/threads" })}
          >
            Go to threads
          </Button>
        }
      />
    </div>
  );
}
