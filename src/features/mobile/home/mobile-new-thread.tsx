import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo, useRef, useState } from "react";
import { Composer, type ComposerHandle } from "@/components/composer";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";
import { composerCommands } from "@/features/composer/composer-commands";
import { useComposerSend } from "@/features/thread/use-composer-send";
import { Button } from "@/primitives/button";
import { MobileHome } from "./mobile-home";

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
  const composerRef = useRef<ComposerHandle>(null);
  const submit = useComposerSend();
  const commands = useMemo(
    () =>
      composerCommands({
        newThread: () => {
          composerRef.current?.reset(null);
          composerRef.current?.focus();
        },
      }),
    [],
  );
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
      composer={
        <Composer ref={composerRef} onSubmit={submit} commands={commands} />
      }
      onSelectProject={setSelectedId}
      onNewProject={() => {}}
      onManageProjects={() => {}}
    />
  );
}
