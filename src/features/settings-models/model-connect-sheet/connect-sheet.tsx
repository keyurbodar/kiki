import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { type ClipboardEvent, useState } from "react";
import { toast } from "sonner";
import {
  ConnectBack,
  ConnectFooter,
  type ConnectNest,
} from "@/components/claude-connect-dialog/connect-layout";
import { ArrowUpRightGlyph } from "@/components/claude-connect-dialog/glyphs";
import { Button, buttonVariants } from "@/primitives/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/primitives/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import { menuRowVariants } from "@/primitives/menu";
import {
  MenuCombobox,
  MenuComboboxItem,
  MenuComboboxTrigger,
} from "@/primitives/menu-combobox";
import {
  SideSheet,
  SideSheetBody,
  SideSheetContent,
  SideSheetHeader,
  SideSheetTitle,
} from "@/primitives/side-sheet";
import { failureMessage } from "../model-routing/actions.ts";
import {
  checkMediaUrlAtom,
  createCredentialAtom,
  discoverModelsAtom,
  modelsKeys,
  refreshDaybreakAtom,
  removeCompactAtAtom,
  routingKeys,
  setConnectionModelsAtom,
  updateCredentialAtom,
  upsertCompactAtAtom,
  useCompactAt,
  useOrgId,
} from "../model-routing/atoms.ts";
import {
  ChevronDownGlyph,
  CrossGlyph,
  PlusGlyph,
} from "../model-routing/glyphs.tsx";
import { ProviderIcon } from "../model-routing/provider-icon.tsx";
import {
  applyTick,
  formatContext,
  labWildcard,
  modelIdOf,
  slugModelId,
} from "../model-routing/routing.ts";
import { TickTree } from "../model-routing/tick-tree.tsx";
import type {
  Api,
  CatalogEntry,
  Credential,
  ModelSetting,
  OwnerType,
} from "../model-routing/types.ts";
import {
  type CustomModelDraft,
  CustomModelForm,
  type CustomModelInitial,
  revealNearest,
} from "./custom-model-form.tsx";
import { HeaderRows } from "./header-rows.tsx";
import {
  buildTicks,
  cleanHeaders,
  customIdProblem,
  type DiscoveredModel,
  type DiscoverResponse,
  type Discovery,
  directTicks,
  draftHeaders,
  hasHeaderProblems,
  listedModels,
  matchedFirst,
  readDaybreak,
  readMediaCheck,
  servedCount,
  shortDate,
  stripWhitespace,
  totalCount,
} from "./helpers.ts";
import {
  apiOptions,
  credentialIconProvider,
  customLab,
  defaultBaseUrls,
  directProviders,
  dropServedAsOnUntick,
  findCatalogEntry,
  normalizeBaseUrl,
  openaiCompatible,
  presets,
  providerName,
  requestUrlHint,
  wireCheckedAt,
  wireRejections,
} from "./presets.ts";
import {
  DaybreakAccessRow,
  MediaDeliveryRows,
  WebSocketRow,
  WireNotice,
} from "./rows.tsx";
import { ServedAsRow } from "./served-as-row.tsx";
import {
  ComboboxPopup,
  Field,
  FieldGroup,
  LoadingButton,
  Section,
  Spinner,
} from "./ui.tsx";
import { useIsAdmin } from "./use-is-admin.ts";

export type ConnectRequest =
  | { readonly kind: "edit"; readonly credential: Credential }
  | {
      readonly kind: "create";
      readonly scope: OwnerType;
      readonly provider: string;
      readonly preset?: string;
    };

export type ConnectSheetProps = {
  nest?: ConnectNest;
  request: ConnectRequest;
  credentials: ReadonlyArray<Credential>;
  catalog: ReadonlyArray<CatalogEntry>;
  onRemove?: (credential: Credential) => void;
  onClose: () => void;
};

export const matchesRow = (row: DiscoveredModel, query: string) =>
  `${row.providerModelId} ${row.name ?? ""}`
    .toLowerCase()
    .includes(query.trim().toLowerCase());

const help = {
  href: "https://docs.capy.ai/models-and-pricing",
  label: "Connection help",
};

type Problem = { readonly field: "key" | "baseURL"; readonly text: string };

const succeeded =
  (message: string) =>
  <A, E>(exit: Exit.Exit<A, E>) => {
    if (Exit.isSuccess(exit)) return true;
    toast.error(failureMessage(exit.cause, message));
    return false;
  };

