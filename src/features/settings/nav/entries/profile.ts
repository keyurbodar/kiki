import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "profile",
  label: "Profile",
  to: "/settings/profile",
  section: "personal",
  order: 20,
  icon: "user",
  rows: [
    {
      id: "profile-picture",
      title: "Profile picture",
      keywords: "avatar image",
    },
    {
      id: "profile-name",
      title: "Name",
    },
    {
      id: "profile-email",
      title: "Email",
    },
    {
      id: "user-id",
      title: "User ID",
      keywords: "identifier support copy",
    },
    {
      id: "delete-account",
      title: "Delete account",
      keywords: "danger remove permanently",
    },
  ],
};
