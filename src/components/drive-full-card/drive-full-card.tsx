import { useAtom, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { organizationsAtom, useActiveOrgId } from "@/data/atoms/session";
import { planDialogAtom } from "@/lib/plan-dialog";
import { Button, type ButtonProps } from "@/primitives/button";
import { Card, CardContent } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import {
  type DriveFacts,
  driveUsageOnPlan,
  opensPaywall,
  recommendedDriveTier,
  upgradeTierNames,
} from "./drive-facts";

function useIsOrgAdmin() {
  const organizations = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(organizationsAtom)),
  );
  const activeOrgId = useActiveOrgId();
  const accessLevel = organizations?.find(
    (organization) => organization.id === activeOrgId,
  )?.accessLevel;
  return accessLevel === "admin" || accessLevel === "owner";
}

export type DriveUpgradeButtonProps = {
  facts: DriveFacts;
  intent?: ButtonProps["intent"];
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  short?: boolean;
};

export function DriveUpgradeButton({
  facts,
  intent,
  variant,
  size = "sm",
  short = false,
}: DriveUpgradeButtonProps) {
  const [, setDialog] = useAtom(planDialogAtom);
  const recommended = recommendedDriveTier(facts);
  if (recommended === undefined) return null;
  return (
    <Button
      data-track-owner="shared/drive-full-card.tsx#DriveUpgradeButton:Button.1"
      size={size}
      intent={intent}
      variant={variant}
      onClick={() =>
        setDialog({
          dialog:
            facts.tier !== null && opensPaywall(facts.tier)
              ? "paywall"
              : "plan",
          recommended,
        })
      }
    >
      {short ? "Upgrade" : `Upgrade to ${upgradeTierNames[recommended]}`}
    </Button>
  );
}

export type DriveFullCardProps = {
  facts: DriveFacts;
  lost: string;
  manageFiles?: boolean;
};

export function DriveFullCard({
  facts,
  lost,
  manageFiles = true,
}: DriveFullCardProps) {
  const [, setDialog] = useAtom(planDialogAtom);
  const isAdmin = useIsOrgAdmin();
  const upgradable = recommendedDriveTier(facts) !== undefined;
  return (
    <Card>
      <CardContent className="flex gap-2.5 p-4">
        <Icon
          name="exclamation-circle"
          className="size-(--icon-base) shrink-0 text-destructive"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm leading-4 font-medium text-foreground">
            Drive is full
          </span>
          <span className="text-sm font-normal text-muted-foreground-1">
            {driveUsageOnPlan(facts)}
          </span>
          <span className="text-sm font-normal text-muted-foreground-1">
            {lost}
          </span>
          {upgradable ? (
            !isAdmin && (
              <span className="text-sm font-normal text-muted-foreground-1">
                Ask an organization admin to upgrade
              </span>
            )
          ) : (
            <span className="text-sm font-normal text-muted-foreground-1">
              Contact Capy support for more storage
            </span>
          )}
          {((isAdmin && upgradable) || manageFiles) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {isAdmin && upgradable && (
                <>
                  <DriveUpgradeButton facts={facts} intent="accent" />
                  <Button
                    data-track-owner="shared/drive-full-card.tsx#DriveFullCard:Button[See plans]"
                    size="sm"
                    onClick={() => setDialog({ dialog: "plan" })}
                  >
                    See plans
                  </Button>
                </>
              )}
              {manageFiles && (
                <Button
                  data-track-owner="shared/drive-full-card.tsx#DriveFullCard:Button[Manage files]"
                  size="sm"
                  render={
                    <Link
                      data-track-owner="shared/drive-full-card.tsx#DriveFullCard:Link.1"
                      to="/drive"
                    />
                  }
                >
                  Manage files
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
