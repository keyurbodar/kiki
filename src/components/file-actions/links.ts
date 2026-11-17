import type { PullRef } from "@/components/diff-tab/model";

export const githubBlobUrl = (pull: PullRef, path: string) =>
  `https://github.com/${pull.repo}/blob/${pull.diffPair?.head ?? pull.headSha}/${path}`;

export const appFileUrl = (origin: string, pull: PullRef, path: string) =>
  `${origin}/pull/${pull.repo}/${pull.number}?tab=diff#${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
