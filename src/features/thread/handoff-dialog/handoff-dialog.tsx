import { LoadingButton } from "@/lib/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";

export type GrantRepoAccessDialogProps = {
  jamId: string;
  repos: ReadonlyArray<string> | null;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  opening?: boolean;
  onGrant: () => void;
};

export function GrantRepoAccessDialog({
  jamId,
  repos,
  onOpenChange,
  isAdmin,
  opening = false,
  onGrant,
}: GrantRepoAccessDialogProps) {
  const descriptionId = `grant-access-${jamId}`;
  return (
    <Dialog open={repos !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={descriptionId}>
        <div className="flex flex-col items-center gap-4 px-5 py-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-(--radius-card) border-hairline border-border-1 bg-card [&_svg]:size-(--icon-lg)">
            <Icon name="github" />
          </span>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-xl">
              Grant repository access
            </DialogTitle>
            <DialogDescription id={descriptionId}>
              Capy does not yet have access to{" "}
              {(repos ?? []).map((repo, index) => (
                <span key={repo}>
                  {index > 0 && ", "}
                  <span className="font-medium text-foreground">{repo}</span>
                </span>
              ))}
            </DialogDescription>
          </div>
          <LoadingButton
            intent="accent"
            size="base"
            className="w-full"
            loading={opening}
            loadingLabel="Opening GitHub"
            disabled={!isAdmin}
            title={
              isAdmin ? undefined : "Only organization admins can grant access"
            }
            onClick={onGrant}
          >
            <Icon name="github" />
            Grant access
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
