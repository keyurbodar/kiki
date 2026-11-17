import { describe, expect, it } from "vitest";
import {
  createRequest,
  deriveServerKey,
  emptyDraft,
  parseKeyValues,
  uniqueServerKey,
  updateRequest,
  validateDraft,
} from "./draft.ts";

describe("server draft", () => {
  it("derives a valid key from a name", () => {
    expect(deriveServerKey("Docs Search!")).toBe("docs-search");
    expect(deriveServerKey("42 tools")).toBe("mcp-42-tools");
    expect(deriveServerKey("Linear")).toBe("linear-mcp");
  });

  it("finds a free key", () => {
    expect(uniqueServerKey("docs", new Set(["docs", "docs-2"]))).toBe("docs-3");
  });

  it("parses key-value rows and rejects duplicates", () => {
    const row = (key: string, value: string) => ({
      id: key + value,
      key,
      value,
    });
    expect(parseKeyValues([row("A", "1"), row("", "")], false)).toEqual({
      A: "1",
    });
    expect(
      parseKeyValues([row("A", "1"), row("A", "2")], false),
    ).toBeUndefined();
    expect(parseKeyValues([row("A", "")], false)).toBeUndefined();
    expect(parseKeyValues([row("A", "")], true)).toEqual({ A: "" });
  });

  it("needs an https url and a valid key for an HTTP server", () => {
    const draft = { ...emptyDraft(), serverKey: "docs", url: "http://x" };
    expect(validateDraft(draft).valid).toBe(false);
    const fixed = { ...draft, url: "https://mcp.example.com/mcp" };
    expect(validateDraft(fixed).valid).toBe(true);
    expect(validateDraft({ ...fixed, serverKey: "Docs" }).valid).toBe(false);
  });

  it("rejects an Authorization request header", () => {
    const draft = {
      ...emptyDraft(),
      serverKey: "docs",
      url: "https://mcp.example.com/mcp",
      requestHeaders: [{ id: "1", key: "Authorization", value: "x" }],
    };
    expect(validateDraft(draft).valid).toBe(false);
  });

  it("builds a stdio create request for a command", () => {
    const draft = {
      ...emptyDraft(),
      serverKey: "local",
      placement: "command" as const,
      command: " npx ",
      args: [
        { id: "a", value: "-y" },
        { id: "b", value: "" },
      ],
    };
    const request = createRequest(draft, validateDraft(draft));
    expect(request).toMatchObject({
      placement: "machine",
      transport: "stdio",
      command: "npx",
      args: ["-y"],
      auth: "none",
    });
  });

  it("clears the client id when leaving an own client", () => {
    const draft = {
      ...emptyDraft(),
      serverKey: "docs",
      url: "https://mcp.example.com/mcp",
      auth: "oauth" as const,
      clientIdentity: "auto" as const,
      savedClientIdentity: "own" as const,
      savedPlacement: "backend" as const,
    };
    const request = updateRequest(draft, validateDraft(draft));
    expect(request.clientId).toBeNull();
    expect(request.placement).toBeUndefined();
  });
});
