import { Button } from "@/primitives/button";
import { toast } from "@/primitives/toaster";
import { LinkIcon } from "./icons";

export type CopyLinkButtonProps = {
  url: string;
  title: string;
  "data-track-owner"?: string;
};

export function CopyLinkButton({ url, title }: CopyLinkButtonProps) {
  return (
    <Button
      data-track-owner="shared/share-dialog.tsx#CopyLinkButton:Button[Copy link]"
      variant="outline"
      type="button"
      className="mr-auto"
      onClick={() =>
        void navigator.clipboard.writeText(url).then(
          () => toast.success("Link copied", { description: title }),
          () => toast.error("Could not copy link", { description: title }),
        )
      }
    >
      <LinkIcon />
      Copy link
    </Button>
  );
}

export const appOrigin = () => window.location.origin;
