import { Schema } from "effect";

export const EmailProgram = Schema.Literals([
  "product_news",
  "weekly",
  "onboarding",
  "win_back",
]);
export type EmailProgram = typeof EmailProgram.Type;

export class EmailProgramPreference extends Schema.Class<EmailProgramPreference>(
  "EmailProgramPreference",
)({
  program: EmailProgram,
  subscribed: Schema.Boolean,
}) {}

export class EmailNoticePreference extends Schema.Class<EmailNoticePreference>(
  "EmailNoticePreference",
)({
  template: Schema.String,
  subscribed: Schema.Boolean,
}) {}

export class EmailPreferencesState extends Schema.Class<EmailPreferencesState>(
  "EmailPreferencesState",
)({
  programs: Schema.Array(EmailProgramPreference),
  notices: Schema.Array(EmailNoticePreference),
  marketing: Schema.Boolean,
  blocked: Schema.Boolean,
  noticesEditable: Schema.Boolean,
}) {}

export const EmailSubscription = Schema.Struct({
  subscribed: Schema.Boolean,
}).annotate({ identifier: "EmailSubscription" });
