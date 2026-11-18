import { useAtomSet } from "@effect/atom-react";
import { type ComponentProps, useState } from "react";
import { FailedRead } from "@/components/failed-read";
import {
  SettingsLoadingCard,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import { reactivityKeys } from "@/data/atoms/conventions";
import {
  reviewDefaultsAtom,
  reviewReactivityKeys,
  setPullGuidesAtom,
  setReviewDefaultsAtom,
} from "@/data/atoms/reviews";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import { ReviewFiltersSections } from "../review-filters-page/review-filters-sections";
import { ReviewRulesSection } from "../review-rules/review-rules-section";
import { CheckIcon, ChevronDownIcon } from "./review-icons";
import {
  customModePayload,
  errorMessage,
  flexTierCopy,
  type ReviewDefaults,
  type ReviewTier,
  reviewTierCopy,
  reviewTierState,
} from "./review-model";
import {
  checkClass,
  MenuRowLabel,
  ReviewAdminNotice,
  ReviewTierMenu,
  useQuery,
  useReviewOrg,
} from "./review-shared";

export function ReviewAgentConfigPage() {
  const { orgId, orgFailed, refreshOrganizations } = useReviewOrg();
  return (
    <SettingsPage
      title="Agent config"
      description="How thorough Capy is, what it skips, and what it follows"
      headerContent={<ReviewAdminNotice scope="agent" />}
    >
      {orgFailed ? (
        <FailedRead
          slot="review-config-failed"
          line="Couldn't load your organization"
          sub="Check your connection and try again"
          onRetry={refreshOrganizations}
        />
      ) : orgId === undefined ? (
        <SettingsSection title="Review tiers" description={tiersDescription}>
          <SettingsLoadingCard />
        </SettingsSection>
      ) : (
        <>
          <ReviewTiersSection orgId={orgId} />
          <GuidesSection orgId={orgId} />
          <ReviewFiltersSections orgId={orgId} />
          <ReviewRulesSection orgId={orgId} />
        </>
      )}
    </SettingsPage>
  );
}

const tiersDescription =
  "Choose the review tier for each pull request; higher tiers cost more per round";
const followUpCopy =
  "Pushes after the first review; a smaller diff usually needs less";

type DefaultsPatch = {
  tier?: ReviewTier | null;
  incrementalTier?: ReviewTier | "flex" | null;
};

function ReviewTiersSection({ orgId }: { orgId: OrgId }) {
  const defaults = useQuery(reviewDefaultsAtom(orgId)).value as
    | ReviewDefaults
    | undefined;
  const setDefaults = useAtomSet(setReviewDefaultsAtom, { mode: "promise" });
  const { isAdmin, adminReason } = useReviewOrg();
  const [busy, setBusy] = useState(false);
  const onChange = (patch: DefaultsPatch) => {
    setBusy(true);
    setDefaults({
      params: { orgId },
      payload: patch,
      reactivityKeys: [reviewReactivityKeys.defaults(orgId)],
    })
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not update the review tier")),
      )
      .finally(() => setBusy(false));
  };
  return (
    <SettingsSection title="Review tiers" description={tiersDescription}>
      <ReviewTiersCard
        defaults={defaults}
        busy={busy}
        isAdmin={isAdmin}
        adminReason={adminReason}
        onChange={onChange}
      />
    </SettingsSection>
  );
}

function TierButton({
  label,
  ariaLabel,
  disabled,
  title,
  ...props
}: Omit<ComponentProps<typeof Button>, "aria-label"> & {
  label: string;
  ariaLabel: string;
}) {
  return (
    <Button
      {...props}
      variant="ghost"
      size="sm"
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
    >
      {label}
      <ChevronDownIcon />
    </Button>
  );
}

