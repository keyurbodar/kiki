import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";

export type SkillListingVersion = {
  id: string;
  version: string | null;
  notes?: string | null;
};

export type SkillListing = {
  card: {
    displayName: string;
    version: string | null;
    versionId: string | null;
  };
  versions: readonly SkillListingVersion[];
};

export type SkillUpdateRequest = { slug: string; scope: string };

export type SkillUpdateCardProps = {
  slug: string;
  versionId: string;
  scope: string;
  listing?: SkillListing;
  onUpdate?: (request: SkillUpdateRequest) => Promise<unknown>;
};

export function skillUpdateState(listing: SkillListing, versionId: string) {
  const installed = listing.versions.find(
    (version) => version.id === versionId || version.version === versionId,
  );
  const updateAvailable =
    listing.card.versionId !== null &&
    listing.card.versionId !== versionId &&
    listing.card.version !== versionId;
  return {
    installed,
    updateAvailable,
    updateDescription: `${(listing.versions[0]?.notes ?? "A newer version is in Explore").replace(/\.$/, "")}. Update replaces this folder, so edits made here are replaced too`,
    status: updateAvailable
      ? `Your copy stays at ${installed?.version ?? "its version"} until you update`
      : "Up to date with the listing",
  };
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message !== "" ? error.message : fallback;

export function SkillUpdateCard({
  slug,
  versionId,
  scope,
  listing,
  onUpdate,
}: SkillUpdateCardProps) {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  if (listing === undefined) return null;
  const { installed, updateAvailable, updateDescription, status } =
    skillUpdateState(listing, versionId);
  const update = () => {
    if (onUpdate === undefined || updating) return;
    setUpdating(true);
    onUpdate({ slug, scope })
      .then(() =>
        toast.success(`Updated ${listing.card.displayName}`, {
          description:
            listing.card.version === null
              ? undefined
              : `Now on ${listing.card.version}`,
        }),
      )
      .catch((error: unknown) =>
        toast.error(
          errorMessage(error, `Could not update ${listing.card.displayName}`),
        ),
      )
      .finally(() => setUpdating(false));
  };
  return (
    <Card rows>
      {updateAvailable ? (
        <SettingsRow
          label={
            <span className="flex items-center gap-2">
              Update available
              {listing.card.version !== null && (
                <Badge size="sm">{listing.card.version}</Badge>
              )}
            </span>
          }
          description={updateDescription}
        >
          <Button
            intent="accent"
            size="sm"
            disabled={updating}
            aria-busy={updating || undefined}
            onClick={update}
          >
            {updating ? "Updating" : "Update"}
          </Button>
        </SettingsRow>
      ) : null}
      <SettingsRow label="Added from Explore" description={status}>
        <span className="text-sm text-muted-foreground-1 tabular-nums">
          {installed?.version}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            void navigate({
              to: "/explore/$kind/$slug",
              params: { kind: "skills", slug },
            })
          }
        >
          View in Explore
        </Button>
      </SettingsRow>
    </Card>
  );
}
