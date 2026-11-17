import {
  EmailNoticePreference,
  EmailPreferencesState,
  EmailProgramPreference,
} from "../../api/schemas/emailPreferences.ts";

export const sampleEmailPreferences = new EmailPreferencesState({
  programs: [
    new EmailProgramPreference({ program: "product_news", subscribed: true }),
    new EmailProgramPreference({ program: "weekly", subscribed: true }),
    new EmailProgramPreference({ program: "onboarding", subscribed: true }),
    new EmailProgramPreference({ program: "win_back", subscribed: false }),
  ],
  notices: [
    new EmailNoticePreference({ template: "org_invite", subscribed: true }),
    new EmailNoticePreference({ template: "member_joined", subscribed: true }),
    new EmailNoticePreference({
      template: "device_enrolled",
      subscribed: true,
    }),
    new EmailNoticePreference({ template: "auto_reload", subscribed: false }),
  ],
  marketing: true,
  blocked: false,
  noticesEditable: true,
});
