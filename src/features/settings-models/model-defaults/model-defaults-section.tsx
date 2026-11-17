import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { toast } from "sonner";
import {
  SettingsLoadFailedRow,
  SettingsSection,
} from "@/components/settings-page";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import { DefaultModelsSection } from "./model-chooser";
import {
  modelsCatalogAtom,
  setOrgDefaultModelAtom,
  setSurfaceDefaultModelAtom,
  surfaceDefaultModelAtom,
  updatePreferencesAtom,
} from "./model-defaults.atoms";
import {
  extractCatalog,
  fromSelection,
  type ModelEntry,
  type ModelSelection,
  toSelection,
} from "./model-selection";

const surfaceLabels: Record<string, string> = {
  slack: "Slack",
  linear: "Linear",
};

export function ModelDefaultsSection() {
  const user = useAtomValue(currentUserAtom);
  const organizations = useAtomValue(organizationsAtom);
  const catalogResult = useAtomValue(modelsCatalogAtom);
  const organization = AsyncResult.isSuccess(organizations)
    ? organizations.value[0]
    : undefined;
  const orgId = organization?.id ?? "";
  const slack = useAtomValue(surfaceDefaultModelAtom(orgId, "slack"));
  const linear = useAtomValue(surfaceDefaultModelAtom(orgId, "linear"));
  const saveWeb = useAtomSet(updatePreferencesAtom, { mode: "promise" });
  const saveOrg = useAtomSet(setOrgDefaultModelAtom, { mode: "promise" });
  const saveSurface = useAtomSet(setSurfaceDefaultModelAtom, {
    mode: "promise",
  });

  const profile = AsyncResult.isSuccess(user) ? user.value : undefined;
  const webValue = fromSelection(profile?.preferences.model);
  const orgValue = fromSelection(organization?.defaultModel ?? null);
  const catalog: ReadonlyArray<ModelEntry> = AsyncResult.isSuccess(
    catalogResult,
  )
    ? extractCatalog(catalogResult.value)
    : [];

  const save = async (
    kind: "web" | "org" | "slack" | "linear",
    value: ModelSelection | null,
  ) => {
    const payload = { model: toSelection(value) };
    try {
      if (kind === "web") {
        await saveWeb({ payload });
        toast.success("Web default model saved");
      } else if (kind === "org") {
        await saveOrg({ params: { orgId }, payload });
        toast.success("Organization default model saved");
      } else {
        await saveSurface({ params: { orgId, surface: kind }, payload });
        toast.success(`${surfaceLabels[kind]} default model saved`);
      }
    } catch {
      toast.error(
        kind === "org"
          ? "Could not save the organization default model"
          : kind === "web"
            ? "Could not save your web default model"
            : `Could not save your ${surfaceLabels[kind]} default model`,
      );
    }
  };

  return (
    <SettingsSection
      id="model-defaults"
      title="Default models"
      description="The model a thread starts on when nobody picks one"
    >
      {AsyncResult.isFailure(organizations) ? (
        <SettingsLoadFailedRow
          label="Default models"
          onRetry={() => window.location.reload()}
        />
      ) : (
        <DefaultModelsSection
          catalog={catalog}
          webValue={webValue}
          orgValue={orgValue}
          surfaceValues={{
            slack: AsyncResult.isSuccess(slack)
              ? fromSelection(slack.value)
              : null,
            linear: AsyncResult.isSuccess(linear)
              ? fromSelection(linear.value)
              : null,
          }}
          isAdmin={
            organization?.accessLevel === "admin" ||
            organization?.accessLevel === "owner"
          }
          adminReason="Only organization admins can change this"
          onSaveWeb={(value) => void save("web", value)}
          onSaveOrg={(value) => void save("org", value)}
          onSaveSurface={(surface, value) =>
            void save(surface === "slack" ? "slack" : "linear", value)
          }
        />
      )}
    </SettingsSection>
  );
}
