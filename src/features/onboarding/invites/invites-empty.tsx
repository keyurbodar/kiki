import { useNavigate } from "@tanstack/react-router";
import { CapyIllustration } from "@/primitives/brand/capy-illustration";
import { Button } from "@/primitives/button";

/**
 * What `/invites` shows a person who has none: the route used to render
 * nothing at all when the org list was empty, which reads as a broken page
 * rather than as "nothing to accept".
 */
export function InvitesEmpty() {
  const navigate = useNavigate();
  return (
    <div
      data-slot="invites-empty"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center"
    >
      <CapyIllustration
        name="gift"
        className="mb-2 h-24 opacity-30 grayscale"
      />
      <span className="max-w-sm text-sm text-balance text-muted-foreground-1">
        No invitations yet
      </span>
      <span className="max-w-sm text-xs text-balance text-muted-foreground-3">
        An invitation to a workspace shows up here, with its projects and
        threads one press away.
      </span>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => void navigate({ to: "/threads" })}
      >
        Go to threads
      </Button>
    </div>
  );
}