export function ConnectSheet({
  nest,
  request,
  credentials,
  catalog,
  onRemove,
  onClose,
}: ConnectSheetProps) {
  const orgId = useOrgId();
  const isAdmin = useIsAdmin();
  const discover = useAtomSet(discoverModelsAtom, { mode: "promiseExit" });
  const createCredential = useAtomSet(createCredentialAtom, {
    mode: "promiseExit",
  });
  const updateCredential = useAtomSet(updateCredentialAtom, {
    mode: "promiseExit",
  });
  const setConnectionModels = useAtomSet(setConnectionModelsAtom, {
    mode: "promiseExit",
  });
  const checkMediaUrl = useAtomSet(checkMediaUrlAtom, { mode: "promiseExit" });
  const refreshDaybreak = useAtomSet(refreshDaybreakAtom, {
    mode: "promiseExit",
  });
  const upsertCompactAt = useAtomSet(upsertCompactAtAtom, {
    mode: "promiseExit",
  });
  const removeCompactAt = useAtomSet(removeCompactAtAtom, {
    mode: "promiseExit",
  });
  const orgCompactAt = useCompactAt(orgId).org;
  const credential = request.kind === "edit" ? request.credential : undefined;
  const scope =
    request.kind === "create" ? request.scope : request.credential.ownerType;
  const provider =
    request.kind === "create" ? request.provider : request.credential.provider;
  const preset =
    request.kind === "create"
      ? presets.find((p) => p.id === request.preset)
      : undefined;
  const custom = provider === openaiCompatible;
  const azure = provider === "azure";
  const direct = directProviders.includes(provider);
  const displayName = preset?.name ?? providerName(provider);
  const defaultUrl = defaultBaseUrls[provider];

  const [name, setName] = useState(() =>
    credential === undefined
      ? (custom && preset === undefined) ||
        credentials.some((c) => c.ownerType === scope && c.name === displayName)
        ? ""
        : displayName
      : credential.name,
  );
  const [baseUrl, setBaseUrl] = useState(
    credential?.baseURL ?? preset?.baseURL ?? defaultBaseUrls[provider] ?? "",
  );
  const [api, setApi] = useState<Api>(
    credential?.api ?? preset?.api ?? "chat_completions",
  );
  const [resourceName, setResourceName] = useState(
    credential?.azure?.resourceName ?? "",
  );
  const [apiVersion, setApiVersion] = useState(
    credential?.azure?.apiVersion ?? "",
  );
  const [key, setKey] = useState("");
  const savedSocket = credential?.wire?.socket?.enabled === true;
  const [socket, setSocket] = useState(savedSocket);
  const [headers, setHeaders] = useState(() =>
    draftHeaders(credential?.headers),
  );
  const [checking, setChecking] = useState(false);
  const [media, setMedia] = useState(credential?.mediaUrl);
  const [mediaChecking, setMediaChecking] = useState(false);
  const [mediaFailure, setMediaFailure] = useState<string>();
  const [daybreak, setDaybreak] = useState(credential?.daybreak);
  const [refreshing, setRefreshing] = useState(false);
  const [daybreakFailure, setDaybreakFailure] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<Problem>();
  const [discovery, setDiscovery] = useState<Discovery>();
  const [models, setModels] = useState<ReadonlyArray<ModelSetting>>(
    credential?.models ?? [],
  );
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [probing, setProbing] = useState<DiscoveredModel>();
  const [askContext, setAskContext] = useState<{
    row: DiscoveredModel;
    context?: number;
  }>();
  const [form, setForm] = useState<{
    initial: CustomModelInitial;
    editing: boolean;
  }>();
  const [usingCapyModel, setUsingCapyModel] = useState(false);
  const [compactAts, setCompactAts] = useState(
    () => new Map<string, number | undefined>(),
  );

  const keys = orgId === undefined ? [] : routingKeys(orgId);
  const listed = discovery?.rows ?? [];
  const allModels = credential?.allModels ?? direct;
  const ticks = buildTicks(
    credential === undefined
      ? direct
        ? directTicks(provider, catalog)
        : []
      : credential.ticks,
    listed,
    models,
    allModels,
    catalog,
    direct ? provider : custom ? customLab : undefined,
    custom,
  );
  const customs = models.filter((m) => m.name !== undefined);
  const unlisted = listed.filter(
    (row) =>
      row.match === undefined &&
      !customs.some((m) => m.model === slugModelId(row.providerModelId)),
  );
  const served = servedCount(ticks);
  const total = totalCount(ticks);
  const connection =
    name.trim() === "" ? (credential?.name ?? displayName) : name.trim();
  const usesUrl = !azure;
  const customUrl =
    defaultUrl === undefined || normalizeBaseUrl(baseUrl) !== defaultUrl;
  const cleanKey = stripWhitespace(key);
  const keyPreset =
    preset ??
    (custom ? undefined : presets.find((p) => p.provider === provider));
  const keyProblem =
    keyPreset?.keyPrefix !== undefined &&
    cleanKey !== "" &&
    !cleanKey.startsWith(keyPreset.keyPrefix)
      ? `${keyPreset.name} keys start with ${keyPreset.keyPrefix}`
      : undefined;
  const ready =
    ((credential !== undefined && cleanKey === "") || cleanKey !== "") &&
    keyProblem === undefined &&
    (!usesUrl || (baseUrl.trim() !== "" && !baseUrl.includes("{"))) &&
    (!azure || resourceName.trim() !== "") &&
    !hasHeaderProblems(headers);
  const settled =
    probing === undefined &&
    askContext === undefined &&
    form === undefined &&
    customs.every((m) => m.context !== undefined);
  const sentHeaders = azure ? [] : cleanHeaders(headers);
  const sentUrl = usesUrl && customUrl ? normalizeBaseUrl(baseUrl) : undefined;
  const urlHint = usesUrl
    ? requestUrlHint(
        baseUrl,
        custom
          ? api
          : provider === "openai"
            ? "responses"
            : provider === "anthropic"
              ? "anthropic_messages"
              : (preset ?? keyPreset)?.api,
      )
    : undefined;
  const savedUrl = credential?.baseURL ?? defaultUrl ?? "";
  const changes = {
    name:
      credential !== undefined && name.trim() !== credential.name
        ? name.trim()
        : undefined,
    key: cleanKey === "" ? undefined : cleanKey,
    baseURL:
      credential === undefined ||
      !usesUrl ||
      normalizeBaseUrl(baseUrl) === savedUrl
        ? undefined
        : customUrl
          ? normalizeBaseUrl(baseUrl)
          : "",
    headers:
      credential === undefined ||
      azure ||
      JSON.stringify(sentHeaders) === JSON.stringify(credential.headers ?? [])
        ? undefined
        : sentHeaders,
    api:
      credential !== undefined && custom && api !== credential.api
        ? api
        : undefined,
    wire:
      credential !== undefined && socket !== savedSocket
        ? { socket: { enabled: socket } }
        : undefined,
  };
  const changed = Object.values(changes).some((v) => v !== undefined);
  const modelsChanged =
    credential !== undefined &&
    JSON.stringify(models) !== JSON.stringify(credential.models);
  const canSubmit =
    credential === undefined
      ? ready && name.trim() !== "" && discovery !== undefined && settled
      : (changed || modelsChanged) && ready && name.trim() !== "" && settled;
  const wireAt = wireCheckedAt(credential?.wire);

  const compactAtOf = (model: string) =>
    compactAts.has(model)
      ? compactAts.get(model)
      : orgCompactAt.find((e) => e.model === model)?.compactAt;

  const saveCompactAts = (message: string) => {
    if (orgId === undefined || !isAdmin) return Promise.resolve(true);
    const kept = new Set(customs.map((m) => m.model));
    const settle = <A, E>(exit: Exit.Exit<A, E>) => {
      if (Exit.isSuccess(exit)) return true;
      toast.error(message, {
        description: failureMessage(exit.cause, "Request failed"),
      });
      return false;
    };
    return Promise.all(
      [...compactAts].flatMap(([model, compactAt]) => {
        if (
          !kept.has(model) ||
          orgCompactAt.find((e) => e.model === model)?.compactAt === compactAt
        )
          return [];
        return [
          compactAt === undefined
            ? removeCompactAt({
                params: { orgId },
                query: { model },
                reactivityKeys: modelsKeys.compactAt(orgId),
              }).then(settle)
            : upsertCompactAt({
                params: { orgId },
                payload: { model, compactAt },
                reactivityKeys: modelsKeys.compactAt(orgId),
              }).then(settle),
        ];
      }),
    ).then((results) => results.every(Boolean));
  };

  const idProblem = (id: string) =>
    customIdProblem(id, customs, listed, catalog);

  const addCustom = (draft: CustomModelDraft) => {
    const model = slugModelId(draft.id);
    setModels((current) => [
      ...current.filter((m) => m.model !== model),
      {
        model,
        providerModelId: draft.id,
        name: draft.name ?? draft.id,
        context: draft.context,
        output: draft.output,
        reasoning: draft.reasoning || undefined,
        images: draft.images || undefined,
      },
    ]);
    setCompactAts(new Map([...compactAts, [model, draft.compactAt]]));
    setForm(undefined);
  };

  const editCustom = (model: string) => {
    const existing = customs.find((m) => m.model === model);
    if (existing === undefined) return;
    setForm({
      initial: {
        id: existing.providerModelId ?? existing.model,
        name: existing.name,
        context: existing.context,
        output: existing.output,
        reasoning: existing.reasoning,
        images: existing.images,
        compactAt: compactAtOf(model),
      },
      editing: true,
    });
  };

  const clearProblem = () => {
    setDiscovery(undefined);
    setProblem(undefined);
  };

  const discoverPayload =
    credential === undefined
      ? {
          ownerType: scope,
          provider,
          key: cleanKey,
          baseURL: sentUrl,
          api: custom ? api : undefined,
          headers: sentHeaders.length === 0 ? undefined : sentHeaders,
        }
      : {
          provider,
          credentialId: credential.id,
          key: changes.key,
          baseURL: changes.baseURL,
          api: changes.api,
          headers: changes.headers,
        };

  const checkAccess = () => {
    if (orgId === undefined || !ready) return;
    if (usesUrl) setBaseUrl(normalizeBaseUrl(baseUrl));
    setProblem(undefined);
    setChecking(true);
    void discover({ params: { orgId }, payload: discoverPayload })
      .then((exit) => {
        if (Exit.isFailure(exit)) {
          setProblem({
            field: "key",
            text: failureMessage(exit.cause, "Could not check access"),
          });
          return;
        }
        const result = exit.value as DiscoverResponse;
        if (result.outcome === "rejected") {
          setProblem({
            field: "key",
            text: result.message ?? "The provider rejected this key",
          });
          return;
        }
        if (result.outcome === "unreachable") {
          setProblem({
            field: usesUrl ? "baseURL" : "key",
            text: result.message ?? "Could not reach the provider",
          });
          return;
        }
        const rows = result.models.toSorted(matchedFirst);
        setDiscovery({
          outcome: result.outcome,
          message: result.message,
          rows,
          wire: wireRejections(result.wire),
          at: new Date(),
        });
        if (credential !== undefined) return;
        const found = listedModels(rows);
        const labs = [
          ...new Set(
            rows.flatMap((row) => {
              const entry = catalog.find((e) => e.id === row.match?.entryId);
              return entry === undefined ? [] : [entry.provider];
            }),
          ),
        ];
        setModels((current) =>
          direct
            ? current.filter((m) => m.name !== undefined)
            : preset === undefined
              ? [
                  ...current.filter(
                    (m) => !found.some((f) => f.model === m.model),
                  ),
                  ...found,
                ]
              : [...labs.map((lab) => ({ model: labWildcard(lab) })), ...found],
        );
      })
      .finally(() => setChecking(false));
  };

  const showMedia =
    credential?.baseURL !== undefined &&
    media !== undefined &&
    (provider === "anthropic" || (custom && api === "anthropic_messages"));
  const showSocket = provider === "openai" || (custom && api === "responses");

  const checkMedia = () => {
    if (orgId === undefined || credential === undefined) return;
    setMediaChecking(true);
    void checkMediaUrl({
      params: { orgId, credentialId: credential.id },
      reactivityKeys: keys,
    })
      .then((exit) => {
        if (Exit.isFailure(exit)) {
          setMediaFailure(
            failureMessage(exit.cause, "Could not check image delivery"),
          );
          return;
        }
        const result = readMediaCheck(exit.value);
        setMedia(result.media);
        setMediaFailure(result.failure);
      })
      .finally(() => setMediaChecking(false));
  };

  const refreshAccess = () => {
    if (orgId === undefined || credential === undefined) return;
    setRefreshing(true);
    void refreshDaybreak({
      params: { orgId, credentialId: credential.id },
      reactivityKeys: keys,
    })
      .then((exit) => {
        if (Exit.isFailure(exit)) {
          setDaybreakFailure(
            failureMessage(exit.cause, "Could not check Daybreak access"),
          );
          return;
        }
        const result = readDaybreak(exit.value);
        setDaybreak(result.access);
        setDaybreakFailure(result.failure);
      })
      .finally(() => setRefreshing(false));
  };

  const addListed = (row: DiscoveredModel, context: number) => {
    const model = slugModelId(row.providerModelId);
    setModels((current) => [
      ...current.filter((m) => m.model !== model),
      {
        model,
        providerModelId: row.providerModelId,
        name: row.name ?? row.providerModelId,
        context,
      },
    ]);
  };

  const pick = (row: DiscoveredModel) => {
    const model = slugModelId(row.providerModelId);
    setQuery("");
    setPickerOpen(false);
    if (model === "" || listed.some((r) => r.match?.model === model)) return;
    if (!direct) {
      if (catalog.some((e) => modelIdOf(e.id) === model))
        setModels([
          ...models.filter((m) => m.model !== model),
          {
            model,
            providerModelId:
              row.providerModelId === model ? undefined : row.providerModelId,
          },
        ]);
      return;
    }
    if (findCatalogEntry(catalog, model) !== undefined) return;
    if (row.context !== undefined) {
      addListed(row, row.context);
      return;
    }
    if (orgId === undefined || !ready) return;
    setProbing(row);
    void discover({
      params: { orgId },
      payload: { ...discoverPayload, model: row.providerModelId },
    })
      .then((exit) => {
        const result = Exit.isSuccess(exit)
          ? (exit.value as DiscoverResponse)
          : undefined;
        if (result?.outcome === "unreachable") {
          toast.error(
            result.message ?? `This key does not serve ${row.providerModelId}`,
          );
          return;
        }
        const found = result?.models.find(
          (m) => m.providerModelId === row.providerModelId,
        );
        const next = { ...row, name: row.name ?? found?.name };
        if (found?.context === undefined) setAskContext({ row: next });
        else addListed(next, found.context);
      })
      .finally(() => setProbing(undefined));
  };

  const save = () => {
    if (orgId === undefined || credential === undefined || !canSubmit) return;
    setSaving(true);
    void (
      changed
        ? updateCredential({
            params: { orgId, credentialId: credential.id },
            payload: changes,
            reactivityKeys: keys,
          }).then(succeeded("Could not save the connection"))
        : Promise.resolve(true)
    )
      .then((ok) =>
        ok && modelsChanged
          ? setConnectionModels({
              params: { orgId, credentialId: credential.id },
              payload: { models },
              reactivityKeys: keys,
            }).then(succeeded("Could not save the models"))
          : ok,
      )
      .then((ok) => (ok ? saveCompactAts("Could not save compact at") : false))
      .then((ok) => {
        if (!ok) return;
        toast.success(`${connection} saved`);
        onClose();
      })
      .finally(() => setSaving(false));
  };

  const connect = () => {
    if (orgId === undefined || !canSubmit) return;
    setSaving(true);
    void createCredential({
      params: { orgId },
      payload: {
        ownerType: scope,
        provider,
        name: name.trim(),
        key: cleanKey,
        baseURL: sentUrl,
        api: custom ? api : undefined,
        azure: azure
          ? {
              resourceName: resourceName.trim(),
              apiVersion:
                apiVersion.trim() === "" ? undefined : apiVersion.trim(),
            }
          : undefined,
        headers: sentHeaders.length === 0 ? undefined : sentHeaders,
        wire: socket ? { socket: { enabled: true } } : undefined,
        models,
      },
      reactivityKeys: keys,
    })
      .then((exit) => {
        if (Exit.isFailure(exit)) {
          toast.error(failureMessage(exit.cause, "Could not connect the key"));
          return;
        }
        const created = (exit.value as { name: string }).name;
        return saveCompactAts(
          `${created} connected without compact at, set it from the Models table`,
        ).then((ok) => {
          if (ok) toast.success(`${created} connected`);
          onClose();
        });
      })
      .finally(() => setSaving(false));
  };

  const trimmedQuery = query.trim();
  const querySlug = slugModelId(trimmedQuery);
  const queryTaken =
    trimmedQuery === "" ||
    listed.some(
      (row) =>
        row.providerModelId === trimmedQuery || row.match?.model === querySlug,
    ) ||
    customs.some((m) => m.model === querySlug) ||
    (direct && findCatalogEntry(catalog, querySlug) !== undefined);
  const pickerItems = direct ? unlisted : [];

  const picker = (
    <MenuCombobox
      items={[...pickerItems]}
      value={null}
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      onValueChange={(row: DiscoveredModel | null) => {
        if (row !== null) pick(row);
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      itemToStringLabel={(row: DiscoveredModel) =>
        row.name ?? row.providerModelId
      }
      filter={matchesRow}
    >
      <MenuComboboxTrigger
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className:
            "-mx-1 h-8 w-[calc(100%+--spacing(2))] justify-start pl-6.5",
        })}
      >
        <PlusGlyph />
        {direct
          ? `Add a custom model served by ${connection}`
          : "Add a model by id"}
      </MenuComboboxTrigger>
      <ComboboxPopup
        className="w-(--anchor-width)"
        searchPlaceholder="Search or type a model id"
        emptyText={
          direct
            ? unlisted.length === 0 && trimmedQuery === ""
              ? "Every model this key serves is already here"
              : "No listed model matches"
            : "Type the id of a model this endpoint serves"
        }
        empty={!pickerItems.some((row) => matchesRow(row, query))}
        footer={
          queryTaken ? undefined : (
            <button
              type="button"
              data-slot="menu-action-item"
              className={menuRowVariants({ interaction: "button" })}
              onClick={() => pick({ providerModelId: trimmedQuery })}
            >
              {`Add ${trimmedQuery} by id`}
            </button>
          )
        }
      >
        {(row: DiscoveredModel) => (
          <MenuComboboxItem
            key={row.providerModelId}
            value={row}
            className={menuRowVariants({ density: "rich" })}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">
                {row.name ?? row.providerModelId}
              </span>
              <span className="truncate text-xs font-normal text-muted-foreground-2">
                {[
                  row.name === undefined ? undefined : row.providerModelId,
                  row.context === undefined
                    ? undefined
                    : `${formatContext(row.context)} context`,
                ]
                  .filter((part) => part !== undefined)
                  .join(", ")}
              </span>
            </span>
          </MenuComboboxItem>
        )}
      </ComboboxPopup>
    </MenuCombobox>
  );

  const adding =
    probing !== undefined ? (
      <div
        ref={revealNearest}
        className="flex h-8 scroll-mb-12 items-center gap-1.5 pl-5.5 text-sm"
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          <Spinner label={`Checking ${probing.providerModelId}`} />
        </span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground-2">
          {probing.name ?? probing.providerModelId}
        </span>
      </div>
    ) : askContext !== undefined ? (
      <form
        ref={revealNearest}
        className="flex h-8 scroll-mb-12 items-center gap-1.5 pl-5.5 text-sm"
        onSubmit={(event) => {
          event.preventDefault();
          if (askContext.context === undefined) return;
          addListed(askContext.row, askContext.context);
          setAskContext(undefined);
        }}
      >
        <span className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          {askContext.row.name ?? askContext.row.providerModelId}
        </span>
        <Input
          type="number"
          inputMode="numeric"
          size="xs"
          autoFocus
          aria-label={`Context window of ${askContext.row.name ?? askContext.row.providerModelId}`}
          placeholder="Context window"
          className="w-32 shrink-0"
          value={askContext.context ?? ""}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setAskContext(undefined);
            }
          }}
          onChange={(event) => {
            const tokens = Number(event.currentTarget.value);
            setAskContext({
              row: askContext.row,
              context:
                Number.isInteger(tokens) && tokens > 0 ? tokens : undefined,
            });
          }}
        />
        <Button
          type="submit"
          size="xs"
          disabled={askContext.context === undefined}
        >
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Cancel"
          onClick={() => setAskContext(undefined)}
        >
          <CrossGlyph />
        </Button>
      </form>
    ) : form !== undefined ? (
      <CustomModelForm
        key={form.initial.id ?? "new"}
        connection={connection}
        initial={form.initial}
        listed={unlisted}
        idProblem={idProblem}
        compactable={isAdmin}
        editing={form.editing}
        onSubmit={addCustom}
        onCancel={() => setForm(undefined)}
      />
    ) : usingCapyModel ? (
      <ServedAsRow
        catalog={catalog.filter((e) => e.pricing !== undefined)}
        onAdd={(model) => {
          setModels((current) => [
            ...current.filter((m) => m.model !== model.model),
            model,
          ]);
          setUsingCapyModel(false);
        }}
        onCancel={() => setUsingCapyModel(false)}
      />
    ) : custom ? (
      <div className="-mx-1 flex items-center gap-1 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setForm({ initial: {}, editing: false })}
        >
          <PlusGlyph />
          Add custom model
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUsingCapyModel(true)}
        >
          <PlusGlyph />
          Use a Capy model
        </Button>
      </div>
    ) : direct ||
      discovery === undefined ||
      discovery.outcome === "unlisted" ? (
      picker
    ) : null;

  const keyHint =
    preset === undefined ? undefined : (
      <>
        {preset.keyHint === undefined ? null : (
          <span className="block">{preset.keyHint}</span>
        )}
        <a
          href={preset.keyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-foreground hover:underline"
        >
          {`Get a key from ${preset.name}`}
          <ArrowUpRightGlyph className="size-(--icon-xs)" />
        </a>
      </>
    );

  const accessStatus =
    problem !== undefined ? (
      <span className="min-w-0 text-xs font-normal text-destructive">
        {problem.text}
      </span>
    ) : discovery === undefined ? null : (
      <span className="min-w-0 text-xs font-normal text-muted-foreground-2">
        {discovery.outcome === "listed"
          ? `Key accepted on ${shortDate(discovery.at)}, ${listed.length} ${listed.length === 1 ? "model" : "models"} listed`
          : "Key accepted, this endpoint does not list its models"}
      </span>
    );

  const pasteKey = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const input = event.currentTarget;
    setKey(
      stripWhitespace(
        input.value.slice(0, input.selectionStart ?? 0) +
          event.clipboardData.getData("text") +
          input.value.slice(input.selectionEnd ?? input.value.length),
      ),
    );
    clearProblem();
  };

  const content = (
    <>
      <SideSheetHeader>
        <SideSheetTitle className="flex items-center gap-2">
          {nest === undefined ? null : <ConnectBack onBack={nest.onBack} />}
          <ProviderIcon
            provider={
              credential === undefined
                ? (preset?.id ?? (custom ? connection : provider))
                : credentialIconProvider(credential)
            }
            className="size-(--icon-base) shrink-0"
          />
          {credential === undefined
            ? custom && name.trim() === ""
              ? "Connect a custom endpoint"
              : `Connect ${connection}`
            : connection}
        </SideSheetTitle>
      </SideSheetHeader>
      <SideSheetBody className="md:scroll-fade-y">
        <Section title="Endpoint">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <Field label="Name">
                <Input
                  aria-label="Name"
                  autoComplete="off"
                  placeholder={custom ? "Particle" : `${displayName} (ZDR)`}
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                />
              </Field>
              {usesUrl ? (
                <Field
                  label="Base URL"
                  problem={urlHint?.doubled === true ? urlHint.text : undefined}
                  hint={
                    preset?.baseURL.includes("{") === true &&
                    baseUrl.includes("{")
                      ? (preset.urlHint ?? "Fill in the ids from your gateway")
                      : urlHint?.text
                  }
                >
                  <Input
                    aria-label="Base URL"
                    autoComplete="off"
                    placeholder={defaultUrl ?? "https://api.example.com/v1"}
                    aria-invalid={
                      problem?.field === "baseURL" || urlHint?.doubled === true
                    }
                    value={baseUrl}
                    onChange={(event) => {
                      setBaseUrl(event.currentTarget.value);
                      clearProblem();
                    }}
                  />
                </Field>
              ) : null}
              {azure ? (
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
                  <Field label="Resource name">
                    <Input
                      aria-label="Resource name"
                      autoComplete="off"
                      placeholder="my-resource"
                      disabled={credential !== undefined}
                      value={resourceName}
                      onChange={(event) =>
                        setResourceName(event.currentTarget.value)
                      }
                    />
                  </Field>
                  <Field label="API version">
                    <Input
                      aria-label="API version"
                      autoComplete="off"
                      placeholder="preview"
                      disabled={credential !== undefined}
                      value={apiVersion}
                      onChange={(event) =>
                        setApiVersion(event.currentTarget.value)
                      }
                    />
                  </Field>
                </div>
              ) : null}
              {custom ? (
                <Field label="API format">
                  <fieldset aria-label="API format" className="flex self-start">
                    {apiOptions.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant="segmented"
                        size="sm"
                        data-selected={api === option.value || undefined}
                        aria-pressed={api === option.value}
                        onClick={() => {
                          setApi(option.value);
                          clearProblem();
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </fieldset>
                </Field>
              ) : null}
              <Field label="API key" problem={keyProblem} hint={keyHint}>
                <Input
                  type="password"
                  autoComplete="off"
                  aria-label="API key"
                  placeholder={
                    credential === undefined
                      ? keyPreset?.keyPrefix === undefined
                        ? "API key"
                        : `${keyPreset.keyPrefix}…`
                      : "Saved, paste a new key to replace it"
                  }
                  aria-invalid={
                    problem?.field === "key" || keyProblem !== undefined
                  }
                  value={key}
                  onChange={(event) => {
                    setKey(stripWhitespace(event.currentTarget.value));
                    clearProblem();
                  }}
                  onPaste={pasteKey}
                />
              </Field>
              {azure ? null : (
                <FieldGroup className="flex flex-col gap-1.5">
                  <Label>Headers</Label>
                  <HeaderRows
                    headers={headers}
                    recipient={connection}
                    onChange={setHeaders}
                  />
                </FieldGroup>
              )}
            </CardContent>
            <CardFooter className="gap-3">
              <LoadingButton
                variant="soft"
                size="base"
                loading={checking}
                disabled={!ready}
                onClick={checkAccess}
              >
                Check access
              </LoadingButton>
              {accessStatus}
            </CardFooter>
            {discovery === undefined ? (
              wireAt === undefined ? null : (
                <WireNotice
                  rejections={wireRejections(credential?.wire)}
                  checkedAt={new Date(wireAt)}
                  checking={checking}
                  onCheckAgain={checkAccess}
                />
              )
            ) : discovery.wire.length > 0 ? (
              <WireNotice
                rejections={discovery.wire}
                checkedAt={discovery.at}
                checking={checking}
                onCheckAgain={checkAccess}
              />
            ) : null}
          </Card>
        </Section>
        <Section title="Models">
          <Card>
            <CardHeader className="justify-between">
              <CardTitle className="text-sm">
                {direct
                  ? `Serves ${served} of ${total} ${displayName} models`
                  : `Serves ${served} ${served === 1 ? "model" : "models"}`}
              </CardTitle>
              {direct ? (
                <LoadingButton
                  variant="ghost"
                  size="sm"
                  loading={checking}
                  disabled={!ready}
                  onClick={checkAccess}
                >
                  Find models
                </LoadingButton>
              ) : null}
            </CardHeader>
            <CardContent className="pt-0">
              {discovery?.message === undefined ? null : (
                <p className="pt-2 text-xs font-normal text-muted-foreground-2">
                  {discovery.message}
                </p>
              )}
              {ticks.length > 0 ? (
                <TickTree
                  key={ticks.map((lab) => lab.lab).join(" ")}
                  ticks={ticks}
                  connection={connection}
                  onEdit={custom ? editCustom : undefined}
                  editable
                  onTick={(change) => {
                    const next = applyTick(models, allModels, ticks, change);
                    setModels(
                      custom
                        ? dropServedAsOnUntick(next, allModels, change)
                        : next,
                    );
                  }}
                  onContext={(model, context) =>
                    setModels(
                      models.map((m) =>
                        m.model === model ? { ...m, context } : m,
                      ),
                    )
                  }
                />
              ) : (
                <p className="py-2 text-sm font-normal text-muted-foreground-2">
                  {discovery === undefined
                    ? "Check access to list the models"
                    : listed.length > 0
                      ? "None of the listed models are in Capy"
                      : custom
                        ? "Add the models this endpoint serves"
                        : "Add the models this key serves by id"}
                </p>
              )}
              {adding}
              {!direct && !custom && unlisted.length > 0 ? (
                <p className="pt-1 text-xs font-normal text-muted-foreground-2">
                  {`Not in Capy: ${unlisted.map((row) => row.providerModelId).join(", ")}`}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </Section>
        {showSocket || showMedia || daybreak !== undefined ? (
          <Collapsible>
            <CollapsibleTrigger className="group/collapsible -mx-1 flex w-fit cursor-pointer items-center gap-1.5 rounded px-1 text-left text-sm font-medium text-muted-foreground-1 outline-none select-none hover:text-foreground focus-visible:outline-ring-inset">
              Advanced
              <ChevronDownGlyph className="size-(--icon-sm) -rotate-90 text-muted-foreground-3 group-data-[panel-open]/collapsible:rotate-0" />
            </CollapsibleTrigger>
            <CollapsiblePanel className="overflow-visible">
              {showSocket ? (
                <WebSocketRow checked={socket} onCheckedChange={setSocket} />
              ) : null}
              {showMedia && media !== undefined ? (
                <MediaDeliveryRows
                  media={media}
                  failure={mediaFailure}
                  checking={mediaChecking}
                  disabled={changes.baseURL !== undefined}
                  onCheck={checkMedia}
                />
              ) : null}
              {daybreak === undefined ? null : (
                <DaybreakAccessRow
                  access={daybreak}
                  failure={daybreakFailure}
                  refreshing={refreshing}
                  disabled={
                    changes.key !== undefined ||
                    changes.baseURL !== undefined ||
                    changes.headers !== undefined
                  }
                  onRefresh={refreshAccess}
                />
              )}
            </CollapsiblePanel>
          </Collapsible>
        ) : null}
      </SideSheetBody>
      <ConnectFooter
        surface="sheet"
        help={help}
        onCancel={onClose}
        secondary={
          credential !== undefined && onRemove !== undefined ? (
            <Button
              variant="outline"
              intent="danger"
              onClick={() => onRemove(credential)}
            >
              Remove
            </Button>
          ) : null
        }
      >
        <LoadingButton
          intent="accent"
          loading={saving}
          disabled={!canSubmit}
          onClick={credential === undefined ? connect : save}
        >
          {credential === undefined ? "Connect" : "Save"}
        </LoadingButton>
      </ConnectFooter>
    </>
  );

  if (nest !== undefined) return content;
  return (
    <SideSheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SideSheetContent
        aria-label={
          credential === undefined ? `Connect ${displayName}` : credential.name
        }
      >
        {content}
      </SideSheetContent>
    </SideSheet>
  );
}
