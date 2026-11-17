import { Cause } from "effect";
import {
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/http";
import { describe, expect, it } from "vitest";
import {
  claudeConnectError,
  claudeSetupCommand,
  normalizeClaudeToken,
} from "./claude-token.ts";

describe("normalizeClaudeToken", () => {
  it("strips every kind of whitespace and invisible separator", () => {
    expect(normalizeClaudeToken(" sk-ant-oat01-abc\n def\t")).toBe(
      "sk-ant-oat01-abcdef",
    );
    expect(normalizeClaudeToken("sk\u200bant\u00a0oat\ufeff01\u2060x")).toBe(
      "skantoat01x",
    );
    expect(normalizeClaudeToken("sk\u180e-\u200f1\u3000")).toBe("sk-1");
  });

  it("keeps a clean token as it is", () => {
    expect(normalizeClaudeToken("sk-ant-oat01-Acme_42")).toBe(
      "sk-ant-oat01-Acme_42",
    );
  });
});

describe("claudeConnectError", () => {
  it("maps each token rejection to its sentence", () => {
    expect(claudeConnectError(Cause.fail({ reason: "invalid_token" }))).toBe(
      "This Claude token isn't valid, run claude setup-token again",
    );
    expect(claudeConnectError(Cause.fail({ reason: "plan_not_allowed" }))).toBe(
      "This Claude account's plan can't run Claude Code, use a Pro or Max plan",
    );
    expect(claudeConnectError(Cause.fail({ reason: "usage_limit" }))).toBe(
      "This Claude plan is out of usage for now, try again after it resets",
    );
    expect(claudeConnectError(Cause.fail({ reason: "unavailable" }))).toBe(
      "Couldn't reach Claude to check the token, try again in a minute",
    );
  });

  it("quotes Claude's own message when it sends one", () => {
    expect(
      claudeConnectError(
        Cause.fail({
          reason: "invalid_token",
          providerMessage: "token revoked",
        }),
      ),
    ).toBe("Claude turned this token down: token revoked");
  });

  const request = HttpClientRequest.put("https://acme.test/models/claude");
  const statusError = (status: number) =>
    new HttpClientError.HttpClientError({
      reason: new HttpClientError.StatusCodeError({
        request,
        response: HttpClientResponse.fromWeb(
          request,
          new Response(null, { status }),
        ),
      }),
    });

  it("explains transport failures", () => {
    const error = new HttpClientError.HttpClientError({
      reason: new HttpClientError.TransportError({ request }),
    });
    expect(claudeConnectError(Cause.fail(error))).toBe(
      "Couldn't reach Capy, check your connection and try again",
    );
  });

  it("explains missing support and server errors", () => {
    expect(claudeConnectError(Cause.fail(statusError(404)))).toBe(
      "This Capy server doesn't support Claude Code yet",
    );
    expect(claudeConnectError(Cause.fail(statusError(503)))).toBe(
      "Capy hit a server error checking the token, try again in a minute",
    );
  });

  it("falls back to the failure message, then to the generic sentence", () => {
    expect(
      claudeConnectError(Cause.fail({ message: "Seat limit reached" })),
    ).toBe("Seat limit reached");
    expect(claudeConnectError(Cause.fail({ reason: "other" }))).toBe(
      "Couldn't connect the subscription",
    );
    expect(claudeConnectError(Cause.die(new Error("boom")))).toBe(
      "Couldn't connect the subscription",
    );
  });

  it("names the setup command", () => {
    expect(claudeSetupCommand).toBe("claude setup-token");
  });
});
