import { describe, expect, it } from "vitest";
import { sampleGitSigning } from "@/data/mocks/users/fixtures";
import {
  ciModeOptions,
  conflictModeOptions,
  readGitSigning,
} from "./git-settings";

describe("mock response shapes", () => {
  it("reads the signing fixture's enabled/keyId fields", () => {
    const signing = readGitSigning(sampleGitSigning);
    expect(signing?.hasKey).toBe(true);
    expect(signing?.fingerprint).toBe("signing_sample_alex");
    expect(signing?.publicKey).toBe("ssh-ed25519 AAAAEXAMPLE alex@example.com");
  });

  it("offers the modes stored by the feedback mock", () => {
    expect(ciModeOptions.map((option) => option.value)).toContain("once");
    expect(conflictModeOptions.map((option) => option.value)).toContain("ask");
  });
});
