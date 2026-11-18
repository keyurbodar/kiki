import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo, useRef, useState } from "react";
import type { ComposerHandle, ComposerPayload } from "@/components/composer";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";
import { FabricBackdrop } from "@/features/home/home-page/fabric-backdrop";
import { DashboardBackdrop } from "@/features/settings-appearance/background-effect";
import { useAppearance } from "@/features/settings-appearance/model/appearance-store";
import { useComposerSend } from "@/features/thread/use-composer-send";
import { Button } from "@/primitives/button";
import {
  MobileComposer,
  MobileComposerAddTrigger,
  MobileComposerModelTrigger,
  mentionCategories,
} from "../composer";
import { MobileAddDrawer, MobileModelDrawer } from "../drawers";
import { modelSections } from "../thread";
import { mobileModelsAtom } from "../thread/atoms";
import { MobileHome } from "./mobile-home";

const mentionCategoryIds: ReadonlySet<string> = new Set(
  mentionCategories.map((category) => category.id),
);

export function MobileNewThread() {
  const organizations = AsyncResult.getOrElse(
    useAtomValue(organizationsAtom),
    () => [],
  );
  const orgId = organizations[0]?.id;
  return orgId === undefined ? null : <MobileNewThreadForOrg orgId={orgId} />;
}

function MobileNewThreadForOrg({
  orgId,
}: {
  orgId: Parameters<typeof projectsAtom>[0];
}) {
  const projects = AsyncResult.getOrElse(
    useAtomValue(projectsAtom(orgId)),
    () => [],
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [modelId, setModelId] = useState<string>();
  const composerRef = useRef<ComposerHandle>(null);
  const submit = useComposerSend();
  const models = useAtomValue(mobileModelsAtom);
  const sections = useMemo(
    () =>
      modelSections(AsyncResult.isSuccess(models) ? models.value : undefined),
    [models],
  );
  const model = sections
    .flatMap((section) => section.models)
    .find((option) => option.id === modelId);
  const { preferences } = useAppearance();
  const background = preferences.background;
  return (
    <MobileHome
      projects={projects.map((project) => ({
        id: project.id,
        name: project.name,
      }))}
      selectedProjectId={selectedId ?? projects[0]?.id}
      runOn={
        <Button variant="ghost" size="auto-sm" className="w-fit">
          Cloud
        </Button>
      }
      background={
        <>
          <FabricBackdrop effect={preferences.effect} />
          {background === null ? null : (
            <DashboardBackdrop
              image={background.url}
              effect={preferences.effect}
              appearance={background.appearance}
            />
          )}
        </>
      }
      composer={
        <MobileComposer
          ref={composerRef}
          onCommand={(command) => {
            if (command !== "new") return;
            composerRef.current?.reset(null);
            composerRef.current?.focus();
          }}
          onSend={(text) =>
            void submit({
              text,
              mentions: [],
              files: [],
            } satisfies ComposerPayload)
          }
          addMenu={
            <MobileAddDrawer
              trigger={<MobileComposerAddTrigger />}
              onSelect={(id) => {
                if (!mentionCategoryIds.has(id)) return;
                composerRef.current?.typeCharacter(`@${id}:`);
              }}
            />
          }
          modelMenu={
            <MobileModelDrawer
              sections={sections}
              selectedId={modelId}
              groupLabel="By provider"
              trigger={
                <MobileComposerModelTrigger label={model?.name ?? "Model"} />
              }
              onSelect={setModelId}
              onOpenSettings={() => {}}
              onGroupBy={() => {}}
            />
          }
        />
      }
      onSelectProject={setSelectedId}
      onNewProject={() => {}}
      onManageProjects={() => {}}
    />
  );
}
