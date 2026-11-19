import { useNavigate } from "@tanstack/react-router";
import type { SidebarFolder } from "@/components/sidebar-threads";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

/**
 * Capy's folder-header button: it opens the new-thread composer with the folder
 * already picked, rather than creating a thread nothing has been said in yet.
 * The composer puts the thread in that folder once it exists.
 */
export function NewThreadInFolderButton({ folder }: { folder: SidebarFolder }) {
  const navigate = useNavigate();
  const label = `New thread in ${folder.name}`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="bare"
            size="icon-shrink"
            aria-label={label}
            className="kiki-icon-button relative opacity-0 transition-opacity duration-100 group-hover/folder:opacity-100 focus-visible:opacity-100"
            onClick={() =>
              void navigate({ to: "/new", search: { folder: folder.id } })
            }
          />
        }
      >
        <Icon name="plus-medium" size="sm" />
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
