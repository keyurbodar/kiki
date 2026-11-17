import { useAtomValue } from "@effect/atom-react";
import { Link, useParams } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { SettingsPage, SettingsLoadFailedRow, SettingsSection } from "@/components/settings-page";
import { projectAtom } from "@/data/atoms/project-settings";
import { CardList } from "../shared/card-list";
import { useActiveOrgId } from "../shared/use-org";

export function ProjectEnvironmentPage() {
  const { projectId } = useParams({ strict: false });
  const orgId = useActiveOrgId();
  const result = useAtomValue(projectAtom(`${orgId}/${projectId}`));
  return (
    <SettingsPage title="Project environment" description="Where this project lives on your devices">
      {AsyncResult.isFailure(result) && (
        <SettingsLoadFailedRow label="Could not load the project" onRetry={() => {}} />
      )}
      {AsyncResult.isSuccess(result) && (
        <SettingsSection title="Project">
          <CardList>
            <Link to="/settings/projects/$projectId" params={{ projectId }} className="p-4">
              Back to {result.value.name}
            </Link>
          </CardList>
        </SettingsSection>
      )}
    </SettingsPage>
  );
}
