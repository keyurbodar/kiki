import type { DesktopFactor, DesktopVerifyResult } from "@/lib/desktop-bridge";

export const VERIFY_ON_WEB = "Verify on capy.ai, then retry this change here";
export const VERIFY_FAILED = "Something went wrong";

export type VerifyState =
  | { kind: "loading" }
  | { kind: "blocked"; message: string }
  | { kind: "password"; emailAddressId: string | null }
  | { kind: "email-code"; identifier: string | null }
  | { kind: "totp"; backupCode: boolean }
  | { kind: "backup-code"; totp: boolean };

export type VerifyNext =
  | { kind: "settle" }
  | { kind: "state"; state: VerifyState }
  | { kind: "email-code"; emailAddressId: string; identifier: string | null };

const has = (factors: DesktopFactor[] | undefined, strategy: string) =>
  factors?.some((factor) => factor.strategy === strategy) ?? false;

export function nextVerifyStep(result: DesktopVerifyResult): VerifyNext {
  if (!result.ok) {
    return {
      kind: "state",
      state: { kind: "blocked", message: result.message },
    };
  }
  if (result.status === "complete") return { kind: "settle" };
  if (result.status === "needs_second_factor") {
    const totp = has(result.secondFactors, "totp");
    const backupCode = has(result.secondFactors, "backup_code");
    return {
      kind: "state",
      state: totp
        ? { kind: "totp", backupCode }
        : backupCode
          ? { kind: "backup-code", totp }
          : { kind: "blocked", message: VERIFY_ON_WEB },
    };
  }
  const password = result.firstFactors?.find(
    (factor) => factor.strategy === "password",
  );
  const email = result.firstFactors?.find(
    (factor) =>
      factor.strategy === "email_code" &&
      factor.emailAddressId !== null &&
      factor.emailAddressId !== undefined,
  );
  if (password !== undefined) {
    return {
      kind: "state",
      state: {
        kind: "password",
        emailAddressId: email?.emailAddressId ?? null,
      },
    };
  }
  if (email?.emailAddressId) {
    return {
      kind: "email-code",
      emailAddressId: email.emailAddressId,
      identifier: email.safeIdentifier ?? null,
    };
  }
  return { kind: "state", state: { kind: "blocked", message: VERIFY_ON_WEB } };
}

export function verifyDescription(state: VerifyState): string {
  switch (state.kind) {
    case "email-code":
      return state.identifier === null
        ? "Enter the code Capy sent to your email"
        : `Enter the code sent to ${state.identifier}`;
    case "totp":
      return "Enter the code from your authenticator app";
    case "backup-code":
      return "Enter one of the backup codes you saved when you set up two-step verification";
    default:
      return "This change needs a quick check that you're still you";
  }
}

export type ReverificationPrompt = { settle: (verified: boolean) => void };

let current: ReverificationPrompt | undefined;
const listeners = new Set<() => void>();

const publish = (prompt: ReverificationPrompt | undefined) => {
  current = prompt;
  for (const listener of listeners) listener();
};

export function requestDesktopReverification(): Promise<boolean> {
  current?.settle(false);
  return new Promise((resolve) => {
    const prompt: ReverificationPrompt = {
      settle: (verified) => {
        if (current === prompt) publish(undefined);
        resolve(verified);
      },
    };
    publish(prompt);
  });
}

export function subscribeReverification(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function currentReverification() {
  return current;
}
