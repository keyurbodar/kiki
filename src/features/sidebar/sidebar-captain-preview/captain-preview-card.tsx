import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import {
  findGroup,
  groupModels,
  parseEntries,
} from "@/components/model-picker/catalog";
import type { SidebarCaptain } from "@/components/sidebar-threads";
import { previewOrigin, ThreadPreview } from "@/components/thread-preview";
import type { CaptainCard } from "@/data/api/schemas/captain";
import { modelsAtom } from "@/data/atoms/models";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import { useCaptainCrew } from "@/features/captains/overview/use-captain";
import {
  LinearIcon,
  SlackIcon,
} from "@/features/settings-integrations/integrations/brand-icons";

const originIconFor = (origin: CaptainCard["origin"]) => {
  const preview = previewOrigin(origin);
  if (preview === "slack")
    return (
      <span className="size-3 shrink-0 [&_svg]:size-full">
        <SlackIcon />
      </span>
    );
  if (preview === "linear")
    return (
      <span className="size-3 shrink-0 [&_svg]:size-full">
        <LinearIcon />
      </span>
    );
  return undefined;
};

/** A Captain's hover card: the same preview a thread row opens, in captain mode. */
export function CaptainPreviewCard({
  captain,
}: {
  captain: SidebarCaptain & { card: CaptainCard };
}) {
  const card = captain.card;
  const organizations = AsyncResult.getOrElse(
    useAtomValue(organizationsAtom),
    () => [],
  );
  const orgId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const catalog = useAtomValue(modelsAtom(orgId ?? ""));
  const entries = useMemo(
    () => (AsyncResult.isSuccess(catalog) ? parseEntries(catalog.value) : []),
    [catalog],
  );
  const crew = useCaptainCrew(orgId, card.id);
  const model = useMemo(() => {
    if (card.lastModelId === null) return undefined;
    const group = findGroup(groupModels(entries), card.lastModelId);
    return group === undefined ? undefined : { name: group.name };
  }, [entries, card.lastModelId]);
  return (
    <ThreadPreview
      thread={card}
      description={captain.preview}
      originIcon={originIconFor(card.origin)}
      model={model}
      crew={(crew ?? []).map((member) => ({
        id: member.id,
        title: member.title,
        needsYou: member.needsYou,
      }))}
    />
  );
}
