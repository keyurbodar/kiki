import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "review-repositories",
  label: "Repositories",
  title: "Review repositories",
  to: "/settings/review/repositories",
  section: "review",
  order: 230,
  icon: "folders-2",
  keywords:
    "repositories automatic reviews enabled add repository status check billing",
  rows: [
    {
      id: "review-repositories",
      title: "Enabled repositories",
      keywords:
        "repository auto review once every push off status check billing memory add",
    },
    {
      id: "review-your-prs",
      title: "Your pull requests",
      keywords: "personal automatic review own author skip opt out",
    },
  ],
};
