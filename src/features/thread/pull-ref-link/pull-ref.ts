export type PullRefState =
  | "ready"
  | "pending"
  | "draft"
  | "merged"
  | "failed"
  | "closed";

export type PullRef = {
  repo: string;
  number: number;
  state: PullRefState;
  url: string;
};

export type PullRefTarget = { repositoryFullName: string; number: number };

const pullUrl =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/([1-9]\d*)\/?$/i;

export function parsePullHref(href: string): PullRefTarget | undefined {
  const match = pullUrl.exec(href);
  if (match === null) return undefined;
  return {
    repositoryFullName: `${match[1]}/${match[2]}`,
    number: Number(match[3]),
  };
}

export const pullRefKey = (repo: string, number: number) =>
  `${repo.toLowerCase()}#${number}`;

export function pullRouteParams(repo: string, number: number) {
  const [owner = "", name = repo] = repo.split("/");
  return { owner, repo: name, prNumber: String(number) };
}

export const isModifiedClick = (event: {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}) => event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
