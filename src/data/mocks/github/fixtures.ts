import { isoMinutesAgo } from "../fixtures/world.ts";

export interface SecondaryGitHubAccount {
  readonly id: string;
  readonly login: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly connectedAt: string;
  readonly scopes: ReadonlyArray<string>;
  readonly connected: boolean;
}

export const sampleSecondaryGitHubAccount: SecondaryGitHubAccount = {
  id: "gh_sample_secondary",
  login: "alex-morgan-sample",
  name: "Alex Morgan (sample)",
  avatarUrl: "https://avatars.example.com/alex-morgan-sample",
  connectedAt: isoMinutesAgo(60 * 24 * 12),
  scopes: ["repo", "read:org", "read:user"],
  connected: true,
};
