import { HttpApi } from "effect/http-api";
import { AnnouncementsGroup } from "./groups/announcements.ts";
import { ApiKeysGroup } from "./groups/apiKeys.ts";
import { AuditGroup } from "./groups/audit.ts";
import { AutomationsGroup } from "./groups/automations.ts";
import { AvatarGroup } from "./groups/avatar.ts";
import { BillingGroup } from "./groups/billing.ts";
import { CaptainsGroup } from "./groups/captains.ts";
import { ChildrenGroup } from "./groups/children.ts";
import { CloudAccessGroup } from "./groups/cloud-access.ts";
import { DevicesGroup } from "./groups/devices.ts";
import { EmailPreferencesGroup } from "./groups/emailPreferences.ts";
import { EventsGroup } from "./groups/events.ts";
import { ExperimentsGroup } from "./groups/experiments.ts";
import { ExploreGroup } from "./groups/explore.ts";
import { ExplorePublicGroup } from "./groups/explorePublic.ts";
import { FeedbackBotHealthGroup } from "./groups/feedback-bot-health.ts";
import { FeedbackBotsGroup } from "./groups/feedback-bots.ts";
import { FeedbackSettingsGroup } from "./groups/feedback-settings.ts";
import { FilesGroup } from "./groups/files.ts";
import { GitGroup } from "./groups/git.ts";
import { GithubGroup } from "./groups/github.ts";
import { HandoffsGroup } from "./groups/handoffs.ts";
import { IntegrationsGroup } from "./groups/integrations.ts";
import { InvitationsGroup } from "./groups/invitations.ts";
import { IssueLabelsGroup } from "./groups/issue-labels.ts";
import { IssueStatesGroup } from "./groups/issue-states.ts";
import { IssuesGroup } from "./groups/issues.ts";
import { JamsGroup } from "./groups/jams.ts";
import { MachinesGroup } from "./groups/machines.ts";
import { McpGroup } from "./groups/mcp.ts";
import { MembersGroup } from "./groups/members.ts";
import { MemoryGroup } from "./groups/memory.ts";
import { MobileConnectionGroup } from "./groups/mobileConnection.ts";
import { MobileSessionsGroup } from "./groups/mobileSessions.ts";
import { ModelsGroup } from "./groups/models.ts";
import { NotificationsGroup } from "./groups/notifications.ts";
import { OnboardingGroup } from "./groups/onboarding.ts";
import { OperationsGroup } from "./groups/operations.ts";
import { OrganizationsGroup } from "./groups/organizations.ts";
import { OrgsGroup } from "./groups/orgs.ts";
import { PaperGroup } from "./groups/paper.ts";
import { PluginsGroup } from "./groups/plugins.ts";
import { ProjectsGroup } from "./groups/projects.ts";
import { PromotionsGroup } from "./groups/promotions.ts";
import { PullsGroup } from "./groups/pulls.ts";
import { PushGroup } from "./groups/push.ts";
import { ReferralsGroup } from "./groups/referrals.ts";
import { ReposGroup } from "./groups/repos.ts";
import { RestoreGroup } from "./groups/restore.ts";
import { ReviewDefaultSettingsGroup } from "./groups/reviewDefaultSettings.ts";
import { ReviewFiltersGroup } from "./groups/reviewFilters.ts";
import { ReviewRulesGroup } from "./groups/reviewRules.ts";
import { ReviewsGroup } from "./groups/reviews.ts";
import { ServiceUsersGroup } from "./groups/serviceUsers.ts";
import { TelemetryGroup } from "./groups/telemetry.ts";
import { ThemesGroup } from "./groups/themes.ts";
import { ThreadCollectionGroup } from "./groups/threadCollection.ts";
import { ThreadOrganizationGroup } from "./groups/threadOrganization.ts";
import { UsersGroup } from "./groups/users.ts";
import { VolumesGroup } from "./groups/volumes.ts";
import { WallpapersGroup } from "./groups/wallpapers.ts";

export class KikiApi extends HttpApi.make("kiki").add(
  AnnouncementsGroup,
  ApiKeysGroup,
  AuditGroup,
  AutomationsGroup,
  AvatarGroup,
  BillingGroup,
  CaptainsGroup,
  ChildrenGroup,
  CloudAccessGroup,
  DevicesGroup,
  EmailPreferencesGroup,
  EventsGroup,
  ExperimentsGroup,
  ExploreGroup,
  ExplorePublicGroup,
  FeedbackBotHealthGroup,
  FeedbackBotsGroup,
  FeedbackSettingsGroup,
  FilesGroup,
  GitGroup,
  GithubGroup,
  HandoffsGroup,
  IntegrationsGroup,
  InvitationsGroup,
  IssueLabelsGroup,
  IssueStatesGroup,
  IssuesGroup,
  JamsGroup,
  MachinesGroup,
  McpGroup,
  MembersGroup,
  MemoryGroup,
  MobileConnectionGroup,
  MobileSessionsGroup,
  ModelsGroup,
  NotificationsGroup,
  OnboardingGroup,
  OperationsGroup,
  OrganizationsGroup,
  OrgsGroup,
  PaperGroup,
  PluginsGroup,
  ProjectsGroup,
  PromotionsGroup,
  PullsGroup,
  PushGroup,
  ReferralsGroup,
  ReposGroup,
  RestoreGroup,
  ReviewDefaultSettingsGroup,
  ReviewFiltersGroup,
  ReviewRulesGroup,
  ReviewsGroup,
  ServiceUsersGroup,
  TelemetryGroup,
  ThemesGroup,
  ThreadCollectionGroup,
  ThreadOrganizationGroup,
  UsersGroup,
  VolumesGroup,
  WallpapersGroup,
) {}

export const groupIds = [
  "announcements",
  "apiKeys",
  "audit",
  "automations",
  "avatar",
  "billing",
  "captains",
  "children",
  "cloud-access",
  "devices",
  "emailPreferences",
  "events",
  "experiments",
  "explore",
  "explorePublic",
  "feedback-bot-health",
  "feedback-bots",
  "feedback-settings",
  "files",
  "git",
  "github",
  "handoffs",
  "integrations",
  "invitations",
  "issue-labels",
  "issue-states",
  "issues",
  "jams",
  "machines",
  "mcp",
  "members",
  "memory",
  "mobileConnection",
  "mobileSessions",
  "models",
  "notifications",
  "onboarding",
  "operations",
  "organizations",
  "orgs",
  "paper",
  "plugins",
  "projects",
  "promotions",
  "pulls",
  "push",
  "referrals",
  "repos",
  "restore",
  "reviewDefaultSettings",
  "reviewFilters",
  "reviewRules",
  "reviews",
  "serviceUsers",
  "telemetry",
  "themes",
  "threadCollection",
  "threadOrganization",
  "users",
  "volumes",
  "wallpapers",
] as const;
