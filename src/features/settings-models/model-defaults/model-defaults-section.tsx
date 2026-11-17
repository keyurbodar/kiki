import { useAtomValue, useAtomSet } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { toast } from "sonner";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import { SettingsLoadFailedRow, SettingsSection } from "@/components/settings-page";
import {
  DefaultModelsSection,
} from "./model-chooser";
import {
  type ModelEntry,
  type ModelSelection,
  fallbackCatalog,
  fromSelection,
  toSelection,
} from "./model-selection";
import {
  modelsCatalogAtom,
  orgDefaultModelAtom,
  setModelSettingAtom,
  setOrgDefaultModelAtom,
  setSurfaceDefaultModelAtom,
  surfaceDefaultModelAtom,
  updatePreferencesAtom,
} from "./model-defaults.atoms";

export function ModelDefaultsSection() {
  const user = useAtomValue(currentUserAtom);
  const organizations = useAtomValue(organizationsAtom);
  const catalogResult = useAtomValue(modelsCatalogAtom);
  const org = useAtomValue(orgDefaultModelAtom);
  const slack = useAtomValue(surfaceDefaultModelAtom("slack"));
  const linear = useAtomValue(surfaceDefaultModelAtom("linear"));
  const saveWeb = useAtomSet(updatePreferencesAtom, { mode: "promise" });
  const saveOrg = useAtomSet(setOrgDefaultModelAtom, { mode: "promise" });
  const saveSurface = useAtomSet(setSurfaceDefaultModelAtom, {
    mode: "promise",
  });
  const refresh = useAtomValue(orgDefaultModelAtom);

  const orgList = AsyncResult.isSuccess(organizations)
    ? organizations.value
    : [];
  const orgId = orgList[0]?.id;
  const profile = AsyncResult.isSuccess(user) ? user.value : undefined;
  const webValue = fromSelection(profile?.preferences.model);
  const orgValue =
    (AsyncResult.isSuccess(org) ? fromSelection(org.value) : null) ??
    (orgList[0]?.defaultModel
      ? fromSelection(orgList[0].defaultModel)
      : null);
  const catalog: ReadonlyArray<ModelEntry> = AsyncResult.isSuccess(
    catalogResult,
  )
    ? extractCatalog(catalogResult.value)
    : fallbackCatalog;

  const surfaceFailures = ["slack", "linear"].filter(
    (surface) =>
      surface === "slack"
        ? AsyncResult.isFailure(slack)
        : AsyncResult.isFailure(linear),
  );

  const save = async (
    kind: "web" | "org" | "slack" | "linear",
    value: ModelSelection | null,
  ) => {
    const payload = toSelection(value);
    try {
      if (kind === "web") {
        await saveWeb({ payload: { model: payload } });
        toast.success("Web default model saved");
      } else if (kind === "org" && orgId !== undefined) {
        await saveOrg({
          params: { orgId },
          payload: { model: payload },
        });
        toast.success("Organization default model saved");
      } else if (orgId !== undefined) {
        await saveSurface({
          params: { orgId, surface: kind },
          payload: { model: payload },
        });
        toast.success(`${kind === "slack" ? "Slack" : "Linear"} default model saved`);
      }
    } catch {
      toast.error("Could not save the preference");
    } finally {
      void refresh;
    }
  };

  return (
    <SettingsSection
      id="model-defaults"
      title="Default models"
      description="The model a thread starts on when nobody picks one"
    >
      {AsyncResult.isFailure(user) || AsyncResult.isFailure(organizations) ? (
        <SettingsLoadFailedRow
          label="Default models"
          onRetry={() => window.location.reload()}
        />
      ) : surfaceFailures.length > 0 ? (
        <p
          role="status"
          className="px-4 py-4 text-sm font-normal text-muted-foreground-2"
        >
          No model matches
        </p>
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
          isAdmin={true}
          catalogFailed={AsyncResult.isFailure(catalogResult)}
          saving={null}
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

function extractCatalog(value: unknown): ReadonlyArray<ModelEntry> {
  const rows = Array.isArray(value)
    ? value
    : typeof value === "object" && value !== null && "entries" in value
      ? Array.isArray((value as { entries: unknown }).entries)
        ? ((value as { entries: unknown[] }).entries)
        : []
      : [];
  return rows.flatMap((row) => {
    if (typeof row !== "object" || row === null) return [];
    const item = row as Record<string, unknown>;
    const id = item.id ?? item.modelId;
    const name = item.name ?? item.label;
    if (typeof id !== "string" || typeof name !== "string") return [];
    return [
      {
        id,
        name,
        provider: typeof item.provider === "string" ? item.provider : "capy",
        efforts: Array.isArray(item.efforts)
          ? item.efforts.filter(
              (effort): effort is string => typeof effort === "string",
            )
          : undefined,
        defaultEffort:
          typeof item.defaultEffort === "string"
            ? item.defaultEffort
            : undefined,
        context:
          typeof item.context === "number"
            ? item.context
            : typeof item.limits === "object" &&
                item.limits !== null &&
                "context" in item.limits &&
                typeof (item.limits as { context: unknown }).context ===
                  "number"
              ? (item.limits as { context: number }).context
              : undefined,
      },
    ];
  });
}
