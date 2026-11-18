import type { PullRef } from "@/components/diff-tab/model";
import { Button } from "@/primitives/button";
import { Icon, type IconId } from "@/primitives/icon";
import { MenuSeparator } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { toast } from "@/primitives/toaster";
import { appFileUrl, githubBlobUrl } from "./links";

const iconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export const copyWithToast = (text: string, success: string) => {
  navigator.clipboard.writeText(text).then(
    () => toast.success(success),
    () => toast.error("Could not copy"),
  );
};

function ItemIcon({ name }: { name: IconId }) {
  return (
    <span className={iconSlot}>
      <Icon name={name} size="sm" />
    </span>
  );
}

export type FileActionsMenuProps = {
  pull: PullRef;
  path: string;
  onComment?: () => void;
  finalFile?: boolean;
  onFinalFileChange?: (finalFile: boolean) => void;
};

export function FileActionsMenu({
  pull,
  path,
  onComment,
  finalFile = false,
  onFinalFileChange,
}: FileActionsMenuProps) {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger
        render={
          <Button variant="ghost" size="icon-xs" aria-label="File actions">
            <Icon name="circle-dotted" size="sm" />
          </Button>
        }
      />
      <ResponsiveMenuContent align="end" className="w-52">
        {onComment !== undefined && (
          <ResponsiveMenuItem onClick={onComment}>
            <ItemIcon name="bubble-text" />
            Comment on file
          </ResponsiveMenuItem>
        )}
        {onFinalFileChange !== undefined && (
          <ResponsiveMenuItem onClick={() => onFinalFileChange(!finalFile)}>
            <ItemIcon name={finalFile ? "file-edit" : "file-text"} />
            {finalFile ? "View changes" : "View final file"}
          </ResponsiveMenuItem>
        )}
        <ResponsiveMenuItem
          onClick={() =>
            window.open(
              githubBlobUrl(pull, path),
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <ItemIcon name="github" />
          Open file in GitHub
        </ResponsiveMenuItem>
        <MenuSeparator />
        <ResponsiveMenuItem
          onClick={() =>
            copyWithToast(
              appFileUrl(window.location.origin, pull, path),
              "Link copied",
            )
          }
        >
          <ItemIcon name="chain-link-2" />
          Copy link to file
        </ResponsiveMenuItem>
        <ResponsiveMenuItem onClick={() => copyWithToast(path, "Path copied")}>
          <ItemIcon name="text-1" />
          Copy full path
        </ResponsiveMenuItem>
        <ResponsiveMenuItem
          onClick={() => copyWithToast(name, "Filename copied")}
        >
          <ItemIcon name="text-1" />
          Copy filename
        </ResponsiveMenuItem>
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
