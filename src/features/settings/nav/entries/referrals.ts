import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "referrals",
  label: "Referrals",
  to: "/settings/referrals",
  section: "personal",
  order: 40,
  icon: "people",
  keywords: "refer friends rewards credits wallet invite",
  rows: [
    {
      id: "referral-link",
      title: "Referral link",
      keywords: "copy share",
    },
    {
      id: "referral-invite",
      title: "Invite by email",
      keywords: "send invitations",
    },
    {
      id: "referral-history",
      title: "History",
      keywords: "balance apply credits rewards",
    },
  ],
};
