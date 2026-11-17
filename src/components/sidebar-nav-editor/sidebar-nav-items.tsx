import type { ComponentType, SVGProps } from "react";
import {
  CalendarClockIcon,
  CircleDashedIcon,
  CompassRoundIcon,
  EditSmallIcon,
  FilesIcon,
  ListBulletsIcon,
  PullRequestIcon,
} from "@/components/app-sidebar/icons";
import { Icon } from "@/primitives/icon";
import type { SidebarNavItem } from "./sidebar-nav";

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

function MemoryIcon(props: SVGProps<SVGSVGElement>) {
  return <Icon size="sm" {...props} name="book" />;
}

export type SidebarNavItemConfig = {
  label: string;
  to: string;
  exact?: boolean;
  icon: NavIcon;
};

export const SIDEBAR_NAV_CONFIG: Record<SidebarNavItem, SidebarNavItemConfig> =
  {
    newThread: {
      label: "New thread",
      to: "/new",
      exact: true,
      icon: EditSmallIcon,
    },
    issues: { label: "Issues", to: "/issues", icon: CircleDashedIcon },
    pullRequests: {
      label: "Pull requests",
      to: "/pulls",
      icon: PullRequestIcon,
    },
    automations: {
      label: "Automations",
      to: "/automations",
      icon: CalendarClockIcon,
    },
    explore: { label: "Explore", to: "/explore", icon: CompassRoundIcon },
    memory: { label: "Memory", to: "/memory", icon: MemoryIcon },
    volumes: { label: "Drive", to: "/drive", icon: FilesIcon },
    threads: { label: "Threads", to: "/threads", icon: ListBulletsIcon },
  };
