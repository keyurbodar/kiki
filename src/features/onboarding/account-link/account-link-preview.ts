import { Schema } from "effect";

export const AccountLinkPreview = Schema.Struct({
  orgName: Schema.String,
  externalUserId: Schema.String,
  externalUserName: Schema.optional(Schema.NullOr(Schema.String)),
  workspaceName: Schema.optional(Schema.NullOr(Schema.String)),
  avatarUrl: Schema.optional(Schema.NullOr(Schema.String)),
});
export type AccountLinkPreview = typeof AccountLinkPreview.Type;

export const maxTokenLength = 512;

export const isUsableToken = (token: string | undefined): token is string =>
  token !== undefined && token.length > 0 && token.length <= maxTokenLength;

export const initials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};
