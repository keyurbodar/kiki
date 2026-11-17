import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "notifications-email",
  label: "Email",
  to: "/settings/notifications/email",
  section: "search",
  order: 70,
  icon: "bell",
  keywords: "email unsubscribe newsletter marketing inbox",
  rows: [
    {
      id: "email-marketing",
      title: "All marketing email",
      keywords: "email unsubscribe stop marketing opt out",
    },
    {
      id: "email-product-news",
      title: "Product news",
      keywords: "email launches news",
    },
    {
      id: "email-weekly",
      title: "Weekly recap",
      keywords: "email digest summary week",
    },
    {
      id: "email-onboarding",
      title: "Onboarding tips",
      keywords: "email getting started setup",
    },
    {
      id: "email-win-back",
      title: "Check-ins",
      keywords: "email away inactive win back",
    },
    {
      id: "email-sign-ins",
      title: "New sign-ins",
      keywords: "email security device computer",
    },
    {
      id: "email-invitations",
      title: "Invitations",
      keywords: "email invite organization",
    },
    {
      id: "email-credit-offers",
      title: "Credit offers",
      keywords: "email partner yc credits",
    },
    {
      id: "email-new-members",
      title: "New members",
      keywords: "email joined team",
    },
    {
      id: "email-auto-reload",
      title: "Auto-reload receipts",
      keywords: "email billing charge receipt",
    },
    {
      id: "email-failed-payments",
      title: "Failed payments",
      keywords: "email billing card",
    },
    {
      id: "email-credits-added",
      title: "Credits added",
      keywords: "email partner promo",
    },
  ],
};
