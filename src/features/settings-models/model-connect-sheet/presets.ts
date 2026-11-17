import {
  labName,
  labWildcard,
  modelIdOf,
  slugModelId,
} from "../model-routing/routing.ts";
import type {
  Api,
  CatalogEntry,
  Credential,
  ModelSetting,
  TickChange,
  WireFeature,
  WireState,
} from "../model-routing/types.ts";

export const openaiCompatible = "openai_compatible";

export const customLab = "custom";

export type Preset = {
  readonly id: string;
  readonly provider: string;
  readonly name: string;
  readonly kind: "gateway" | "coding_plan" | "api_key";
  readonly baseURL: string;
  readonly host?: string;
  readonly api: Api;
  readonly keyUrl: string;
  readonly urlHint?: string;
  readonly keyPrefix?: string;
  readonly keyHint?: string;
};

export const directProviders = ["anthropic", "openai", "xai", "google"];

export const presets: ReadonlyArray<Preset> = [
  {
    id: "vercel_gateway",
    provider: "vercel_gateway",
    name: "Vercel AI Gateway",
    kind: "gateway",
    baseURL: "https://ai-gateway.vercel.sh/v1",
    api: "chat_completions",
    keyUrl: "https://vercel.com/d?to=%2F%5Bteam%5D%2F~%2Fai%2Fapi-keys",
  },
  {
    id: "openrouter",
    provider: "openrouter",
    name: "OpenRouter",
    kind: "gateway",
    baseURL: "https://openrouter.ai/api/v1",
    api: "chat_completions",
    keyUrl: "https://openrouter.ai/settings/keys",
  },
  {
    id: "cloudflare_gateway",
    provider: "cloudflare_gateway",
    name: "Cloudflare AI Gateway",
    kind: "gateway",
    baseURL:
      "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/compat",
    api: "chat_completions",
    keyUrl: "https://dash.cloudflare.com/?to=/:account/ai/ai-gateway",
  },
  {
    id: "ollama_cloud",
    provider: "ollama_cloud",
    name: "Ollama Cloud",
    kind: "coding_plan",
    baseURL: "https://ollama.com/v1",
    api: "chat_completions",
    keyUrl: "https://ollama.com/settings/keys",
  },
  {
    id: "neon_gateway",
    provider: "neon_gateway",
    name: "Neon AI Gateway",
    kind: "gateway",
    baseURL: "https://{branch_host}/v1",
    host: "neon.tech",
    api: "chat_completions",
    keyUrl: "https://console.neon.tech",
    urlHint:
      "Fill in your branch host from Connect, AI Gateway in the Neon Console",
    keyPrefix: "nt_live_",
    keyHint: "A branch credential with ai_gateway:invoke, not a Neon API key",
  },
  {
    id: "ramp_router",
    provider: "ramp_router",
    name: "Ramp Router",
    kind: "gateway",
    baseURL: "https://api.router.com/v1",
    api: "responses",
    keyUrl: "https://app.router.com/keys",
  },
  {
    id: "opencode_go",
    provider: "opencode_go",
    name: "OpenCode Go",
    kind: "coding_plan",
    baseURL: "https://opencode.ai/zen/go/v1",
    api: "chat_completions",
    keyUrl: "https://opencode.ai/auth",
  },
  {
    id: "kimi_code",
    provider: "kimi_code",
    name: "Kimi Code",
    kind: "coding_plan",
    baseURL: "https://api.kimi.ai/coding/v1",
    api: "chat_completions",
    keyUrl: "https://www.kimi.ai/code/console",
  },
  {
    id: "morph_ultra",
    provider: "morph_ultra",
    name: "Morph Ultra",
    kind: "coding_plan",
    baseURL: "https://api.morphllm.com/v1",
    api: "chat_completions",
    keyUrl: "https://www.morphllm.com/dashboard",
  },
  {
    id: "glm_coding_plan",
    provider: "glm_coding_plan",
    name: "GLM Coding Plan",
    kind: "coding_plan",
    baseURL: "https://api.z.ai/api/coding/paas/v4",
    api: "chat_completions",
    keyUrl: "https://z.ai/manage-apikey/apikey-list",
  },
  {
    id: "bedrock",
    provider: openaiCompatible,
    name: "Amazon Bedrock",
    kind: "gateway",
    baseURL: "https://bedrock-mantle.{region}.api.aws/v1",
    host: "bedrock-mantle.api.aws",
    api: "chat_completions",
    keyUrl:
      "https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html",
    urlHint:
      "Fill in the region your long-term key was made in, such as us-east-1",
    keyHint: "A long-term Bedrock API key",
  },
  {
    id: "baseten",
    provider: openaiCompatible,
    name: "Baseten",
    kind: "gateway",
    baseURL: "https://inference.baseten.co/v1",
    api: "chat_completions",
    keyUrl: "https://app.baseten.co/settings/api_keys",
  },
  {
    id: "fireworks",
    provider: openaiCompatible,
    name: "Fireworks",
    kind: "gateway",
    baseURL: "https://api.fireworks.ai/inference/v1",
    api: "chat_completions",
    keyUrl: "https://app.fireworks.ai/settings/users/api-keys",
  },
  {
    id: "together",
    provider: openaiCompatible,
    name: "Together AI",
    kind: "gateway",
    baseURL: "https://api.together.xyz/v1",
    api: "chat_completions",
    keyUrl: "https://api.together.ai/settings/api-keys",
  },
  {
    id: "deepinfra",
    provider: openaiCompatible,
    name: "DeepInfra",
    kind: "gateway",
    baseURL: "https://api.deepinfra.com/v1/openai",
    api: "chat_completions",
    keyUrl: "https://deepinfra.com/dash/api_keys",
  },
  {
    id: "meta_model_api",
    provider: openaiCompatible,
    name: "Meta Model API",
    kind: "api_key",
    baseURL: "https://api.meta.ai/v1",
    api: "chat_completions",
    keyUrl: "https://dev.meta.ai",
  },
  {
    id: "nvidia",
    provider: openaiCompatible,
    name: "NVIDIA",
    kind: "gateway",
    baseURL: "https://integrate.api.nvidia.com/v1",
    api: "chat_completions",
    keyUrl: "https://build.nvidia.com/settings/api-keys",
    keyPrefix: "nvapi-",
  },
];

