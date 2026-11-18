import {
  LinearLinkPreview,
  SlackLinkPreview,
} from "../../api/schemas/integrationOAuth.ts";
import {
  isoMinutesAgo,
  org,
  people,
  projects,
  repos,
  threads,
  world,
} from "../fixtures/world.ts";

export const sampleGitHubUser = {
  id: "gh_user_sample_alex",
  login: people.alex.githubLogin,
  name: `${people.alex.firstName} ${people.alex.lastName}`,
  email: people.alex.email,
  avatarUrl: "https://avatars.example.com/alex-sample.png",
  scopes: ["repo", "read:user"],
  connectedAt: isoMinutesAgo(6 * 24 * 60),
};

export const sampleGitHubInstallation = {
  id: "ghi_sample_acme",
  account: { login: "acme", type: "Organization", id: "gh_org_sample_acme" },
  appId: "app_sample_capy",
  suspended: false,
  permissions: { contents: "read", pull_requests: "write" },
  repositorySelection: "selected",
  installedAt: isoMinutesAgo(14 * 24 * 60),
};

export const sampleGitHubReachableInstallations = [
  sampleGitHubInstallation,
  {
    id: "ghi_sample_acme_sandbox",
    account: {
      login: "acme-sandbox",
      type: "Organization",
      id: "gh_org_sample_sandbox",
    },
    appId: "app_sample_capy",
    suspended: false,
    permissions: { contents: "read", pull_requests: "write" },
    repositorySelection: "all",
    installedAt: isoMinutesAgo(21 * 24 * 60),
  },
];

const day = 24 * 60;

/** Minutes since the last push, per repository in `repos`, in the same order. */
const repoPushedMinutesAgo = [
  1 * day,
  2 * day,
  2 * day,
  9 * day,
  20 * day,
  2 * day,
];

export const sampleGitHubInstallationRepos = repos.map((repo, index) => ({
  id: repo.id.replace("repo_sample_", "gh_repo_sample_"),
  githubRepoId: 42_100 + index,
  name: repo.fullName.split("/")[1],
  fullName: repo.fullName,
  repoFullName: repo.fullName,
  private: repo.private,
  defaultBranch: repo.defaultBranch,
  selected: repo.fullName !== "acme/legacy-site",
  archived: false,
  pushedAt: isoMinutesAgo(repoPushedMinutesAgo[index] ?? 2 * day),
}));

export const sampleGitHubWorkspace = {
  login: "acme",
  name: "Acme",
  type: "Organization",
  installationId: sampleGitHubInstallation.id,
  repositories: sampleGitHubInstallationRepos
    .filter((repo) => repo.selected)
    .map((repo) => repo.fullName),
  defaultRepository: repos[0].fullName,
  connectedAt: sampleGitHubInstallation.installedAt,
};

export const sampleLinearConnection = {
  id: "linear_conn_sample_acme",
  organizationName: "Acme sample",
  organizationUrl: "https://linear.example.com/acme",
  teamId: "team_sample_web",
  teamName: "Web app",
  teamKey: "WEB",
  defaultIssueStateId: world.issueStates[4].id,
  connectedById: people.alex.id,
  connectedAt: isoMinutesAgo(12 * 24 * 60),
};

export const sampleLinearLabels = world.issueLabels.map((label) => ({
  id: label.id.replace("lbl_sample_", "linear_lbl_sample_"),
  name: label.name,
  color: label.color,
}));

export const sampleLinearTeams = [
  projects.web,
  projects.api,
  projects.docs,
].map((project) => ({
  id: `team_sample_${project.code.toLowerCase()}`,
  key: project.code,
  name: project.name,
}));

export interface LinearLink {
  readonly id: string;
  readonly threadId: string;
  readonly issueId: string;
  readonly issueKey: string;
  readonly issueTitle: string;
  readonly issueUrl: string;
  readonly linkedById: string;
  readonly createdAt: string;
}

export const sampleLinearTemplate = {
  id: "lin_link_sample_1",
  threadId: threads.checkoutTest.id,
  issueId: "lin_issue_sample_41",
  issueKey: "WEB-41",
  issueTitle: "Fix flaky checkout test",
  issueUrl: "https://linear.example.com/acme/WEB-41",
  linkedById: people.alex.id,
  createdAt: isoMinutesAgo(2 * 24 * 60),
};

export const sampleLinearLinks: ReadonlyArray<LinearLink> = [
  sampleLinearTemplate,
];

