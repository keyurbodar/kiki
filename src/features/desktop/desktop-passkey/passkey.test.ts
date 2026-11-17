import { describe, expect, it } from "vitest";
import {
  encodeCredential,
  fromBase64Url,
  parsePasskeyRequest,
  passkeyErrorMessage,
  passkeyReturnUrl,
  toBase64Url,
} from "./passkey";

const STATE = "a".repeat(43);
const encode = (value: unknown) =>
  toBase64Url(
    new TextEncoder().encode(JSON.stringify(value)).buffer as ArrayBuffer,
  );

const hash = (params: Record<string, string>) =>
  `#${new URLSearchParams(params).toString()}`;

const createOptions = {
  challenge: "Y2g",
  user: { id: "dXNlcg", name: "alex@acme.dev" },
};

describe("base64url", () => {
  it("round-trips bytes without padding", () => {
    const bytes = new Uint8Array([251, 255, 0, 1]);
    const encoded = toBase64Url(bytes.buffer);
    expect(encoded).toBe("-_8AAQ");
    expect([...fromBase64Url(encoded)]).toEqual([...bytes]);
  });
});

describe("parsePasskeyRequest", () => {
  it("parses a create request from the app", () => {
    const request = parsePasskeyRequest(
      hash({
        op: "create",
        app: "capy",
        state: STATE,
        options: encode(createOptions),
        surface: "app",
      }),
    );
    expect(request).toMatchObject({
      op: "create",
      scheme: "capy",
      state: STATE,
      inApp: true,
    });
    expect(request?.options.challenge).toBe("Y2g");
  });

  it("parses a get request without a user", () => {
    const request = parsePasskeyRequest(
      hash({
        op: "get",
        app: "capy-nightly",
        state: STATE,
        options: encode({ challenge: "Y2g" }),
      }),
    );
    expect(request).toMatchObject({
      op: "get",
      scheme: "capy-nightly",
      inApp: false,
    });
  });

  it.each([
    [
      "unknown op",
      {
        op: "delete",
        app: "capy",
        state: STATE,
        options: encode(createOptions),
      },
    ],
    [
      "unknown app",
      {
        op: "create",
        app: "evil",
        state: STATE,
        options: encode(createOptions),
      },
    ],
    [
      "short state",
      {
        op: "create",
        app: "capy",
        state: "abc",
        options: encode(createOptions),
      },
    ],
    [
      "bad options",
      { op: "create", app: "capy", state: STATE, options: "%%%" },
    ],
    [
      "no challenge",
      { op: "get", app: "capy", state: STATE, options: encode({}) },
    ],
    [
      "create without user id",
      {
        op: "create",
        app: "capy",
        state: STATE,
        options: encode({ challenge: "Y2g" }),
      },
    ],
  ])("rejects %s", (_, params) => {
    expect(parsePasskeyRequest(hash(params))).toBeUndefined();
  });

  it("treats an empty hash as expired", () => {
    expect(parsePasskeyRequest("")).toBeUndefined();
  });
});

describe("passkeyReturnUrl", () => {
  it("returns to the desktop scheme with the state", () => {
    const request = parsePasskeyRequest(
      hash({
        op: "get",
        app: "capy",
        state: STATE,
        options: encode({ challenge: "Y2g" }),
      }),
    );
    if (!request) throw new Error("expected a request");
    expect(passkeyReturnUrl(request, { passkey_error: "cancelled" })).toBe(
      `capy://app/?passkey_state=${STATE}&passkey_error=cancelled`,
    );
  });
});

describe("passkeyErrorMessage", () => {
  it("maps DOM exceptions to Capy's copy", () => {
    expect(
      passkeyErrorMessage("get", new DOMException("", "NotAllowedError")),
    ).toBe("The passkey prompt closed before it finished");
    expect(
      passkeyErrorMessage("create", new DOMException("", "InvalidStateError")),
    ).toBe("This device already has a passkey for your account");
    expect(
      passkeyErrorMessage("get", new DOMException("", "InvalidStateError")),
    ).toBe("The passkey couldn't be used here, try again or cancel");
  });
});

it("encodes the credential JSON as base64url", () => {
  expect(
    new TextDecoder().decode(fromBase64Url(encodeCredential('{"a":1}'))),
  ).toBe('{"a":1}');
});
