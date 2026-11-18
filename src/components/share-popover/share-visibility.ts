import type { ComponentType } from "react";
import { toast } from "@/primitives/toaster";
import {
  GlobeIcon,
  LockIcon,
  type ShareIconProps,
  UserGroupIcon,
} from "./icons";

export type ShareVisibility = "private" | "org" | "public";

export interface ShareVisibilityOption {
  readonly id: ShareVisibility;
  readonly label: string;
  readonly icon: ComponentType<ShareIconProps>;
  readonly description: string;
}

export const SHARE_VISIBILITIES: ReadonlyArray<ShareVisibilityOption> = [
  {
    id: "private",
    label: "Only you",
    icon: LockIcon,
    description: "Only you can open this link",
  },
  {
    id: "org",
    label: "Organization",
    icon: UserGroupIcon,
    description: "Members who can see this drive can open it",
  },
  {
    id: "public",
    label: "Anyone",
    icon: GlobeIcon,
    description: "Anyone with the link can open it, no account needed",
  },
];

export interface ShareLink {
  readonly id: string;
  readonly url: string;
  readonly visibility: ShareVisibility;
  readonly createdBy: string | null | undefined;
  readonly manageable: boolean;
}

export const shareErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null || !("_tag" in error))
    return fallback;
  if (error._tag === "capy/DriveSharePathNotFound")
    return "Save the file before sharing it";
  if (error._tag === "capy/Forbidden")
    return "You cannot share from this drive";
  return fallback;
};

export const shareViewUrl = (url: string) => `${url}?view=share`;

export const copyShareLink = (url: string) =>
  navigator.clipboard.writeText(url).then(
    () => toast.success("Link copied"),
    () => toast.error("Could not copy the link"),
  );

export const shareReactivityKeys = (orgId: string | undefined) =>
  orgId === undefined ? [] : [`drive-share:${orgId}`];
