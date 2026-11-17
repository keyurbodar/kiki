import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { ComponentProps } from "react";
import { menuIconSlot } from "@/components/app-sidebar/classes";
import { GiftBoxIcon } from "@/components/release";
import { currentUserAtom } from "@/data/atoms/session";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";

export type SidebarReferralMenuProps = ComponentProps<"div">;

export function canRefer(user: unknown) {
  if (typeof user !== "object" || user === null) return false;
  const row = user as Record<string, unknown>;
  return row.onboardedAt !== null && row.canRefer === true;
}

export function SidebarReferralMenu(_props: SidebarReferralMenuProps) {
  const user = useAtomValue(currentUserAtom);
  if (!AsyncResult.isSuccess(user) || !canRefer(user.value)) return null;
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
