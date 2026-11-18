import { Layer } from "effect";
import { AnnouncementsMock } from "./announcements/index.ts";
import { ApiKeysMock } from "./apiKeys/index.ts";
import { AuditMock } from "./audit/index.ts";
import { AutomationsMock } from "./automations/index.ts";
import { AvatarMock } from "./avatar/index.ts";
import { BillingMock } from "./billing/index.ts";
import { CaptainsMock } from "./captains/index.ts";
import { ChildrenMock } from "./children/index.ts";
import { CloudAccessMock } from "./cloud-access/index.ts";
import { DevicesMock } from "./devices/index.ts";
import { EmailPreferencesMock } from "./emailPreferences/index.ts";
import { EventsMock } from "./events/index.ts";
import { ExperimentsMock } from "./experiments/index.ts";
import { ExploreMock } from "./explore/index.ts";
import { ExplorePublicMock } from "./explorePublic/index.ts";
import { FeedbackBotHealthMock } from "./feedback-bot-health/index.ts";
import { FeedbackBotsMock } from "./feedback-bots/index.ts";
import { FeedbackSettingsMock } from "./feedback-settings/index.ts";
import { FilesMock } from "./files/index.ts";
import { GitMock } from "./git/index.ts";
import { GithubMock } from "./github/index.ts";
import { HandoffsMock } from "./handoffs/index.ts";
import { IntegrationsMock } from "./integrations/index.ts";
import { InvitationsMock } from "./invitations/index.ts";
import { IssueLabelsMock } from "./issue-labels/index.ts";
import { IssueStatesMock } from "./issue-states/index.ts";
import { IssuesMock } from "./issues/index.ts";
import { JamsMock } from "./jams/index.ts";
import { MachinesMock } from "./machines/index.ts";
import { McpMock } from "./mcp/index.ts";
import { MembersMock } from "./members/index.ts";
import { MemoryMock } from "./memory/index.ts";
import { MobileConnectionMock } from "./mobileConnection/index.ts";
import { MobileSessionsMock } from "./mobileSessions/index.ts";
import { ModelsMock } from "./models/index.ts";
import { NotificationsMock } from "./notifications/index.ts";
import { OnboardingMock } from "./onboarding/index.ts";
import { OperationsMock } from "./operations/index.ts";
import { OrganizationsMock } from "./organizations/index.ts";
import { OrgsMock } from "./orgs/index.ts";
import { PaperMock } from "./paper/index.ts";
import { PluginsMock } from "./plugins/index.ts";
import { ProjectsMock } from "./projects/index.ts";
import { PromotionsMock } from "./promotions/index.ts";
import { PullGuidesMock } from "./pullGuides/index.ts";
import { PullsMock } from "./pulls/index.ts";
import { PushMock } from "./push/index.ts";
import { ReferralsMock } from "./referrals/index.ts";
import { ReposMock } from "./repos/index.ts";
import { RestoreMock } from "./restore/index.ts";
import { ReviewDefaultSettingsMock } from "./reviewDefaultSettings/index.ts";
import { ReviewFiltersMock } from "./reviewFilters/index.ts";
import { ReviewRulesMock } from "./reviewRules/index.ts";
import { ReviewsMock } from "./reviews/index.ts";
import { ServiceUsersMock } from "./serviceUsers/index.ts";
import { ThreadSessionsMock } from "./sessions/index.ts";
import { TelemetryMock } from "./telemetry/index.ts";
import { ThemesMock } from "./themes/index.ts";
import { ThreadCollectionMock } from "./threadCollection/index.ts";
import { ThreadOrganizationMock } from "./threadOrganization/index.ts";
import { UsersMock } from "./users/index.ts";
import { VolumesMock } from "./volumes/index.ts";
import { WallpapersMock } from "./wallpapers/index.ts";

export const MockGroups = Layer.mergeAll(
  AnnouncementsMock,
  ApiKeysMock,
  AuditMock,
  AutomationsMock,
  AvatarMock,
  BillingMock,
  CaptainsMock,
  ChildrenMock,
  CloudAccessMock,
  DevicesMock,
  EmailPreferencesMock,
  EventsMock,
  ExperimentsMock,
  ExploreMock,
  ExplorePublicMock,
  FeedbackBotHealthMock,
  FeedbackBotsMock,
  FeedbackSettingsMock,
  FilesMock,
  GitMock,
  GithubMock,
  HandoffsMock,
  IntegrationsMock,
  InvitationsMock,
  IssueLabelsMock,
  IssueStatesMock,
  IssuesMock,
  JamsMock,
  MachinesMock,
  McpMock,
  MembersMock,
  MemoryMock,
  MobileConnectionMock,
  MobileSessionsMock,
  ThreadSessionsMock,
  ModelsMock,
  NotificationsMock,
  OnboardingMock,
  OperationsMock,
  OrganizationsMock,
  OrgsMock,
  PaperMock,
  PluginsMock,
  ProjectsMock,
  PromotionsMock,
  PullGuidesMock,
  PullsMock,
  PushMock,
  ReferralsMock,
  ReposMock,
  RestoreMock,
  ReviewDefaultSettingsMock,
  ReviewFiltersMock,
  ReviewRulesMock,
  ReviewsMock,
  ServiceUsersMock,
  TelemetryMock,
  ThemesMock,
  ThreadCollectionMock,
  ThreadOrganizationMock,
  UsersMock,
  VolumesMock,
  WallpapersMock,
);
