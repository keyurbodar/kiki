import { desktopScheme } from "../desktop-handoff/handoff";

const STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

type CredentialDescriptor = Omit<PublicKeyCredentialDescriptor, "id"> & {
  id: string;
};

export type CreateOptions = {
  challenge: string;
  user: { id: string; name?: string; [key: string]: unknown };
  excludeCredentials?: CredentialDescriptor[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  [key: string]: unknown;
};

export type GetOptions = {
  challenge: string;
  allowCredentials?: CredentialDescriptor[];
  [key: string]: unknown;
};

type RequestBase = { scheme: string; state: string; inApp: boolean };

export type PasskeyRequest =
  | (RequestBase & { op: "create"; options: CreateOptions })
  | (RequestBase & { op: "get"; options: GetOptions });

export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export function toBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(/=+$/u, "");
}

function decodeOptions(value: string): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(value)));
  } catch {
    return undefined;
  }
}

export function parsePasskeyRequest(hash: string): PasskeyRequest | undefined {
  const params = new URLSearchParams(hash.replace(/^#/u, ""));
  const op = params.get("op");
  const scheme = desktopScheme(params.get("app"));
  const state = params.get("state") ?? "";
  const options = decodeOptions(params.get("options") ?? "");
  if (
    (op !== "create" && op !== "get") ||
    scheme === undefined ||
    !STATE_PATTERN.test(state) ||
    typeof options !== "object" ||
    options === null
  ) {
    return undefined;
  }
  const record = options as Record<string, unknown>;
  if (typeof record.challenge !== "string") return undefined;
  const inApp = params.get("surface") === "app";
  if (op === "get") {
    return { op, scheme, state, inApp, options: options as GetOptions };
  }
  const user = record.user as { id?: unknown } | undefined;
  if (typeof user?.id !== "string") return undefined;
  return { op, scheme, state, inApp, options: options as CreateOptions };
}

export function passkeyReturnUrl(
  request: PasskeyRequest,
  params: Record<string, string>,
): string {
  const search = new URLSearchParams({
    passkey_state: request.state,
    ...params,
  });
  return `${request.scheme}://app/?${search.toString()}`;
}

export async function runPasskeyCeremony(
  request: PasskeyRequest,
  credentials: CredentialsContainer = navigator.credentials,
): Promise<string> {
  if (request.op === "create") {
    const options = request.options;
    const credential = await credentials.create({
      publicKey: {
        ...(options as unknown as PublicKeyCredentialCreationOptions),
        authenticatorSelection: request.inApp
          ? {
              ...options.authenticatorSelection,
              authenticatorAttachment: "platform",
            }
          : options.authenticatorSelection,
        challenge: fromBase64Url(options.challenge),
        user: {
          ...(options.user as unknown as PublicKeyCredentialUserEntity),
          id: fromBase64Url(options.user.id),
        },
        excludeCredentials: (options.excludeCredentials ?? []).map(
          (descriptor) => ({ ...descriptor, id: fromBase64Url(descriptor.id) }),
        ),
      },
    });
    if (!(credential instanceof PublicKeyCredential)) {
      throw new DOMException("", "NotAllowedError");
    }
    const response = credential.response as AuthenticatorAttestationResponse;
    return JSON.stringify({
      type: credential.type,
      id: credential.id,
      rawId: toBase64Url(credential.rawId),
      authenticatorAttachment: credential.authenticatorAttachment,
      response: {
        clientDataJSON: toBase64Url(response.clientDataJSON),
        attestationObject: toBase64Url(response.attestationObject),
        transports: response.getTransports(),
      },
    });
  }
  const options = request.options;
  const credential = await credentials.get({
    publicKey: {
      ...(options as unknown as PublicKeyCredentialRequestOptions),
      challenge: fromBase64Url(options.challenge),
      allowCredentials: (options.allowCredentials ?? []).map((descriptor) => ({
        ...descriptor,
        id: fromBase64Url(descriptor.id),
      })),
    },
  });
  if (!(credential instanceof PublicKeyCredential)) {
    throw new DOMException("", "NotAllowedError");
  }
  const response = credential.response as AuthenticatorAssertionResponse;
  return JSON.stringify({
    type: credential.type,
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      clientDataJSON: toBase64Url(response.clientDataJSON),
      authenticatorData: toBase64Url(response.authenticatorData),
      signature: toBase64Url(response.signature),
      userHandle:
        response.userHandle === null ? null : toBase64Url(response.userHandle),
    },
  });
}

export function passkeyErrorMessage(
  op: PasskeyRequest["op"],
  error: unknown,
): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") {
    return "The passkey prompt closed before it finished";
  }
  if (name === "InvalidStateError" && op === "create") {
    return "This device already has a passkey for your account";
  }
  return "The passkey couldn't be used here, try again or cancel";
}

export function encodeCredential(json: string): string {
  return toBase64Url(new TextEncoder().encode(json).buffer as ArrayBuffer);
}
