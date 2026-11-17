import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { ComponentProps } from "react";
import { menuIconSlot } from "@/components/app-sidebar/classes";
import { GiftBoxIcon } from "@/components/release";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { currentUserAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";

export type SidebarReferralMenuProps = ComponentProps<"div">;

export const referralsDashboardAtom = ApiClient.query(
  "referrals",
  "dashboard",
  {
    reactivityKeys: ["referrals"],
    timeToLive: queryTimeToLive,
  },
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function onboardingFinished(user: unknown) {
  return isRecord(user) && user.onboardedAt !== null;
}

export function canRefer(dashboard: unknown) {
  return isRecord(dashboard) && dashboard.canRefer === true;
}

export function SidebarReferralMenu(_props: SidebarReferralMenuProps) {
  const user = useAtomValue(currentUserAtom);
  const dashboard = useAtomValue(referralsDashboardAtom);
  if (!onboardingFinished(AsyncResult.isSuccess(user) ? user.value : null)) {
    return null;
  }
  if (!canRefer(AsyncResult.isSuccess(dashboard) ? dashboard.value : null)) {
    return null;
  }
  return (
    <ResponsiveMenuItem
      data-track-owner="shared/sidebar-referral-menu.tsx#ReferralMenuItem:ResponsiveMenuItem[Refer a friend]"
      render={
        <a
          data-track-owner="shared/sidebar-referral-menu.tsx#ReferralMenuItem:Link.1"
          href="/settings/referrals"
        />
      }
    >
      <span className={menuIconSlot}>
        <GiftBoxIcon />
      </span>
      Refer a friend
    </ResponsiveMenuItem>
  );
}