export const defaultBaseUrls: Record<string, string> = {
  anthropic: "https://api.anthropic.com/v1",
  openai: "https://api.openai.com/v1",
  xai: "https://api.x.ai/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
};

export const providerName = (provider: string) =>
  provider === openaiCompatible
    ? "Custom endpoint"
    : (presets.find((p) => p.provider === provider)?.name ?? labName(provider));

export const credentialIconProvider = (credential: Credential) =>
  credential.provider === openaiCompatible
    ? (presets.find((p) => p.name === credential.name)?.id ?? credential.name)
    : credential.provider;

const wireFeatures: ReadonlyArray<WireFeature> = [
  "strict",
  "custom",
  "fallbacks",
  "thinking",
];

export const wireRejections = (wire: WireState | undefined) =>
  wireFeatures.flatMap((feature) =>
    wire?.[feature]?.enabled === false ? [{ feature }] : [],
  );

export const wireCheckedAt = (wire: WireState | undefined) =>
  wireFeatures
    .flatMap((feature) => {
      const state = wire?.[feature];
      return state?.enabled === false ? [state.at] : [];
    })
    .toSorted((a, b) => a.getTime() - b.getTime())
    .at(-1);

export const apiOptions: ReadonlyArray<{
  readonly value: Api;
  readonly label: string;
}> = [
  { value: "chat_completions", label: "Chat completions" },
  { value: "responses", label: "Responses" },
  { value: "anthropic_messages", label: "Anthropic messages" },
];

export const findCatalogEntry = (
  catalog: ReadonlyArray<CatalogEntry>,
  model: string,
) =>
  catalog.find(
    (entry) =>
      modelIdOf(entry.id) === model ||
      entry.replaces?.some((id) => modelIdOf(id) === model) === true,
  );

export const normalizeBaseUrl = (url: string) =>
  url
    .trim()
    .replace(/\/(chat\/completions|responses|messages)$/, "")
    .replace(/\/+$/, "");

export const requestUrlHint = (url: string, api: Api | undefined) => {
  const base = url.trim().replace(/\/+$/, "");
  if (api === undefined || base === "" || base.includes("{")) return undefined;
  const suffix = base.match(
    /\/(chat\/completions|responses|v1\/messages)$/,
  )?.[0];
  if (suffix !== undefined)
    return {
      doubled: true,
      text: `The base URL already ends in ${suffix}; enter the part before it`,
    };
  const path =
    api === "anthropic_messages"
      ? base.endsWith("/v1")
        ? "/messages"
        : "/v1/messages"
      : api === "responses"
        ? "/responses"
        : "/chat/completions";
  return { doubled: false, text: `Requests go to ${base}${path}` };
};

export const isServedAs = (
  model: Pick<ModelSetting, "model" | "name" | "providerModelId">,
) =>
  model.name === undefined &&
  model.providerModelId !== undefined &&
  slugModelId(model.providerModelId) !== model.model;

export const dropServedAsOnUntick = (
  models: Array<ModelSetting>,
  allModels: boolean,
  change: TickChange,
) => {
  if (change.model === undefined || change.ticked) return models;
  const wildcard = models.find((m) => m.model === labWildcard(change.lab));
  const labOn = wildcard === undefined ? allModels : wildcard.excluded !== true;
  return labOn
    ? models
    : models.filter((m) => !(m.model === change.model && isServedAs(m)));
};