function ReviewTiersCard({
  defaults,
  busy,
  isAdmin,
  adminReason,
  onChange,
}: {
  defaults?: ReviewDefaults;
  busy: boolean;
  isAdmin: boolean;
  adminReason?: string;
  onChange: (patch: DefaultsPatch) => void;
}) {
  if (defaults === undefined)
    return (
      <Card>
        <div className="flex flex-col gap-2 p-4">
          <SkeletonPanel className="h-4 w-1/3" />
          <SkeletonPanel className="h-4 w-1/2" />
        </div>
      </Card>
    );
  const { flex, firstPinned, followUpPinned, pinnedFollowUp } =
    reviewTierState(defaults);
  const pinned = (ariaLabel: string) =>
    isAdmin ? (
      <TierButton label="Custom" ariaLabel={ariaLabel} disabled />
    ) : (
      <span className="text-sm">Custom</span>
    );
  const locked = isAdmin ? undefined : adminReason;

  if (firstPinned)
    return (
      <Card rows>
        <SettingsRow
          id="review-effort"
          label="Mode"
          description="Review model is managed by Capy"
        >
          {pinned("Review tier mode")}
        </SettingsRow>
        <SettingsRow label="First review" description="Managed by Capy">
          {pinned("First review tier")}
        </SettingsRow>
        <SettingsRow
          label="Follow-up reviews"
          description={
            pinnedFollowUp === undefined ? "Managed by Capy" : followUpCopy
          }
        >
          {pinnedFollowUp === undefined ? (
            pinned("Follow-up review tier")
          ) : isAdmin ? (
            <ReviewTierMenu
              value={pinnedFollowUp}
              onPick={(tier) => onChange({ incrementalTier: tier })}
              trigger={
                <TierButton
                  label={reviewTierCopy[pinnedFollowUp].label}
                  ariaLabel="Follow-up review tier"
                  disabled={busy}
                />
              }
            />
          ) : (
            <span className="text-sm">
              {reviewTierCopy[pinnedFollowUp].label}
            </span>
          )}
        </SettingsRow>
      </Card>
    );

  const first =
    defaults.effectiveTier === null
      ? undefined
      : reviewTierCopy[defaults.effectiveTier];
  const followUp =
    defaults.effectiveIncrementalTier === null
      ? undefined
      : reviewTierCopy[defaults.effectiveIncrementalTier];
  return (
    <Card rows>
      <SettingsRow
        id="review-effort"
        label="Mode"
        description={
          flex
            ? flexTierCopy.description
            : "Choose the first-review and follow-up levels yourself"
        }
      >
        {isAdmin ? (
          <Menu>
            <MenuTrigger
              render={
                <TierButton
                  label={flex ? "Flex" : "Custom"}
                  ariaLabel="Review tier mode"
                  disabled={
                    busy || (defaults.modelPinned && defaults.tier !== null)
                  }
                  title={locked}
                />
              }
            />
            <MenuContent align="end" className="w-80">
              <MenuItem
                density="rich"
                onClick={() => {
                  if (!flex) onChange({ incrementalTier: "flex" });
                }}
              >
                <MenuRowLabel
                  density="rich"
                  label="Flex"
                  description={flexTierCopy.description}
                  trailing={flex ? <CheckIcon className={checkClass} /> : null}
                />
              </MenuItem>
              <MenuItem
                density="rich"
                onClick={() => {
                  if (flex) onChange(customModePayload(defaults));
                }}
              >
                <MenuRowLabel
                  density="rich"
                  label="Custom"
                  description="Pick the first-review and follow-up levels"
                  trailing={flex ? null : <CheckIcon className={checkClass} />}
                />
              </MenuItem>
            </MenuContent>
          </Menu>
        ) : (
          <span className="text-sm">{flex ? "Flex" : "Custom"}</span>
        )}
      </SettingsRow>
      {!flex && (
        <SettingsRow
          label="First review"
          description={
            first === undefined
              ? "Managed by Capy"
              : defaults.tier === null
                ? `${first.description} (default)`
                : first.description
          }
        >
          {isAdmin ? (
            <ReviewTierMenu
              value={defaults.tier}
              defaultLabel={
                defaults.modelPinned ? undefined : "Platform default"
              }
              onPick={(tier) => onChange({ tier })}
              trigger={
                <TierButton
                  label={first?.label ?? "Configured model"}
                  ariaLabel="First review tier"
                  disabled={busy}
                />
              }
            />
          ) : (
            <span className="text-sm">{first?.label ?? "Custom"}</span>
          )}
        </SettingsRow>
      )}
      {!flex && (
        <SettingsRow
          label="Follow-up reviews"
          description={
            followUpPinned || followUp === undefined
              ? "Managed by Capy"
              : followUpCopy
          }
        >
          {isAdmin ? (
            followUpPinned ? (
              pinned("Follow-up review tier")
            ) : (
              <ReviewTierMenu
                value={
                  defaults.incrementalTier === "flex"
                    ? null
                    : defaults.incrementalTier
                }
                defaultLabel={
                  defaults.incrementalModelPinned
                    ? undefined
                    : "Same as first review"
                }
                onPick={(tier) => onChange({ incrementalTier: tier })}
                trigger={
                  <TierButton
                    label={
                      defaults.incrementalTier === null
                        ? "Same as first review"
                        : (followUp?.label ?? "Configured model")
                    }
                    ariaLabel="Follow-up review tier"
                    disabled={busy}
                  />
                }
              />
            )
          ) : (
            <span className="text-sm">
              {followUpPinned
                ? "Custom"
                : defaults.incrementalTier === null
                  ? "Same as first review"
                  : (followUp?.label ?? "Custom")}
            </span>
          )}
        </SettingsRow>
      )}
    </Card>
  );
}

const guidesDescription =
  "Review pull requests in chapters with summaries linked to the changed files";

function GuidesSection({ orgId }: { orgId: OrgId }) {
  const { org, isAdmin, adminReason } = useReviewOrg();
  const setGuides = useAtomSet(setPullGuidesAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);
  const enabled = org?.pullGuidesEnabled;
  if (enabled === undefined)
    return (
      <SettingsSection title="Guides" description={guidesDescription}>
        <SettingsLoadingCard />
      </SettingsSection>
    );
  const onChange = (next: boolean) => {
    setBusy(true);
    setGuides({
      params: { orgId },
      payload: { enabled: next },
      reactivityKeys: [reactivityKeys.organizations],
    })
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not update guides")),
      )
      .finally(() => setBusy(false));
  };
  return (
    <SettingsSection title="Guides" description={guidesDescription}>
      <Card rows>
        <SettingsRow
          id="review-guides"
          label="Generate pull request guides"
          description="Writes a guide when someone opens the pull request in Capy"
        >
          {isAdmin ? (
            <Switch
              checked={enabled}
              disabled={busy}
              title={adminReason}
              aria-label="Generate pull request guides"
              onCheckedChange={onChange}
            />
          ) : (
            <span className="text-sm">{enabled ? "On" : "Off"}</span>
          )}
        </SettingsRow>
      </Card>
    </SettingsSection>
  );
}
