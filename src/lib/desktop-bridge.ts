export type DesktopPlatform = "darwin" | "win32" | "linux";

export type DesktopQuitDevice = { orgId: string; deviceId: string };

export type DesktopQuitRequest = {
  devices: DesktopQuitDevice[];
  askWhenIdle: boolean;
};

export type DesktopQuitBridge = {
  subscribe: (listener: (request: DesktopQuitRequest) => void) => () => void;
  answer: (answer: { quit: boolean; askWhenIdle: boolean }) => void;
};

export type DesktopFactor = {
  strategy: string;
  emailAddressId?: string | null;
  safeIdentifier?: string | null;
};

export type DesktopVerifyStep =
  | { kind: "start"; level: "first_factor" | "second_factor" | "multi_factor" }
  | { kind: "prepare-email-code"; emailAddressId: string }
  | { kind: "attempt-password"; password: string }
  | { kind: "attempt-email-code"; code: string }
  | { kind: "attempt-totp"; code: string }
  | { kind: "attempt-backup-code"; code: string };

export type DesktopVerifyResult =
  | { ok: false; message: string }
  | {
      ok: true;
      status: "complete" | "needs_first_factor" | "needs_second_factor";
      firstFactors?: DesktopFactor[];
      secondFactors?: DesktopFactor[];
    };

export type DesktopSessionBridge = {
  verify: (step: DesktopVerifyStep) => Promise<DesktopVerifyResult>;
};

export type CapyDesktopBridge = {
  platform?: string;
  quit?: DesktopQuitBridge;
  session?: DesktopSessionBridge;
};

declare global {
  interface Window {
    capyDesktop?: CapyDesktopBridge;
  }
}

export function desktopBridge(): CapyDesktopBridge | undefined {
  return typeof window === "undefined" ? undefined : window.capyDesktop;
}
