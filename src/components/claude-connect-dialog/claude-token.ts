import { Cause } from "effect";
import { HttpClientError } from "effect/http";

export const claudeSetupCommand = "claude setup-token";

export const normalizeClaudeToken = (value: string) =>
  value.replace(/[\p{White_Space}\u180e\u200b-\u200f\u2060\ufeff]/gu, "");

export const claudeTokenRejections = {
  invalid_token: "This Claude token isn't valid, run claude setup-token again",
  plan_not_allowed:
    "This Claude account's plan can't run Claude Code, use a Pro or Max plan",
  usage_limit:
    "This Claude plan is out of usage for now, try again after it resets",
  unavailable:
    "Couldn't reach Claude to check the token, try again in a minute",
} as const;

type Rejection = {
  readonly reason: keyof typeof claudeTokenRejections;
  readonly providerMessage?: string;
};

const isRejection = (error: unknown): error is Rejection =>
  error !== null &&
  typeof error === "object" &&
  "reason" in error &&
  typeof error.reason === "string" &&
  error.reason in claudeTokenRejections;

const messageOf = (error: unknown) =>
  error !== null &&
  typeof error === "object" &&
  "message" in error &&
  typeof error.message === "string" &&
  error.message.length > 0
    ? error.message
    : undefined;

export const claudeConnectError = (cause: Cause.Cause<unknown>) => {
  const error = cause.reasons.find(Cause.isFailReason)?.error;
  if (isRejection(error))
    return error.providerMessage === undefined
      ? claudeTokenRejections[error.reason]
      : `Claude turned this token down: ${error.providerMessage}`;
  if (HttpClientError.isHttpClientError(error)) {
    if (error.reason._tag === "TransportError")
      return "Couldn't reach Capy, check your connection and try again";
    const status = error.response?.status ?? 0;
    if (status === 404)
      return "This Capy server doesn't support Claude Code yet";
    if (status >= 500)
      return "Capy hit a server error checking the token, try again in a minute";
  }
  return messageOf(error) ?? "Couldn't connect the subscription";
};
