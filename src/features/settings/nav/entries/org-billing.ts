import type { SettingsNavEntry } from "../registry";

export const entry: SettingsNavEntry = {
  id: "org-billing",
  label: "Billing",
  to: "/settings/org/billing",
  section: "organization",
  order: 290,
  icon: "credit-card-1",
  keywords: "organization",
  rows: [
    {
      id: "org-billing-plan",
      title: "Plan",
      keywords: "subscription tier upgrade downgrade capy pro",
    },
    {
      id: "org-billing-balance",
      title: "Balance",
      keywords: "credits remaining top up add",
    },
    {
      id: "org-billing-sponsored-allowance",
      title: "Sponsored allowance",
      keywords:
        "sponsored open source oss allowance credits paid fall-through reviews",
      sponsoredGrantOnly: true,
    },
    {
      id: "org-billing-workspace-type",
      title: "Workspace type",
      keywords: "personal team active members token fee",
    },
    {
      id: "org-billing-machine-memory",
      title: "Machine memory",
      keywords: "cloud machines ram gb running concurrent budget limit usage",
    },
    {
      id: "org-billing-auto-reload",
      title: "Auto-reload",
      keywords: "top up automatic reload threshold balance",
    },
    {
      id: "org-billing-payment",
      title: "Payment method",
      keywords: "card stripe portal",
    },
    {
      id: "org-billing-receipts",
      title: "Email receipts",
      keywords: "payment receipt email invoice billing email ramp expense",
    },
    {
      id: "org-billing-credit-sources",
      title: "Credit sources",
      keywords: "plan grant purchased credits resets expires balance breakdown",
      creditSourcesOnly: true,
    },
    {
      id: "org-billing-activity",
      title: "Billing activity",
      keywords: "invoices receipts history transactions",
    },
  ],
};