export const samplePaperConnection = {
  id: "paper_conn_sample_acme",
  email: people.alex.email,
  displayName: `${people.alex.firstName} ${people.alex.lastName}`,
  workspaceName: "Acme",
  connectedAt: isoMinutesAgo(9 * 24 * 60),
};

export const sampleSlackConnection = {
  id: "slack_conn_sample_acme",
  teamId: "T_SAMPLE_ACME",
  teamName: "Acme sample",
  userId: "U_SAMPLE_ALEX",
  userName: people.alex.githubLogin,
  botUserId: "U_SAMPLE_BOT",
  defaultChannelId: "C_SAMPLE_GENERAL",
  notificationsEnabled: true,
  connectedById: people.alex.id,
  connectedAt: isoMinutesAgo(20 * 24 * 60),
};

export const sampleSlackChannel = {
  id: "C_SAMPLE_GENERAL",
  name: "general",
  isPrivate: false,
  isMember: true,
};

export const sampleSlackChannels = [
  sampleSlackChannel,
  {
    id: "C_SAMPLE_RELEASES",
    name: "releases",
    isPrivate: false,
    isMember: true,
  },
  {
    id: "C_SAMPLE_INCIDENTS",
    name: "incidents",
    isPrivate: true,
    isMember: true,
  },
];

export const sampleSlackEmojis = [
  { name: "eyes", value: "eyes" },
  { name: "white_check_mark", value: "white_check_mark" },
  { name: "hourglass", value: "hourglass" },
];

export interface SlackLink {
  readonly id: string;
  readonly threadId: string;
  readonly channelId: string;
  readonly channelName: string;
  readonly messageTs: string;
  readonly linkedById: string;
  readonly createdAt: string;
}

export const sampleSlackTemplate = {
  id: "slack_link_sample_1",
  threadId: threads.darkMode.id,
  channelId: "C_SAMPLE_RELEASES",
  channelName: "releases",
  messageTs: "1740000000.000100",
  linkedById: people.sam.id,
  createdAt: isoMinutesAgo(60),
};

export const sampleSlackLinks: ReadonlyArray<SlackLink> = [sampleSlackTemplate];

export const sampleSlackUsers = world.members.map((member, index) => ({
  id: index === 0 ? "U_SAMPLE_ALEX" : `U_SAMPLE_${member.id.toUpperCase()}`,
  name: member.githubLogin,
  realName: `${member.firstName} ${member.lastName}`,
  email: member.email,
  deleted: false,
  isBot: false,
}));

export const sampleSlackUserRead = {
  id: "slack_read_sample_acme",
  enabled: true,
  access: "organization",
  invitedById: people.alex.id,
  updatedAt: isoMinutesAgo(3 * 24 * 60),
  requests: [
    {
      id: "slack_access_sample_1",
      userId: people.priya.id,
      externalUserId: "U_SAMPLE_PRIYA",
      status: "pending",
      scopes: ["channels:history", "users:read"],
      requestedAt: isoMinutesAgo(4 * 60),
    },
    {
      id: "slack_access_sample_2",
      userId: people.jordan.id,
      externalUserId: "U_SAMPLE_JORDAN",
      status: "granted",
      scopes: ["channels:history"],
      requestedAt: isoMinutesAgo(2 * 24 * 60),
    },
  ],
};

export const sampleThreadSlackUserReadAccess = [
  {
    threadId: threads.darkMode.id,
    accessId: "slack_access_sample_2",
    userId: people.jordan.id,
    status: "granted",
    scopes: ["channels:history"],
  },
];

export const sampleTailscaleConnection = {
  id: "tailscale_sample_acme",
  tailnet: "acme.example.com",
  connected: true,
  tags: ["tag:acme-agents"],
  connectedById: people.sam.id,
  connectedAt: isoMinutesAgo(8 * 24 * 60),
};

export const sampleOAuthStart = (provider: string, state: string) => ({
  provider,
  state,
  authorizationUrl: `https://accounts.example.com/${provider}/authorize?state=${state}`,
  expiresAt: isoMinutesAgo(-10),
});

export const sampleSlackLinkPreview = new SlackLinkPreview({
  externalUserId: "U_SAMPLE_ALEX",
  externalUserName: `${people.alex.firstName} ${people.alex.lastName}`,
  avatarUrl: "https://avatars.example.com/alex-sample.png",
  workspaceName: "Acme sample",
  orgName: org.name,
});

export const sampleLinearLinkPreview = new LinearLinkPreview({
  externalUserId: "lin_user_sample_alex",
  externalUserName: `${people.alex.firstName} ${people.alex.lastName}`,
  workspaceName: "Acme sample",
  orgName: org.name,
});
