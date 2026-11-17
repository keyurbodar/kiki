import { Menu } from "@/primitives/menu";
import {
  SideThreadsPage,
  type SideThreadsPageProps,
} from "./side-threads-page";

/**
 * The thread pane's body. The side threads page is a page of the open-a-tab
 * menu, so its rows are `ResponsiveMenuItem`s: the pane mounts them inside the
 * menu root those items belong to instead of leaving them without one.
 */
export function SideThreadsPane(props: SideThreadsPageProps) {
  return (
    <Menu open>
      <div
        role="menu"
        aria-label="Threads"
        data-menu-list
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-1"
      >
        <SideThreadsPage {...props} />
      </div>
    </Menu>
  );
}
