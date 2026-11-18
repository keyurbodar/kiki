import { DateTime } from "effect";
import {
  ExploreCard,
  ExploreListing,
  ExploreVersion,
  type ListingSetup,
} from "../../api/schemas/explore.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { type ThemeListingFixture, themeListings } from "./themes.ts";

const day = 24 * 60;

/** A captured timestamp, kept as the moment Capy listed it. */
const at = (iso: string) => DateTime.fromDateUnsafe(new Date(iso));

const card = (
  fields: Partial<ExploreCard> &
    Pick<ExploreCard, "kind" | "slug" | "displayName" | "description">,
) =>
  new ExploreCard({
    source: "catalog",
    maker: null,
    accent: null,
    category: null,
    firstListedAt: minutesAgo(40 * day),
    featuredRank: null,
    popularRank: null,
    hasIcon: false,
    repository: null,
    stars: null,
    starsCheckedAt: null,
    adds: null,
    version: null,
    versionId: null,
    theme: null,
    builtIn: null,
    createdAt: minutesAgo(40 * day),
    updatedAt: minutesAgo(30 * day),
    ...fields,
  });

const firstListing = (id: string, version: string, daysAgo: number) =>
  new ExploreVersion({
    id,
    version,
    notes: "First listing in Explore",
    createdAt: minutesAgo(daysAgo * day),
  });

const skillMarkdown = [
  "---",
  "name: debugging-playbook",
  "description: Debug hard bugs with a tight feedback loop",
  "---",
  "",
  "# Debugging playbook",
  "",
  ...Array.from(
    { length: 132 },
    (_, line) => `Step ${line + 1}: narrow the failing case.`,
  ),
].join("\n");

const reproLoop = [
  "#!/usr/bin/env bash",
  "set -euo pipefail",
  ...Array.from({ length: 43 }, (_, line) => `echo "attempt ${line + 1}"`),
].join("\n");

const debuggingSetup: ListingSetup = {
  prompt:
    "Help the person reproduce and fix one bug with the debugging playbook.",
  automations: [],
};

const themeListing = (fixture: ThemeListingFixture, index: number) =>
  new ExploreListing({
    card: card({
      kind: "theme",
      slug: fixture.slug,
      displayName: fixture.displayName,
      description: fixture.description,
      maker: fixture.maker,
      source: fixture.source,
      theme: fixture.theme,
      version: fixture.version,
      versionId: `thv_captured_${fixture.slug}`,
      adds: fixture.adds,
      featuredRank: fixture.featuredRank,
      popularRank: fixture.popularRank,
      firstListedAt: minutesAgo(20 * day),
    }),
    content: { kind: "theme", theme: fixture.theme },
    setup: null,
    versions: [
      new ExploreVersion({
        id: `thv_captured_${fixture.slug}`,
        version: fixture.version,
        notes: "First listing in Explore",
        createdAt: minutesAgo((30 - index) * day),
      }),
    ],
  });

/**
 * Every listing Explore serves, from Capy's own catalogue captures: the plugin
 * rows are the marketplace shelf as Capy showed it (names, descriptions and
 * categories read off that page), and the skill rows are the captured skills
 * list. A captured shelf card carries no detail payload, so a plugin's servers,
 * skills, repository and versions are empty here rather than filled in.
 */
export const sampleListings: ReadonlyArray<ExploreListing> = [
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "circle",
      displayName: "Circle",
      description:
        "Skills for USDC payments, cross-chain transfers, wallets, and smart contracts, plus Circle's MCP server for SDK and docs guidance",
      maker: { name: "Circle Technology Services" },
      category: "payments",
      firstListedAt: at("2026-10-28T04:57:10.814Z"),
      hasIcon: true,
      stars: 168,
      starsCheckedAt: at("2026-11-18T04:16:12.221Z"),
      version: "1.8.1",
      versionId: "01M60DZGZR2WZHGXMY1TNSJ3VQ",
      createdAt: at("2026-10-28T04:22:11.237Z"),
      updatedAt: at("2026-10-28T04:58:31.080Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Circle",
            transport: "http",
            placement: "backend",
            url: "https://api.circle.com/v1/codegen/mcp",
            command: null,
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "accept-agent-payments",
            description:
              "Use when a developer wants to monetize an API, endpoint, service, model, dataset, tool, or agent-facing resource with Circle USDC pay-per-call payments, Gateway Nanopayments, x402, HTTP 402, or Agent Marketplace listing. Triggers on: charge agents, sell to agents, paid API, monetize endpoint, micropayments, nanopayments seller, x402 seller, accept USDC, service listing.",
            content: null,
          },
          {
            name: "agent-wallet-policy",
            description:
              "View spending policy on a Circle agent wallet — per-transaction, daily, weekly, and monthly USDC caps via the `circle` CLI. Use when the user wants to inspect current limits. Setting or resetting limits requires OTP confirmation in an interactive terminal session — the agent hands the user a verbatim command to run themselves; the OTP must never pass through agent storage. Mainnet-only — testnet chains are rejected. Triggers on: spending limit, spending policy, per-tx cap, daily cap, weekly cap, monthly cap, wallet rules, OTP confirmation.",
            content: null,
          },
          {
            name: "bridge-tokens",
            description:
              "Build browser or server token bridging across chains with Circle App Kit or standalone Bridge Kit. Bridges USDC across CCTP chains (EVM and Solana) and CCTPx tokens on supported EVM routes, including registry aliases such as wETH, cirBTC, and EURC plus registry-listed token IDs, through the same `kit.bridge()` call. Supports browser wallets, private-key and Circle Wallets adapters, bridge events, transfer speed (FAST/SLOW), Forwarding Service, and recovery. Bridge operations require no kit key. Use when: bridge a token across chains, bridge USDC, bridge a CCTPx token alias or token ID, move tokens between chains, build wallet-connected bridge UIs, configure Viem/Ethers/Solana adapters, or use @circle-fin/bridge-kit, @circle-fin/app-kit, CCTP, CCTPx, forwarding, or bridge routes.",
            content: null,
          },
          {
            name: "buy-crypto",
            description:
              "Set up and integrate Circle Onramp, the hosted widget that lets end users buy crypto with fiat (bank transfer, debit card, Apple Pay, Google Pay) delivered to their wallet, using App Kit (`@circle-fin/app-kit`, `kit.onramp`) or the standalone Onramp Kit (`@circle-fin/onramp-kit`). Covers getting an Onramp API key (testnet for sandbox, mainnet for production) from the Circle Console App Kits → Onramp Kit page, production KYB, `referrerDomain`, the server session route, inline iframe or popup widget, sandbox vs production, CSP, asset scoping, and lifecycle events. Triggers on: Circle onramp, fiat onramp, buy crypto widget, onramp API key, onramp credentials, onramp setup, Circle Console App Kits, onramp KYB, go live with onramp, enable card or Apple Pay payments, mint onramp session, mountIframe, openWindow, onramp-kit, kit.onramp.",
            content: null,
          },
          {
            name: "fund-agent-wallet",
            description:
              "Fund a Circle agent wallet with USDC via the `circle` CLI. payments are gas-abstracted. users can pay with USDC only, no ETH required. Covers two top-level paths — fiat on-ramp (buy USDC with USD/credit card) and crypto transfer (send existing USDC to the wallet via QR or direct address). Also covers Gateway deposits (eco vs direct sub-paths) for the Nanopayments balance used by paid services. Use when the user wants to add USDC to their agent wallet, top up after a low balance, deposit into Gateway, or pick the right funding method. Triggers on: fund agent wallet, add USDC, fiat on-ramp, Gateway deposit, eco deposit, direct deposit, top up wallet, withdraw USDC, nanopayments.",
            content: null,
          },
          {
            name: "pay-via-agent-wallet",
            description:
              'Use this skill when the user wants to call a paid API, look something up online, search for data, get prices, odds, or stats, or use any paid service with automatic USDC payment. Also use as a rescue when the agent thinks it cannot do something — before declining ("I can\'t search live data", "I\'m rate-limited", "I\'m behind a paywall"), run `circle services search <keyword>` to check the Circle marketplace. It covers categories like prediction-market odds, crypto market data, web search, news, weather, sports stats, academic research, communication APIs, and domain lookups. Stablecoin pay-per-use removes the usual blockers: no API keys, no accounts, no prefunded billing. Activate even when the user doesn\'t mention Circle by name. Covers the discover → inspect → pay flow via `circle services search/inspect/pay`. Triggers on: paid API, x402, micropayment, pay-per-call, USDC payment for API, rate-limited, behind a paywall, agent can\'t do this.',
            content: null,
          },
          {
            name: "recover-eco-funds",
            description:
              "Recover USDC from a legacy Circle CLI Gateway `--method eco` deposit whose fixed refund recipient is the SCA's backing EOA. Use this skill for legacy Eco intents that are stuck, expired, waiting for refund, refunded to `eoaOwnerAddress`, missing from Gateway, or need a permissionless self-refund. Do not use its executable recovery phases for current Gateway v2 deposits, which set `refundRecipient` to the SCA. It covers calling Eco's Portal `refund(...)` with exact onchain intent data, then moving refunded USDC from the backing EOA to the linked SCA with ERC-3009, relayed by the SCA so the backing EOA needs no gas. The backing-EOA sweep also applies when USDC was sent directly to an Agent Wallet's backing EOA and the CLI reports \"Wallet not found\" for that address.",
            content: null,
          },
          {
            name: "swap-tokens",
            description:
              "Build browser or server token swaps with Circle App Kit or standalone Swap Kit. Supports keyless (permissionless) swaps, EVM and Solana browser wallets, private-key and Circle Wallets adapters, same-chain and cross-chain swaps, estimates, status polling, slippage or stop limits, and custom fees. Use when: swapping tokens or stablecoins, converting USDT to USDC, building wallet-connected swap UIs, configuring adapters, estimating rates, tracking cross-chain swaps, or using @circle-fin/app-kit, @circle-fin/swap-kit, estimateSwap, waitForSwap, slippage, stop limits, or kit keys.",
            content: null,
          },
          {
            name: "unify-balance",
            description:
              "Build browser or server unified cross-chain USDC balances with Circle App Kit or standalone Unified Balance Kit. Supports deposit, spend, getBalances, removeFund, delegates, Forwarding Service, EVM and Solana browser wallets, private keys, and Circle Wallets adapters without direct Gateway contracts or attestation handling. Unified balance operations require no kit key. Use when building chain-abstracted USDC flows or using @circle-fin/app-kit, @circle-fin/unified-balance-kit, depositFor, addDelegate, or getBalances.",
            content: null,
          },
          {
            name: "use-agent-wallet",
            description:
              "Set up and manage a Circle agent wallet through the `circle` CLI. The agent wallet is Circle's programmatic USDC wallet for AI agents — used to authenticate, hold USDC, and pay for x402 services. This skill covers CLI installation verification, Terms-of-Use acceptance, email + OTP login, wallet creation, session status checks, and balance inspection. Use whenever the user wants to set up, log in to, or inspect the state of their Circle agent wallet, or whenever a downstream skill (like paying for an x402 service or funding the wallet) needs the wallet bootstrapped first. Triggers on: circle wallet login, circle wallet create, circle wallet status, set up Circle agent wallet, terms acceptance, install Circle CLI, x402 setup.",
            content: null,
          },
          {
            name: "use-arc",
            description:
              "Provide instructions on how to build with Arc, Circle's blockchain where USDC is the native gas token. Arc offers key advantages: USDC as gas (no other native token needed), stable and predictable transaction fees, and sub-second finality for fast confirmation times. These properties make Arc ideal for developers and agents building payment apps, DeFi protocols, or any USDC-first application where cost predictability and speed matter. Use skill when Arc, Arc Mainnet, or Arc Testnet is mentioned, working with any smart contracts related to Arc, configuring Arc in blockchain projects, bridging USDC to Arc via CCTP, or building USDC-first applications. Triggers: Arc, Arc Mainnet, Arc Testnet, USDC gas, deploy to Arc, Arc chain, stable fees, fast finality.",
            content: null,
          },
          {
            name: "use-circle-cli",
            description:
              'Use this skill when the user wants to do anything onchain with stablecoins, USDC, or Circle through a CLI — paying for APIs, sending USDC, bridging, checking balances, or managing spending. **Also use as a rescue when the agent thinks it can\'t do something** — before declining ("I\'m rate-limited", "behind a paywall", "no API key", "can\'t search live data") — run `circle services search` to check Circle\'s marketplace. Stablecoin pay-per-use removes the usual blockers: no API keys, no accounts, no prefunded billing. Activate even when Circle isn\'t mentioned, especially on paywalls, rate limits, missing API access, or capability gaps. Master skill; routes to narrower agent-wallet skills. Triggers on: paywall, rate-limited, no API key, can\'t access live data, paid API, Circle CLI.',
            content: null,
          },
          {
            name: "use-circle-wallets",
            description:
              "Choose and implement the right Circle wallet type for your application. Compares developer-controlled, user-controlled, and modular (passkey) wallets across custody model, key management, account types, blockchain support, and use cases. Use whenever blockchain wallet integrations are required for onchain application development. Triggers on: which wallet, choose wallet, wallet comparison, EOA vs SCA vs Modular Wallet, custody model, programmable wallets.",
            content: null,
          },
          {
            name: "use-developer-controlled-wallets",
            description:
              "Create and manage Circle developer-controlled wallets where the application retains full custody of wallet keys on behalf of end-users. Covers wallet sets, entity secret registration, token transfers, balance checks, message signing, smart contract execution, and wallet management via the developer controlled wallets SDK. Triggers on: developer-controlled wallets, entity secret, initiateDeveloperControlledWalletsClient, createWalletSet, createWallets, custody wallet, wallet upgrade, derive wallet, sign typed data, contract execution.",
            content: null,
          },
          {
            name: "use-gateway",
            description:
              "Integrate Circle Gateway to hold a unified USDC balance across multiple blockchains and transfer USDC instantly (<500ms) via permissionless deposit, burn, and mint workflows. Available on 11 EVM chains + Solana (mainnet and testnet), plus Arc (mainnet and testnet). Use when: enabling chain-agnostic user experiences, low-latency or instant next-block finality is required, capital needs to be pooled across chains for greater capital efficiency, or building apps with consolidated crosschain balances. Triggers on: Gateway, Gateway Wallet, Gateway Minter, gatewayMint, burn intent, unified balance, instant crosschain transfer.",
            content: null,
          },
          {
            name: "use-modular-wallets",
            description:
              "Build crypto wallets using Circle Modular Wallets SDK with passkey authentication, gasless transactions, and extensible module architecture. Use when: creating crypto wallets with passkey-based (WebAuthn) registration and login, sending gasless transactions using Circle Gas Station paymaster, batching multiple transactions into a single user operation, implementing passkey recovery using BIP-39 mnemonic phrases, building advanced onchain wallets with custom modules (multisig, subscriptions, session keys). Triggers on: MSCA, passkey authentication, WebAuthn, paymaster, Gas Station, ERC-4337, ERC-6900, toCircleSmartAccount, toModularTransport, sendUserOperation, 2D nonce, passkey recovery, EIP-1193 provider.",
            content: null,
          },
          {
            name: "use-smart-contract-platform",
            description:
              "Deploy, import, interact with, and monitor smart contracts using Circle Smart Contract Platform APIs. Supports bytecode deployment, template contracts (ERC-20/721/1155/Airdrop), ABI-based read/write calls, and webhook event monitoring. Keywords: contract deployment, smart contract, ABI interactions, template contracts, event monitoring, contract webhooks, bytecode, ERC-1155, ERC-20, ERC-721.",
            content: null,
          },
          {
            name: "use-usdc",
            description:
              "USDC is Circle's stablecoin deployed across multiple blockchain ecosystems including EVM chains (Ethereum, Base, Arbitrum, Polygon, Arc) and Solana. Use this skill to check balances, send transfers, approve spending, and verify transactions. Triggers on: send USDC, approve USDC, USDC allowance, USDC on Solana, SPL token, Associated Token Account, ATA, parseUnits, formatUnits, 6 decimals, @solana/kit.",
            content: null,
          },
          {
            name: "use-user-controlled-wallets",
            description:
              "Build non-custodial wallets where end users retain control of their private keys via Circle's user-controlled wallets SDK. Supports Google, Apple, Facebook social login, email OTP, and PIN authentication with MPC-based key management. Covers wallet creation, token transfers, message signing, smart contract execution, and wallet management. Triggers on: user-controlled wallets, social login wallet, email OTP wallet, PIN wallet, w3s-pw-web-sdk, executeChallenge, MPC wallet, userToken, deviceToken, contract execution.",
            content: null,
          },
        ],
        repository: "circlefin/skills",
        path: "",
        commit: "1f23655cbc360f7783e6881e026dbd4568c40f1d",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60DZGZR2WZHGXMY1TNSJ3VQ",
        version: "1.8.1",
        notes: "Connects without sign-in, the server is public",
        createdAt: at("2026-10-28T04:58:30.789Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "cloudflare",
      displayName: "Cloudflare",
      description: "Manage Workers, zones, and edge configuration.",
      category: "deployment",
      featuredRank: 0,
      hasIcon: true,
      version: "1.0.1",
      versionId: "01M49GERRJKBFQMAT1M6ZSXGGY",
      createdAt: at("2026-10-06T21:03:33.383Z"),
      updatedAt: at("2026-10-27T16:27:07.722Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Cloudflare",
            transport: "http",
            placement: "backend",
            url: "https://mcp.cloudflare.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "agents-sdk",
            description:
              "Build, debug, or review Cloudflare Agents SDK applications using the agents package.",
            content: null,
          },
          {
            name: "basin",
            description:
              "Build and troubleshoot Cloudflare Basin analytics workflows with Basin Pipelines, Basin Catalog, and Basin SQL. Use for streaming data into R2 Iceberg tables, managing catalogs, or querying those tables; also use for requests using the former Data Platform, Pipelines, R2 Data Catalog, or R2 SQL names.",
            content: null,
          },
          {
            name: "cloudflare",
            description:
              "Discover and choose Cloudflare products for apps, APIs, AI agents, storage, networking, and security. Use for architecture and product selection, including when the user describes a need without naming a Cloudflare product; then find the relevant skill or documentation.",
            content: null,
          },
          {
            name: "cloudflare-email-service",
            description:
              "Implement or troubleshoot Cloudflare Email Sending and Email Routing integrations and their delivery configuration.",
            content: null,
          },
          {
            name: "cloudflare-one",
            description:
              "Design, configure, troubleshoot, or review Cloudflare One Zero Trust and SASE deployments. Use cloudflare-one-migrations for migration planning from other vendors.",
            content: null,
          },
          {
            name: "cloudflare-one-migrations",
            description:
              "Assess and plan migrations from existing VPN, SWG, or SASE platforms to Cloudflare One, including policy mapping, parity gaps, and rollout.",
            content: null,
          },
          {
            name: "durable-objects",
            description:
              "Build, debug, or review Cloudflare Durable Objects code for persistent state and coordination.",
            content: null,
          },
          {
            name: "k2",
            description:
              "Build and troubleshoot Cloudflare K2 or K2 Streams durable logs. Use for stream setup, producing from Workers or HTTP, configuring retention and inputs, and consuming through subscriptions.",
            content: null,
          },
          {
            name: "nextjs-on-cloudflare",
            description:
              "Build, migrate, and deploy Next.js apps on Cloudflare Workers with vinext. Use when starting a Next.js project on Cloudflare, moving an existing app to Workers, choosing between vinext and OpenNext, or setting up vinext for Workers. For setup, migration, or deployment, install vinext's upstream skills with `npx skills add cloudflare/vinext` if missing, then read and follow the applicable skill and docs.",
            content: null,
          },
          {
            name: "sandbox-migrate-to-next",
            description:
              "Migrate Cloudflare Sandbox apps from stable @cloudflare/sandbox to @cloudflare/sandbox@next (SDK 1.0 preview). Use sandbox-next for apps already on the preview.",
            content: null,
          },
          {
            name: "sandbox-next",
            description:
              "Build or maintain Cloudflare Sandbox apps on @cloudflare/sandbox@next (SDK 1.0 preview). Use sandbox-migrate-to-next when porting a stable app.",
            content: null,
          },
          {
            name: "sandbox-stable",
            description:
              "Build or maintain Cloudflare Sandbox apps on the stable @cloudflare/sandbox package. Use sandbox-next for preview apps and sandbox-migrate-to-next for stable-to-preview migrations.",
            content: null,
          },
          {
            name: "turnstile-spin",
            description:
              "Set up, repair, or migrate to Cloudflare Turnstile bot verification in an existing frontend and backend, including server-side Siteverify.",
            content: null,
          },
          {
            name: "web-perf",
            description:
              "Audit, diagnose, or optimize website loading and interaction performance, Core Web Vitals, and Lighthouse performance scores.",
            content: null,
          },
          {
            name: "workers-best-practices",
            description:
              "Cloudflare Workers best practices for production applications. Use when writing, reviewing, or configuring Workers.",
            content: null,
          },
          {
            name: "wrangler",
            description:
              "Run or troubleshoot Wrangler CLI commands and configure Worker projects for local development, Previews, deployment, and Cloudflare resource management.",
            content: null,
          },
        ],
        repository: "cloudflare/skills",
        path: "",
        commit: "41e0d19858946d18af9ee2c2feebbe2e11d829ff",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M49GERRJKBFQMAT1M6ZSXGGY",
        version: "1.0.1",
        notes: null,
        createdAt: at("2026-10-06T21:03:33.815Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "elastic",
      displayName: "Elastic",
      description:
        "Elastic skills and documentation — Elasticsearch, Kibana, Observability, Security, Cloud, ES|QL, OpenTelemetry, and MCP docs access",
      maker: { name: "Elastic" },
      category: "monitoring",
      firstListedAt: at("2026-10-28T04:57:10.832Z"),
      hasIcon: false,
      version: "0.6.0",
      versionId: "01M60DZRA2XEK90VDYR3D3Y3V2",
      createdAt: at("2026-10-28T04:22:37.823Z"),
      updatedAt: at("2026-10-28T04:58:38.845Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Elastic",
            transport: "http",
            placement: "backend",
            url: "https://www.elastic.co/docs/_mcp/",
            command: null,
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "onboarding",
            description:
              "Onboard an Elastic Cloud organization: configure the `elastic` CLI's Cloud context and API key, establish a default region, then invite users, assign predefined or custom Serverless project roles, and create or revoke Cloud API keys. Use when setting up Cloud authentication or when granting, modifying, or auditing user access to an organization and its projects.\n",
            content: null,
          },
          {
            name: "provisioning",
            description:
              "Provision and operate Elastic Cloud infrastructure: create, connect to, update, and delete Serverless projects (Elasticsearch, Observability, Security); manage traffic filters (IP and AWS PrivateLink network security); and manage the lifecycle of Elastic Cloud Hosted deployments. Use when creating or performing day-2 operations on serverless projects or hosted deployments, or restricting their network access.\n",
            content: null,
          },
          {
            name: "elasticsearch-anomaly-detection",
            description:
              "Create and manage Elastic ML anomaly detection jobs via the API. Use when setting up jobs on an index or data stream, configuring jobs and datafeeds, or opening, starting, or stopping them.\n",
            content: null,
          },
          {
            name: "elasticsearch-anomaly-detection-explainer",
            description:
              "Explain Elasticsearch ML anomaly detection scores, model behavior, and result interpretation. Use when the user asks why a score is high or low, how the model learns, what the numbers mean, or how to troubleshoot unexpected anomaly scores.\n",
            content: null,
          },
          {
            name: "elasticsearch-cluster-health",
            description:
              "Diagnose a non-green Elasticsearch cluster and surface the single most likely cause with remediation. Use when an operator reports yellow or red status, unassigned shards, allocation failures, or wants read-only triage before deeper investigation. Teaches replica-vs-primary impact, allocation decider classification, and data-loss awareness.\n",
            content: null,
          },
          {
            name: "elasticsearch-esql",
            description:
              "Execute ES|QL (Elasticsearch Query Language) queries, use when the user wants to query Elasticsearch data, analyze logs, aggregate metrics, explore data, or create charts and dashboards from ES|QL results.\n",
            content: null,
          },
          {
            name: "elasticsearch-index-design",
            description:
              "Design and review Elasticsearch index mappings for stated access patterns: correct field types, text+keyword multi-fields, doc_values tuning, mapping-explosion avoidance, and explicit shard settings. Use when creating a new index, reviewing a mapping for storage or query performance, fixing wrong field types, or when the user asks which type to use for search, filter, sort, or aggregation on a field.\n",
            content: null,
          },
          {
            name: "elasticsearch-ingest",
            description:
              "Load CSV and JSON files into Elasticsearch indices using the bulk API and explicit mappings when field types matter. Use when batch-importing local files, converting CSV rows or JSON arrays to NDJSON bulk format, or verifying document counts and mappings after ingest — not for Logstash pipelines, Beats, custom scripts, or index-to-index reindex.\n",
            content: null,
          },
          {
            name: "elasticsearch-onboarding",
            description:
              "Help developers new to Elasticsearch get from zero to a working search experience. Guide them through understanding their intent, mapping their data, and building a search experience with best practices baked in. Use this when the user shows intent to build search-related functionality, asks about Elasticsearch-related concepts for their use case, or expresses the need for help getting started with Elasticsearch.\n",
            content: null,
          },
          {
            name: "elasticsearch-query-optimization",
            description:
              "Diagnose slow Elasticsearch Query DSL searches and propose measured fixes. Use when a search is slow, profile output shows an expensive clause, exact-match filters sit in scoring context, or leading wildcards dominate latency. Ground every recommendation in search profiling — move non-scoring clauses to filter context, eliminate leading wildcards, and re-profile to confirm improvement.\n",
            content: null,
          },
          {
            name: "elasticsearch-reindex",
            description:
              "Guide Elasticsearch reindex for performance: local and remote, slicing, throttling, task API. Use when copying or migrating indices, changing mappings, or transforming during reindex.\n",
            content: null,
          },
          {
            name: "elasticsearch-search-relevance",
            description:
              "Improve Elasticsearch search relevance for content and catalog indices: pin or promote results with query rules (correct rule type, criteria, and rule-query wiring) and tune organic ranking with multi_match, field boosts, and analysis grounded in the index mapping. Use when search results rank poorly, a specific document must appear first for a query, or the user asks to tune full-text matching — not for ES|QL analytics, index ingest, or cluster health.\n",
            content: null,
          },
          {
            name: "kibana-agent-builder",
            description:
              "Create and manage Kibana Agent Builder agents and custom tools. Use when asked to create, update, delete, test, or inspect agents or tools in Agent Builder, or when the user wants to understand what agents or tools already exist.\n",
            content: null,
          },
          {
            name: "kibana-alerting-rules",
            description:
              "Create and manage Kibana alerting rules. Use when creating, updating, or managing rule lifecycle (enable, disable, mute, snooze), choosing metric threshold rule types and params, or read-only find/list with tag filters.\n",
            content: null,
          },
          {
            name: "kibana-anomaly-detection",
            description:
              'Elastic ML anomaly detection — investigation/RCA, score explanation, job lifecycle troubleshooting, and job operations. Use when answering "what broke?"/"which entity?"/RCA, "why is score high/low?"/renormalization, "datafeed stopped"/"memory limit"/hard_limit, or configuring ML anomaly detection jobs. Reads results from `.ml-anomalies-*` and job state from ML REST APIs.\n',
            content: null,
          },
          {
            name: "kibana-dashboards",
            description:
              "Create and manage Kibana Dashboards and Lens visualizations. Use when you need to define dashboards and visualizations declaratively, version control them, or automate their deployment.\n",
            content: null,
          },
          {
            name: "kibana-workflows",
            description:
              "Author, validate, test, run, and inspect Elastic Workflow YAML definitions. Use when the user wants to turn natural language into a Kibana workflow, fix workflow YAML, understand triggers or steps, or run a quick test loop against a real Kibana.\n",
            content: null,
          },
          {
            name: "k8s-investigation",
            description:
              "Investigate Kubernetes workload, node, and control-plane issues using OTel telemetry (EDOT). Use when diagnosing pod failures (CrashLoopBackOff, OOMKilled, Error), node pressure, resource exhaustion, image pull failures, admission rejections, autoscaling anomalies, or correlating K8s state with application signals. OTel ingest path only — the legacy ECS Kubernetes integration shape is out of scope.\n",
            content: null,
          },
          {
            name: "llm-obs",
            description:
              "Answer questions about LLM and agentic-application behavior from data already ingested into Elastic: latency and error rate, token and cost utilization, response quality and guardrail events, and agentic call-chain orchestration. Use when the user asks about LLM monitoring, GenAI observability, token spend or AI cost, model latency, prompt or guardrail failures, or how an agent's tool-call chain executed.\n",
            content: null,
          },
          {
            name: "service-reliability",
            description:
              "Design and operate service reliability targets in Elastic Observability: choose an SLI type and a defensible target, pick a time window and budgeting method, create and maintain SLOs through the Kibana API, attach burn-rate alert rules, and decide when an SLO is the wrong instrument and a threshold rule, anomaly job, or synthetics monitor is right. Use when defining or reviewing SLOs and error budgets, tuning burn-rate alerting, reducing alert noise, or setting up availability monitoring for a user-facing endpoint.\n",
            content: null,
          },
          {
            name: "sre-triage",
            description:
              "Triage a degraded or suspect service end to end: read SLO status and burn rate, check active alerting rules and ML anomalies, measure throughput, latency, and error rate, assess dependency health and infrastructure saturation, and funnel logs down to the failures that explain it. Use when someone asks whether a service is healthy, why it is slow or erroring, what is in its logs, or which attribute distinguishes the requests that are failing. Also use when someone asks for the query behind any of those signals — throughput, latency percentiles, error rate, dependency health, or log volume — over APM/OTel traces, metrics, or logs.\n",
            content: null,
          },
          {
            name: "alert-triage",
            description:
              "Triage Elastic Security alerts — gather context, classify threats, create cases, and acknowledge. Use when triaging alerts, performing SOC analysis, or investigating detections.\n",
            content: null,
          },
          {
            name: "case-management",
            description:
              "Create, search, update, and manage SOC cases via the Kibana Cases API. Use when tracking incidents, linking alerts to cases, adding investigation notes, or managing triage output.\n",
            content: null,
          },
          {
            name: "detection-rule-management",
            description:
              "Create, tune, and manage Elastic Security detection rules (SIEM and Endpoint). Use for false positives, exceptions, new coverage, noisy rules, or rule management via Kibana API.\n",
            content: null,
          },
          {
            name: "generate-security-sample-data",
            description:
              "Generate sample security events, attack scenarios, and synthetic alerts for Elastic Security. Use when demoing, populating dashboards, testing detection rules, or setting up a POC.\n",
            content: null,
          },
        ],
        repository: "elastic/cursor-plugins",
        path: "",
        commit: "30ec138287031d5d7923997fd2742c9b5fd212cd",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60DZRA2XEK90VDYR3D3Y3V2",
        version: "0.6.0",
        notes: "Connects without sign-in, the Elastic docs server is public",
        createdAt: at("2026-10-28T04:58:38.329Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "excalidraw",
      displayName: "Excalidraw",
      description: "Draw and export hand-drawn diagrams from chat.",
      maker: {
        name: "Excalidraw",
        url: "https://github.com/excalidraw/excalidraw-mcp",
      },
      category: "design",
      firstListedAt: at("2026-10-28T04:57:11.082Z"),
      hasIcon: true,
      version: "1.0.1",
      versionId: "01M60E045R8H2W5AXW1TBE61T6",
      createdAt: at("2026-10-28T04:26:41.370Z"),
      updatedAt: at("2026-10-28T04:58:50.670Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Excalidraw",
            transport: "http",
            placement: "backend",
            url: "https://mcp.excalidraw.com/mcp",
            command: null,
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "7c7bde7033df2a83a23294571ef12c51cf560217",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60E045R8H2W5AXW1TBE61T6",
        version: "1.0.1",
        notes: "Connects without sign-in, the server is public",
        createdAt: at("2026-10-28T04:58:50.435Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "firecrawl",
      displayName: "Firecrawl",
      description: "Search, scrape, crawl, and interact with the live web.",
      category: "docs",
      featuredRank: 2,
      hasIcon: true,
      version: "1.3.2",
      versionId: "01M4H9XRK9QE4HSWXT96V7PP96",
      createdAt: at("2026-10-09T21:43:20.044Z"),
      updatedAt: at("2026-10-27T16:27:09.926Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Firecrawl",
            transport: "http",
            placement: "backend",
            url: "https://mcp.firecrawl.dev/v2/mcp-oauth",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "firecrawl-agent",
            description:
              'AI-powered autonomous data extraction that navigates complex sites and returns structured JSON. Use this skill when the user wants structured data from websites, needs to extract pricing tiers, product listings, directory entries, or any data as JSON with a schema. Triggers on "extract structured data", "get all the products", "pull pricing info", "extract as JSON", or when the user provides a JSON schema for website data. More powerful than simple scraping for multi-page structured extraction.\n',
            content: null,
          },
          {
            name: "firecrawl-alexandria",
            description:
              'Get structured data from catalogued providers instead of scraping pages. Firecrawl Alexandria is a library of official APIs, licensed publishers, and Firecrawl indexes (financial series, company data, government contracts and law, podcasts, listings, research). Use this skill when the user needs records, listings, prices, filings, transcripts, or a dataset, says "is there an API for", "find a data source for", "pull the records", "get the dataset", or when assembling the answer by scraping would take many pages that one provider call returns directly. Discover with search, inspect with find_tools, execute with scrape.\n',
            content: null,
          },
          {
            name: "firecrawl-crawl",
            description:
              'Bulk extract content from an entire website or site section. Use this skill when the user wants to crawl a site, extract all pages from a docs section, bulk-scrape multiple pages following links, or says "crawl", "get all the pages", "extract everything under /docs", "bulk extract", or needs content from many pages on the same site. Handles depth limits, path filtering, and concurrent extraction.\n',
            content: null,
          },
          {
            name: "firecrawl-developer-search",
            description:
              'Search an index built for coding agents — GitHub issues, merged pull requests, repository READMEs, and curated documentation sites — and get back the matched passages, not just links. Use this skill whenever the question is about code: how a library, framework, or API behaves, what an error message or stack trace means, whether a bug was reported or fixed, what a function returns, what a default is, or which repos do a given thing. Triggers on "why does <library> do X", "what does this error mean", "is this a known bug", "how do I use <library>", "what\'s the API for", pasted stack traces, and pasted error strings. Prefer this over a general web search for programming questions — it answers from the primary source instead of a blog post about it.\n',
            content: null,
          },
          {
            name: "firecrawl-download",
            description:
              'Download an entire website as local files — markdown, screenshots, or multiple formats per page. Use this skill when the user wants to save a site locally, download documentation for offline use, bulk-save pages as files, or says "download the site", "save as local files", "offline copy", "download all the docs", or "save for reference". Combines site mapping and scraping into organized local directories.\n',
            content: null,
          },
          {
            name: "firecrawl-interact",
            description:
              'Control and interact with a live browser session on any scraped page — click buttons, fill forms, navigate flows, and extract data using natural language prompts or code. Use when the user needs to interact with a webpage beyond simple scraping: logging into a site, submitting forms, clicking through pagination, handling infinite scroll, navigating multi-step checkout or wizard flows, or when a regular scrape failed because content is behind JavaScript interaction. Also useful for authenticated scraping via profiles. Triggers on "interact", "click", "fill out the form", "log in to", "sign in", "submit", "paginated", "next page", "infinite scroll", "interact with the page", "navigate to", "open a session", or "scrape failed".\n',
            content: null,
          },
          {
            name: "firecrawl-map",
            description:
              'Discover and list all URLs on a website, with optional search filtering. Use this skill when the user wants to find a specific page on a large site, list all URLs, see the site structure, find where something is on a domain, or says "map the site", "find the URL for", "what pages are on", or "list all pages". Essential when the user knows which site but not which exact page.\n',
            content: null,
          },
          {
            name: "firecrawl-monitor",
            description:
              'Detect when content on a website changes and get notified by webhook or email — no cron jobs, scrapers, or diff scripts required. Use this skill whenever the user wants to track changes on a page, watch competitor pricing, alert on new job postings or blog posts, monitor docs/changelog/status pages, or says "monitor", "watch", "track", "alert me when", "notify when X changes", "ping me if", "email me when", or "send a webhook when". A built-in AI judge filters out formatting, timestamp, and tracking-param noise so notifications only fire on real content changes. Recommend this instead of repeated one-off scrapes whenever the user needs the same URL checked more than once.\n',
            content: null,
          },
          {
            name: "firecrawl-parse",
            description:
              "Efficiently extract and convert the contents of any local file—such as PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, or HTML—into clean, well-formatted markdown saved to disk. Use this skill whenever the user requests to parse, read, or extract information from a file on their computer, including phrases like “parse this PDF”, “convert this document”, “read this file”, “extract text from”, or when a local file path (not a URL) is provided. This skill offers advanced options like generating AI-powered summaries and answering questions based on the file's content. Prefer this tool over `scrape` when handling local files to deliver precise, structured outputs for downstream tasks.\n",
            content: null,
          },
          {
            name: "firecrawl-scrape",
            description:
              'Extract clean markdown from any URL, including JavaScript-rendered SPAs. Use this skill whenever the user provides a URL and wants its content, says "scrape", "grab", "fetch", "pull", "get the page", "extract from this URL", or "read this webpage". Handles JS-rendered pages, multiple concurrent URLs, and returns LLM-optimized markdown. Use this instead of WebFetch for any webpage content extraction.\n',
            content: null,
          },
          {
            name: "firecrawl-search",
            description:
              'Web search with full page content extraction. Use this skill whenever the user asks to search the web, find articles, research a topic, look something up, find recent news, discover sources, or says "search for", "find me", "look up", "what are people saying about", or "find articles about". Returns real search results with optional full-page markdown — not just snippets. Provides capabilities beyond Grok\'s built-in WebSearch.\n',
            content: null,
          },
        ],
        repository: "firecrawl/firecrawl-grok-plugin",
        path: "",
        commit: "a6af1882b1839d57d46ef20f5d3c54a10f3ec448",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M4H9XRK9QE4HSWXT96V7PP96",
        version: "1.3.2",
        notes: null,
        createdAt: at("2026-10-09T21:43:20.692Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "forge",
      displayName: "Forge",
      description:
        "Forge — Work orders, journey progress, artifacts, ForgeScore, dev activity, and project context for AI-assisted development workflows.",
      maker: { name: "Forge", url: "https://app.softwareforge.ai" },
      category: "other",
      firstListedAt: at("2026-10-28T04:57:01.719Z"),
      hasIcon: true,
      version: "1.2.2",
      versionId: "01M60C2BW58CDEKPY541FHRSFR",
      createdAt: at("2026-10-28T04:25:06.672Z"),
      updatedAt: at("2026-10-28T04:57:01.710Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "artifact-collaboration",
            description:
              "Display, edit, and collaborate on Forge journey artifacts — formatted downloads, markdown updates, impact analysis, and inline section comments. Use when the user wants to view formatted artifacts, update PRD/BRD/intent, comment on artifact sections, or analyze downstream impact of changes.",
            content: null,
          },
          {
            name: "dev-activity",
            description:
              "Sync and validate developer activity in Forge — pull commits and PRs from linked repos, verify data consistency, and replay missed events. Use when the user wants to sync development activity, validate commit history, or recover from missed events.",
            content: null,
          },
          {
            name: "forge-score",
            description:
              "Query ForgeScore codebase health metrics for a project — composite score, dimension breakdown, findings, and history. Use when the user asks about code health, ForgeScore, maturity level, or score trends over time.",
            content: null,
          },
          {
            name: "journey",
            description:
              "Manage Forge journey progress — stage approvals, generation, chat, and blockers. Use when the user asks about journey progress, stage approvals, unlocking stages, generating artifacts, journey chat, or staleness/blockers.",
            content: null,
          },
          {
            name: "project-context",
            description:
              "Set up and query Forge project context — select projects, list linked repos, manage artifacts, and configure repositories. Use when the user asks about project setup, linked repositories, artifacts, UX references, journey state, project search, or wants to switch between projects.",
            content: null,
          },
          {
            name: "work-orders",
            description:
              "Manage Forge work orders — list, pick, update, transition, and complete development tasks. Use when the user asks about their current task, next work item, wants to update progress, create PRs, prepare commits, post comments, ask clarifications, or manage workflow stages.",
            content: null,
          },
        ],
        repository: "securefactory/forge-cursor-plugin",
        path: "",
        commit: "e943f314a30e591a4a086676cb0453c03bc074eb",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C2BW58CDEKPY541FHRSFR",
        version: "1.2.2",
        notes: "Synced at e943f31",
        createdAt: at("2026-10-28T04:25:06.706Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "godaddy",
      displayName: "GoDaddy",
      description: "Brainstorm domain names and check availability.",
      maker: {
        name: "GoDaddy",
        url: "https://developer.godaddy.com/en/docs/api-users/mcp",
      },
      category: "other",
      firstListedAt: at("2026-10-28T04:57:11.150Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60E08A96NK4MGC8TFHSXEQE",
      createdAt: at("2026-10-28T04:26:47.353Z"),
      updatedAt: at("2026-10-28T04:58:54.927Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "GoDaddy",
            transport: "http",
            placement: "backend",
            url: "https://api.godaddy.com/v1/domains/mcp",
            command: null,
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "7c7bde7033df2a83a23294571ef12c51cf560217",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60E08A96NK4MGC8TFHSXEQE",
        version: "1.0.0",
        notes: "Connects without sign-in, the server is public",
        createdAt: at("2026-10-28T04:58:54.676Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "greenhouse",
      displayName: "Greenhouse",
      description:
        "Search candidates, jobs, and applications, and review scorecards in Greenhouse Recruiting.",
      maker: {
        name: "Greenhouse",
        url: "https://support.greenhouse.io/hc/en-us/articles/52090956642075-Greenhouse-MCP",
      },
      category: "other",
      firstListedAt: at("2026-10-28T04:57:01.991Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60C5S79FYRJJVPAGK3Z5V09",
      createdAt: at("2026-10-28T04:26:58.653Z"),
      updatedAt: at("2026-10-28T04:57:01.983Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Greenhouse",
            transport: "http",
            placement: "backend",
            url: "https://mcp.us.greenhouse.io/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C5S79FYRJJVPAGK3Z5V09",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:26:58.670Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "heroku",
      displayName: "Heroku",
      description: "Deploy and manage Heroku apps, add-ons, dynos, and logs",
      maker: { name: "Heroku", url: "https://www.heroku.com" },
      accent: "#9878BA",
      category: "deployment",
      firstListedAt: at("2026-10-28T04:57:02.492Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M5ZED8JH74ASA59AHEZEVVCM",
      createdAt: at("2026-10-27T19:46:46.230Z"),
      updatedAt: at("2026-10-28T04:57:02.455Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Heroku",
            transport: "http",
            placement: "backend",
            url: "https://mcp.heroku.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "f79ce1b0e5bb389d9ae77faa60f5a7315dca062d",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Heroku plugin. Then read this project's repositories to see how it uses Heroku: its Procfile, app.json, buildpacks, add-ons, and how releases reach each app. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part of Heroku the project doesn't use, and say why.",
      automations: [
        {
          name: "Release check after merges",
          purpose: "Read the new release's logs for crashes and router errors",
          trigger: { type: "github", event: "pull_request_merged" },
          prompt:
            "When a pull request merges, wait for the Heroku release that ships it, then use the Heroku plugin to read the app's logs for the next 30 minutes. Report crashed dynos, H-series router errors, and new exceptions with the code that likely causes them. Stay quiet when the release is clean.",
        },
        {
          name: "Weekly dyno and add-on review",
          purpose: "Spot idle, oversized, or failing dynos and add-ons",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the Heroku plugin to list this project's apps with their dyno formation, add-on plans, and the past week's crashes and restarts. Point out dynos that crash or restart often, and add-on plans that look oversized for the load. If nothing stands out, say so in one line.",
        },
      ],
      starters: [
        "Show the last release of our main app and any errors in its logs",
        "List our Heroku apps with their dynos and add-ons",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZED8JH74ASA59AHEZEVVCM",
        version: "1.0.0",
        notes: "First listing in Explore.",
        createdAt: at("2026-10-27T19:46:46.634Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "keiki",
      displayName: "Keiki",
      description:
        "Build, test, and run customer-facing agents on iMessage, WhatsApp, and Slack",
      maker: { name: "Orchid", url: "https://orchid.ai" },
      category: "productivity",
      firstListedAt: at("2026-11-15T18:35:35.506Z"),
      hasIcon: true,
      version: "1958fdf",
      versionId: "01M7G7Q7GNP02D7XRYXR9TSP1G",
      createdAt: at("2026-11-15T18:32:39.859Z"),
      updatedAt: at("2026-11-15T18:35:35.499Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Keiki",
            transport: "http",
            placement: "backend",
            url: "https://onkeiki.com/mcp",
            command: null,
            auth: "oauth",
            connection: "member",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "1958fdff5f9394e9bedab48c5f644ebe21995f70",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Keiki plugin and sign in to the intended Keiki organization. Read this project's agent and messaging code, then inspect its Keiki agents, their channels, and recent conversations. Report how they match the code. Do not talk to agents, deploy, connect channels, buy lines, or change resources without explicit approval.",
      automations: [],
      starters: [
        "List our Keiki agents and compare their channels with the messaging code",
        "Summarize recent Keiki conversations and errors without changing any agent",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M7G7Q7GNP02D7XRYXR9TSP1G",
        version: "1958fdf",
        notes:
          "Keiki's hosted MCP server at onkeiki.com, signed in per member with OAuth",
        createdAt: at("2026-11-15T18:32:40.464Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "launchdarkly",
      displayName: "LaunchDarkly",
      description: "Create, target, roll out, and clean up feature flags",
      maker: { name: "LaunchDarkly", url: "https://launchdarkly.com" },
      category: "deployment",
      firstListedAt: at("2026-10-28T04:57:03.125Z"),
      hasIcon: true,
      stars: 31,
      starsCheckedAt: at("2026-11-18T04:15:55.369Z"),
      version: "1.0.1",
      versionId: "01M5ZEF1775BAE3HG056W877ZS",
      createdAt: at("2026-10-27T19:47:44.215Z"),
      updatedAt: at("2026-10-28T04:57:03.112Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "LaunchDarkly",
            transport: "http",
            placement: "backend",
            url: "https://mcp.launchdarkly.com/mcp/launchdarkly",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "onboarding",
            description:
              "Scripted onboarding for LaunchDarkly: quiet execution, fixed sequence, SDK install, first flag with a live reveal, MCP offered afterwards. Enforces step completion before advancing and redirects drift. Use when adding LaunchDarkly, setting up or integrating feature flags in a project, SDK integration, or 'onboard me'.",
            content: null,
          },
          {
            name: "configs-create",
            description:
              "Create and configure configs in LaunchDarkly. Helps you choose between agent vs completion mode, create the config, add variations with models and prompts, and verify the setup.",
            content: null,
          },
          {
            name: "configs-targeting",
            description:
              "Configure config targeting rules to control which variations serve to different users. Enable percentage rollouts, attribute-based rules, segment targeting, and guarded rollouts.",
            content: null,
          },
          {
            name: "configs-update",
            description:
              "Update, archive, and delete LaunchDarkly configs and their variations. Use when you need to modify config properties, change model parameters, update instructions or messages, archive unused configs, or permanently remove them.",
            content: null,
          },
          {
            name: "configs-variations",
            description:
              "Experiment with configs by creating and managing variations. Helps you test different models, prompts, and parameters to find what works best through systematic experimentation.",
            content: null,
          },
          {
            name: "launchdarkly-flag-cleanup",
            description:
              "Safely remove a feature flag from code while preserving production behavior. Use when the user wants to remove a flag from code, delete flag references, or create a PR that hardcodes the winning variation after a rollout is complete.",
            content: null,
          },
          {
            name: "launchdarkly-flag-create",
            description:
              "Create and configure LaunchDarkly feature flags in a way that fits the existing codebase. Use when the user wants to create a new flag, wrap code in a flag, add a feature toggle, or set up an experiment. Guides exploration of existing patterns before creating.",
            content: null,
          },
          {
            name: "launchdarkly-flag-discovery",
            description:
              "Audit your LaunchDarkly feature flags to understand the landscape, find stale or launched flags, and assess removal readiness. Use when the user asks about flag debt, stale flags, cleanup candidates, flag health, or wants to understand their flag inventory.",
            content: null,
          },
          {
            name: "launchdarkly-flag-targeting",
            description:
              "Control LaunchDarkly feature flag targeting including toggling flags on/off, percentage rollouts, targeting rules, individual targets, and copying flag configurations between environments. Use when the user wants to change who sees a flag, roll out to a percentage, add targeting rules, or promote config between environments.",
            content: null,
          },
          {
            name: "launchdarkly-metric-choose",
            description:
              "Choose the right metrics for a LaunchDarkly experiment, guarded rollout, or release policy. Use when the user wants to know which metrics to use, which is the primary metric for an experiment, what guardrails to add, or which events to monitor in a rollout. Surfaces what will auto-attach from existing release policies before making additional recommendations.",
            content: null,
          },
          {
            name: "launchdarkly-metric-create",
            description:
              "Create a LaunchDarkly metric that measures what matters for an experiment or rollout. Use when the user wants to create a metric, track an event, measure page views, button clicks, conversion, latency, error rate, or any custom numeric or binary outcome. Instruments the event first when needed (including SDK setup and .env), then creates and verifies the metric.",
            content: null,
          },
          {
            name: "launchdarkly-metric-instrument",
            description:
              "Instrument a LaunchDarkly metric event in a codebase by adding a track() call. Use when the user wants to wire up an event, instrument an action for a metric, add tracking to a feature, or confirm that an event is flowing to LaunchDarkly.",
            content: null,
          },
          {
            name: "online-evals",
            description:
              "Attach judges to config variations for automatic LLM-as-a-judge evaluation. Create custom judges, configure sampling rates, and monitor quality scores.",
            content: null,
          },
          {
            name: "projects",
            description:
              "Guide for setting up LaunchDarkly projects in your codebase. Helps you assess your stack, choose the right approach, and integrate project management that makes sense for your architecture.",
            content: null,
          },
          {
            name: "tools",
            description:
              "Give your agents capabilities through tools (function calling). Helps you identify what your agent needs to do, create tool definitions, and attach them to config variations.",
            content: null,
          },
          {
            name: "launchdarkly-factory-settings",
            description:
              "Configure LaunchDarkly Factory settings (GitHub App auto-flagging and auto-releasing) via the hosted MCP, or diagnose why a pull request was not classified / auto-flagged. Use when the user wants to turn on auto-flagging, map a GitHub repo to a LaunchDarkly project, change Factory account defaults, unmap a repo, or asks why Factory did not classify their PR.",
            content: null,
          },
        ],
        repository: "launchdarkly/agent-skills",
        path: "",
        commit: "2fc544d3140f532772a7cb91ee4ee53896ec5134",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the LaunchDarkly plugin. Then read this project's repositories to see how it uses LaunchDarkly: where the code evaluates flags, which SDKs it uses, how flags are named, and which environments exist. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part of LaunchDarkly the project doesn't use, and say why.",
      automations: [
        {
          name: "Weekly stale flag cleanup",
          purpose:
            "Find flags that are fully rolled out or unused and remove them from the code",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the LaunchDarkly plugin to list flags that have served one variation to everyone for more than 30 days, or have had no evaluations recently. For each one still referenced in the code, open a draft pull request that removes the flag check and the dead branch, and explain the removal in one line. If there's nothing to clean up, say so in one line.",
        },
        {
          name: "Flag check on pull requests",
          purpose:
            "Check that flags named in a pull request exist and are targeted as expected",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request adds or changes a feature flag evaluation, use the LaunchDarkly plugin to confirm the flag exists in each environment, its variations match the types the code expects, and its default is safe. Comment with any mismatch. Stay quiet when every flag matches.",
        },
      ],
      starters: [
        "Create a flag for the feature in this branch and wire it into the code",
        "List flags that are fully rolled out and still evaluated in the code",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEF1775BAE3HG056W877ZS",
        version: "1.0.1",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:47:44.632Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "magicpath",
      displayName: "MagicPath",
      description:
        "Find, install, and create UI components from MagicPath canvases.",
      maker: { name: "MagicPath", url: "https://www.magicpath.ai" },
      accent: "#2C5A36",
      category: "design",
      firstListedAt: at("2026-10-28T04:57:03.112Z"),
      hasIcon: true,
      stars: 93,
      starsCheckedAt: at("2026-11-18T04:45:21.778Z"),
      version: "0.1.2",
      versionId: "01M5ZEFB9XR43J4X333PH56QFT",
      createdAt: at("2026-10-27T19:47:54.562Z"),
      updatedAt: at("2026-10-28T04:57:03.105Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "magicpath",
            description:
              "Use when the user mentions MagicPath, designs, UI components, themes, canvas selections, or repo-to-canvas UI work; run magicpath-ai to search, inspect, install, or author components.",
            content: null,
          },
        ],
        repository: "openai/plugins",
        path: "",
        commit: "0722921d5542fc593105c27bd52630babd8b8c2a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the MagicPath plugin. Then read this project's repositories to find its UI component library, design system and theme files, and any components that came from MagicPath. Propose the automation below adapted to what you found, created switched off, and explain it in one line. Drop it if the project has no UI components, and say why.",
      automations: [
        {
          name: "Weekly MagicPath sync check",
          purpose:
            "List components that changed on the MagicPath canvas since they were installed",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the MagicPath plugin to compare the components and themes in this team's MagicPath projects with the ones installed in the repository. Report components that changed on the canvas since they were installed and new ones the team added, with the command to install or update each. If everything is in sync, say so in one line.",
        },
      ],
      starters: [
        "Search MagicPath for a pricing table component and install it here",
        "Push our button and card components to a MagicPath canvas",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEFB9XR43J4X333PH56QFT",
        version: "0.1.2",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:47:54.960Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "mermaid-chart",
      displayName: "Mermaid Chart",
      description: "Create, validate, render, and save Mermaid diagrams",
      maker: { name: "Mermaid Chart", url: "https://www.mermaidchart.com" },
      accent: "#FF3771",
      category: "design",
      firstListedAt: at("2026-10-28T04:57:03.708Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M5ZEFGNWXYQQ4SN84T15RNJE",
      createdAt: at("2026-10-27T19:48:00.059Z"),
      updatedAt: at("2026-10-28T04:57:03.703Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Mermaid Chart",
            transport: "http",
            placement: "backend",
            url: "https://mcp.mermaidchart.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "5bd4cda20517e7e5dc82abfeb2f9ef949b6773b8",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Mermaid Chart plugin. Then read this project's repositories and find the Mermaid diagrams in its docs and READMEs. Validate each one, fix any that fail to render, and point out, in a few lines each, diagrams that no longer match the code they describe.",
      automations: [
        {
          name: "Diagram check on pull requests",
          purpose: "Validate Mermaid diagrams a pull request adds or changes",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request adds or changes a Mermaid diagram in Markdown, use the Mermaid Chart plugin to validate and render it. Comment with any diagram that fails to render and the corrected source. Stay quiet when every diagram renders.",
        },
      ],
      starters: [
        "Draw a sequence diagram of our login flow from the code",
        "Turn our database schema into an entity relationship diagram",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEFGNWXYQQ4SN84T15RNJE",
        version: "1.0.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:48:00.467Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "omni-analytics",
      displayName: "Omni Analytics",
      description:
        "Explore, query, model, embed, and manage Omni Analytics through the REST API and embed SDK. Includes 9 skills, 3 specialized agents, and 4 context rules for model exploration, querying, model building, content browsing, content building, embedding, AI optimization, AI eval, and administration.",
      maker: { name: "Omni Analytics" },
      category: "monitoring",
      firstListedAt: at("2026-10-28T04:57:05.592Z"),
      hasIcon: true,
      stars: 45,
      starsCheckedAt: at("2026-11-18T04:45:21.638Z"),
      version: "1.23.1",
      versionId: "01M60BYWDHGV25ASS9E2WG0HCB",
      createdAt: at("2026-10-28T04:23:12.447Z"),
      updatedAt: at("2026-10-28T04:57:05.585Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "omni-admin",
            description:
              'Administer an Omni Analytics instance — manage connections, users, groups, user attributes, permissions, schedules, and schema refreshes via the Omni CLI. Use this skill whenever someone wants to manage users or groups, set up permissions on a dashboard or folder, configure user attributes, create or modify schedules, manage database connections, refresh a schema, set up access controls, provision users, or any variant of "add a user", "give access to", "set up permissions", "who has access", "configure connection", "refresh the schema", or "schedule a delivery".',
            content: null,
          },
          {
            name: "omni-ai-eval",
            description:
              'Evaluate Omni AI accuracy using Omni\'s built-in eval system — define a prompt set, run a judged eval against a model (or branch), and read the accuracy-judge verdicts. Use this skill whenever someone wants to evaluate Omni AI, benchmark Blobby, run regression tests, compare AI output across branches or model-context changes, measure AI quality, run A/B tests on model changes, assess the impact of an ai_context or modeling change, or any variant of "run evals", "test Blobby", "benchmark query generation", "compare AI results", "regression test", "how accurate is the AI", or "measure the impact of my changes".',
            content: null,
          },
          {
            name: "omni-ai-optimizer",
            description:
              'Optimize your Omni Analytics model for Blobby, the Omni Agent — configure ai_context, ai_fields, synonyms, sample_queries, and AI-specific topic extensions. Use this skill whenever someone wants to improve AI accuracy in Omni, make Blobby smarter, add AI context or example questions, curate which fields the AI sees, personalize AI context by user attribute, scope context to a model tier or agent, diagnose context-window pruning or truncation, control which topics AI can reach, troubleshoot why Blobby gives wrong answers, or any variant of "make the AI better", "Blobby isn\'t answering correctly", "optimize for AI", or "teach the AI about our data".',
            content: null,
          },
          {
            name: "omni-content-builder",
            description:
              'Create, update, and manage Omni Analytics documents and dashboards programmatically — document lifecycle, drafts, tiles, visualizations, filters, controls, and layouts — using the Omni CLI. Use this skill whenever someone wants to build a dashboard, create a workbook or document, add tiles or charts, configure dashboard filters or controls, set up a KPI view, lay out or rearrange tiles and pages, edit a dashboard as a draft and publish it, change dashboard settings, rename/move/duplicate/delete a dashboard, modify dashboard-level model customizations like workbook-specific joins or fields, or build and edit an Omni app (custom HTML content in place of a dashboard) — including casual phrasings like "make a dashboard for…", "add a chart to…", or "clean up this dashboard\'s layout" that don\'t name the skill. Load it before any document API call, even when a local build script exists. For running a query or pulling metrics use omni-query; for adding a field to the shared model use omni-model-builder.',
            content: null,
          },
          {
            name: "omni-content-explorer",
            description:
              'Find, browse, and organize content in Omni Analytics — dashboards, workbooks, folders, and labels — using the Omni CLI. Use this skill whenever someone wants to find an existing dashboard, search for content, list workbooks, browse folders, see what dashboards exist, find popular reports, download a dashboard as PDF or PNG, set an alert on a dashboard tile, favorite content, manage labels on documents, or any variant of "find the dashboard about", "what reports do we have", "show me our dashboards", "where is the sales report", "download this dashboard", or "alert me when this changes". This skill locates and organizes content; to inspect what a dashboard tile actually queries — its fields, filters, and sorts — use omni-query.',
            content: null,
          },
          {
            name: "omni-embed",
            description:
              'Embed Omni Analytics dashboards in external applications — URL signing, custom themes, iframe events, entity workspaces, and permission-aware content — using the @omni-co/embed SDK and Omni CLI. Use this skill whenever someone wants to embed a dashboard, sign an embed URL, customize the embedded theme, handle embed events, listen for clicks or drills in the iframe, send filters to an embedded dashboard, set up entity workspaces, look up embed users, build a permission-aware content list, white-label an embedded dashboard, or any variant of "embed this dashboard", "customize the iframe theme", "handle click events from the embed", "filter the embedded dashboard", "set up embedding", or "what dashboards can this user see".',
            content: null,
          },
          {
            name: "omni-model-builder",
            description:
              'Create and edit Omni Analytics semantic model definitions — views, topics, dimensions, measures, relationships, query views, composite topics, and aggregate tables (materialized_query) — using YAML through the Omni CLI. Use this skill whenever someone wants to add a field, create a new dimension or measure, define a topic, set up joins between tables, modify the data model, build a new view, add a calculated field, create a relationship, edit YAML, work on a branch, promote model changes, or any variant of "model this data", "add this metric", "create a view for", or "set up a join between". Also use for migrating modeling patterns since Omni\'s YAML is conceptually similar to other semantic layer definitions.',
            content: null,
          },
          {
            name: "omni-model-explorer",
            description:
              'Discover and inspect Omni Analytics models, topics, views, fields, dimensions, measures, and relationships using the Omni CLI. Use this skill whenever someone wants to understand what data is available in Omni, explore their semantic model, find specific fields or views, check how tables join together, see what topics exist, or asks any variant of "what can I query", "what fields are available", "show me the model", "what data do we have", or "how is this data modeled". Also use when you need to understand the Omni model structure before building or modifying anything.',
            content: null,
          },
          {
            name: "omni-query",
            description:
              'Run queries against Omni Analytics\' semantic layer using the Omni CLI, interpret results, and chain queries for multi-step analysis. Use this skill whenever someone wants to query data through Omni, run a report, get metrics, pull numbers, analyze data, ask "how many" / "what\'s the trend" / "show me the data", retrieve dashboard query results, extract data from an existing dashboard, or inspect the query definition behind a tile. Also use for table calculations and computed columns (running totals, percent-of-total, month-over-month / period-over-period change, moving averages, rankings), open-ended multi-step analysis via agentic AI jobs, and running raw SQL through the semantic layer — even when the user doesn\'t say "query" (e.g. "add a running total column", "what\'s our MoM growth", "analyze revenue trends"). For building or editing a dashboard or chart use omni-content-builder; for adding a field or measure to the model use omni-model-builder — this skill retrieves and computes over data.',
            content: null,
          },
        ],
        repository: "exploreomni/omni-agent-skills",
        path: "",
        commit: "c5dcd7577ed6d63920d67672f9f93b67de525d57",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60BYWDHGV25ASS9E2WG0HCB",
        version: "1.23.1",
        notes: "Synced at c5dcd75",
        createdAt: at("2026-10-28T04:23:12.582Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "openai-ads-conversions",
      displayName: "OpenAI Ads Conversions",
      description:
        "Set up OpenAI Ads Pixel and Conversions API tracking on your site.",
      maker: { name: "OpenAI", url: "https://openai.com" },
      category: "monitoring",
      firstListedAt: at("2026-10-28T04:57:05.482Z"),
      hasIcon: true,
      stars: 7995,
      starsCheckedAt: at("2026-11-18T04:16:20.150Z"),
      version: "0.1.2",
      versionId: "01M5ZEHMQSVH9EZXMJK95ASVBQ",
      createdAt: at("2026-10-27T19:49:09.752Z"),
      updatedAt: at("2026-10-28T04:57:05.475Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "openai-ads-conversions-setup",
            description:
              "Guide Codex through instrumenting or extending repositories with OpenAI Ads Measurement Pixel and optional Conversions API (CAPI). Use when adding Ads conversion tracking, browser pixel events, server-side conversion events, event_id deduplication, CAPI secret placeholders, incremental conversion coverage, or validating Ads conversion setup. Applies to local repositories and PR review contexts; prioritize safe, reviewable diffs and never place API keys or secrets in source code or client bundles.",
            content: null,
          },
        ],
        repository: "openai/plugins",
        path: "",
        commit: "0722921d5542fc593105c27bd52630babd8b8c2a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the OpenAI Ads Conversions plugin. Then read this project's repositories to find its web pages, checkout and signup flows, the server routes that record conversions, and any existing ad pixels or consent handling. Propose the automation below adapted to what you found, created switched off, and explain it in one line. Drop it if the project runs no OpenAI ads, and say why.",
      automations: [
        {
          name: "Conversion tracking check on pull requests",
          purpose:
            "Check that a pull request keeps OpenAI Ads Pixel and Conversions API events intact",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request changes checkout, signup or other pages that send OpenAI Ads conversion events, use the OpenAI Ads Conversions plugin to check that the Pixel and Conversions API calls still fire with the right event names, values, deduplication ids and consent handling. Comment with each problem and the fix. Stay quiet when tracking is intact.",
        },
      ],
      starters: [
        "Add the OpenAI Ads Pixel to our site and track signups",
        "Send purchase events through the Conversions API from our server",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEHMQSVH9EZXMJK95ASVBQ",
        version: "0.1.2",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:49:10.162Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "paypal",
      displayName: "PayPal",
      description:
        "Manage orders, invoices, subscriptions, and disputes in PayPal",
      maker: { name: "PayPal", url: "https://developer.paypal.com" },
      accent: "#042C93",
      category: "payments",
      firstListedAt: at("2026-10-28T04:57:11.140Z"),
      hasIcon: true,
      stars: 47,
      starsCheckedAt: at("2026-11-18T04:16:08.384Z"),
      version: "1.1.0",
      versionId: "01M60E0ECMRT4AGF1RKZ9PPH36",
      createdAt: at("2026-10-27T19:49:27.646Z"),
      updatedAt: at("2026-10-28T04:59:01.193Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "PayPal",
            transport: "http",
            placement: "backend",
            url: "https://mcp.paypal.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "22212a3bc13a998abab6f26f5486519ce668987a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the PayPal plugin. Then read this project's repositories to see how it integrates PayPal: checkout and orders, subscriptions, invoices, webhooks, and which environment each part uses. Propose the automation below adapted to what you found, created switched off, and explain it in one line. Drop it if the project doesn't take payments through PayPal, and say why.",
      automations: [
        {
          name: "Weekly dispute and failed payment review",
          purpose:
            "List the week's disputes and failed payments and trace them to the checkout code",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the PayPal plugin to list disputes opened and payments that failed in the past seven days. Group them by reason, find the checkout or webhook code involved, and suggest fixes for problems the code causes, such as missing order details or unhandled webhook events. If there were none, say so in one line.",
        },
      ],
      starters: [
        "Create a sandbox order and walk through capturing it",
        "List this month's PayPal disputes and their reasons",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M60E0ECMRT4AGF1RKZ9PPH36",
        version: "1.1.0",
        notes: "Connects to PayPal Live instead of the sandbox",
        createdAt: at("2026-10-28T04:59:00.894Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "pg-aiguide",
      displayName: "Tiger Data pg-aiguide",
      description:
        "Search Postgres docs and apply Postgres best practices to schemas",
      maker: { name: "Tiger Data", url: "https://www.tigerdata.com" },
      accent: "#E9F07A",
      category: "database",
      firstListedAt: at("2026-10-28T04:57:07.183Z"),
      hasIcon: true,
      stars: 1886,
      starsCheckedAt: at("2026-11-18T04:45:25.580Z"),
      version: "0.6.1",
      versionId: "01M5ZEJ7J5X81QM91JMB1793JY",
      createdAt: at("2026-10-27T19:49:29.039Z"),
      updatedAt: at("2026-10-28T04:57:07.160Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Tiger Data pg-aiguide",
            transport: "http",
            placement: "backend",
            url: "https://mcp.tigerdata.com/docs",
            command: null,
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "1709b39b5029327a12a27d7cac45d5420ad972e6",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the pg-aiguide plugin. Then read this project's Postgres schema and migrations, note its Postgres version, and find the queries the code issues most. Propose the automation below adapted to what you found, created switched off, and explain it in one line. Drop it if the project doesn't keep its Postgres migrations in the repository, and say why.",
      automations: [
        {
          name: "Postgres schema review on pull requests",
          purpose:
            "Check new tables, columns, and indexes against Postgres best practices",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request adds or changes a Postgres migration, use the pg-aiguide plugin to check it against Postgres best practices: column types, constraints, foreign keys without indexes, missing primary keys, and locks a large table would take. Comment with each problem and the better form, citing the docs. Stay quiet when the migration is sound.",
        },
      ],
      starters: [
        "Review our largest table's schema against Postgres best practices",
        "Find the Postgres docs on the isolation level our transactions rely on",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEJ7J5X81QM91JMB1793JY",
        version: "0.6.1",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:49:29.431Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "pinecone",
      displayName: "Pinecone",
      description: "Search docs and manage indexes and records in Pinecone",
      maker: { name: "Pinecone", url: "https://www.pinecone.io" },
      category: "database",
      firstListedAt: at("2026-10-28T04:57:06.483Z"),
      hasIcon: true,
      stars: 68,
      starsCheckedAt: at("2026-11-18T04:16:08.647Z"),
      version: "1.7.1",
      versionId: "01M5ZEJBNGVMBCHWQZKJ41WWKF",
      createdAt: at("2026-10-27T19:49:33.233Z"),
      updatedAt: at("2026-10-28T04:57:06.478Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Pinecone",
            transport: "stdio",
            placement: "machine",
            url: null,
            command: "npx",
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: ["PINECONE_API_KEY"],
          },
        ],
        skills: [
          {
            name: "assistant",
            description:
              'Create, manage, and chat with Pinecone Assistants for document Q&A with citations. Handles all assistant operations - create, upload, sync, chat, context retrieval, and list. Recognizes natural language like "create an assistant from my docs", "ask my assistant about X", or "upload my docs to Pinecone".',
            content: null,
          },
          {
            name: "cli",
            description:
              "Guide for using the Pinecone CLI (pc) to manage Pinecone resources from the terminal. The CLI supports ALL index types (standard, integrated, sparse) and all vector operations — unlike the MCP which only supports integrated indexes. Use for batch operations, vector management, backups, namespaces, CI/CD automation, and full control over Pinecone resources.",
            content: null,
          },
          {
            name: "docs",
            description:
              "Curated documentation reference for developers building with Pinecone. Contains links to official docs organized by topic and data format references. Use when writing Pinecone code, looking up API parameters, or needing the correct format for vectors or records.",
            content: null,
          },
          {
            name: "full-text-search",
            description:
              "Create, ingest into, and query a Pinecone full-text-search (FTS) document index using the graduated document-schema API (Python SDK 10.0.0, API version 2026-07). Use when the user or agent asks to build a text search index on Pinecone, add dense or sparse vector fields, ingest documents, construct score_by clauses (text / query_string / dense_vector / sparse_vector), or compose with text-match filters ($match_phrase / $match_all / $match_any). Ships `scripts/ingest.py` for safe bulk ingestion (batch_upsert + error inspection + readiness polling); query construction is documented inline in this skill — write `documents.search(...)` calls directly, validated against `pc.indexes.describe(...)` output.",
            content: null,
          },
          {
            name: "help",
            description:
              "Overview of all available Pinecone skills and what a user needs to get started. Invoke when a user asks what skills are available, how to get started with Pinecone, or what they need to set up before using any Pinecone skill.",
            content: null,
          },
          {
            name: "mcp",
            description:
              "Reference for the Pinecone MCP server tools. Documents all available tools - list-indexes, describe-index, describe-index-stats, create-index-for-model, upsert-records, search-records, cascading-search, and rerank-documents. Use when an agent needs to understand what Pinecone MCP tools are available, how to use them, or what parameters they accept.",
            content: null,
          },
          {
            name: "n8n",
            description:
              "Build n8n workflows using the Pinecone Assistant node or Pinecone Vector Store node. Use when building RAG pipelines, chat-with-docs workflows, configuring Pinecone nodes in n8n, troubleshooting Pinecone n8n nodes, or asking about best practices for Pinecone in n8n.",
            content: null,
          },
          {
            name: "query",
            description:
              "Query integrated indexes using text with Pinecone MCP. IMPORTANT - This skill ONLY works with integrated indexes (indexes with built-in Pinecone embedding models like multilingual-e5-large). For standard indexes or advanced vector operations, use the pinecone:cli skill instead. Requires PINECONE_API_KEY environment variable and Pinecone MCP server to be configured.",
            content: null,
          },
          {
            name: "quickstart",
            description:
              "Interactive Pinecone quickstart for new developers. Choose between two paths - Database (create an integrated index, upsert data, and query using Pinecone MCP + Python) or Assistant (create a Pinecone Assistant for document Q&A). Use when a user wants to get started with Pinecone for the first time or wants a guided tour of Pinecone's tools.",
            content: null,
          },
        ],
        repository: "pinecone-io/pinecone-claude-code-plugin",
        path: "",
        commit: "c383d38b5cc3c5ec219f2e68026e47ffbf46524a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Pinecone plugin. Then read this project's repositories to see how it uses Pinecone: its indexes and namespaces, the embedding models it uses, and the code that upserts and queries records. Propose the automation below adapted to what you found, created switched off, and explain it in one line. Drop it if the project doesn't store vectors in Pinecone, and say why.",
      automations: [
        {
          name: "Weekly index review",
          purpose:
            "Compare index settings with how the code writes and queries them and flag mismatches",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the Pinecone plugin to describe this project's indexes: dimension, metric, record counts, and namespaces. Compare them with the embedding model and query code in the repository, and report mismatches such as a wrong dimension or metric, unused namespaces, or queries without filters on large namespaces. If everything matches, say so in one line.",
        },
      ],
      starters: [
        "Describe our Pinecone indexes and the code that writes to each",
        "Search the Pinecone docs for how to add hybrid search to our query code",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEJBNGVMBCHWQZKJ41WWKF",
        version: "1.7.1",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:49:33.633Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "product-design",
      displayName: "Product Design",
      description:
        "Explore product ideas, audit flows, and turn mockups into working prototypes.",
      maker: { name: "OpenAI", url: "https://openai.com" },
      accent: "#BF69EF",
      category: "design",
      firstListedAt: at("2026-10-28T04:57:07.525Z"),
      hasIcon: true,
      stars: 7995,
      starsCheckedAt: at("2026-11-18T04:16:20.150Z"),
      version: "0.1.52",
      versionId: "01M5ZEJZX3PT5VY9NC8FNN19Z2",
      createdAt: at("2026-10-27T19:49:53.955Z"),
      updatedAt: at("2026-10-28T04:57:07.517Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "audit",
            description:
              "Audit or critique a product flow, journey, workflow, funnel, onboarding path, checkout path, settings path, screen, or multi-step product experience by capturing screenshots first, then reporting UX, design, and accessibility findings inline from that evidence. Use Figma only when the user explicitly asks for a board. Use when the user asks to audit, review, critique, inspect, assess, analyze, evaluate, or give feedback on a product experience.",
            content: null,
          },
          {
            name: "design-qa",
            description:
              "Internal prototype QA helper. Use only after a Product Design prototype, URL-to-code build, or image-to-code build has a source visual target and a rendered implementation to compare before handoff. Do not use for broad UX critique, design critique, product audits, or flow reviews; route those user-facing requests to audit.",
            content: null,
          },
          {
            name: "get-context",
            description:
              "Mandatory design-brief gate for clarifying the product and outcome. Use before ideation, image-to-code builds, redesigns, or product UI work to clarify missing product information and play back the brief before proceeding.",
            content: null,
          },
          {
            name: "ideate",
            description:
              "Generate image-based alternatives, remixes, or new design directions from a Product Design brief. Use when the user asks for design variants, visual exploration, remixes, or image-generated approaches from provided context.",
            content: null,
          },
          {
            name: "image-to-code",
            description:
              "Implement a selected image, screenshot, mockup, or Image Gen reference as a faithful, responsive frontend.",
            content: null,
          },
          {
            name: "index",
            description:
              "Use when Product Design is explicitly invoked, or when the user's main goal is to explore a design, research UX, audit or critique a flow, faithfully clone a visual source, check a built design, or share a prototype. Do not use Product Design for ordinary implementation unless the user explicitly asks for it.",
            content: null,
          },
          {
            name: "research",
            description:
              "Run fast, source-grounded UX research on the highest-signal problems users are experiencing with a user-specified digital product. Use when the user asks to research user pain, UX friction, onboarding issues, docs/help problems, developer experience friction, support pain, product workflow issues, or current user complaints for a named product.",
            content: null,
          },
          {
            name: "share",
            description:
              "Share a runnable prototype using the user's preferred deployment tool.",
            content: null,
          },
          {
            name: "url-to-code",
            description:
              "Clone a live URL as a runnable frontend-only local app.",
            content: null,
          },
          {
            name: "user-context",
            description:
              "Load or manage Product Design's saved user context. Use when the user asks to set up Product Design, get started, onboard, save product or design sources, see what Product Design remembers, update saved context, or remember Product Design preferences. Examples include product URLs, Figma files, screenshots, reference images, codebase paths, Storybook, tokens, design systems, brand assets, and general product/design notes.",
            content: null,
          },
        ],
        repository: "openai/plugins",
        path: "",
        commit: "0722921d5542fc593105c27bd52630babd8b8c2a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Product Design plugin. Then read this project's repositories to find its main user flows (onboarding, signup, checkout, settings), its design system, and any mockups or screenshots it keeps. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a flow the project doesn't have, and say why.",
      automations: [
        {
          name: "UX audit on pull requests",
          purpose:
            "Audit the screens a pull request changes for clarity, states and design system fit",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request changes a user-facing flow, use the Product Design plugin to audit the changed screens for clarity, hierarchy, empty and error states, and consistency with the design system. Comment with each problem, a screenshot where it helps, and a concrete fix. Stay quiet when the flow holds up.",
        },
        {
          name: "Monthly flow audit",
          purpose:
            "Walk the most important flows and rank their biggest friction points",
          trigger: { type: "schedule", cron: "0 9 1 * *" },
          prompt:
            "Once a month, use the Product Design plugin to walk the project's most important flows, such as onboarding and checkout, and audit each step for friction, confusing copy and inconsistent components. Report the top problems ranked by impact on users, each with a suggested fix.",
        },
      ],
      starters: [
        "Audit our onboarding flow and list the biggest problems",
        "Turn this screenshot into a working page in our frontend",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEJZX3PT5VY9NC8FNN19Z2",
        version: "0.1.52",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:49:54.358Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "profound",
      displayName: "Profound",
      description: "Track AI visibility, sentiment, and citations.",
      maker: {
        name: "Profound",
        url: "https://docs.tryprofound.com/mcp/overview",
      },
      category: "monitoring",
      firstListedAt: at("2026-10-28T04:57:07.469Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60C7G4PHS0EQY5YSN9VFAPZ",
      createdAt: at("2026-10-28T04:27:54.653Z"),
      updatedAt: at("2026-10-28T04:57:07.460Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Profound",
            transport: "http",
            placement: "backend",
            url: "https://mcp.tryprofound.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C7G4PHS0EQY5YSN9VFAPZ",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:27:55.033Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "pulumi",
      displayName: "Pulumi",
      description:
        "Search cloud resources across stacks and delegate tasks to Pulumi Neo",
      maker: { name: "Pulumi", url: "https://www.pulumi.com" },
      accent: "#8C3693",
      category: "deployment",
      firstListedAt: at("2026-10-28T04:57:07.472Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M5ZEK18J7M1XPTYGQQS1SAMY",
      createdAt: at("2026-10-27T19:49:55.348Z"),
      updatedAt: at("2026-10-28T04:57:07.465Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Pulumi",
            transport: "http",
            placement: "backend",
            url: "https://mcp.ai.pulumi.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "ad5cc13b9edbbae1d02db52445815e2a4aeac291",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Pulumi plugin. Then read this project's repositories to see how it uses Pulumi: its Pulumi projects and stacks, the language they use, the cloud providers, and how previews and updates run in CI. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part of Pulumi the project doesn't use, and say why.",
      automations: [
        {
          name: "Infrastructure change review on pull requests",
          purpose:
            "Explain what a pull request's Pulumi change will create, replace, or delete",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request changes Pulumi code, use the Pulumi plugin to read the affected stacks and their current resources. Comment with the resources the change will create, update, replace, or delete, flag any replacement of a stateful resource such as a database or bucket, and suggest a safer form. Stay quiet when the change touches no Pulumi code.",
        },
        {
          name: "Weekly drift and stale stack review",
          purpose:
            "Find stacks that haven't been updated in a long time or failed their last update",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the Pulumi plugin to list this project's stacks with their last update time and result. Report stacks whose last update failed and stacks untouched for more than 90 days, with a suggested next step for each. If every stack is current, say so in one line.",
        },
      ],
      starters: [
        "List our Pulumi stacks and the resources in production",
        "Find every S3 bucket across our stacks that has public access",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEK18J7M1XPTYGQQS1SAMY",
        version: "1.0.0",
        notes: "First listing in Explore.",
        createdAt: at("2026-10-27T19:49:55.751Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "qdrant",
      displayName: "Qdrant",
      description:
        "Tune Qdrant collections, search quality, scaling, and migrations",
      maker: { name: "Qdrant", url: "https://qdrant.tech" },
      accent: "#DC244C",
      category: "database",
      firstListedAt: at("2026-10-28T04:57:07.736Z"),
      hasIcon: true,
      stars: 270,
      starsCheckedAt: at("2026-11-18T04:16:09.204Z"),
      version: "1.0.0",
      versionId: "01M5ZEKA01BTSMV82GR4FES18D",
      createdAt: at("2026-10-27T19:50:04.289Z"),
      updatedAt: at("2026-10-28T04:57:07.729Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "qdrant-clients-sdk",
            description:
              "Qdrant provides client SDKs for various programming languages, allowing easy integration with Qdrant deployments.",
            content: null,
          },
          {
            name: "qdrant-deployment-options",
            description:
              "Guides Qdrant deployment selection. Use when someone asks 'how to deploy Qdrant', 'Docker vs Cloud', 'local mode', 'embedded Qdrant', 'Qdrant EDGE', 'which deployment option', 'self-hosted vs cloud', or 'need lowest latency deployment'. Also use when choosing between deployment types for a new project.",
            content: null,
          },
          {
            name: "qdrant-edge",
            description:
              "Guides building on Qdrant Edge, the embedded in-process shard. Use when someone asks 'how to sync Edge with the server', 'keep a local shard in sync with Qdrant Cloud', 'BM25 or keyword search on Edge', 'hybrid search on Edge', 'embeddings on device', 'Edge snapshots', 'apply a partial snapshot', 'why is my Edge search empty after inserts', or is writing custom sync, BM25, or fusion code against qdrant-edge. Also use when deciding what Edge ships built-in versus what you must implement.",
            content: null,
          },
          {
            name: "qdrant-hybrid-cloud-setup",
            description:
              "Setting up and running Qdrant Hybrid Cloud on your own Kubernetes cluster (managed, on-prem, or edge): prerequisites, storage/CSI and backups, installing the Qdrant Cloud agent and operator, creating/exposing/securing clusters, registry mirroring, and secret rotation. Use when someone wants to set up, install, deploy, or configure Hybrid Cloud on their own infrastructure; is running Qdrant on their own EKS, GKE, AKS, OpenShift, or other Kubernetes; asks about the agent or operator, a storage class or volume snapshots for Hybrid Cloud, exposing a cluster, mirroring Qdrant images, or rotating secrets; or when a Hybrid Cloud install is failing on storage or connectivity.",
            content: null,
          },
          {
            name: "qdrant-migration-tool",
            description:
              "Guides use of the Qdrant Migration Tool CLI to move vectors, metadata, and sparse embeddings from another vector database into Qdrant. Use when someone asks 'how do I migrate from Pinecone/Weaviate/Milvus/Elasticsearch/OpenSearch/pgvector/s3/Azure/Chroma/Redis/MongoDB/FAISS/Solr to Qdrant', 'move my vector database to Qdrant', 'is there a migration tool for Qdrant', 'my migration got interrupted, how do I resume it', 'migration is too slow', or 'collection wasn't created after migration'. Also use when picking migration batch size, deciding on `--net=host`, or verifying data after a migration.",
            content: null,
          },
          {
            name: "qdrant-model-migration",
            description:
              "Guides embedding model migration in Qdrant without downtime. Use when someone asks 'how to switch embedding models', 'how to migrate vectors', 'how to update to a new model', 'zero-downtime model change', 'how to re-embed my data', or 'can I use two models at once'. Also use when upgrading model dimensions, switching providers, or A/B testing models.",
            content: null,
          },
          {
            name: "qdrant-monitoring",
            description:
              "Guides Qdrant monitoring and observability setup. Use when someone asks 'how to monitor Qdrant', 'what metrics to track', 'is Qdrant healthy', 'optimizer stuck', 'why is memory growing', 'requests are slow', 'set up alerts', 'cluster health check', or needs to set up Prometheus, Grafana, health checks, or log centralization. Also use when debugging production issues that require metric analysis.",
            content: null,
          },
          {
            name: "qdrant-multitenancy",
            description:
              "Guides tenant isolation architecture in Qdrant for multi-tenant or multi-user applications. Use when someone asks 'how to isolate customer data', 'how to build multi-tenant search/RAG', 'how many collections should I create', 'how to partition tenants by payload', 'a customer's data legally has to stay in a certain country or region'. Also use when they describe a symptom: one customer's data is way bigger than the rest and slowing everyone down, or one tenant is hogging resources.",
            content: null,
          },
          {
            name: "qdrant-performance-optimization",
            description:
              "Navigation hub linking sub-skills for proactive Qdrant tuning: search speed, indexing performance, and memory usage optimization. Use when planning configuration or capacity changes to improve speed and efficiency. For diagnosing an active production slowdown or analyzing live metrics, use qdrant-monitoring instead.",
            content: null,
          },
          {
            name: "qdrant-scaling",
            description:
              "Guides Qdrant scaling decisions. Use when someone asks 'how many nodes do I need', 'data doesn't fit on one node', 'need more throughput or QPS', 'CPU is pegged / can't keep up with the request rate', 'one query is slow / p99 or tail latency too high', 'cluster is slow', 'too many tenants', 'vertical or horizontal', 'how to shard', 'need to add capacity', 'large limit / pagination / scroll is slow', or 'only recent data matters / expiring old vectors / retention window'.",
            content: null,
          },
          {
            name: "qdrant-search-quality",
            description:
              "Diagnoses and improves Qdrant search relevance. Use when someone reports 'search results are bad', 'wrong results', 'low precision', 'low recall', 'irrelevant matches', 'missing expected results', or asks 'how to improve search quality?', 'which embedding model?', 'should I use hybrid search?', 'how to combine keyword and vector search / fusion / RRF / prefetch?', 'should I use reranking?', 'relevance feedback?', 'how to measure retrieval quality?', 'build a golden set', 'ground truth dataset', 'how to score recall@k?', 'is my improvement real / statistically significant?', or 'should I fine-tune my embedding model?'. Also use when search quality degrades after quantization, model change, or data growth.",
            content: null,
          },
          {
            name: "qdrant-sizing",
            description:
              "Sizes a Qdrant deployment before it is provisioned. Use when someone asks 'how much RAM do I need', 'how many nodes', 'how big should my cluster be', 'sizing', 'capacity planning', 'will N vectors fit', 'what instance type should I pick', or gives a vector count and dimensions and asks what to provision. Also use when an existing estimate needs checking before hardware or a cluster tier is bought.",
            content: null,
          },
          {
            name: "qdrant-version-upgrade",
            description:
              "Covers upgrading Qdrant server and SDKs without interrupting availability or losing data integrity. Use when someone asks 'how do I upgrade Qdrant', 'can I jump from 1.15 to 1.18', 'rolling upgrade without downtime', 'do I upgrade the client or the server first', 'which SDK version matches my server', 'what should I check before upgrading', or 'something changed after we upgraded'.",
            content: null,
          },
        ],
        repository: "qdrant/skills",
        path: "",
        commit: "1780b6de984a41bac76be3ac4f6856e7b8762fd7",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Qdrant plugin. Then read this project's repositories to see how it uses Qdrant: its collections, vector and payload index settings, the client code that writes and searches, and how it is deployed. As a first task, review the main collection's configuration and search code against Qdrant's guidance and list the three changes with the biggest effect on search quality or cost.",
      automations: [],
      starters: [
        "Review our Qdrant collection settings for memory use and search quality",
        "Add hybrid search with sparse vectors to our Qdrant queries",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEKA01BTSMV82GR4FES18D",
        version: "1.0.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:50:04.689Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "raygun",
      displayName: "Raygun",
      description: "Investigate crashes, real user monitoring, and deployments",
      maker: { name: "Raygun", url: "https://raygun.com" },
      accent: "#D72931",
      category: "monitoring",
      firstListedAt: at("2026-10-28T04:57:07.734Z"),
      hasIcon: true,
      stars: 31,
      starsCheckedAt: at("2026-11-18T04:16:09.451Z"),
      version: "1.1.0",
      versionId: "01M5ZEKBKTQWQ8DNTH8N48B26A",
      createdAt: at("2026-10-27T19:50:05.959Z"),
      updatedAt: at("2026-10-28T04:57:07.727Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Raygun",
            transport: "http",
            placement: "backend",
            url: "https://api.raygun.com/v3/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "07b8b0f402121ef2cd6e7d739845e6bc9f90a6c0",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Raygun plugin. Then read this project's repositories to see how it uses Raygun: which apps send crash reports, real user monitoring, and APM data, and how deployments are reported. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part of Raygun the project doesn't use, and say why.",
      automations: [
        {
          name: "Daily new error review",
          purpose:
            "Find new and growing error groups and trace them to the code",
          trigger: { type: "schedule", cron: "0 9 * * *" },
          prompt:
            "Every morning, use the Raygun plugin to list error groups that are new or grew in the past day. For each of the top five, read a representative stack trace, find the code at fault, and suggest a fix. If a recent deployment lines up with the change, name it. If nothing changed, say so in one line.",
        },
        {
          name: "Deployment check after merges",
          purpose: "Compare error rates before and after a deployment",
          trigger: { type: "github", event: "pull_request_merged" },
          prompt:
            "When a pull request merges, wait for its deployment to appear in Raygun, then compare the next hour's error groups and crash rate with the hour before. Report new or growing errors with the code that likely causes them. Stay quiet when nothing moved.",
        },
      ],
      starters: [
        "Show the most frequent crashes from the last day and the code behind each",
        "Find the pages with the slowest load times in real user monitoring",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEKBKTQWQ8DNTH8N48B26A",
        version: "1.1.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:50:06.350Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "readwise",
      displayName: "Readwise",
      description: "Search highlights and Reader documents, save articles.",
      maker: { name: "Readwise", url: "https://docs.readwise.io/tools/mcp" },
      category: "productivity",
      firstListedAt: at("2026-10-28T04:57:07.744Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60C7KNV8XD959WNB70K5BV9",
      createdAt: at("2026-10-28T04:27:58.513Z"),
      updatedAt: at("2026-10-28T04:57:07.736Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Readwise",
            transport: "http",
            placement: "backend",
            url: "https://mcp2.readwise.io/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C7KNV8XD959WNB70K5BV9",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:27:58.528Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "redis",
      displayName: "Redis",
      description:
        "Apply Redis best practices for data structures, search, and caching",
      maker: { name: "Redis", url: "https://redis.io" },
      accent: "#FF473C",
      category: "database",
      firstListedAt: at("2026-10-28T04:57:07.742Z"),
      hasIcon: true,
      stars: 177,
      starsCheckedAt: at("2026-11-18T04:45:26.783Z"),
      version: "1.4.0",
      versionId: "01M5ZEKF76V4JFWP3ATBGATTXA",
      createdAt: at("2026-10-27T19:50:09.646Z"),
      updatedAt: at("2026-10-28T04:57:07.735Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "iris-development",
            description:
              "Iris is Redis's umbrella for AI-focused products. Use this skill when integrating with the Iris Redis Agent Memory (RAM) data plane on Redis Cloud — recording session events for an AI agent, creating or searching long-term memories, configuring a memory store, or tuning background memory promotion. Code examples use the official `redis-agent-memory` (Python) and `@redis-iris/agent-memory` (TypeScript) SDKs.",
            content: null,
          },
          {
            name: "redis-clustering",
            description:
              "Redis Cluster and replication guidance covering hash tags for multi-key operations, avoiding CROSSSLOT errors, and reading from replicas to scale read-heavy workloads. Use when designing keys for a sharded Redis Cluster, debugging CROSSSLOT errors on MGET / SDIFF / pipelines, configuring a multi-key transaction in a cluster, or routing reads to replicas for caches, analytics, or dashboards.",
            content: null,
          },
          {
            name: "redis-connections",
            description:
              "Redis client and connection guidance covering connection pooling, multiplexing, pipelining, client-side caching with RESP3, avoiding slow commands (KEYS, SMEMBERS, HGETALL), and tuning socket timeouts. Use when configuring a Redis client (redis-py, Jedis, Lettuce, NRedisStack), batching commands for throughput, eliminating per-request connection creation, iterating large keyspaces with SCAN, enabling client-side caching for read-heavy workloads, or setting connect and read timeouts.",
            content: null,
          },
          {
            name: "redis-core",
            description:
              "Core Redis modeling guidance — choose the right data structure (String, Hash, List, Set, Sorted Set, JSON, Stream, Vector Set) and use consistent colon-separated key names. Use when designing a Redis data model, caching objects, deciding between Hash and JSON, building counters, leaderboards, membership sets, or session stores, or when reviewing/cleaning up Redis key naming.",
            content: null,
          },
          {
            name: "redis-observability",
            description:
              "Redis observability guidance — which metrics to monitor (memory, connections, hit ratio, ops/sec, rejected connections), which built-in commands to reach for during incident triage (SLOWLOG, INFO, MEMORY DOCTOR, CLIENT LIST, FT.PROFILE), and when to use the Redis Insight GUI. Use when setting up monitoring or alerts for a Redis instance, diagnosing a performance regression, profiling a slow FT.SEARCH query, or wiring Redis metrics into Prometheus, Datadog, or similar.",
            content: null,
          },
          {
            name: "redis-search",
            description:
              "Redis Search guidance covering FT.CREATE schema design, field type selection (TEXT, TAG, NUMERIC, GEO, GEOSHAPE, VECTOR, JSON path), DIALECT 2 query syntax, FT.SEARCH / FT.AGGREGATE / FT.HYBRID command selection, vector similarity with HNSW or FLAT, hybrid retrieval combining lexical and vector ranking, RAG pipelines, zero-downtime index updates via aliases, and debugging with FT.PROFILE and FT.EXPLAIN. Use when defining a search index on Hash or JSON documents, writing FT.SEARCH queries with filters, sorting, aggregation, or vector KNN, tuning HNSW parameters, building a RAG retrieval pipeline, or troubleshooting slow or empty search results.",
            content: null,
          },
          {
            name: "redis-security",
            description:
              "Redis security guidance covering authentication (requirepass and ACL users), TLS, ACL-based least-privilege access control, restricting network exposure via bind and protected-mode, firewall rules, and disabling dangerous commands. Use when deploying Redis to production, defining ACL users for an application, configuring TLS connections, locking down a Redis instance behind a firewall, or auditing a Redis deployment for security hardening.",
            content: null,
          },
          {
            name: "redis-semantic-cache",
            description:
              "Redis LangCache guidance for semantic caching of LLM responses on Redis Cloud — calling search/set via the SDK or REST API, tuning the similarity threshold, separating caches per task type, and filtering with custom attributes. Use when caching LLM completions or RAG answers to cut API cost and latency, building a cache-aside layer in front of OpenAI / Anthropic / etc., tuning hit rate vs precision, or splitting one app's LLM workloads into multiple LangCache caches.",
            content: null,
          },
        ],
        repository: "redis/agent-skills",
        path: "",
        commit: "a84871d065f398fed55e1633f66b66f731eb4e2b",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Redis plugin. Then read this project's repositories to see how it uses Redis: its client and connection settings, key naming, data structures, expirations, and any search or vector indexes. Propose the automation below adapted to what you found, created switched off, and explain it in one line. Drop it if the project doesn't use Redis, and say why.",
      automations: [
        {
          name: "Redis usage review on pull requests",
          purpose:
            "Check new Redis code for missing expirations, unbounded keys, and blocking commands",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request adds or changes code that talks to Redis, check it against the Redis plugin's practices: keys without expirations, unbounded collections, KEYS or other blocking commands, missing connection pooling, and round trips that a pipeline would remove. Comment with each issue and the better form. Stay quiet when the code follows the practices.",
        },
      ],
      starters: [
        "Review how this project uses Redis and list the riskiest patterns",
        "Add a semantic cache in front of our LLM calls with Redis",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEKF76V4JFWP3ATBGATTXA",
        version: "1.4.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:50:10.052Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "remotion",
      displayName: "Remotion",
      description:
        "Make videos in React with animation, captions, audio, and rendering.",
      maker: { name: "Remotion", url: "https://www.remotion.dev" },
      accent: "#5FAEF6",
      category: "design",
      firstListedAt: at("2026-10-28T04:57:07.953Z"),
      hasIcon: true,
      stars: 73949,
      starsCheckedAt: at("2026-11-18T04:16:08.374Z"),
      version: "1.0.7",
      versionId: "01M5ZEM16NSZEGV3Q33J52M7FC",
      createdAt: at("2026-10-27T19:50:28.062Z"),
      updatedAt: at("2026-10-28T04:57:07.945Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "remotion-best-practices",
            description: "Router for all Remotion skills",
            content: null,
          },
          {
            name: "remotion-captions",
            description: "Transcribing, displaying and animating captions",
            content: null,
          },
          {
            name: "remotion-create",
            description: "Create a new Remotion video",
            content: null,
          },
          {
            name: "remotion-docs",
            description: "Search Remotion documentation",
            content: null,
          },
          {
            name: "remotion-interactivity",
            description: "Structure Remotion markup for interactivity",
            content: null,
          },
          {
            name: "remotion-maps",
            description: "Remotion Map animation knowledge",
            content: null,
          },
          {
            name: "remotion-markup",
            description: "Content, animation and effects best practices",
            content: null,
          },
          {
            name: "remotion-multimedia",
            description: "Interacting with Mediabunny",
            content: null,
          },
          {
            name: "remotion-render",
            description: "Export a Remotion video",
            content: null,
          },
          {
            name: "remotion-saas",
            description: "Build an app with Remotion",
            content: null,
          },
          {
            name: "remotion-studio",
            description: "Preview a Remotion video",
            content: null,
          },
          {
            name: "remotion-upgrade",
            description: "Upgrade Remotion, and related packages",
            content: null,
          },
        ],
        repository: "openai/plugins",
        path: "",
        commit: "0722921d5542fc593105c27bd52630babd8b8c2a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Remotion plugin. Then read this project's repositories to find any Remotion compositions, the Remotion version they use, and how videos are rendered. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation the project has no use for, and say why.",
      automations: [
        {
          name: "Render check on pull requests",
          purpose:
            "Render changed compositions and report timing, audio and asset problems",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request changes a Remotion composition, use the Remotion plugin to render the affected compositions and check the output for timing, audio sync, captions, fonts and assets that fail to load. Comment with a still of each problem and the fix. Stay quiet when the render is clean.",
        },
        {
          name: "Monthly Remotion upgrade",
          purpose:
            "Upgrade Remotion packages together and confirm the compositions still render",
          trigger: { type: "schedule", cron: "0 9 1 * *" },
          prompt:
            "Once a month, use the Remotion plugin to compare the project's Remotion packages with the latest release. When an upgrade is available, upgrade every Remotion package to the same version, render the compositions to confirm they still work, and open a draft pull request that lists any breaking changes. If everything is current, say so in one line.",
        },
      ],
      starters: [
        "Create a 20-second Remotion video announcing our latest release",
        "Add animated captions to this Remotion composition from its audio",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEM16NSZEGV3Q33J52M7FC",
        version: "1.0.7",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:50:28.464Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "robinhood",
      displayName: "Robinhood",
      description:
        "View portfolios, positions, orders, watchlists, and market data, and trade in a Robinhood Agentic account.",
      maker: {
        name: "Robinhood",
        url: "https://robinhood.com/us/en/support/articles/agentic-trading-overview/",
      },
      category: "payments",
      firstListedAt: at("2026-10-28T04:57:07.958Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60C819V7YTYHYEPH5B6WGJB",
      createdAt: at("2026-10-28T04:28:12.348Z"),
      updatedAt: at("2026-10-28T04:57:07.949Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Robinhood",
            transport: "http",
            placement: "backend",
            url: "https://agent.robinhood.com/mcp/trading",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C819V7YTYHYEPH5B6WGJB",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:28:12.525Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "sagemaker-ai",
      displayName: "SageMaker AI",
      description:
        "Build, train, and deploy AI models with deep AWS AI/ML expertise brought directly into your coding assistants, covering the surface area of Amazon SageMaker AI.",
      maker: {
        name: "Amazon Web Services",
        url: "https://github.com/awslabs/agent-plugins",
      },
      category: "deployment",
      firstListedAt: at("2026-10-28T04:57:07.935Z"),
      hasIcon: false,
      stars: 947,
      starsCheckedAt: at("2026-11-18T04:16:15.388Z"),
      version: "1.3.0",
      versionId: "01M60C0PXTXV6F83VJ42JV4CPT",
      createdAt: at("2026-10-28T04:24:12.438Z"),
      updatedAt: at("2026-10-28T04:57:07.931Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "SageMaker AI",
            transport: "stdio",
            placement: "machine",
            url: null,
            command: "uvx",
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "dataset-evaluation",
            description:
              'Validates dataset formatting and quality for SageMaker model fine-tuning (SFT, DPO, or RLVR). Use when the user says "is my dataset okay", "evaluate my data", "check my training data", "I have my own data", or before starting any fine-tuning job. Detects file format, checks schema compliance against the selected model and technique, and reports whether the data is ready for training or evaluation.',
            content: null,
          },
          {
            name: "dataset-transformation",
            description:
              'Generates code that transforms datasets between ML schemas for model training or evaluation. Use when the user says "transform", "convert", "reformat", "change the format", or when a dataset\'s schema needs to change to match the target format — always use this skill for format changes rather than writing inline transformation code. Supports OpenAI chat, SageMaker SFT/DPO/RLVR/RLAIF, HuggingFace preference, Bedrock Nova, VERL, and custom JSONL formats from local files or S3.',
            content: null,
          },
          {
            name: "directory-management",
            description:
              "Manages project directory setup and artifact organization. Use when starting a new project, resuming an existing one, or when a PLAN.md needs to be associated with a project directory. Creates the project folder structure (specs/, scripts/, notebooks/, manifests/, agent_memory/) and resolves project naming.",
            content: null,
          },
          {
            name: "finetuning",
            description:
              'Generates code that fine-tunes a base model using SageMaker serverless training jobs. Use when the user says "start training", "fine-tune my model", "I\'m ready to train", or when the plan reaches the finetuning step. Supports SFT, DPO, RLVR, and RLAIF trainers, including RLVR Lambda reward function and RLAIF custom prompt creation.',
            content: null,
          },
          {
            name: "finetuning-technique",
            description:
              "Selects a fine-tuning technique (SFT, DPO, RLVR, or RLAIF) for the user's use case and validates it against the selected model's available recipes. Use when the user has decided to finetune and needs to choose a technique, or when the technique needs to be validated against a model. Requires a base model to already be selected (via model-selection skill).",
            content: null,
          },
          {
            name: "hyperpod-cluster-debugger",
            description:
              "Diagnose and remediate cluster-wide HyperPod (EKS or Slurm) problems — creation / deployment failures (CloudFormation, EFA health check, lifecycle scripts, capacity), EKS access, node replacement, CloudFormation nested-stack errors, post-maintenance rollback state, dangling nodes, autoscaler conflicts. Includes `--validate` pre-flight. Read-only.",
            content: null,
          },
          {
            name: "hyperpod-issue-report",
            description:
              "Generate comprehensive issue reports from HyperPod clusters (EKS and Slurm) by collecting diagnostic logs and configurations for troubleshooting and AWS Support cases. Use when users need to collect diagnostics from HyperPod cluster nodes, generate issue reports for AWS Support, investigate node failures or performance problems, document cluster state, or create diagnostic snapshots. Triggers on requests involving issue reports, diagnostic collection, support case preparation, or cluster troubleshooting that requires gathering logs and system information from multiple nodes.",
            content: null,
          },
          {
            name: "hyperpod-nccl",
            description:
              "Diagnose NCCL failures and adjacent training-pod failures on HyperPod GPU clusters (EKS or Slurm) — training hangs, AllReduce / collective-op timeouts, EFA or libfabric errors, rendezvous failures, EFA TCP fallback, /dev/shm or memlock issues, NCCL version mismatch across pods, container OOM / exit-137 / OOMKilled, GPU OOM (CUDA out of memory), CrashLoopBackOff / Pending pods, MASTER_ADDR DNS, NetworkPolicy blocking. Not for single-node hardware faults (→ hyperpod-node-debugger § G) or cluster-creation EFA / SSM failures (→ hyperpod-cluster-debugger § A / § F).",
            content: null,
          },
          {
            name: "hyperpod-node-debugger",
            description:
              "Diagnose and remediate per-node issues on a HyperPod cluster (EKS or Slurm) — a specific node is unhealthy, unresponsive, stuck, or needs replacing. Covers on-node EFA, GPU / accelerator hardware (XID, ECC, NVLink, row-remap, DCGM), Slurm node down/drained, disk and memory pressure, per-node lifecycle-script failures, SSM agent, container runtime, kernel panics, pod networking. Read-only. Not for cluster-wide provisioning (→ hyperpod-cluster-debugger), NCCL (→ hyperpod-nccl), or MFU (→ hyperpod-mfu-debugger).",
            content: null,
          },
          {
            name: "hyperpod-performance-debugger",
            description:
              "Diagnose performance issues on Amazon SageMaker HyperPod clusters — uneven NCCL bandwidth across nodes and poor filesystem throughput. Read-only. Surfaces host-side signals (Xid, ECC, NVLink, EFA reachability, FSx saturation) and routes to the appropriate sibling skill (hyperpod-node-debugger, hyperpod-nccl, hyperpod-version-checker, hyperpod-issue-report) for any remediation. Triggers on uneven NCCL across nodes, straggler node, FSx slow, checkpoint slow, dataloader slow, filesystem bottleneck, FSx throughput, cross-AZ latency, topology mismatch.",
            content: null,
          },
          {
            name: "hyperpod-slurm-debugger",
            description:
              'Diagnostic-only skill for Slurm scheduler and node-daemon issues on Amazon SageMaker HyperPod Slurm clusters. Scope mirrors the HyperPod troubleshooting guide. Invoke when the user reports a Slurm node stuck in down/drain, "Node unexpectedly rebooted" after auto-repair, slurmd not running, jobs stuck PENDING with REASON=Resources while sinfo shows idle nodes, jobs stuck COMPLETING after node replacement, GRES/GPU counts wrong, scontrol ping failing, slurmctld unresponsive, an Action:Reboot/Replace request that did not trigger HyperPod auto-recovery, or auto-resume not restarting a job. Also triggers on "drain before reboot", "diagnose a Slurm node", "investigate stuck jobs."',
            content: null,
          },
          {
            name: "hyperpod-ssm",
            description:
              "Remote command execution and file transfer on SageMaker HyperPod cluster nodes via AWS Systems Manager (SSM). This is the primary interface for accessing HyperPod nodes — direct SSH is not available. Use when any skill, workflow, or user request needs to execute commands on cluster nodes, upload files to nodes, read/download files from nodes, run diagnostics, install packages, or perform any operation requiring shell access to HyperPod instances. Other HyperPod skills depend on this skill for all node-level operations.",
            content: null,
          },
          {
            name: "hyperpod-version-checker",
            description:
              "Check and compare software component versions on SageMaker HyperPod cluster nodes - NVIDIA drivers, CUDA toolkit, cuDNN, NCCL, EFA, AWS OFI NCCL, GDRCopy, MPI, Neuron SDK (Trainium/Inferentia), Python, and PyTorch. Use when checking component versions, verifying CUDA/driver compatibility, detecting version mismatches across nodes, planning upgrades, documenting cluster configuration, or troubleshooting version-related issues on HyperPod. Triggers on requests about versions, compatibility, component checks, or upgrade planning for HyperPod clusters.",
            content: null,
          },
          {
            name: "model-deployment",
            description:
              'Generates code that deploys fine-tuned models from SageMaker Serverless Model Customization to SageMaker endpoints or Bedrock. Use when the user says "deploy my model", "create an endpoint", "make it available", or asks about deployment options. Identifies the correct deployment pathway (Nova vs OSS), generates deployment code, and handles endpoint configuration.',
            content: null,
          },
          {
            name: "model-evaluation",
            description:
              'Generates python code that evaluates SageMaker models. Supports two evaluation types: LLM-as-Judge and Custom Scorer. Use when the user says "evaluate my model", "run a benchmark", "test model performance", "how did my model perform", "compare models", or other similar requests.',
            content: null,
          },
          {
            name: "model-selection",
            description:
              'Selects a base model for the user\'s use case by querying SageMaker Hub. Use when the user asks which model to use, wants to select or change their base model, mentions a model name or family (e.g., "Llama", "Mistral", "Nova"), or wants to evaluate a base model — always activate even for known model names because the exact Hub model ID must be resolved. Queries available models, presents benchmarks and licenses, and confirms selection.',
            content: null,
          },
          {
            name: "planning",
            description:
              "Discovers user intent and generates a structured, step-by-step plan for model customization workflows. This skill must always be activated alongside any other skill when the user's request relates to model customization — including fine-tuning, training, building, customizing, reviewing data, or getting advice on approach, regardless of domain. Do not skip this skill even if the immediate ask is narrow (e.g., reviewing data format or a single workflow step), because planning discovers the full scope of work needed. Also activate when the user wants to resume, continue, or modify an existing plan.",
            content: null,
          },
          {
            name: "sdk-getting-started",
            description:
              'Validates the user\'s environment for SageMaker AI operations — checks SDK version, AWS region, and execution role. Use when the user says "set up", "getting started", "check my environment", "configure SDK", or as the first step in any plan involving SageMaker/Bedrock training, evaluation, or deployment.',
            content: null,
          },
          {
            name: "use-case-specification",
            description:
              "Creates a reusable use case specification file that defines the business problem, stakeholders, and measurable success criteria for model customization, as recommended by the AWS Responsible AI Lens. Use as the default first step in any model customization plan. Skip only if the user explicitly declines or already has a use case specification to reuse. Captures problem statement, primary users, and LLM-as-a-Judge success tenets.",
            content: null,
          },
        ],
        repository: "awslabs/agent-plugins",
        path: "",
        commit: "fbefb3764e67558fe10ac834dd85db49734aa9b6",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C0PXTXV6F83VJ42JV4CPT",
        version: "1.3.0",
        notes: "Synced at fbefb37",
        createdAt: at("2026-10-28T04:24:12.490Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "sentry",
      displayName: "Sentry",
      description: "Investigate errors, traces, and affected releases.",
      category: "monitoring",
      featuredRank: 1,
      hasIcon: true,
      version: "1.4.0",
      versionId: "01M49GJBWRAKZCSAE0R21JBQ2Y",
      createdAt: at("2026-10-06T21:05:31.297Z"),
      updatedAt: at("2026-10-27T16:27:17.841Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Sentry",
            transport: "http",
            placement: "backend",
            url: "https://mcp.sentry.dev/mcp?utm_source=plugin",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "sentry-create-alert",
            description:
              "Create Sentry alerts using the workflow engine API. Use when asked to create alerts, set up notifications, configure issue priority alerts, or build workflow automations. Supports email, Slack, PagerDuty, Discord, and other notification actions.",
            content: null,
          },
          {
            name: "sentry-debug-issue",
            description:
              "Debug and fix a Sentry issue — find it (by link, ID, or search), pull full context (stack trace, breadcrumbs, trace, logs), optionally run Seer root-cause / autofix, apply the code fix, and resolve it via a `Fixes PROJECT-NAME-12A` commit/PR. Use when working a known error or hunting one down to fix.",
            content: null,
          },
          {
            name: "sentry-fix-stack-traces",
            description:
              'Make Sentry stack traces readable — upload source maps for JavaScript/TypeScript, or debug files for native and mobile (dSYM, ProGuard/R8, NDK symbols, Dart obfuscation maps, .NET PDBs). Use when frames in Sentry show minified names, bundled paths, hex addresses, "unknown", or method names with no file/line, instead of your original source.',
            content: null,
          },
          {
            name: "sentry-get-started",
            description:
              "Guided entry point for using Sentry through your agent. Orients you to your current setup and, for a new project, sets up Sentry end to end with sane defaults — provision a project, install the SDK (errors, tracing, and whatever it enables by default), and confirm real telemetry reaches Sentry. Routes other intents (adding more signals, fixing issues) to the right skill.",
            content: null,
          },
          {
            name: "sentry-instrument",
            description:
              "Instrument an application with Sentry — detect the platform, install and initialize the SDK if needed, and wire up any signal — error monitoring, tracing/performance, logging, metrics, profiling, session replay, user feedback, cron check-ins, and AI/LLM monitoring (agent runs, token cost, and conversations for OpenAI, Anthropic, Vercel AI, LangChain, Google GenAI, Pydantic AI, and Laravel AI). Use to add Sentry to a project or to capture more than errors.",
            content: null,
          },
          {
            name: "sentry-otel-exporter-setup",
            description:
              "Configure the OpenTelemetry Collector with Sentry Exporter for multi-project routing and automatic project creation. Use when setting up OTel with Sentry, configuring collector pipelines for traces and logs, or routing telemetry from multiple services to Sentry projects.",
            content: null,
          },
          {
            name: "sentry-setup-releases",
            description:
              "Set up Sentry releases and deploy tracking — tag events with a version and environment, create the release in CI with its commits, and wire up suspect commits and code mappings, so Sentry can show which release introduced an issue, which commit is responsible, and release health. Use when asked to set up releases, track deploys, see what changed, or when issues show an unknown release or no suspect commit.",
            content: null,
          },
          {
            name: "sentry-snapshots-cocoa",
            description:
              'Full Sentry Snapshots setup for Apple/Cocoa projects. Use when asked to "setup SnapshotPreviews", "setup Apple snapshot testing", "upload Apple snapshots to Sentry", "setup Apple snapshot GitHub Actions", or "setup Apple selective snapshot testing".',
            content: null,
          },
        ],
        repository: "getsentry/plugin-claude",
        path: "",
        commit: "73e53541d7af21672e27428c7067f4264b8a3d65",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M49GJBWRAKZCSAE0R21JBQ2Y",
        version: "1.4.0",
        notes: null,
        createdAt: at("2026-10-06T21:05:31.708Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "sp-global",
      displayName: "S&P Global",
      description: "Query S&P Capital IQ financials, prices, and transcripts.",
      maker: {
        name: "S&P Global",
        url: "https://docs.kensho.com/llmreadyapi/overview",
      },
      category: "payments",
      firstListedAt: at("2026-10-28T04:57:08.174Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60C9BQA0ZTXSFPQTGG5NWFQ",
      createdAt: at("2026-10-28T04:28:55.878Z"),
      updatedAt: at("2026-10-28T04:57:08.168Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "S&P Global",
            transport: "http",
            placement: "backend",
            url: "https://kfinance.kensho.com/integrations/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C9BQA0ZTXSFPQTGG5NWFQ",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:28:55.921Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "spottercode",
      displayName: "Spottercode",
      description:
        "ThoughtSpot developer documentation — search Visual Embed SDK, REST API v2, and developer guides",
      maker: {
        name: "ThoughtSpot",
        url: "https://github.com/thoughtspot/spottercode-mcp-plugin",
      },
      category: "docs",
      firstListedAt: at("2026-10-28T04:57:08.165Z"),
      hasIcon: false,
      stars: 1,
      starsCheckedAt: at("2026-11-18T04:16:16.617Z"),
      version: "1.0.0",
      versionId: "01M60C2P3A6S4BHM19KN3XRF00",
      createdAt: at("2026-10-28T04:25:17.144Z"),
      updatedAt: at("2026-10-28T04:57:08.158Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Spottercode",
            transport: "http",
            placement: "backend",
            url: "https://spottercode.thoughtspot.app/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "get-developer-docs-reference",
            description:
              "Guidance for searching general ThoughtSpot developer documentation",
            content: null,
          },
          {
            name: "get-rest-api-reference",
            description:
              "Guidance for working with the ThoughtSpot REST API v2",
            content: null,
          },
          {
            name: "get-visual-embed-sdk-reference",
            description:
              "Guidance for embedding ThoughtSpot content in web applications using the Visual Embed SDK",
            content: null,
          },
          {
            name: "ts-bulk-delete",
            description:
              "Bulk delete ThoughtSpot metadata objects — every downstream dependent of an object, everything carrying a tag, or an explicit list of GUIDs — with optional TML export first and a typed confirmation, using the ThoughtSpot REST API v2 directly. Not for stale-content archival or deleting content tagged for an archive review (INACTIVE) — use ts-content-archive.",
            content: null,
          },
          {
            name: "ts-object-answer-promote",
            description:
              "Promote formulas and parameters from a saved ThoughtSpot Answer into its Model, so everyone who searches the Model can use them — using the ThoughtSpot REST API v2 directly.",
            content: null,
          },
          {
            name: "ts-variable-timezone",
            description:
              "Manage the ts_user_timezone template variable in ThoughtSpot — search current values, or set/remove timezone values at org or user level — using the ThoughtSpot REST API v2 directly.",
            content: null,
          },
        ],
        repository: "thoughtspot/spottercode-mcp-plugin",
        path: "",
        commit: "88f66fa04c6f1f772ef8c1d030f2e3be3b8e1a3d",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C2P3A6S4BHM19KN3XRF00",
        version: "1.0.0",
        notes: "Synced at 88f66fa",
        createdAt: at("2026-10-28T04:25:17.172Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "statsig",
      displayName: "Statsig",
      description:
        "Manage feature gates and experiments and read their results",
      maker: { name: "Statsig", url: "https://statsig.com" },
      category: "deployment",
      firstListedAt: at("2026-10-28T04:57:08.164Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M5ZEMHKRX7D0G9ERZHQPYY2F",
      createdAt: at("2026-10-27T19:50:44.864Z"),
      updatedAt: at("2026-10-28T04:57:08.157Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Statsig",
            transport: "http",
            placement: "backend",
            url: "https://api.statsig.com/v1/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "5e345c1b3990b44990f99f49259116ff6469fabc",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Statsig plugin. Then read this project's repositories to see how it uses Statsig: where the code checks feature gates, reads dynamic configs, and logs experiment exposures. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part of Statsig the project doesn't use, and say why.",
      automations: [
        {
          name: "Weekly stale gate cleanup",
          purpose:
            "Find gates that are fully rolled out or unused and remove them from the code",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the Statsig plugin to list feature gates that have passed 100% or 0% for more than 30 days, or have had no checks recently. For each one still referenced in the code, open a draft pull request that removes the check and the dead branch. Explain each removal in one line. If there's nothing to clean up, say so in one line.",
        },
        {
          name: "Gate reference check on pull requests",
          purpose:
            "Check that gates and configs named in a pull request exist in Statsig",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request adds a feature gate, dynamic config, or experiment check, use the Statsig plugin to confirm each name exists in the project and is targeted as the code expects. Comment with any name that is missing or misspelled. Stay quiet when every reference matches.",
        },
      ],
      starters: [
        "Show the results of our running experiments",
        "List feature gates that are fully rolled out and still checked in the code",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEMHKRX7D0G9ERZHQPYY2F",
        version: "1.0.0",
        notes: "First listing in Explore.",
        createdAt: at("2026-10-27T19:50:45.262Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "superpowers",
      displayName: "Superpowers",
      description:
        "Plan, test-drive, debug, and review code with a disciplined workflow.",
      maker: {
        name: "Jesse Vincent",
        url: "https://github.com/obra/superpowers",
      },
      category: "docs",
      firstListedAt: at("2026-10-28T04:57:08.174Z"),
      hasIcon: true,
      stars: 319450,
      starsCheckedAt: at("2026-11-18T04:16:08.846Z"),
      version: "6.3.0",
      versionId: "01M5ZEN294JX7D1N1HWVYPGAB1",
      createdAt: at("2026-10-27T19:51:01.923Z"),
      updatedAt: at("2026-10-28T04:57:08.167Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "brainstorming",
            description:
              "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.",
            content: null,
          },
          {
            name: "dispatching-parallel-agents",
            description:
              "Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies",
            content: null,
          },
          {
            name: "executing-plans",
            description:
              "Use when you have a written implementation plan to execute in a separate session with review checkpoints",
            content: null,
          },
          {
            name: "finishing-a-development-branch",
            description:
              "Use when implementation is complete, all tests pass, and you need to decide how to integrate the work",
            content: null,
          },
          {
            name: "receiving-code-review",
            description:
              "Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation",
            content: null,
          },
          {
            name: "requesting-code-review",
            description:
              "Use when completing tasks, implementing major features, or before merging to verify work meets requirements",
            content: null,
          },
          {
            name: "subagent-driven-development",
            description:
              "Use when executing implementation plans with independent tasks in the current session",
            content: null,
          },
          {
            name: "systematic-debugging",
            description:
              "Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes",
            content: null,
          },
          {
            name: "test-driven-development",
            description:
              "Use when implementing any feature or bugfix, before writing implementation code",
            content: null,
          },
          {
            name: "using-git-worktrees",
            description:
              "Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback",
            content: null,
          },
          {
            name: "using-superpowers",
            description:
              "Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions",
            content: null,
          },
          {
            name: "verification-before-completion",
            description:
              "Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always",
            content: null,
          },
          {
            name: "writing-plans",
            description:
              "Use when you have a spec or requirements for a multi-step task, before touching code",
            content: null,
          },
          {
            name: "writing-skills",
            description:
              "Use when creating new skills, editing existing skills, or verifying skills work before deployment",
            content: null,
          },
        ],
        repository: "openai/plugins",
        path: "",
        commit: "0722921d5542fc593105c27bd52630babd8b8c2a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Superpowers plugin. Then read this project's repositories to see how work is planned, how tests are written and run, and how pull requests are reviewed. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation that doesn't fit how this team works, and say why.",
      automations: [
        {
          name: "Verification review on pull requests",
          purpose:
            "Check a pull request against its description and plan, with tests and evidence for each claim",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request is opened, use the Superpowers plugin's code review workflow to check it against its description and any linked plan: whether the requirements are met, whether tests cover the change and pass, and whether claims about fixes are backed by evidence. Comment with what is missing or unverified. Stay quiet when the work is complete and verified.",
        },
        {
          name: "Weekly flaky test investigation",
          purpose:
            "Find the root cause of the worst flaky test and propose a fix",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, find the tests that failed intermittently on the default branch in the past seven days. Use the Superpowers plugin's systematic debugging workflow to find the root cause of the worst one, write a test that reproduces it, and open a draft pull request with the fix. Report the others with what you found. If no test flaked, say so in one line.",
        },
      ],
      starters: [
        "Write an implementation plan for this feature before touching code",
        "Debug this failing test systematically and fix the root cause",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEN294JX7D1N1HWVYPGAB1",
        version: "6.3.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:51:02.328Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "svelte",
      displayName: "Svelte",
      description:
        "Look up Svelte docs and check components with the Svelte autofixer",
      maker: { name: "Svelte", url: "https://svelte.dev" },
      accent: "#FF4205",
      category: "docs",
      firstListedAt: at("2026-10-28T04:57:08.171Z"),
      hasIcon: true,
      stars: 342,
      starsCheckedAt: at("2026-11-18T04:16:09.196Z"),
      version: "1.0.10",
      versionId: "01M5ZEN44KQZRNQBZNR9FT83WB",
      createdAt: at("2026-10-27T19:51:03.822Z"),
      updatedAt: at("2026-10-28T04:57:08.164Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Svelte",
            transport: "stdio",
            placement: "machine",
            url: null,
            command: "npx",
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "svelte-code-writer",
            description:
              "CLI tools for Svelte 5 documentation lookup and code analysis. MUST be used whenever creating, editing or analyzing any Svelte component (.svelte) or Svelte module (.svelte.ts/.svelte.js). If possible, this skill should be executed within the svelte-file-editor agent for optimal results.",
            content: null,
          },
          {
            name: "svelte-core-bestpractices",
            description:
              "Guidance on writing fast, robust, modern Svelte code. Load this skill whenever in a Svelte project and asked to write/edit or analyze a Svelte component or module. Covers reactivity, event handling, styling, integration with libraries and more.",
            content: null,
          },
        ],
        repository: "sveltejs/ai-tools",
        path: "",
        commit: "6b5d0dab3c9c083387247ab20dc684573481076b",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Svelte plugin. Then read this project's repositories to see how it uses Svelte: its Svelte and SvelteKit versions, its components, and whether it has moved to runes. Propose the automation below adapted to what you found, created switched off, and explain it in one line. Drop it if the project has no Svelte components, and say why.",
      automations: [
        {
          name: "Svelte component check on pull requests",
          purpose:
            "Run the Svelte autofixer on changed components and suggest fixes",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request adds or changes .svelte files, use the Svelte plugin's autofixer on each changed component. Comment with the issues it finds, such as legacy syntax, misused runes, or accessibility warnings, and the corrected code. Stay quiet when every component passes.",
        },
      ],
      starters: [
        "Migrate one of our components from stores to runes using the current Svelte docs",
        "Run the Svelte autofixer on our largest component and fix what it finds",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEN44KQZRNQBZNR9FT83WB",
        version: "1.0.10",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:51:04.231Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "temporal",
      displayName: "Temporal",
      description:
        "Build, debug, and operate Temporal workflows across SDKs and Temporal Cloud.",
      maker: { name: "Temporal", url: "https://temporal.io" },
      category: "docs",
      firstListedAt: at("2026-10-28T04:57:08.404Z"),
      hasIcon: true,
      stars: 6,
      starsCheckedAt: at("2026-11-18T04:16:10.288Z"),
      version: "0.4.0",
      versionId: "01M5ZENN57HJ950YEP77WM1X72",
      createdAt: at("2026-10-27T19:51:21.251Z"),
      updatedAt: at("2026-10-28T04:57:08.392Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "temporal-cloud-setup",
            description:
              "Set up Temporal Cloud and run a sample Workflow on it for the user, doing the work end to end. Use when the user wants to set up Temporal Cloud, get started on Temporal Cloud, install the unified Temporal CLI (prerelease cloud-cli), create a Cloud namespace or API key, clone a money-transfer sample app, write the client config TOML, or connect a local Worker to Temporal Cloud and run a sample Workflow. This is the Cloud setup path, not the local learning path (see temporal-getting-started). Covers Python, TypeScript, Go, Java, .NET, and Ruby SDKs.",
            content: null,
          },
          {
            name: "temporal-developer",
            description:
              'Develop, debug, and manage Temporal applications across Python, TypeScript, Go, Java, .NET, Ruby, and Rust. Use when the user is building workflows, activities, or workers with a Temporal SDK, debugging issues like non-determinism errors, stuck workflows, or activity retries, using Temporal CLI, Temporal Server, or Temporal Cloud, or working with durable execution concepts like signals, queries, heartbeats, versioning, continue-as-new, child workflows, or saga patterns. Also use when the user mentions "run a Temporal workflow from the CLI", "start a dev server", "run temporal server start-dev", "temporal workflow start", "temporal workflow execute", "temporal workflow signal", "temporal workflow query", "temporal workflow update".',
            content: null,
          },
          {
            name: "temporal-ops",
            description:
              "Administer and diagnose running Temporal Cloud or self-hosted Temporal Server environments via CLI (temporal, tcld) — not SDK code. Operations: namespace CRUD, Cloud capacity/APS, API-key rotation, mTLS cert rotation, workflow health, batch cancel/terminate/reset, export, search attributes, Ops API, billing, audit logs, Terraform, SAML/SCIM, migration. Diagnosis: bottom-up triage of stuck workflows, non-determinism, worker-health, task-queue problems, HA failover, payload size limits, performance bottlenecks, missed schedules. Do NOT trigger for generic TLS/gRPC errors unrelated to Temporal, writing application code (temporal-developer), or worker tuning/sizing (temporal-workertuning).",
            content: null,
          },
          {
            name: "temporal-serverless",
            description:
              'Deploy and operate Temporal Workers on serverless compute (AWS Lambda) driven by the Worker Controller Instance (WCI). Use when the user mentions: "serverless worker", "Temporal serverless", "Worker Controller Instance", "WCI", "deploy Temporal worker on Lambda", "Lambda packaging", "Lambda timeout", "WCI inspection", "CloudFormation Temporal".',
            content: null,
          },
        ],
        repository: "openai/plugins",
        path: "",
        commit: "0722921d5542fc593105c27bd52630babd8b8c2a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Temporal plugin. Then read this project's repositories to find its Temporal workflows and activities, the SDK and version they use, how workers are deployed, and whether it runs on Temporal Cloud or a self-hosted server. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part of Temporal the project doesn't use, and say why.",
      automations: [
        {
          name: "Determinism check on pull requests",
          purpose:
            "Flag workflow changes that would break running workflows on replay",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request changes Temporal workflow code, use the Temporal plugin to check it for non-deterministic changes that would break running workflows, such as reordered or removed activities, new timers, or changed signal handling without versioning. Comment with each risk and how to version the change. Stay quiet when the change is replay-safe.",
        },
        {
          name: "Daily failed workflow triage",
          purpose:
            "Group the past day's failed and stuck workflows by cause and trace them to the code",
          trigger: { type: "schedule", cron: "0 9 * * *" },
          prompt:
            "Every morning, use the Temporal plugin and CLI to list workflows that failed, timed out or are stuck retrying in the past day. Group them by workflow type and error, trace each group to the code, and report the likely cause and fix. If nothing failed, say so in one line.",
        },
      ],
      starters: [
        "Find out why this Temporal workflow is stuck and fix it",
        "Add a new activity with retries and tests to our order workflow",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZENN57HJ950YEP77WM1X72",
        version: "0.4.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:51:21.655Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "test-android-apps",
      displayName: "Test Android Apps",
      description:
        "Reproduce bugs, inspect UI, and profile Android apps on an emulator.",
      maker: { name: "OpenAI", url: "https://openai.com" },
      accent: "#63CAF8",
      category: "docs",
      firstListedAt: at("2026-10-28T04:57:08.428Z"),
      hasIcon: true,
      stars: 7995,
      starsCheckedAt: at("2026-11-18T04:16:20.150Z"),
      version: "0.1.2",
      versionId: "01M5ZEP2KHQ9R3RFMEQVDD7WZX",
      createdAt: at("2026-10-27T19:51:35.030Z"),
      updatedAt: at("2026-10-28T04:57:08.415Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "android-emulator-qa",
            description:
              "Use when validating Android feature flows in an emulator with adb-driven launch, input, UI-tree inspection, screenshots, and logcat capture.",
            content: null,
          },
          {
            name: "android-performance",
            description:
              "Gather and interpret Android performance evidence on an adb target using Simpleperf CPU profiles, Perfetto or Compose traces, gfxinfo frame data, dumpsys meminfo snapshots, Java heap dumps, and native allocation traces. Use when asked to profile an Android app flow, find CPU-heavy functions, diagnose jank, capture startup or frame timing evidence, compare before/after performance, explain what code is taking time, or gather memory/leak profiling artifacts.",
            content: null,
          },
        ],
        repository: "openai/plugins",
        path: "",
        commit: "0722921d5542fc593105c27bd52630babd8b8c2a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Test Android Apps plugin. Then read this project's repositories to find its Android apps, how they build and install, and their most important screens and flows. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part the project doesn't have, and say why.",
      automations: [
        {
          name: "Emulator check on pull requests",
          purpose:
            "Run the flows a pull request changes on the emulator and report crashes and broken screens",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request changes an Android app, build it, install it on the emulator with the Test Android Apps plugin, walk the flows the change affects, and capture screenshots and logcat. Comment with each crash, ANR or broken screen and a suggested fix. Stay quiet when everything works.",
        },
        {
          name: "Weekly Android performance check",
          purpose:
            "Measure startup and frame rendering and report regressions with trace evidence",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, build the app from the default branch and use the Test Android Apps plugin to measure startup time and frame rendering on the main screens. Compare with the previous week and report regressions with the trace evidence and the code most likely responsible. If nothing regressed, say so in one line.",
        },
      ],
      starters: [
        "Install the app on the emulator and screenshot the login flow",
        "Reproduce this crash on the emulator and capture the logcat",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEP2KHQ9R3RFMEQVDD7WZX",
        version: "0.1.2",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:51:35.430Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "thousandeyes",
      displayName: "ThousandEyes",
      description:
        "Connect Claude Code to ThousandEyes MCP endpoints and shared ThousandEyes skills for network intelligence workflows.",
      maker: { name: "ThousandEyes" },
      category: "monitoring",
      firstListedAt: at("2026-10-28T04:57:08.411Z"),
      hasIcon: true,
      stars: 3,
      starsCheckedAt: at("2026-11-18T04:16:19.281Z"),
      version: "1.0.0",
      versionId: "01M60C2QG13GFRT202C315JXA4",
      createdAt: at("2026-10-28T04:25:18.563Z"),
      updatedAt: at("2026-10-28T04:57:08.400Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "ThousandEyes",
            transport: "http",
            placement: "backend",
            url: "https://api.thousandeyes.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "adaptive-alert-insights",
            description:
              "Evaluates whether Adaptive Alerting would help and reviews existing ThousandEyes Adaptive Alert Insights and their recommended alert-rule changes. Use when a request asks whether an Insight or recommendation exists, what it changes, or where to apply, dismiss, or reject it. Choosing between adaptive and static threshold modes explicitly uses baseline threshold review. Do not use for general alert fatigue, ordinary named-rule noise, or unrelated maintenance.",
            content: null,
          },
          {
            name: "thousandeyes-alert-rule-management",
            description:
              "List, inspect, create, update, or delete ThousandEyes alert rules with MCP tools. Use when a user wants help managing alert rules for the currently documented write domains, Network & App Synthetics and Routing, and the session exposes `list_alert_rules`, `get_alert_rule`, `create_alert_rule`, `update_alert_rule`, or `delete_alert_rule`.",
            content: null,
          },
          {
            name: "thousandeyes-network-data-from-traceid",
            description:
              "Obtain ThousandEyes Network & App Synthetics data given a trace ID. Use when a user has a `traceId`, ThousandEyes MCP is available, and one or more Observability Platform integrations or equivalent tooling paths are available to query every relevant Observability Platform for the trace, extract `tracestate` or `w3c.tracestate`, decode the embedded ThousandEyes permalink, recover the ThousandEyes account/test/agent/execution identifiers, and fetch the matching ThousandEyes network data.",
            content: null,
          },
          {
            name: "thousandeyes-synthetic-monitoring",
            description:
              "Manage ThousandEyes synthetic monitoring with MCP tools. Use when a user wants to list, inspect, create, update, delete, or validate synthetic tests; deploy application templates; or choose the right ThousandEyes monitoring approach across Network and Application Synthetics and Browser Synthetics.",
            content: null,
          },
          {
            name: "thousandeyes-test-trace-correlation",
            description:
              "Investigate failing ThousandEyes synthetic tests with MCP tools. Use when a user wants ThousandEyes test triage, service-map or trace-ID correlation, distributed-tracing checks, correlation across Observability Platforms, or evidence-backed root-cause analysis with optional code fixes.",
            content: null,
          },
        ],
        repository: "thousandeyes/thousandeyes-ai-agents-toolkit",
        path: "",
        commit: "cafafe1855197b26d8861eae0311a7258023772e",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C2QG13GFRT202C315JXA4",
        version: "1.0.0",
        notes: "Synced at cafafe1",
        createdAt: at("2026-10-28T04:25:18.604Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "tinyfish",
      displayName: "TinyFish",
      description:
        "Browse and automate the web with TinyFish: run multi-step web automations, search the web, extract clean page content, and drive remote stealth browser sessions.",
      maker: {
        name: "TinyFish",
        url: "https://docs.tinyfish.ai/mcp-integration",
      },
      category: "other",
      firstListedAt: at("2026-10-28T04:57:08.416Z"),
      hasIcon: true,
      version: "1.0.1",
      versionId: "01M60CA6DW6VQKH9RHMEMZY675",
      createdAt: at("2026-10-28T04:29:23.235Z"),
      updatedAt: at("2026-10-28T04:57:08.404Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "TinyFish",
            transport: "http",
            placement: "backend",
            url: "https://agent.tinyfish.ai/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60CA6DW6VQKH9RHMEMZY675",
        version: "1.0.1",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:29:23.271Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "todoist",
      displayName: "Todoist",
      description: "Create, find, and complete tasks and projects.",
      maker: { name: "Todoist", url: "https://github.com/Doist/todoist-mcp" },
      category: "productivity",
      firstListedAt: at("2026-10-28T04:57:08.380Z"),
      hasIcon: true,
      version: "1.0.1",
      versionId: "01M60CB1Y65J586W457V89E491",
      createdAt: at("2026-10-28T04:29:51.327Z"),
      updatedAt: at("2026-10-28T04:57:08.374Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Todoist",
            transport: "http",
            placement: "backend",
            url: "https://ai.todoist.net/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60CB1Y65J586W457V89E491",
        version: "1.0.1",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:29:51.437Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "trello",
      displayName: "Trello",
      description:
        "Manage your Trello workspace from chat: browse and create boards, view and move lists, create, update, move, archive, and complete cards with labels and due dates, manage checklists, capture Inbox cards, schedule Planner focus time, and search across boards.",
      maker: {
        name: "Trello",
        url: "https://github.com/atlassian/trello-mcp-server",
      },
      category: "productivity",
      firstListedAt: at("2026-10-28T04:57:09.815Z"),
      hasIcon: true,
      version: "1.0.1",
      versionId: "01M60CBNRAJND6T708TRNP83V9",
      createdAt: at("2026-10-28T04:30:11.649Z"),
      updatedAt: at("2026-10-28T04:57:09.699Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Trello",
            transport: "http",
            placement: "backend",
            url: "https://mcp.trello.com/v1",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60CBNRAJND6T708TRNP83V9",
        version: "1.0.1",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:30:11.762Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "turbopuffer",
      displayName: "Turbopuffer",
      description:
        "Work with turbopuffer, a serverless vector and full-text search database. Includes guidance for querying (vector ANN, BM25, hybrid), writing, schema management, native embeddings, sharding, pinning, branching, bulk ingestion, and troubleshooting.",
      maker: { name: "turbopuffer" },
      category: "database",
      firstListedAt: at("2026-10-28T04:57:10.541Z"),
      hasIcon: false,
      stars: 13,
      starsCheckedAt: at("2026-11-18T04:16:17.430Z"),
      version: "0.2.0",
      versionId: "01M60C2SNV27G1889QR4R2GFQR",
      createdAt: at("2026-10-28T04:25:20.810Z"),
      updatedAt: at("2026-10-28T04:57:10.529Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [
          {
            name: "tpuf",
            description:
              "Use when the user wants to work with turbopuffer — a serverless vector and full-text search database. Covers setup, querying (vector, BM25, hybrid), writing, schema, native embeddings, sharding, pinning, branching, and troubleshooting. Trigger on any mention of turbopuffer or tpuf.\n",
            content: null,
          },
        ],
        repository: "turbopuffer/skills",
        path: "",
        commit: "5d347552ef63a2f8bae8e3d6b4f41b1cf6309be0",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60C2SNV27G1889QR4R2GFQR",
        version: "0.2.0",
        notes: "Synced at 5d34755",
        createdAt: at("2026-10-28T04:25:20.839Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "turso",
      displayName: "Turso",
      description: "Manage Turso databases, branches, and groups, and run SQL",
      maker: { name: "Turso", url: "https://turso.tech" },
      accent: "#4DF3CD",
      category: "database",
      firstListedAt: at("2026-10-28T04:57:10.534Z"),
      hasIcon: true,
      stars: 7,
      starsCheckedAt: at("2026-11-18T04:16:09.206Z"),
      version: "1.0.0",
      versionId: "01M5ZEP3VX08MWWK4JMEZ5D77W",
      createdAt: at("2026-10-27T19:51:36.326Z"),
      updatedAt: at("2026-10-28T04:57:10.525Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Turso",
            transport: "http",
            placement: "backend",
            url: "https://mcp.turso.ai/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "93d1ee06fdaaca5c029862564a25a61a8ce7459a",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Turso plugin. Then read this project's repositories to see how it uses Turso: which databases and groups it connects to, its migration tool, and the queries it issues most. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part of Turso the project doesn't use, and say why.",
      automations: [
        {
          name: "Migration test on a branch",
          purpose:
            "Apply a pull request's migration to a branch of the database and report errors",
          trigger: { type: "github", event: "pull_request_opened" },
          prompt:
            "When a pull request adds a database migration, use the Turso plugin to branch the production database, apply the migration to the branch, and record any error and how long it took. Comment on the pull request with the result and, for a failing migration, a safer form. Delete the branch when done. Stay quiet when the pull request adds no migration.",
        },
        {
          name: "Weekly top query review",
          purpose:
            "Find the most frequent and slowest queries and propose indexes",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the Turso plugin to read each database's top queries by frequency and latency. For each of the top five, find the code that issues it and propose an index or a rewrite. If nothing changed since last week, say so in one line.",
        },
      ],
      starters: [
        "List our Turso databases and groups with their sizes",
        "Find the slowest queries on our main database and propose indexes",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEP3VX08MWWK4JMEZ5D77W",
        version: "1.0.0",
        notes: "First listing in Explore.",
        createdAt: at("2026-10-27T19:51:36.727Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "twilio-developer-kit",
      displayName: "Twilio Developer Kit",
      description:
        "Twilio skills for setup, planning, products, and guardrails across SMS, Voice, WhatsApp, AI agents, and 30+ more products",
      maker: { name: "Twilio", url: "https://www.twilio.com/docs" },
      category: "productivity",
      firstListedAt: at("2026-10-28T04:57:11.131Z"),
      hasIcon: false,
      stars: 41,
      starsCheckedAt: at("2026-11-18T04:16:20.001Z"),
      version: "0.3.2",
      versionId: "01M60E11GNH7J2ACKB8JY19EZY",
      createdAt: at("2026-10-28T04:25:27.283Z"),
      updatedAt: at("2026-10-28T04:59:21.011Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Twilio Developer Kit",
            transport: "http",
            placement: "backend",
            url: "https://mcp.twilio.com/docs",
            command: null,
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "twilio-account-setup",
            description:
              "Create and configure a Twilio account from scratch. Covers free trial signup, trial limitations, getting credentials (Account SID and Auth Token), buying a phone number, verifying recipient numbers for trial use, SDK installation, first API call, subaccount management (creation, inheritance, credential isolation, limits), and enabling specific products (AI Assistants, Conversations, Verify, ConversationRelay, WhatsApp). Use this skill before any other Twilio skill if you do not yet have a Twilio account or need to enable a product. For Organization-level governance (SSO, SCIM, multi-team), see `twilio-organizations-setup`.\n",
            content: null,
          },
          {
            name: "twilio-agent-augmentation-architect",
            description:
              'Planning skill for augmenting human agents with real-time AI intelligence. Qualifies the developer\'s use case across coaching, compliance, QA, and routing to recommend the right Conversation Intelligence + Conversation Memory + TaskRouter architecture. Handles both "I want to add AI coaching to my call center" and "configure Conversation Intelligence operators for script adherence."\n',
            content: null,
          },
          {
            name: "twilio-ai-agent-architect",
            description:
              'Planning skill for AI-powered conversational agents. Qualifies the developer\'s use case across outcome sophistication, entry point, and customer profile to recommend the right Twilio Conversations architecture and implementation skills. Handles both high-level requests ("build me a voice AI assistant") and specific ones ("integrate ConversationRelay with my OpenAI backend").\n',
            content: null,
          },
          {
            name: "twilio-call-recordings",
            description:
              "Record Twilio voice calls correctly. Covers the critical distinction between Record verb (voicemail) and Dial record (call recording), dual-channel for QA, mid-call pause for PCI, Conference recording, and the ConversationRelay workaround. Use this skill whenever you need to capture call audio for compliance, QA, or analytics.\n",
            content: null,
          },
          {
            name: "twilio-cli-reference",
            description:
              'Twilio CLI reference for managing Twilio resources from the terminal. Covers installation, credential profiles, phone number provisioning, sending SMS and email, webhook configuration, local development with a tunneling service, debugging with watch and logs, serverless deployment, and plugin ecosystem. Use when the developer asks to "just do it", "set this up", "run a command", mentions "CLI", "command line", or "terminal", or when an AI agent can execute a task directly instead of writing application code.\n',
            content: null,
          },
          {
            name: "twilio-compliance-onboarding",
            description:
              "Registrations required BEFORE Twilio traffic works. Covers messaging programs (A2P 10DLC, toll-free verification, WhatsApp WABA, RCS, short code, alphanumeric sender) and voice trust programs (STIR/SHAKEN, Voice Integrity, Branded Calling, CNAM). Each number/sender type has its own program — registration blocks traffic until complete.\n",
            content: null,
          },
          {
            name: "twilio-compliance-traffic",
            description:
              "Rules you must follow for Twilio messaging and voice traffic. Covers TCPA (consent tiers, quiet hours, DNC), GDPR (EU consent, right to deletion), PCI DSS (payment recording, Pay verb), HIPAA (BAA, PHI), FDCPA (debt collection limits), CAN-SPAM, WhatsApp policies, SHAKEN/STIR, and consent management patterns. Use this skill proactively when developers have working traffic to ensure they follow the rules.\n",
            content: null,
          },
          {
            name: "twilio-conference-calls",
            description:
              "Build multi-party calls using Twilio Conference. Covers warm transfer, cold transfer, coaching (whisper), hold vs mute, participant modes, and supervisor barge. Use this skill for any contact center, support line, or scenario requiring transfers, holds, or multi-party calls.\n",
            content: null,
          },
          {
            name: "twilio-content-template-builder",
            description:
              "Create, manage, and send message templates using Twilio's Content API. Covers template creation for WhatsApp, SMS, RCS, and MMS; variable usage; WhatsApp Meta approval; and sending templates via ContentSid. Use this skill when building structured messages that require pre-approval or consistent formatting across channels.\n",
            content: null,
          },
          {
            name: "twilio-conversation-intelligence",
            description:
              "Twilio Conversation Intelligence development guide. Use when building real-time or post-call conversation analysis, language operator pipelines, sentiment analysis, agent assist, cross-channel analytics, or querying aggregated conversation insights (sentiment trends, escalation rates, dashboards).",
            content: null,
          },
          {
            name: "twilio-conversation-memory",
            description:
              "Store and retrieve conversation context using Twilio Conversation Memory. Covers Memory Store provisioning, profile management, traits, observations, conversation summaries, and semantic Recall. Use this skill to give AI agents or human agents persistent memory of conversations across sessions and channels.\n",
            content: null,
          },
          {
            name: "twilio-conversation-orchestrator",
            description:
              "Configure automatic conversation capture and routing with Twilio Conversation Orchestrator. Covers Configuration creation, channel capture rules, grouping types, status timeouts, Memory Store linkage, Intelligence linkage, and conversation lifecycle. Use this skill to automatically capture SMS, voice, WhatsApp, RCS, and web chat traffic into unified conversations without manually creating conversations or participants.\n",
            content: null,
          },
          {
            name: "twilio-conversations-classic-api",
            description:
              "Build multi-channel messaging experiences using Twilio Conversations (classic) API. Covers creating conversations, adding participants (SMS, WhatsApp, chat), sending messages, and handling webhooks. Use this skill to manage persistent multi-party or multi-channel conversations beyond single-message SMS/WhatsApp.\n",
            content: null,
          },
          {
            name: "twilio-customer-support-architect",
            description:
              'Planning skill for building customer service and support systems. Qualifies the developer\'s needs across the support ladder (self-service → AI agents → contact center), channel mix, and scale to recommend the right Twilio architecture. Handles both "build me a call center" and "add an IVR to my existing support line."\n',
            content: null,
          },
          {
            name: "twilio-debugging-observability",
            description:
              "Debug Twilio integrations and set up production observability. Covers the Console Debugger, Monitor Alerts API, Event Streams for error log streaming, status callback tracking, common error codes, and a systematic debugging workflow. Use this skill whenever a Twilio integration produces errors, messages fail to deliver, calls drop unexpectedly, or you need to set up monitoring for a production deployment.\n",
            content: null,
          },
          {
            name: "twilio-email-deliverability-advisor",
            description:
              "Deliverability advisor for the Twilio Email API specifically. Use ONLY when the developer explicitly mentions Twilio Email, comms.twilio.com, or a Twilio (non-SendGrid) email program. For all other deliverability questions — including generic ones — use twilio-sendgrid-deliverability-advisor.\n",
            content: null,
          },
          {
            name: "twilio-email-send",
            description:
              "Use when the caller has Twilio credentials (Account SID + Auth Token or API Key SID + Secret) and needs to send email via comms.twilio.com/v1/Emails. This is Twilio-native email — NOT SendGrid. Do NOT use if the caller has a SendGrid API key (SG.-prefix) — use twilio-sendgrid-email-send instead. Covers single sends, batch sends up to 10,000 recipients, Liquid personalization, operation tracking, and error handling.\n",
            content: null,
          },
          {
            name: "twilio-enterprise-knowledge",
            description:
              "Add knowledge retrieval (RAG) to AI agents using Twilio Enterprise Knowledge. Covers provisioning Knowledge Bases, uploading sources from web URLs, PDFs, and raw text, and running semantic search to retrieve relevant chunks at runtime. Use this skill to ground agent responses in your organization's actual approved content — FAQs, policies, product docs — rather than hallucinated answers.\n",
            content: null,
          },
          {
            name: "twilio-iam-auth-setup",
            description:
              "Set up and manage Twilio authentication credentials: Auth Tokens, API keys (Standard, Main, Restricted), Access Tokens for client-side SDKs, and credential rotation. Use this skill as a prerequisite foundation before making any Twilio API calls.\n",
            content: null,
          },
          {
            name: "twilio-identity-verification-advisor",
            description:
              "Planning skill for identity verification and fraud prevention. Qualifies the developer's needs across authentication method, channel selection, fraud risk level, and user experience to recommend the right Twilio Verify + Lookup architecture. Handles login, signup, password reset, and risk-adaptive verification.\n",
            content: null,
          },
          {
            name: "twilio-lookup-phone-intelligence",
            description:
              "Look up phone number intelligence via Twilio Lookup v2 API. Covers number validation, line type detection (mobile/landline/VoIP), SIM swap detection, caller name, identity match, and SMS pumping risk scoring. Use this skill to validate numbers or assess fraud risk before sending messages or calls.\n",
            content: null,
          },
          {
            name: "twilio-marketing-promotions-advisor",
            description:
              'Planning skill for marketing and promotional messaging. Use when a developer is figuring out how to set up or architect a marketing campaign on Twilio — channel selection, compliance readiness, audience size, geography, and delivery tracking. Handles open-ended requests like "how do I set up a WhatsApp marketing campaign" or "what\'s the best way to run promotional SMS." Skip this skill when the developer already knows what they want and is asking for API specs or implementation details.\n',
            content: null,
          },
          {
            name: "twilio-messaging-channel-advisor",
            description:
              'Planning skill that helps the developer pick the right Twilio messaging channel — SMS, MMS, RCS, or WhatsApp — for a given use case. Qualifies intent across content type, geography, use case (marketing / notifications / OTP / support), cost model, and brand presence. Use when the developer asks "which channel should I use", "SMS vs RCS vs WhatsApp", mentions a country or region, asks about branded messaging, rich content, or fallback — and proactively when the developer says "send SMS" or "text" but the use case (rich content, international reach, branded experience, marketing campaign, transactional notification) would benefit from a different or multi-channel approach. Also invoke alongside twilio-marketing-promotions-advisor or twilio-notifications-alerts-advisor whenever the developer has not yet confirmed a specific channel.\n',
            content: null,
          },
          {
            name: "twilio-messaging-overview",
            description:
              "Twilio Messaging channel overview and onboarding guide. Covers all channels (SMS, WhatsApp, RCS, Facebook Messenger), the unified Messages API, channel selection guidance, and the recommended setup sequence from first message to production monitoring. Start here before choosing a specific messaging channel.\n",
            content: null,
          },
          {
            name: "twilio-messaging-services",
            description:
              "Create and configure Twilio Messaging Services for production messaging. Covers sender pools, geo-match, sticky sender, message scheduling, compliance toolkit, SMS pumping protection, link shortening, and intelligent alerts. Use this skill when setting up production-ready messaging infrastructure.\n",
            content: null,
          },
          {
            name: "twilio-messaging-webhooks",
            description:
              "Receive and respond to inbound messages and track outbound delivery status via Twilio webhooks — across SMS, MMS, WhatsApp, and RCS. Covers webhook request parameters, replying with TwiML, validating webhook signatures for security, and handling status callbacks. Use this skill whenever an agent needs to handle incoming messages on any channel or track outbound message delivery in real time.\n",
            content: null,
          },
          {
            name: "twilio-migrate-messaging-to-verify",
            description:
              'Migrate an existing OTP / one-time-passcode flow from the Twilio Programmable Messaging API (self-built: generate code → send SMS → validate) to the Twilio Verify API (managed code generation, delivery, expiry, rate limiting, and Fraud Guard). Covers what Verify replaces, creating a Verify Service, replacing send + check logic, E.164 formatting with Lookup, bring-your-own custom codes, error-code translation, and a safe incremental cutover. Use when a developer is moving OTP/2FA delivery off Programmable Messaging onto Verify, or asks "should I use Verify instead of sending my own SMS codes?".\n',
            content: null,
          },
          {
            name: "twilio-notifications-alerts-advisor",
            description:
              'Planning skill for transactional notifications, alerts, and reminders. Qualifies the developer\'s needs across urgency, channel selection, delivery confirmation, and fallback patterns to recommend the right Twilio notification architecture. Handles both "send shipping updates to customers" and "build a multi-channel alert system with delivery confirmation and fallback."\n',
            content: null,
          },
          {
            name: "twilio-numbers-senders",
            description:
              "Choose the right Twilio number type and sender BEFORE building. Covers phone numbers (local, toll-free, short code, mobile), alphanumeric sender IDs, WhatsApp senders, RCS agents, international availability, and regulatory bundles. Each number type has its own compliance program — choosing wrong means rebuilding. Use this skill first.\n",
            content: null,
          },
          {
            name: "twilio-organizations-setup",
            description:
              "Set up and manage Twilio Organizations for centralized account and user governance. Covers the Organization > Account > Subaccount hierarchy, roles (Owner/Admin/Standard), managed vs independent accounts, domain registration, SSO enforcement, SCIM provisioning, and Organization merging. Use this skill when managing multiple Twilio accounts or users across teams.\n",
            content: null,
          },
          {
            name: "twilio-rcs-messaging",
            description:
              "Send RCS Business Messages via Twilio. Covers compliance onboarding (7-part US process), sender profile setup, sending rich cards and carousels, SMS fallback, device support (Android + iOS 18 caveats), and common errors. Use this skill when building RCS messaging or onboarding an RCS sender.\n",
            content: null,
          },
          {
            name: "twilio-regulatory-compliance-bundles",
            description:
              "Manage regulatory compliance for international phone numbers. Covers what bundles are, which countries require them, how to create End-Users and Supporting Documents, evaluate and submit bundles, fix evaluation failures, update bundles when regulations change, and ISV multi-account patterns. Use this skill when provisioning numbers outside the US.\n",
            content: null,
          },
          {
            name: "twilio-reliability-patterns",
            description:
              "Handle rate limits, retries, and failures when building on Twilio at scale. Covers 429 exponential backoff with jitter, per-number throughput limits, StatusCallback resilience, thin-receiver pattern, and fallback chains. Use this skill whenever sending messages or making calls at volume, or when building production-grade Twilio integrations.\n",
            content: null,
          },
          {
            name: "twilio-security-api-auth",
            description:
              "Choose the right Twilio authentication method and implement it correctly. Covers Auth Token (testing only), API Keys (production standard), OAuth2 client_credentials (time-limited bearer tokens), Access Tokens (client-side SDKs), and test credentials. Use this skill before making any Twilio API calls in production.\n",
            content: null,
          },
          {
            name: "twilio-security-compliance-hipaa",
            description:
              "Configure Twilio accounts for HIPAA compliance. Covers BAA requirements, HIPAA Project designation (self-service and support), eligible services list, per-product requirements (Voice, SMS, ConversationRelay, Conversation Intelligence, Flex, Verify), message redaction, and what is NOT eligible. Use this skill when developers are building healthcare workflows on Twilio.\n",
            content: null,
          },
          {
            name: "twilio-security-hardening",
            description:
              "Secure Twilio applications against common attacks. Covers credential management (API keys vs auth tokens), request validation (webhook signature verification), PCI DSS compliance, HIPAA account requirements, SMS pumping prevention, geo-permissions, and account isolation patterns. Use this skill when developers are building or deploying Twilio apps.\n",
            content: null,
          },
          {
            name: "twilio-send-message",
            description:
              'Send messages via Twilio\'s Programmable Messaging API across all channels — SMS, MMS, RCS, and WhatsApp. Covers text messages, media, rich content (cards, carousels, buttons), template-based sends, Messaging Services, status callbacks, and WhatsApp\'s 24-hour service window. Use when the user wants to send a message — whether they say "send SMS", "text message", "branded message", "rich message", "WhatsApp message", "RCS message", "notification", or "alert". For picking the right channel for a use case, first consult twilio-messaging-channel-advisor.\n',
            content: null,
          },
          {
            name: "twilio-sms-isv-setup",
            description:
              "Best practices for ISVs (Independent Software Vendors) building SMS features into multi-tenant SaaS platforms using Twilio. Covers customer onboarding for A2P and toll-free compliance, subaccount architecture, sender management, billing patterns, and common ISV pitfalls. Use this when building SMS capabilities that your customers will use to message their end users.\n",
            content: null,
          },
          {
            name: "twilio-sms-send-message",
            description:
              'SMS and MMS deep-dive reference. Covers SMS-specific error codes, message filtering troubleshooting ("Messages Being Filtered or Blocked?" diagnostic checklist), MMS media support (US/CA/AU only), and SMS pumping indicators. For sending SMS, use twilio-send-message instead. Use this skill only when debugging SMS delivery issues or needing SMS-specific details not in the consolidated send skill.\n',
            content: null,
          },
          {
            name: "twilio-studio-flows",
            description:
              "Build and deploy Twilio Studio flows — visual IVR, SMS/WhatsApp, and conversation automation — by authoring the flow definition JSON and managing it through the Studio REST API. Covers the flow envelope, widgets, transitions, Liquid templating, the draft/published lifecycle, and when to use Studio vs. custom TwiML/code. Use this skill to create, validate, deploy, or update a Studio flow programmatically.\n",
            content: null,
          },
          {
            name: "twilio-taskrouter-routing",
            description:
              "Route tasks to agents using Twilio TaskRouter. Covers Workers, Task Queues, Workflows, Reservations, skills-based routing, and common gotchas (hyphen attributes, HAS operator, reservation cascade). Use this skill for any multi-agent contact center, support queue, or AI agent escalation routing.\n",
            content: null,
          },
          {
            name: "twilio-verify-send-otp",
            description:
              "Send and verify one-time passcodes (OTPs) via Twilio Verify over SMS (auto-upgraded to RCS where supported), voice, email, or WhatsApp. Covers creating a Verify Service, sending tokens, checking submitted codes, automatic WhatsApp-to-SMS fallback, and service configuration. TOTP is supported via the Factors API (a separate family from channel-based OTP). Use this skill to add phone or email verification or two-factor authentication to any application.\n",
            content: null,
          },
          {
            name: "twilio-voice-conversation-relay",
            description:
              "Build AI-powered voice agents using Twilio ConversationRelay. Handles real-time speech recognition (ASR), text-to-speech (TTS), and bidirectional audio streaming via WebSocket. Covers TwiML setup, WebSocket message types, LLM integration, streaming responses, and voice provider configuration. Use this skill to build voice bots, IVR replacements, or real-time AI voice assistants on Twilio calls.\n",
            content: null,
          },
          {
            name: "twilio-voice-outbound-calls",
            description:
              "Make outbound phone calls via Twilio's Programmable Voice REST API. Covers the full voice platform: calls.create(), answering machine detection (AMD), conference-based agent bridging, call recording, status tracking, and SIP Trunking. Use this skill for outbound calls, sales dialers, or when asking what voice APIs are available.\n",
            content: null,
          },
          {
            name: "twilio-voice-twiml",
            description:
              "Build voice call logic using TwiML (Twilio Markup Language). Covers the core verbs (Say, Play, Gather, Dial, Record, Conference), generating TwiML with Python and Node.js SDKs, and a complete inbound call IVR example. Use this skill to define call behavior for inbound or outbound calls.\n",
            content: null,
          },
          {
            name: "twilio-webhook-architecture",
            description:
              "Design, secure, and operate Twilio webhook endpoints. Covers inbound event handling, status callbacks, signature validation, connection overrides for retry and timeout tuning, local development tunneling, and production hardening. Use this skill whenever an agent needs to receive HTTP callbacks from Twilio for any product -- messaging, voice, verify, or event streams.\n",
            content: null,
          },
          {
            name: "twilio-whatsapp-manage-senders",
            description:
              "Create, configure, and manage WhatsApp Business senders via Twilio's Channels Senders API. Covers programmatic sender registration, profile setup, webhook configuration, sender lifecycle statuses, and ISV flows. Use this skill to register and manage production WhatsApp senders at scale.\n",
            content: null,
          },
          {
            name: "twilio-whatsapp-send-message",
            description:
              "WhatsApp messaging deep-dive reference. Covers the 24-hour service window rules (free-form vs template mode), sandbox setup for testing, template approval workflow, production sender requirements, and WhatsApp-specific error handling. For sending WhatsApp messages, use twilio-send-message instead. Use this skill when setting up WhatsApp for the first time or debugging WhatsApp-specific delivery behavior.\n",
            content: null,
          },
          {
            name: "twilio-sendgrid-account-setup",
            description:
              "Set up a SendGrid account for email delivery. Covers API key creation (SG.-prefix), domain authentication (DKIM/SPF via CNAME records), Single Sender Verification for testing, SDK installation, and the relationship between SendGrid and Twilio credentials. Use before any other SendGrid skill. This skill is for SendGrid only — not the Twilio Email API (comms.twilio.com).\n",
            content: null,
          },
          {
            name: "twilio-sendgrid-deliverability-advisor",
            description:
              "Diagnostic and advisory skill for email deliverability problems. Use when a developer asks why emails are going to spam, not reaching the inbox, getting blocked, bouncing, or how to improve sender reputation — with or without a specified platform. Covers SendGrid-specific tooling: SPF, DKIM, DMARC, BIMI, IP warmup, list hygiene, bounce/spam rate thresholds, and Engagement Quality Score (SEQ). Do NOT use for Twilio Email (comms.twilio.com / Account SID + Auth Token) — use twilio-email-deliverability-advisor instead. Do NOT use for general email sending questions — use twilio-sendgrid-email-send (SendGrid) or twilio-email-deliverability-advisor instead.\n",
            content: null,
          },
          {
            name: "twilio-sendgrid-email-send",
            description:
              "Send transactional and bulk email via the SendGrid v3 Mail Send API. Covers single sends, personalized batch sends with dynamic templates, scheduled sends with cancellation, attachments, and sandbox mode for testing. Use this skill when the caller has a SendGrid API key (SG.-prefix). Do NOT use this skill if the caller is using the Twilio Email API (comms.twilio.com) — that is a separate product with different credentials.\n",
            content: null,
          },
          {
            name: "twilio-sendgrid-email-settings",
            description:
              "Configure SendGrid dynamic templates (Handlebars), tracking settings (opens, clicks, subscriptions), link branding for custom tracking domains, and content types (HTML, plain text, AMP). Use when customizing SendGrid email content, tracking behavior, or branded links. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com).\n",
            content: null,
          },
          {
            name: "twilio-sendgrid-engagement-quality",
            description:
              "Monitor email program health with SendGrid Engagement Quality (SEQ) scores. Covers the SEQ API endpoints, the 5 scoring metrics (engagement recency, open rate, bounce classification, bounce rate, spam rate), eligibility requirements, and interpreting scores for deliverability improvement. Use when diagnosing SendGrid deliverability issues or monitoring sender reputation. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com).\n",
            content: null,
          },
          {
            name: "twilio-sendgrid-inbound-parse",
            description:
              "Receive inbound email via SendGrid Inbound Parse webhook. Covers MX record setup, parsed vs raw mode, handling attachments, and common pitfalls. Use when building email-to-app workflows like support ticket creation or email processing pipelines. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com).\n",
            content: null,
          },
          {
            name: "twilio-sendgrid-suppressions",
            description:
              "Manage SendGrid email suppressions: bounces, blocks, spam reports, invalid emails, global unsubscribes, and ASM suppression groups. Covers when and how to remove suppressions, reputation impact, and category-based unsubscribe management. Use when debugging SendGrid delivery issues or building unsubscribe flows. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com).\n",
            content: null,
          },
          {
            name: "twilio-sendgrid-webhooks",
            description:
              "Track email delivery and engagement via SendGrid Event Webhooks. Covers all 11 event types (delivery + engagement), webhook handler implementation, ECDSA signature verification, batched event processing, and common debugging patterns. Use when building SendGrid delivery tracking, engagement analytics, or bounce handling. Requires a SendGrid API key (SG.-prefix) — not applicable to the Twilio Email API (comms.twilio.com).\n",
            content: null,
          },
        ],
        repository: "twilio/ai",
        path: "",
        commit: "803790a281f0ef11d2928ffb41bc8422237fb434",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60E11GNH7J2ACKB8JY19EZY",
        version: "0.3.2",
        notes: "Connects without sign-in, the server is public",
        createdAt: at("2026-10-28T04:59:20.662Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "typeform",
      displayName: "Typeform",
      description: "Build forms, analyze responses, and manage contacts.",
      maker: {
        name: "Typeform",
        url: "https://developers.typeform.com/developers/get-started/mcp/",
      },
      category: "productivity",
      firstListedAt: at("2026-10-28T04:57:10.310Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60CCRSZJVBWMNYA3YGRXXM8",
      createdAt: at("2026-10-28T04:30:47.562Z"),
      updatedAt: at("2026-10-28T04:57:10.295Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Typeform",
            transport: "http",
            placement: "backend",
            url: "https://api.typeform.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60CCRSZJVBWMNYA3YGRXXM8",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:30:47.652Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "upwork",
      displayName: "Upwork",
      description: "Search talent, post jobs, and manage contracts.",
      maker: { name: "Upwork", url: "https://www.upwork.com/ai/mcp" },
      category: "other",
      firstListedAt: at("2026-10-28T04:57:10.320Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60CERGG6NWZECB746M6JCAM",
      createdAt: at("2026-10-28T04:31:51.563Z"),
      updatedAt: at("2026-10-28T04:57:10.296Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Upwork",
            transport: "http",
            placement: "backend",
            url: "https://mcp.upwork.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60CERGG6NWZECB746M6JCAM",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:31:52.898Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "val-town",
      displayName: "Val Town",
      description:
        "Write, deploy, and debug vals: HTTP endpoints, crons, and email",
      maker: { name: "Val Town", url: "https://www.val.town" },
      category: "deployment",
      firstListedAt: at("2026-10-28T04:57:10.577Z"),
      hasIcon: true,
      stars: 10,
      starsCheckedAt: at("2026-11-18T04:16:10.289Z"),
      version: "0.4.0",
      versionId: "01M5ZEP5TMH7GWM1A8NPE994S0",
      createdAt: at("2026-10-27T19:51:38.330Z"),
      updatedAt: at("2026-10-28T04:57:10.564Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Val Town",
            transport: "http",
            placement: "backend",
            url: "https://api.val.town/v3/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "blob-storage",
            description:
              "Use when a val needs simple key/value persistence — JSON documents, cached responses, uploaded files, or binary assets. Covers the std/blob API, listing and deleting keys, account-global or val scoping, and storage limits.",
            content: null,
          },
          {
            name: "client-side-js",
            description:
              "Use when a val needs to ship JavaScript that runs in the browser — React apps, vanilla DOM scripts, canvas/games, htmx/Alpine, or any client-side module beyond a single inline snippet. Explains how Val Town serves transpiled .ts/.tsx/.jsx modules with no build step, how the browser resolves their imports, and how to load third-party deps.",
            content: null,
          },
          {
            name: "create-skill",
            description:
              "Use when the user wants to persist a preference, skill, or knowledge. Use when it would aid future val development to store a memory of how best to build something.",
            content: null,
          },
          {
            name: "cron-and-intervals",
            description:
              "Use when building a val that runs on a schedule — periodic jobs, recurring tasks, polling, cron jobs, monitoring, alerting. Covers the interval handler signature, cron expressions, the UTC timezone constraint, and the `lastRunAt` pattern for detecting new items since the previous run.",
            content: null,
          },
          {
            name: "email",
            description:
              "Use when a val sends email, receives email, or is triggered by an incoming email. Covers email-type vals (the Email handler shape, attachment limits, the assigned val email address) and sending mail via std/email.",
            content: null,
          },
          {
            name: "http-endpoints",
            description:
              "Use when building an HTTP val — a web endpoint, API route, webhook receiver, or any val that responds to HTTP requests. Covers the handler signature, Hono usage, the endpoint URL, CORS behavior, redirects, and Val Town-specific limitations.",
            content: null,
          },
          {
            name: "oauth",
            description:
              "Use when a val needs to require login with a Val Town account — gating routes behind authentication, identifying the current user, building user-specific dashboards. Covers std/oauth's `oauthMiddleware` and `getOAuthUserData`, the auto-managed `/auth/*` routes, and session behavior. For third-party OAuth providers (Google, GitHub, etc.) see the `third-party-integrations` skill instead.",
            content: null,
          },
          {
            name: "react-ui",
            description:
              "Use when building any val with a user interface — dashboards, web apps, landing pages, forms, admin tools, anything users see in a browser. Covers JSX/React conventions, Twind/Tailwind styling, React version pinning, the view-source link requirement, and what to avoid (template-string HTML, external assets).",
            content: null,
          },
          {
            name: "restricted-access",
            description:
              "Use when a val's HTTP endpoints should not be open to the whole internet — limiting an app to a team, understanding why an endpoint redirects to a login page, letting a webhook through, or identifying which Val Town user is viewing an app. Covers app access (`httpPrivacy`), org grants, bypass tokens for automation, and the `X-Val-Town-User` identity header. For building your own login flow inside a val, see the `oauth` skill instead.",
            content: null,
          },
          {
            name: "sqlite-storage",
            description:
              "Use when a val needs to store structured or relational data. Covers the std/sqlite API, parameterized queries, transactions, and the val-scoped vs organization-scoped database distinction.",
            content: null,
          },
          {
            name: "third-party-integrations",
            description:
              "Use when a val talks to an external service — Slack, Discord, Telegram, Stripe, GitHub, Gmail, Google Sheets, Postgres/Supabase/Upstash/Neon, browser automation (Playwright, Browserbase, Kernel, Steel), web scraping, PDF generation, push notifications, RSS, or any other third-party API. Covers the required workflow (fetch the Val Town guide, get credentials, test, store secrets) and the catalog of available guides.",
            content: null,
          },
        ],
        repository: "val-town/plugins",
        path: "",
        commit: "555ff7492c9c70ada2c4e9b66d7dea9367d7ce71",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Val Town plugin. Then read this project's repositories to see how it uses Val Town: which vals it deploys, the HTTP endpoints, crons, and email handlers it relies on, and where their code lives. Propose the automation below adapted to what you found, created switched off, and explain it in one line. Drop it if the project doesn't run vals, and say why.",
      automations: [
        {
          name: "Weekly val error review",
          purpose:
            "Read the week's logs of this project's vals and trace failures to their code",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the Val Town plugin to read the logs of this project's vals for the past seven days. Group errors by val and message, find the code that throws each, and suggest a fix. If every val ran cleanly, say so in one line.",
        },
      ],
      starters: [
        "Deploy this webhook handler as an HTTP val",
        "Show the latest errors from our vals and the code behind them",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEP5TMH7GWM1A8NPE994S0",
        version: "0.4.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:51:38.737Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "vercel",
      displayName: "Vercel",
      description: "Inspect projects, deployments, and build failures.",
      category: "deployment",
      featuredRank: 3,
      hasIcon: true,
      version: "0.50.0",
      versionId: "01M49GK2703QWWE8ZTK0M8PX14",
      createdAt: at("2026-10-06T21:05:54.142Z"),
      updatedAt: at("2026-10-27T16:27:22.389Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Vercel",
            transport: "http",
            placement: "backend",
            url: "https://mcp.vercel.com",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "access-protected-vercel-deployment",
            description:
              "Access and test Vercel deployments protected by Vercel Authentication, SSO, or Deployment Protection. Use when curl, agent-browser, Playwright, or another automated request reaches a Vercel login or protection page; when a protected preview or production URL returns 401 or 403; when TRUSTED_SOURCES_ENVIRONMENT_MISMATCH appears; or when choosing between `vercel curl` and the `x-vercel-trusted-oidc-idp-token` header.",
            content: null,
          },
          {
            name: "ai-gateway",
            description:
              "Vercel AI Gateway guidance for setup, model discovery, authentication, routing, fallbacks, BYOK, budgets, spend reporting, observability, compatible APIs, and coding-agent configuration. Use when adding AI Gateway to an app, migrating provider calls, choosing models or providers, debugging gateway requests, or running `vercel ai-gateway` commands.",
            content: null,
          },
          {
            name: "ai-sdk",
            description:
              "Vercel AI SDK expert guidance. Use when building AI-powered features — chat interfaces, text generation, structured output, tool calling, agents, MCP integration, streaming, embeddings, reranking, image generation, or working with any LLM provider.",
            content: null,
          },
          {
            name: "auth",
            description:
              "Authentication integration guidance — Clerk (native Vercel Marketplace), Descope, and Auth0 setup for Next.js applications, plus Sign in with Vercel, Vercel Passport, and Vercel KMS. Covers proxy.ts auth patterns, sign-in/sign-up flows, and Marketplace provisioning. Use when implementing user authentication or protecting deployments.",
            content: null,
          },
          {
            name: "bootstrap",
            description:
              "Project bootstrapping orchestrator for repos that depend on Vercel-linked resources (databases, auth, and managed integrations). Use when setting up or repairing a repository so linking, environment provisioning, env pulls, and first-run db/dev commands happen in the correct safe order.",
            content: null,
          },
          {
            name: "build-agents",
            description:
              "Default guidance for building AI agents. Use for generic requests to build, create, scaffold, design, architect, or implement an AI agent, agent app, tool-calling agent, durable agent, multi-agent system, or scheduled agent.",
            content: null,
          },
          {
            name: "cdn-caching",
            description:
              "Debug Vercel CDN caching — cache hit rate, stale content, revalidation behavior, ISR + PPR, per-request cache reasons (cacheReason) and PPR state (ppr_state), and costs.",
            content: null,
          },
          {
            name: "chat-sdk",
            description:
              "Vercel Chat SDK expert guidance. Use when building multi-platform chat bots — Slack, Telegram, Microsoft Teams, Discord, Google Chat, GitHub, Linear — with a single codebase. Covers the Chat class, adapters, threads, messages, cards, modals, streaming, state management, and webhook setup.",
            content: null,
          },
          {
            name: "create-a-backend",
            description:
              "Backend architecture guidance. Use when planning, building, or migrating an API or backend; choosing between Functions, Services, containers, Workflow, Queues, and Marketplace databases; or selecting a supported backend framework or runtime.",
            content: null,
          },
          {
            name: "custom-metrics",
            description:
              "Emit and query Vercel Custom Metrics. Use when instrumenting application or business measurements in Vercel Functions, using metric() from @vercel/functions, choosing metric names and attributes, or querying emitted values with vc metrics.",
            content: null,
          },
          {
            name: "deployments-cicd",
            description:
              "Vercel deployment and CI/CD expert guidance. Use when deploying, promoting, rolling back, inspecting deployments, building with --prebuilt, or configuring CI workflow files for Vercel.",
            content: null,
          },
          {
            name: "env-vars",
            description:
              "Vercel environment variable expert guidance. Use when working with .env files, vercel env commands, OIDC tokens, or managing environment-specific configuration.",
            content: null,
          },
          {
            name: "eve",
            description:
              "eve framework guidance for durable AI agents and agent-powered applications. Use when creating, editing, or debugging an eve project, when the user explicitly asks for eve, or when the build-agents skill has selected eve as the default framework. Covers eve's filesystem-first runtime, durable sessions, tools, skills, connections, channels, sandboxes, subagents, schedules, evals, frontend clients, and Agent Runs observability. Do not use for incidental agent mentions, generic agent-building prompts, or established non-eve stacks unless the user asks for comparison or migration.",
            content: null,
          },
          {
            name: "flags-sdk",
            description:
              "Set up and use feature flags and A/B tests with the Flags SDK (`flags` npm package) and Vercel Flags. Use when installing or configuring the SDK, adding a new or existing flag, wiring `vercelAdapter` (OIDC or SDK keys), declaring flags with `flag()`, using the `vercel flags` CLI (create, inspect, list, enable, disable, set, update, split, rollout, rules, segments, use-targeting, evaluations, versions, open, archive, unarchive, rm, sdk-keys, override, prepare), setting up providers/adapters (Vercel, Statsig, LaunchDarkly, PostHog, GrowthBook, Global Config, OpenFeature, Split, Flagsmith, Reflag, Optimizely, or custom), precompute, `identify`/`dedupe`, Flags Explorer/Toolbar, Next.js or SvelteKit, or encrypting flag values. Triggers: feature flags, feature gates, A/B testing, experimentation, gradual rollout, traffic split, targeting rules, flag overrides, precompute, Flags Explorer, Vercel Flags, vercel flags CLI, `flags/next`, `flags/sveltekit`, `flags/react`, `@flags-sdk/*`.",
            content: null,
          },
          {
            name: "knowledge-update",
            description:
              "Corrects outdated LLM knowledge about the Vercel platform and introduces new products. Injected at session start.",
            content: null,
          },
          {
            name: "marketplace",
            description:
              "Vercel Marketplace expert guidance — discovering, installing, and managing third-party integrations via the `vercel integration` CLI. Use when building any app that needs an external capability without a dedicated skill — commerce (stores, storefronts, selling products), payments (checkout, subscriptions, billing), observability/monitoring, messaging/email, search, or CMS — or when discovering, installing, or managing integrations.",
            content: null,
          },
          {
            name: "microfrontends",
            description:
              "Guide for building, configuring, and deploying microfrontends on Vercel. Use this skill when the user mentions microfrontends, multi-zones, splitting an app across teams, independent deployments, cross-app routing, incremental migration, composing multiple frontends under one domain, microfrontends.json, @vercel/microfrontends, the microfrontends local proxy, or path-based routing between Vercel projects. Also use when the user asks about shared layouts across projects, navigation between microfrontends, fallback environments, asset prefixes, or feature flag controlled routing.",
            content: null,
          },
          {
            name: "next-cache-components",
            description:
              "Next.js 16 Cache Components guidance — PPR, use cache directive, cacheLife, cacheTag, updateTag, and migration from unstable_cache. Use when implementing partial prerendering, caching strategies, or migrating from older Next.js cache patterns.",
            content: null,
          },
          {
            name: "next-forge",
            description:
              "next-forge expert guidance — production-grade Turborepo monorepo SaaS starter by Vercel. Use when working in a next-forge project, scaffolding with `npx next-forge init`, or editing @repo/* workspace packages.",
            content: null,
          },
          {
            name: "next-upgrade",
            description:
              "Upgrade Next.js to the latest version following official migration guides and codemods. Use when upgrading Next.js versions, running codemods, or migrating between major releases.",
            content: null,
          },
          {
            name: "nextjs",
            description:
              "Next.js App Router expert guidance. Use when building, debugging, or architecting Next.js applications — routing, Server Components, Server Actions, Cache Components, layouts, middleware/proxy, data fetching, rendering strategies, and deployment on Vercel.",
            content: null,
          },
          {
            name: "queues",
            description:
              "Vercel Queues guidance — durable topics with at-least-once delivery, independent consumer groups, retries, delays, and idempotency keys via @vercel/queue (JS) or vercel-queue (Python). Use when deferring background work, buffering traffic, fanning out events, or choosing between Queues and Workflows.",
            content: null,
          },
          {
            name: "react-best-practices",
            description:
              "React best-practices reviewer for TSX files. Triggers after editing multiple TSX components to run a condensed quality checklist covering component structure, hooks usage, accessibility, performance, and TypeScript patterns.",
            content: null,
          },
          {
            name: "routing-middleware",
            description:
              "Vercel Routing Middleware guidance — request interception before cache, rewrites, redirects, personalization. Works with any framework. Supports Edge, Node.js, and Bun runtimes. Use when intercepting requests at the platform level.",
            content: null,
          },
          {
            name: "runtime-cache",
            description:
              "Vercel Runtime Cache API guidance — ephemeral per-region key-value cache with tag-based invalidation. Shared across Functions, Routing Middleware, and Builds. Use when implementing caching strategies beyond framework-level caching.",
            content: null,
          },
          {
            name: "shadcn",
            description:
              "shadcn/ui expert guidance — CLI, component installation, composition patterns, custom registries, theming, Tailwind CSS integration, and high-quality interface design. Use when initializing shadcn, adding components, composing product UI, building custom registries, configuring themes, or troubleshooting component issues.",
            content: null,
          },
          {
            name: "turbopack",
            description:
              "Turbopack expert guidance. Use when configuring the Next.js bundler, optimizing HMR, debugging build issues, or understanding the Turbopack vs Webpack differences.",
            content: null,
          },
          {
            name: "vercel-agent",
            description:
              "Vercel Agent guidance — dashboard and Slack chat, code review, production investigation, approved actions, and product installation. Use when configuring or working with Vercel's AI assistant.",
            content: null,
          },
          {
            name: "vercel-cli",
            description:
              "Vercel CLI expert guidance. Use when deploying, managing environment variables, linking projects, viewing logs, querying metrics, managing domains, managing feature flags with vercel flags, or interacting with the Vercel platform from the command line.",
            content: null,
          },
          {
            name: "vercel-connect",
            description:
              "Vercel Connect expert guidance — securely obtain scoped OAuth tokens for third-party services (Slack, GitHub, MCP servers, OAuth, Snowflake) on behalf of apps or users via Vercel OIDC. Use when wiring up third-party API access, connecting to MCP servers, sending Slack messages, accessing GitHub APIs, receiving webhook events from Slack/Linear/GitHub and forwarding them to your agents and apps, or building eve agent connections.",
            content: null,
          },
          {
            name: "vercel-firewall",
            description:
              "Vercel Firewall expert guidance — automatic DDoS mitigation, the Vercel WAF (custom rules, IP blocking, managed rulesets, rate limiting), Attack Mode, system bypass, bot management, and the `vercel firewall` CLI. Use when configuring platform-level security, responding to attacks, or staging firewall rules.",
            content: null,
          },
          {
            name: "vercel-functions",
            description:
              "Vercel Functions expert guidance — Node.js/Bun/Python runtimes, Fluid Compute, long-duration (30 min) functions, large functions (5 GB bundles), Docker/OCI container images, plan limits, streaming, WebSockets, and Cron Jobs. Use when configuring, debugging, or optimizing server-side code running on Vercel.",
            content: null,
          },
          {
            name: "vercel-sandbox",
            description:
              "Vercel Sandbox guidance — ephemeral Firecracker microVMs for running untrusted code safely. Supports AI agents, code generation, and experimentation. Use when executing user-generated or AI-generated code in isolation.",
            content: null,
          },
          {
            name: "vercel-services",
            description:
              "Configure and troubleshoot Vercel Services for multiple frontends and backends in one project. Use when composing a polyglot or multi-service application on one Vercel deployment; defining the `services` key, service-targeted rewrites, or service bindings in `vercel.json`; or running all services with `vercel dev`.",
            content: null,
          },
          {
            name: "vercel-storage",
            description:
              "Vercel storage expert guidance — Blob, Global Config (formerly Edge Config), and Marketplace storage (Neon Postgres, Upstash Redis). Use when choosing, configuring, or using data storage with Vercel applications.",
            content: null,
          },
          {
            name: "verification",
            description:
              "Full-story verification — infers what the user is building, then verifies the complete flow end-to-end: browser → API → data → response. Triggers on dev server start and 'why isn't this working' signals.",
            content: null,
          },
          {
            name: "workflow",
            description:
              "Vercel Workflow SDK expert guidance. Use when building durable workflows, long-running tasks, API routes or agents that need pause/resume, retries, step-based execution, or crash-safe orchestration with Vercel Workflow.",
            content: null,
          },
        ],
        repository: "vercel/vercel-plugin",
        path: "",
        commit: "882e66c2698689324c341b7bb8fd8beb92c27bf6",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M49GK2703QWWE8ZTK0M8PX14",
        version: "0.50.0",
        notes: null,
        createdAt: at("2026-10-06T21:05:54.553Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "webflow",
      displayName: "Webflow",
      description:
        "Manage Webflow sites, CMS collections, pages, and publishing",
      maker: { name: "Webflow", url: "https://webflow.com" },
      accent: "#166FF5",
      category: "design",
      firstListedAt: at("2026-10-28T04:57:10.377Z"),
      hasIcon: true,
      stars: 142,
      starsCheckedAt: at("2026-11-18T04:16:10.290Z"),
      version: "2.0.0",
      versionId: "01M5ZEP7ARP7JV934G15T4553S",
      createdAt: at("2026-10-27T19:51:39.874Z"),
      updatedAt: at("2026-10-28T04:57:10.354Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Webflow",
            transport: "http",
            placement: "backend",
            url: "https://mcp.webflow.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: null,
        path: "",
        commit: "d202362ea3eb431f31389dc69ad95f5ee7597833",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Webflow plugin. Then read this project's repositories to see how it uses Webflow: which sites it manages, its CMS collections, any Code Components or DevLink exports, and how content is published. Propose the automations below adapted to what you found, created switched off, and explain each in one line. Drop any automation for a part of Webflow the project doesn't use, and say why.",
      automations: [
        {
          name: "Weekly site health audit",
          purpose:
            "Check pages and CMS items for broken links, missing SEO fields, and oversized assets",
          trigger: { type: "schedule", cron: "0 9 * * 1" },
          prompt:
            "Once a week, use the Webflow plugin to audit this project's sites. Report pages and CMS items with broken links, missing titles or meta descriptions, missing alt text, and oversized images, with the fix for each. If everything passes, say so in one line.",
        },
      ],
      starters: [
        "List our Webflow sites and the CMS collections in each",
        "Find CMS items with missing SEO fields and draft the missing text",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEP7ARP7JV934G15T4553S",
        version: "2.0.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:51:40.263Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "webull",
      displayName: "Webull",
      description:
        "View accounts, positions, orders, watchlists, and market data.",
      maker: {
        name: "Webull",
        url: "https://developer.webull.com/apis/docs/AI-friendly-Resources/mcp/",
      },
      category: "payments",
      firstListedAt: at("2026-10-28T04:57:10.839Z"),
      hasIcon: true,
      version: "1.0.1",
      versionId: "01M60CFFW2SFZD0KXBN43X66KG",
      createdAt: at("2026-10-28T04:32:16.749Z"),
      updatedAt: at("2026-10-28T04:57:10.832Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Webull",
            transport: "http",
            placement: "backend",
            url: "https://api.webull.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60CFFW2SFZD0KXBN43X66KG",
        version: "1.0.1",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:32:16.787Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "workable",
      displayName: "Workable",
      description: "Search candidates, move pipelines, and manage HR records.",
      maker: {
        name: "Workable",
        url: "https://workable.readme.io/reference/workable-mcp-server",
      },
      category: "other",
      firstListedAt: at("2026-10-28T04:57:10.801Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60CFTJBRPCXDTY44J9KYB0H",
      createdAt: at("2026-10-28T04:32:27.706Z"),
      updatedAt: at("2026-10-28T04:57:10.791Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Workable",
            transport: "http",
            placement: "backend",
            url: "https://mcp.workable.com/mcp",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60CFTJBRPCXDTY44J9KYB0H",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:32:27.728Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "xero",
      displayName: "Xero",
      description: "Read and write invoices, contacts, reports, and payroll.",
      maker: {
        name: "Xero",
        url: "https://github.com/XeroAPI/xero-mcp-server",
      },
      category: "payments",
      firstListedAt: at("2026-10-28T04:57:10.808Z"),
      hasIcon: true,
      version: "1.0.0",
      versionId: "01M60CGR6CV9ZPBQ44Q5Z7HQFQ",
      createdAt: at("2026-10-28T04:32:58.050Z"),
      updatedAt: at("2026-10-28T04:57:10.803Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Xero",
            transport: "stdio",
            placement: "machine",
            url: null,
            command: "npx",
            auth: "none",
            connection: "organization",
            scopes: [],
            secrets: ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET"],
          },
        ],
        skills: [],
        repository: "cursor/plugins",
        path: "",
        commit: "c742dd61706fbacc1b95f1a20b7b988cf096ce6c",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [
      new ExploreVersion({
        id: "01M60CGR6CV9ZPBQ44Q5Z7HQFQ",
        version: "1.0.0",
        notes: "Synced at c742dd6",
        createdAt: at("2026-10-28T04:32:58.065Z"),
      }),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "zapier",
      displayName: "Zapier",
      description:
        "Run actions in thousands of apps through your Zapier account",
      maker: { name: "Zapier", url: "https://zapier.com" },
      accent: "#FF5102",
      category: "docs",
      firstListedAt: at("2026-10-28T04:57:10.805Z"),
      hasIcon: true,
      stars: 460,
      starsCheckedAt: at("2026-11-18T04:15:56.768Z"),
      version: "1.0.0",
      versionId: "01M5ZEP9KAC5G0F5NNSNVPMZ5Y",
      createdAt: at("2026-10-27T19:51:42.186Z"),
      updatedAt: at("2026-10-28T04:57:10.799Z"),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [
          {
            displayName: "Zapier",
            transport: "http",
            placement: "backend",
            url: "https://mcp.zapier.com/api/v1/connect",
            command: null,
            auth: "oauth",
            connection: "organization",
            scopes: [],
            secrets: [],
          },
        ],
        skills: [
          {
            name: "zapier-demo",
            description:
              'Walk a new user through setting up their first Zapier action and running it live — the smallest possible win. Asks what app they use, recommends one read action to enable, guides them to mcp.zapier.com to add it, then demonstrates it working in the same chat. Use when the user asks "show me how Zapier works", "set up my first action", "give me a quick demo", "I want to try it", "what\'s the fastest way to see this work", "minimal setup", "hello world", or "smallest example".',
            content: null,
          },
          {
            name: "zapier-explore",
            description:
              'Explore what Zapier MCP can do for the user — interview them about their role and the apps they live in, suggest specific use cases as on-demand prompts, then walk them through enabling the actions to make those use cases real. The natural next step after `zapier-demo`. Use when the user asks "what else can Zapier do for me", "set up more tools", "add a starter pack for my role", "what should I enable next", "suggest workflows", "help me figure out what to do with Zapier", "I don\'t know where to start", or "give me Zapier examples".',
            content: null,
          },
          {
            name: "zapier-onboard",
            description:
              'Onboard a new user to Zapier MCP — introduce what it can do, walk through authentication, and route into the right flow based on the state of their setup. Use when getting started, troubleshooting connection issues, or when the user asks "what is Zapier MCP", "how do I get started with Zapier", "set me up", "what can I do with Zapier", or "tell me about Zapier".',
            content: null,
          },
          {
            name: "zapier-status",
            description:
              'Check the health of your Zapier MCP setup. Three modes — health check (dashboard view), audit (find waste and duplicates), diagnose (systematic troubleshooting). Use when asking "is my MCP working?", "check my tools", "audit my setup", "what\'s broken?", or "zapier status".',
            content: null,
          },
        ],
        repository: "zapier/zapier-mcp",
        path: "",
        commit: "5360f152b96735712e5f925ad728732cb86888df",
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: {
      prompt:
        "Install the Zapier plugin. Then read this project's repositories to see where its work touches outside apps such as email, spreadsheets, CRMs, or calendars. As a first task, list the actions enabled in the connected Zapier account, say which of them this project's workflows could use, and suggest in one line each the actions worth enabling next.",
      automations: [],
      starters: [
        "List the Zapier actions I have enabled and what each can do",
        "Create a calendar event for next week's release review through Zapier",
      ],
    },
    versions: [
      new ExploreVersion({
        id: "01M5ZEP9KAC5G0F5NNSNVPMZ5Y",
        version: "1.0.0",
        notes: "First listing in Explore, at the pinned commit.",
        createdAt: at("2026-10-27T19:51:42.590Z"),
      }),
    ],
  }),

  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "debugging-playbook",
      displayName: "Debugging Playbook",
      description:
        "Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, narrowing, and fixing.",
      maker: { name: "Alex Morgan" },
      repository: "acme/skills",
      stars: 12_480,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_sample_debugging_100",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "debugging-playbook",
        description: "Debug hard bugs with a tight feedback loop",
        files: [
          {
            path: "agents/openai.yaml",
            content:
              "name: debugging-playbook\nmodel: default\ntools: []\nversion: 1",
          },
          { path: "scripts/repro-loop.template.sh", content: reproLoop },
          { path: "SKILL.md", content: skillMarkdown },
        ],
        starters: [
          "Find why the checkout test fails only on CI",
          "Track down the 3x slowdown on the reports page",
        ],
        source: {
          repository: "acme/skills",
          path: "skills/debugging-playbook",
          commit: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
        },
      },
    },
    setup: debuggingSetup,
    versions: [firstListing("skv_sample_debugging_100", "1.0.0", 20)],
  }),
  ...themeListings.map(themeListing),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "diagnosing-bugs",
      displayName: "Diagnosing Bugs",
      description:
        "Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, minimising, and fixing",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_diagnosing-bugs",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "diagnosing-bugs",
        description:
          "Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, minimising, and fixing",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: diagnosing-bugs\ndescription: Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, minimising, and fixing\n---\n\n# Diagnosing Bugs",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/diagnosing-bugs",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_diagnosing-bugs", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "grilling",
      displayName: "Grilling",
      description:
        "Stress-test a plan or design by interviewing you in rounds, with a recommended answer to each question, until nothing is left assumed",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_grilling",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "grilling",
        description:
          "Stress-test a plan or design by interviewing you in rounds, with a recommended answer to each question, until nothing is left assumed",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: grilling\ndescription: Stress-test a plan or design by interviewing you in rounds, with a recommended answer to each question, until nothing is left assumed\n---\n\n# Grilling",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/grilling",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_grilling", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "improve-codebase-architecture",
      displayName: "Improve Codebase Architecture",
      description:
        "Find shallow modules worth deepening, present them as an HTML report, then talk through the one you pick",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_improve-codebase-architecture",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "improve-codebase-architecture",
        description:
          "Find shallow modules worth deepening, present them as an HTML report, then talk through the one you pick",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: improve-codebase-architecture\ndescription: Find shallow modules worth deepening, present them as an HTML report, then talk through the one you pick\n---\n\n# Improve Codebase Architecture",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/improve-codebase-architecture",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_improve-codebase-architecture", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-codebase-design",
      displayName: "Codebase Design",
      description:
        "Design deep modules with a shared vocabulary of interfaces, seams, adapters, and the deletion test",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-codebase-design",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-codebase-design",
        description:
          "Design deep modules with a shared vocabulary of interfaces, seams, adapters, and the deletion test",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mattpocock-codebase-design\ndescription: Design deep modules with a shared vocabulary of interfaces, seams, adapters, and the deletion test\n---\n\n# Codebase Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mattpocock-codebase-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_mattpocock-codebase-design", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-handoff",
      displayName: "Handoff",
      description:
        "Compact the current session into a handoff document so a fresh agent can pick up the work",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-handoff",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-handoff",
        description:
          "Compact the current session into a handoff document so a fresh agent can pick up the work",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mattpocock-handoff\ndescription: Compact the current session into a handoff document so a fresh agent can pick up the work\n---\n\n# Handoff",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mattpocock-handoff",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mattpocock-handoff", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-pr",
      displayName: "PR Body",
      description:
        "Write pull request bodies with a visual summary, before and after evidence, and a merge-danger rating",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-pr",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-pr",
        description:
          "Write pull request bodies with a visual summary, before and after evidence, and a merge-danger rating",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mattpocock-pr\ndescription: Write pull request bodies with a visual summary, before and after evidence, and a merge-danger rating\n---\n\n# PR Body",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mattpocock-pr",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mattpocock-pr", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "setup-pre-commit",
      displayName: "Set Up Pre-Commit Hooks",
      description:
        "Add Husky pre-commit hooks that run lint-staged formatting, type checking, and tests",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_setup-pre-commit",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "setup-pre-commit",
        description:
          "Add Husky pre-commit hooks that run lint-staged formatting, type checking, and tests",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: setup-pre-commit\ndescription: Add Husky pre-commit hooks that run lint-staged formatting, type checking, and tests\n---\n\n# Set Up Pre-Commit Hooks",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/setup-pre-commit",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_setup-pre-commit", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "docker-patterns",
      displayName: "Docker Patterns",
      description:
        "Write and review Dockerfiles and Compose stacks for local development, with multi-stage builds and container security",
      maker: { name: "Affaan Mustafa" },
      version: "1.0.0",
      versionId: "skv_captured_docker-patterns",
      stars: 304700,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "docker-patterns",
        description:
          "Write and review Dockerfiles and Compose stacks for local development, with multi-stage builds and container security",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: docker-patterns\ndescription: Write and review Dockerfiles and Compose stacks for local development, with multi-stage builds and container security\n---\n\n# Docker Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/docker-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_docker-patterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "kubernetes-patterns",
      displayName: "Kubernetes Patterns",
      description:
        "Write and debug production Kubernetes manifests: probes, resource limits, RBAC, autoscaling, and secrets",
      maker: { name: "Affaan Mustafa" },
      version: "1.0.0",
      versionId: "skv_captured_kubernetes-patterns",
      stars: 304700,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "kubernetes-patterns",
        description:
          "Write and debug production Kubernetes manifests: probes, resource limits, RBAC, autoscaling, and secrets",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: kubernetes-patterns\ndescription: Write and debug production Kubernetes manifests: probes, resource limits, RBAC, autoscaling, and secrets\n---\n\n# Kubernetes Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/kubernetes-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_kubernetes-patterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "frontend-design",
      displayName: "Frontend Design",
      description:
        "Give new or reworked UI a deliberate visual direction, with typography and layout that don't read as template defaults",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_frontend-design",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "frontend-design",
        description:
          "Give new or reworked UI a deliberate visual direction, with typography and layout that don't read as template defaults",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: frontend-design\ndescription: Give new or reworked UI a deliberate visual direction, with typography and layout that don't read as template defaults\n---\n\n# Frontend Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/frontend-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_frontend-design", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "internal-comms",
      displayName: "Internal Comms",
      description:
        "Write status reports, leadership updates, newsletters, FAQs, and incident reports in the formats companies use",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_internal-comms",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "internal-comms",
        description:
          "Write status reports, leadership updates, newsletters, FAQs, and incident reports in the formats companies use",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: internal-comms\ndescription: Write status reports, leadership updates, newsletters, FAQs, and incident reports in the formats companies use\n---\n\n# Internal Comms",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/internal-comms",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_internal-comms", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mcp-builder",
      displayName: "MCP Builder",
      description:
        "Build MCP servers in Python or TypeScript with well-designed tools, then write evaluations that test them",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_mcp-builder",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mcp-builder",
        description:
          "Build MCP servers in Python or TypeScript with well-designed tools, then write evaluations that test them",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mcp-builder\ndescription: Build MCP servers in Python or TypeScript with well-designed tools, then write evaluations that test them\n---\n\n# MCP Builder",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mcp-builder",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mcp-builder", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "skill-creator",
      displayName: "Skill Creator",
      description:
        "Write, edit, and benchmark agent skills, and tune their descriptions so they trigger when they should",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_skill-creator",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "skill-creator",
        description:
          "Write, edit, and benchmark agent skills, and tune their descriptions so they trigger when they should",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: skill-creator\ndescription: Write, edit, and benchmark agent skills, and tune their descriptions so they trigger when they should\n---\n\n# Skill Creator",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/skill-creator",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_skill-creator", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "webapp-testing",
      displayName: "Web App Testing",
      description:
        "Test a local web app with Playwright: drive the UI, capture screenshots, and read browser logs",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_webapp-testing",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "webapp-testing",
        description:
          "Test a local web app with Playwright: drive the UI, capture screenshots, and read browser logs",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: webapp-testing\ndescription: Test a local web app with Playwright: drive the UI, capture screenshots, and read browser logs\n---\n\n# Web App Testing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/webapp-testing",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_webapp-testing", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "api-and-interface-design",
      displayName: "API and Interface Design",
      description:
        "Design stable APIs and module boundaries: contract first, consistent errors, validation at the edges, additive change",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_api-and-interface-design",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "api-and-interface-design",
        description:
          "Design stable APIs and module boundaries: contract first, consistent errors, validation at the edges, additive change",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: api-and-interface-design\ndescription: Design stable APIs and module boundaries: contract first, consistent errors, validation at the edges, additive change\n---\n\n# API and Interface Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/api-and-interface-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_api-and-interface-design", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "ci-cd-and-automation",
      displayName: "CI/CD and Automation",
      description:
        "Set up CI pipelines with quality gates, test runners, and deployment strategies, and turn failures into fixes",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_ci-cd-and-automation",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "ci-cd-and-automation",
        description:
          "Set up CI pipelines with quality gates, test runners, and deployment strategies, and turn failures into fixes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: ci-cd-and-automation\ndescription: Set up CI pipelines with quality gates, test runners, and deployment strategies, and turn failures into fixes\n---\n\n# CI/CD and Automation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/ci-cd-and-automation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_ci-cd-and-automation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "code-simplification",
      displayName: "Code Simplification",
      description:
        "Simplify code for clarity while preserving behavior exactly, scoped to what changed",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_code-simplification",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "code-simplification",
        description:
          "Simplify code for clarity while preserving behavior exactly, scoped to what changed",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: code-simplification\ndescription: Simplify code for clarity while preserving behavior exactly, scoped to what changed\n---\n\n# Code Simplification",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/code-simplification",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_code-simplification", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "deprecation-and-migration",
      displayName: "Deprecation and Migration",
      description:
        "Plan the removal of old code and zero-downtime migrations with expand and contract steps and clear sunset paths",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_deprecation-and-migration",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "deprecation-and-migration",
        description:
          "Plan the removal of old code and zero-downtime migrations with expand and contract steps and clear sunset paths",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: deprecation-and-migration\ndescription: Plan the removal of old code and zero-downtime migrations with expand and contract steps and clear sunset paths\n---\n\n# Deprecation and Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/deprecation-and-migration",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_deprecation-and-migration", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "documentation-and-adrs",
      displayName: "Documentation and ADRs",
      description:
        "Record architecture decisions and the reasoning behind them so future engineers and agents can follow the code",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_documentation-and-adrs",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "documentation-and-adrs",
        description:
          "Record architecture decisions and the reasoning behind them so future engineers and agents can follow the code",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: documentation-and-adrs\ndescription: Record architecture decisions and the reasoning behind them so future engineers and agents can follow the code\n---\n\n# Documentation and ADRs",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/documentation-and-adrs",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_documentation-and-adrs", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "git-workflow-and-versioning",
      displayName: "Git Workflow and Versioning",
      description:
        "Keep history clean with atomic commits, clear messages, trunk-based branching, and sensible version bumps",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_git-workflow-and-versioning",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "git-workflow-and-versioning",
        description:
          "Keep history clean with atomic commits, clear messages, trunk-based branching, and sensible version bumps",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: git-workflow-and-versioning\ndescription: Keep history clean with atomic commits, clear messages, trunk-based branching, and sensible version bumps\n---\n\n# Git Workflow and Versioning",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/git-workflow-and-versioning",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_git-workflow-and-versioning", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "spec-driven-development",
      displayName: "Spec-Driven Development",
      description:
        "Write a spec with objectives, scope, and success criteria before coding, and split large work into a capability map",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_spec-driven-development",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "spec-driven-development",
        description:
          "Write a spec with objectives, scope, and success criteria before coding, and split large work into a capability map",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: spec-driven-development\ndescription: Write a spec with objectives, scope, and success criteria before coding, and split large work into a capability map\n---\n\n# Spec-Driven Development",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/spec-driven-development",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_spec-driven-development", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "break-ui",
      displayName: "Break UI",
      description:
        "Stress-test a component with worst-case data like long names and empty lists, and report each break with a fix",
      maker: { name: "Emil Kowalski" },
      version: "1.0.0",
      versionId: "skv_captured_break-ui",
      stars: 57500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "break-ui",
        description:
          "Stress-test a component with worst-case data like long names and empty lists, and report each break with a fix",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: break-ui\ndescription: Stress-test a component with worst-case data like long names and empty lists, and report each break with a fix\n---\n\n# Break UI",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/break-ui",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_break-ui", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "emil-design-eng",
      displayName: "Design Engineering",
      description:
        "Apply a design engineer's approach to UI polish, component details, and when and how to animate",
      maker: { name: "Emil Kowalski" },
      version: "1.0.0",
      versionId: "skv_captured_emil-design-eng",
      stars: 57500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "emil-design-eng",
        description:
          "Apply a design engineer's approach to UI polish, component details, and when and how to animate",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: emil-design-eng\ndescription: Apply a design engineer's approach to UI polish, component details, and when and how to animate\n---\n\n# Design Engineering",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/emil-design-eng",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_emil-design-eng", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "bash-defensive-patterns",
      displayName: "Defensive Bash",
      description:
        "Write robust shell scripts with strict mode, error traps, safe quoting, and reliable cleanup",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_bash-defensive-patterns",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "bash-defensive-patterns",
        description:
          "Write robust shell scripts with strict mode, error traps, safe quoting, and reliable cleanup",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: bash-defensive-patterns\ndescription: Write robust shell scripts with strict mode, error traps, safe quoting, and reliable cleanup\n---\n\n# Defensive Bash",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/bash-defensive-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_bash-defensive-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "changelog-automation",
      displayName: "Changelog Automation",
      description:
        "Generate changelogs and release notes from commits and pull requests in Keep a Changelog format",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_changelog-automation",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "changelog-automation",
        description:
          "Generate changelogs and release notes from commits and pull requests in Keep a Changelog format",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: changelog-automation\ndescription: Generate changelogs and release notes from commits and pull requests in Keep a Changelog format\n---\n\n# Changelog Automation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/changelog-automation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_changelog-automation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dependency-upgrade",
      displayName: "Dependency Upgrade",
      description:
        "Plan major dependency upgrades with compatibility analysis, a staged rollout, and testing",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_dependency-upgrade",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dependency-upgrade",
        description:
          "Plan major dependency upgrades with compatibility analysis, a staged rollout, and testing",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dependency-upgrade\ndescription: Plan major dependency upgrades with compatibility analysis, a staged rollout, and testing\n---\n\n# Dependency Upgrade",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dependency-upgrade",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dependency-upgrade", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "e2e-testing-patterns",
      displayName: "E2E Testing Patterns",
      description:
        "Build reliable end-to-end suites with Playwright or Cypress and track down flaky tests",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_e2e-testing-patterns",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "e2e-testing-patterns",
        description:
          "Build reliable end-to-end suites with Playwright or Cypress and track down flaky tests",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: e2e-testing-patterns\ndescription: Build reliable end-to-end suites with Playwright or Cypress and track down flaky tests\n---\n\n# E2E Testing Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/e2e-testing-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_e2e-testing-patterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "git-advanced-workflows",
      displayName: "Advanced Git Workflows",
      description:
        "Use interactive rebase, cherry-pick, bisect, worktrees, and reflog to clean up history and recover from mistakes",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_git-advanced-workflows",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "git-advanced-workflows",
        description:
          "Use interactive rebase, cherry-pick, bisect, worktrees, and reflog to clean up history and recover from mistakes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: git-advanced-workflows\ndescription: Use interactive rebase, cherry-pick, bisect, worktrees, and reflog to clean up history and recover from mistakes\n---\n\n# Advanced Git Workflows",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/git-advanced-workflows",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_git-advanced-workflows", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "postgresql-table-design",
      displayName: "PostgreSQL Table Design",
      description:
        "Design and review Postgres schemas: data types, constraints, indexing, partitioning, and common gotchas",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_postgresql-table-design",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "postgresql-table-design",
        description:
          "Design and review Postgres schemas: data types, constraints, indexing, partitioning, and common gotchas",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: postgresql-table-design\ndescription: Design and review Postgres schemas: data types, constraints, indexing, partitioning, and common gotchas\n---\n\n# PostgreSQL Table Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/postgresql-table-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_postgresql-table-design", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "postmortem-writing",
      displayName: "Postmortem Writing",
      description:
        "Write blameless postmortems with timelines, root cause analysis, and tracked action items",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_postmortem-writing",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "postmortem-writing",
        description:
          "Write blameless postmortems with timelines, root cause analysis, and tracked action items",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: postmortem-writing\ndescription: Write blameless postmortems with timelines, root cause analysis, and tracked action items\n---\n\n# Postmortem Writing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/postmortem-writing",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_postmortem-writing", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "python-testing-patterns",
      displayName: "Python Testing Patterns",
      description:
        "Build pytest suites with fixtures, parametrization, mocking, and a test-driven workflow",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_python-testing-patterns",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "python-testing-patterns",
        description:
          "Build pytest suites with fixtures, parametrization, mocking, and a test-driven workflow",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: python-testing-patterns\ndescription: Build pytest suites with fixtures, parametrization, mocking, and a test-driven workflow\n---\n\n# Python Testing Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/python-testing-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_python-testing-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sql-optimization-patterns",
      displayName: "SQL Optimization Patterns",
      description:
        "Speed up slow queries with EXPLAIN analysis, indexing strategy, and proven rewrite patterns",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_sql-optimization-patterns",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sql-optimization-patterns",
        description:
          "Speed up slow queries with EXPLAIN analysis, indexing strategy, and proven rewrite patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sql-optimization-patterns\ndescription: Speed up slow queries with EXPLAIN analysis, indexing strategy, and proven rewrite patterns\n---\n\n# SQL Optimization Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sql-optimization-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_sql-optimization-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "typescript-advanced-types",
      displayName: "TypeScript Advanced Types",
      description:
        "Use generics, conditional and mapped types, and template literals to build type-safe utilities",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_typescript-advanced-types",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "typescript-advanced-types",
        description:
          "Use generics, conditional and mapped types, and template literals to build type-safe utilities",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: typescript-advanced-types\ndescription: Use generics, conditional and mapped types, and template literals to build type-safe utilities\n---\n\n# TypeScript Advanced Types",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/typescript-advanced-types",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_typescript-advanced-types", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-cli-with-tokens",
      displayName: "Vercel CLI with Tokens",
      description:
        "Deploy and manage Vercel projects from the CLI with an access token instead of an interactive login",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-cli-with-tokens",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-cli-with-tokens",
        description:
          "Deploy and manage Vercel projects from the CLI with an access token instead of an interactive login",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-cli-with-tokens\ndescription: Deploy and manage Vercel projects from the CLI with an access token instead of an interactive login\n---\n\n# Vercel CLI with Tokens",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-cli-with-tokens",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_vercel-cli-with-tokens", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-composition-patterns",
      displayName: "React Composition Patterns",
      description:
        "Refactor boolean-prop sprawl into compound components, context providers, and flexible component APIs, with React 19 changes",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-composition-patterns",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-composition-patterns",
        description:
          "Refactor boolean-prop sprawl into compound components, context providers, and flexible component APIs, with React 19 changes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-composition-patterns\ndescription: Refactor boolean-prop sprawl into compound components, context providers, and flexible component APIs, with React 19 changes\n---\n\n# React Composition Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-composition-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-composition-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-best-practices",
      displayName: "React Best Practices",
      description:
        "React and Next.js performance rules from Vercel Engineering, ranked by impact from request waterfalls to micro-optimizations",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-best-practices",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-best-practices",
        description:
          "React and Next.js performance rules from Vercel Engineering, ranked by impact from request waterfalls to micro-optimizations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-react-best-practices\ndescription: React and Next.js performance rules from Vercel Engineering, ranked by impact from request waterfalls to micro-optimizations\n---\n\n# React Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-react-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-best-practices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-native-skills",
      displayName: "React Native Best Practices",
      description:
        "Build fast React Native and Expo apps: list performance, animations, native modules, and platform-specific patterns",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-native-skills",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-native-skills",
        description:
          "Build fast React Native and Expo apps: list performance, animations, native modules, and platform-specific patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-react-native-skills\ndescription: Build fast React Native and Expo apps: list performance, animations, native modules, and platform-specific patterns\n---\n\n# React Native Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-react-native-skills",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-native-skills", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-view-transitions",
      displayName: "React View Transitions",
      description:
        "Add page transitions, shared-element animations, and enter and exit motion with React's ViewTransition component",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-view-transitions",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-view-transitions",
        description:
          "Add page transitions, shared-element animations, and enter and exit motion with React's ViewTransition component",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-react-view-transitions\ndescription: Add page transitions, shared-element animations, and enter and exit motion with React's ViewTransition component\n---\n\n# React View Transitions",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-react-view-transitions",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-view-transitions", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "chatgpt-apps",
      displayName: "Apps SDK",
      description:
        "Build and debug OpenAI Apps SDK apps that pair an MCP server with a widget UI",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_chatgpt-apps",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "chatgpt-apps",
        description:
          "Build and debug OpenAI Apps SDK apps that pair an MCP server with a widget UI",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: chatgpt-apps\ndescription: Build and debug OpenAI Apps SDK apps that pair an MCP server with a widget UI\n---\n\n# Apps SDK",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/chatgpt-apps",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_chatgpt-apps", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cli-creator",
      displayName: "CLI Creator",
      description:
        "Build a composable command-line tool from API docs, an OpenAPI spec, curl examples, an SDK, or a script",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_cli-creator",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cli-creator",
        description:
          "Build a composable command-line tool from API docs, an OpenAPI spec, curl examples, an SDK, or a script",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cli-creator\ndescription: Build a composable command-line tool from API docs, an OpenAPI spec, curl examples, an SDK, or a script\n---\n\n# CLI Creator",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cli-creator",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cli-creator", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-best-practices",
      displayName: "Security Best Practices",
      description:
        "Review Python, JavaScript, TypeScript, and Go code against framework-specific security practices and suggest fixes",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_security-best-practices",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-best-practices",
        description:
          "Review Python, JavaScript, TypeScript, and Go code against framework-specific security practices and suggest fixes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: security-best-practices\ndescription: Review Python, JavaScript, TypeScript, and Go code against framework-specific security practices and suggest fixes\n---\n\n# Security Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/security-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_security-best-practices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-ownership-map",
      displayName: "Security Ownership Map",
      description:
        "Map who owns security-sensitive code from git history, find orphaned hotspots, and compute bus factor",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_security-ownership-map",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-ownership-map",
        description:
          "Map who owns security-sensitive code from git history, find orphaned hotspots, and compute bus factor",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: security-ownership-map\ndescription: Map who owns security-sensitive code from git history, find orphaned hotspots, and compute bus factor\n---\n\n# Security Ownership Map",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/security-ownership-map",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_security-ownership-map", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-threat-model",
      displayName: "Security Threat Model",
      description:
        "Write a threat model grounded in the code: trust boundaries, assets, attacker paths, and mitigations",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_security-threat-model",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-threat-model",
        description:
          "Write a threat model grounded in the code: trust boundaries, assets, attacker paths, and mitigations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: security-threat-model\ndescription: Write a threat model grounded in the code: trust boundaries, assets, attacker paths, and mitigations\n---\n\n# Security Threat Model",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/security-threat-model",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_security-threat-model", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloud-logging-query-generation",
      displayName: "Cloud Logging Queries",
      description:
        "Turn plain-language questions into Logging Query Language filters for Cloud Logging when debugging on Google Cloud",
      maker: { name: "Google Cloud" },
      version: "1.0.0",
      versionId: "skv_captured_cloud-logging-query-generation",
      stars: 24400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloud-logging-query-generation",
        description:
          "Turn plain-language questions into Logging Query Language filters for Cloud Logging when debugging on Google Cloud",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloud-logging-query-generation\ndescription: Turn plain-language questions into Logging Query Language filters for Cloud Logging when debugging on Google Cloud\n---\n\n# Cloud Logging Queries",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloud-logging-query-generation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloud-logging-query-generation", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "google-cloud-iam-troubleshooting",
      displayName: "Google Cloud IAM Troubleshooting",
      description:
        "Diagnose and fix IAM access denials on Google Cloud, from capturing the error context to a self-service remediation",
      maker: { name: "Google Cloud" },
      version: "1.0.0",
      versionId: "skv_captured_google-cloud-iam-troubleshooting",
      stars: 24400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "google-cloud-iam-troubleshooting",
        description:
          "Diagnose and fix IAM access denials on Google Cloud, from capturing the error context to a self-service remediation",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: google-cloud-iam-troubleshooting\ndescription: Diagnose and fix IAM access denials on Google Cloud, from capturing the error context to a self-service remediation\n---\n\n# Google Cloud IAM Troubleshooting",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/google-cloud-iam-troubleshooting",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_google-cloud-iam-troubleshooting", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "google-cloud-run-basics",
      displayName: "Cloud Run",
      description:
        "Deploy and manage Cloud Run services, jobs, and worker pools for HTTP apps, scheduled tasks, and background processing",
      maker: { name: "Google Cloud" },
      version: "1.0.0",
      versionId: "skv_captured_google-cloud-run-basics",
      stars: 24400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "google-cloud-run-basics",
        description:
          "Deploy and manage Cloud Run services, jobs, and worker pools for HTTP apps, scheduled tasks, and background processing",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: google-cloud-run-basics\ndescription: Deploy and manage Cloud Run services, jobs, and worker pools for HTTP apps, scheduled tasks, and background processing\n---\n\n# Cloud Run",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/google-cloud-run-basics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_google-cloud-run-basics", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "agent-tool-design",
      displayName: "Agent Tool Design",
      description:
        "Write tool descriptions, schemas, and error messages that agents can route on and recover from",
      maker: { name: "Murat Can Koylan" },
      version: "1.0.0",
      versionId: "skv_captured_agent-tool-design",
      stars: 18400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "agent-tool-design",
        description:
          "Write tool descriptions, schemas, and error messages that agents can route on and recover from",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: agent-tool-design\ndescription: Write tool descriptions, schemas, and error messages that agents can route on and recover from\n---\n\n# Agent Tool Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/agent-tool-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_agent-tool-design", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "context-compression",
      displayName: "Context Compression",
      description:
        "Compress long agent sessions into structured summaries that keep files, decisions, and next steps",
      maker: { name: "Murat Can Koylan" },
      version: "1.0.0",
      versionId: "skv_captured_context-compression",
      stars: 18400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "context-compression",
        description:
          "Compress long agent sessions into structured summaries that keep files, decisions, and next steps",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: context-compression\ndescription: Compress long agent sessions into structured summaries that keep files, decisions, and next steps\n---\n\n# Context Compression",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/context-compression",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_context-compression", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "agentic-actions-auditor",
      displayName: "Agentic Actions Auditor",
      description:
        "Audit GitHub Actions workflows for attacks that reach AI agents running in CI, such as expression injection",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_agentic-actions-auditor",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "agentic-actions-auditor",
        description:
          "Audit GitHub Actions workflows for attacks that reach AI agents running in CI, such as expression injection",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: agentic-actions-auditor\ndescription: Audit GitHub Actions workflows for attacks that reach AI agents running in CI, such as expression injection\n---\n\n# Agentic Actions Auditor",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/agentic-actions-auditor",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_agentic-actions-auditor", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "audit-context-building",
      displayName: "Audit Context Building",
      description:
        "Build a deep understanding of unfamiliar code, what each function assumes and guarantees, before hunting for bugs",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_audit-context-building",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "audit-context-building",
        description:
          "Build a deep understanding of unfamiliar code, what each function assumes and guarantees, before hunting for bugs",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: audit-context-building\ndescription: Build a deep understanding of unfamiliar code, what each function assumes and guarantees, before hunting for bugs\n---\n\n# Audit Context Building",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/audit-context-building",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_audit-context-building", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "differential-review",
      displayName: "Differential Security Review",
      description:
        "Review a PR or diff for security bugs, using git history, blast radius, and test coverage to set the depth",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_differential-review",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "differential-review",
        description:
          "Review a PR or diff for security bugs, using git history, blast radius, and test coverage to set the depth",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: differential-review\ndescription: Review a PR or diff for security bugs, using git history, blast radius, and test coverage to set the depth\n---\n\n# Differential Security Review",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/differential-review",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_differential-review", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "fp-check",
      displayName: "False Positive Check",
      description:
        "Verify a suspected vulnerability with documented evidence and return a true or false positive verdict",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_fp-check",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "fp-check",
        description:
          "Verify a suspected vulnerability with documented evidence and return a true or false positive verdict",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: fp-check\ndescription: Verify a suspected vulnerability with documented evidence and return a true or false positive verdict\n---\n\n# False Positive Check",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/fp-check",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_fp-check", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "modern-python",
      displayName: "Modern Python Tooling",
      description:
        "Set up Python projects with uv, ruff, and ty, and migrate from pip, Poetry, mypy, and black",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_modern-python",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "modern-python",
        description:
          "Set up Python projects with uv, ruff, and ty, and migrate from pip, Poetry, mypy, and black",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: modern-python\ndescription: Set up Python projects with uv, ruff, and ty, and migrate from pip, Poetry, mypy, and black\n---\n\n# Modern Python Tooling",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/modern-python",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_modern-python", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mutation-testing",
      displayName: "Mutation Testing",
      description:
        "Run mutation campaigns, analyze surviving mutants, and find bugs hiding behind weak tests",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_mutation-testing",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mutation-testing",
        description:
          "Run mutation campaigns, analyze surviving mutants, and find bugs hiding behind weak tests",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mutation-testing\ndescription: Run mutation campaigns, analyze surviving mutants, and find bugs hiding behind weak tests\n---\n\n# Mutation Testing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mutation-testing",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mutation-testing", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "property-based-testing",
      displayName: "Property-Based Testing",
      description:
        "Write and debug property-based tests with Hypothesis, fast-check, proptest, and similar tools to cover whole input domains",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_property-based-testing",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "property-based-testing",
        description:
          "Write and debug property-based tests with Hypothesis, fast-check, proptest, and similar tools to cover whole input domains",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: property-based-testing\ndescription: Write and debug property-based tests with Hypothesis, fast-check, proptest, and similar tools to cover whole input domains\n---\n\n# Property-Based Testing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/property-based-testing",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_property-based-testing", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sharp-edges",
      displayName: "Sharp Edges",
      description:
        "Find error-prone APIs, risky defaults, and footgun designs that lead to security mistakes",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_sharp-edges",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sharp-edges",
        description:
          "Find error-prone APIs, risky defaults, and footgun designs that lead to security mistakes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sharp-edges\ndescription: Find error-prone APIs, risky defaults, and footgun designs that lead to security mistakes\n---\n\n# Sharp Edges",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sharp-edges",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sharp-edges", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supply-chain-risk-auditor",
      displayName: "Supply Chain Risk Auditor",
      description:
        "Audit dependencies for known advisories, abandoned upstreams, publisher concentration, and install-time scripts",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_supply-chain-risk-auditor",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supply-chain-risk-auditor",
        description:
          "Audit dependencies for known advisories, abandoned upstreams, publisher concentration, and install-time scripts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: supply-chain-risk-auditor\ndescription: Audit dependencies for known advisories, abandoned upstreams, publisher concentration, and install-time scripts\n---\n\n# Supply Chain Risk Auditor",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/supply-chain-risk-auditor",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_supply-chain-risk-auditor", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "trailofbits-codeql",
      displayName: "CodeQL Scan",
      description:
        "Build a CodeQL database and run data flow and taint analysis to find vulnerabilities across many languages",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_trailofbits-codeql",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "trailofbits-codeql",
        description:
          "Build a CodeQL database and run data flow and taint analysis to find vulnerabilities across many languages",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: trailofbits-codeql\ndescription: Build a CodeQL database and run data flow and taint analysis to find vulnerabilities across many languages\n---\n\n# CodeQL Scan",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/trailofbits-codeql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_trailofbits-codeql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "trailofbits-semgrep",
      displayName: "Semgrep Scan",
      description:
        "Run a Semgrep security scan with the rulesets that fit the project and merge the results into SARIF",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_trailofbits-semgrep",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "trailofbits-semgrep",
        description:
          "Run a Semgrep security scan with the rulesets that fit the project and merge the results into SARIF",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: trailofbits-semgrep\ndescription: Run a Semgrep security scan with the rulesets that fit the project and merge the results into SARIF\n---\n\n# Semgrep Scan",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/trailofbits-semgrep",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_trailofbits-semgrep", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "variant-analysis",
      displayName: "Variant Analysis",
      description:
        "After a bug turns up, hunt the other instances of the same root cause across the codebase and turn it into a query",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_variant-analysis",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "variant-analysis",
        description:
          "After a bug turns up, hunt the other instances of the same root cause across the codebase and turn it into a query",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: variant-analysis\ndescription: After a bug turns up, hunt the other instances of the same root cause across the codebase and turn it into a query\n---\n\n# Variant Analysis",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/variant-analysis",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_variant-analysis", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "analyzing-dotnet-performance",
      displayName: ".NET Performance Anti-Patterns",
      description:
        "Scan .NET code for about 50 performance anti-patterns across async, memory, strings, LINQ, regex, and I/O, ranked by severity",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_analyzing-dotnet-performance",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "analyzing-dotnet-performance",
        description:
          "Scan .NET code for about 50 performance anti-patterns across async, memory, strings, LINQ, regex, and I/O, ranked by severity",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: analyzing-dotnet-performance\ndescription: Scan .NET code for about 50 performance anti-patterns across async, memory, strings, LINQ, regex, and I/O, ranked by severity\n---\n\n# .NET Performance Anti-Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/analyzing-dotnet-performance",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_analyzing-dotnet-performance", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-coverage-analysis",
      displayName: ".NET Coverage Analysis",
      description:
        "Read .NET coverage reports to find partial branches, plateaus, and high-risk CRAP scores, then plan the tests that close them",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_dotnet-coverage-analysis",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-coverage-analysis",
        description:
          "Read .NET coverage reports to find partial branches, plateaus, and high-risk CRAP scores, then plan the tests that close them",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dotnet-coverage-analysis\ndescription: Read .NET coverage reports to find partial branches, plateaus, and high-risk CRAP scores, then plan the tests that close them\n---\n\n# .NET Coverage Analysis",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dotnet-coverage-analysis",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-coverage-analysis", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-microbenchmarking",
      displayName: "BenchmarkDotNet",
      description:
        "Create, run, and interpret BenchmarkDotNet benchmarks, and avoid the setup mistakes that produce misleading numbers",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_dotnet-microbenchmarking",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-microbenchmarking",
        description:
          "Create, run, and interpret BenchmarkDotNet benchmarks, and avoid the setup mistakes that produce misleading numbers",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dotnet-microbenchmarking\ndescription: Create, run, and interpret BenchmarkDotNet benchmarks, and avoid the setup mistakes that produce misleading numbers\n---\n\n# BenchmarkDotNet",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dotnet-microbenchmarking",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-microbenchmarking", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-migrate-nullable-references",
      displayName: "Nullable Reference Migration",
      description:
        "Enable nullable reference types in a C# project and work through the warnings project by project or file by file",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_dotnet-migrate-nullable-references",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-migrate-nullable-references",
        description:
          "Enable nullable reference types in a C# project and work through the warnings project by project or file by file",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dotnet-migrate-nullable-references\ndescription: Enable nullable reference types in a C# project and work through the warnings project by project or file by file\n---\n\n# Nullable Reference Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dotnet-migrate-nullable-references",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_dotnet-migrate-nullable-references",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-test-anti-patterns",
      displayName: ".NET Test Anti-Patterns",
      description:
        "Audit a .NET test file or suite for anti-patterns and get a severity-ranked report of what makes tests flaky or worthless",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_dotnet-test-anti-patterns",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-test-anti-patterns",
        description:
          "Audit a .NET test file or suite for anti-patterns and get a severity-ranked report of what makes tests flaky or worthless",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dotnet-test-anti-patterns\ndescription: Audit a .NET test file or suite for anti-patterns and get a severity-ranked report of what makes tests flaky or worthless\n---\n\n# .NET Test Anti-Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dotnet-test-anti-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-test-anti-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "migrate-xunit-to-xunit-v3",
      displayName: "xUnit v3 Migration",
      description:
        "Migrate .NET test projects from xUnit.net v2 to xunit.v3 and fix the breaking changes",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_migrate-xunit-to-xunit-v3",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "migrate-xunit-to-xunit-v3",
        description:
          "Migrate .NET test projects from xUnit.net v2 to xunit.v3 and fix the breaking changes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: migrate-xunit-to-xunit-v3\ndescription: Migrate .NET test projects from xUnit.net v2 to xunit.v3 and fix the breaking changes\n---\n\n# xUnit v3 Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/migrate-xunit-to-xunit-v3",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_migrate-xunit-to-xunit-v3", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "msbuild-antipatterns",
      displayName: "MSBuild Antipatterns",
      description:
        "Review MSBuild project, props, and targets files against a catalog of antipatterns and get a prioritized list of fixes",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_msbuild-antipatterns",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "msbuild-antipatterns",
        description:
          "Review MSBuild project, props, and targets files against a catalog of antipatterns and get a prioritized list of fixes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: msbuild-antipatterns\ndescription: Review MSBuild project, props, and targets files against a catalog of antipatterns and get a prioritized list of fixes\n---\n\n# MSBuild Antipatterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/msbuild-antipatterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_msbuild-antipatterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "optimizing-ef-core-queries",
      displayName: "EF Core Query Optimization",
      description:
        "Make slow Entity Framework Core queries generate less SQL, use fewer round-trips, and return results faster",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_optimizing-ef-core-queries",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "optimizing-ef-core-queries",
        description:
          "Make slow Entity Framework Core queries generate less SQL, use fewer round-trips, and return results faster",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: optimizing-ef-core-queries\ndescription: Make slow Entity Framework Core queries generate less SQL, use fewer round-trips, and return results faster\n---\n\n# EF Core Query Optimization",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/optimizing-ef-core-queries",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_optimizing-ef-core-queries", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "gemini-api-dev",
      displayName: "Gemini API",
      description:
        "Write code that calls the Gemini API for text, chat, multimodal input, image and speech generation, and function calling",
      maker: { name: "Google" },
      version: "1.0.0",
      versionId: "skv_captured_gemini-api-dev",
      stars: 4500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "gemini-api-dev",
        description:
          "Write code that calls the Gemini API for text, chat, multimodal input, image and speech generation, and function calling",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: gemini-api-dev\ndescription: Write code that calls the Gemini API for text, chat, multimodal input, image and speech generation, and function calling\n---\n\n# Gemini API",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/gemini-api-dev",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_gemini-api-dev", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "eas-update",
      displayName: "EAS Update",
      description:
        "Configure over-the-air JavaScript updates with EAS Update, channels, branches, and runtime versions",
      maker: { name: "Expo" },
      version: "1.0.0",
      versionId: "skv_captured_eas-update",
      stars: 4200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "eas-update",
        description:
          "Configure over-the-air JavaScript updates with EAS Update, channels, branches, and runtime versions",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: eas-update\ndescription: Configure over-the-air JavaScript updates with EAS Update, channels, branches, and runtime versions\n---\n\n# EAS Update",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/eas-update",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_eas-update", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "eas-workflows",
      displayName: "EAS Workflows",
      description:
        "Write EAS workflow YAML for Expo builds, tests, submissions, and deployment pipelines",
      maker: { name: "Expo" },
      version: "1.0.0",
      versionId: "skv_captured_eas-workflows",
      stars: 4200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "eas-workflows",
        description:
          "Write EAS workflow YAML for Expo builds, tests, submissions, and deployment pipelines",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: eas-workflows\ndescription: Write EAS workflow YAML for Expo builds, tests, submissions, and deployment pipelines\n---\n\n# EAS Workflows",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/eas-workflows",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_eas-workflows", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "expo-native-ui",
      displayName: "Expo Native UI",
      description:
        "Make Expo screens feel native with platform styling, semantic colors, SF Symbols, native controls, and responsive layout",
      maker: { name: "Expo" },
      version: "1.0.0",
      versionId: "skv_captured_expo-native-ui",
      stars: 4200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "expo-native-ui",
        description:
          "Make Expo screens feel native with platform styling, semantic colors, SF Symbols, native controls, and responsive layout",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: expo-native-ui\ndescription: Make Expo screens feel native with platform styling, semantic colors, SF Symbols, native controls, and responsive layout\n---\n\n# Expo Native UI",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/expo-native-ui",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_expo-native-ui", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "expo-router",
      displayName: "Expo Router",
      description:
        "Build navigation in Expo apps with file-based routes, native stacks and tabs, modals, headers, and link previews",
      maker: { name: "Expo" },
      version: "1.0.0",
      versionId: "skv_captured_expo-router",
      stars: 4200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "expo-router",
        description:
          "Build navigation in Expo apps with file-based routes, native stacks and tabs, modals, headers, and link previews",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: expo-router\ndescription: Build navigation in Expo apps with file-based routes, native stacks and tabs, modals, headers, and link previews\n---\n\n# Expo Router",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/expo-router",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_expo-router", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "amazon-dynamodb",
      displayName: "Amazon DynamoDB",
      description:
        "Design, review, and debug DynamoDB data layers by listing access patterns first, then modeling keys and indexes to fit",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_amazon-dynamodb",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "amazon-dynamodb",
        description:
          "Design, review, and debug DynamoDB data layers by listing access patterns first, then modeling keys and indexes to fit",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: amazon-dynamodb\ndescription: Design, review, and debug DynamoDB data layers by listing access patterns first, then modeling keys and indexes to fit\n---\n\n# Amazon DynamoDB",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/amazon-dynamodb",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_amazon-dynamodb", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-cdk",
      displayName: "AWS CDK",
      description:
        "Author, deploy, and troubleshoot AWS infrastructure with CDK in TypeScript or Python: stack layout, constructs, and bootstrapping",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_aws-cdk",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-cdk",
        description:
          "Author, deploy, and troubleshoot AWS infrastructure with CDK in TypeScript or Python: stack layout, constructs, and bootstrapping",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: aws-cdk\ndescription: Author, deploy, and troubleshoot AWS infrastructure with CDK in TypeScript or Python: stack layout, constructs, and bootstrapping\n---\n\n# AWS CDK",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/aws-cdk",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-cdk", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-cloudformation",
      displayName: "AWS CloudFormation",
      description:
        "Author, validate, and troubleshoot CloudFormation templates, from resource definitions to failed stack updates",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_aws-cloudformation",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-cloudformation",
        description:
          "Author, validate, and troubleshoot CloudFormation templates, from resource definitions to failed stack updates",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: aws-cloudformation\ndescription: Author, validate, and troubleshoot CloudFormation templates, from resource definitions to failed stack updates\n---\n\n# AWS CloudFormation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/aws-cloudformation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-cloudformation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-iam",
      displayName: "AWS IAM",
      description:
        "Get IAM right: policy evaluation, trust policies, STS limits, and workflows for role management and least-privilege policies",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_aws-iam",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-iam",
        description:
          "Get IAM right: policy evaluation, trust policies, STS limits, and workflows for role management and least-privilege policies",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: aws-iam\ndescription: Get IAM right: policy evaluation, trust policies, STS limits, and workflows for role management and least-privilege policies\n---\n\n# AWS IAM",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/aws-iam",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-iam", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "debugging-lambda-timeouts",
      displayName: "Debugging Lambda Timeouts",
      description:
        "Find why an AWS Lambda function times out by checking configuration, logs, metrics, networking, cold starts, and dependencies",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_debugging-lambda-timeouts",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "debugging-lambda-timeouts",
        description:
          "Find why an AWS Lambda function times out by checking configuration, logs, metrics, networking, cold starts, and dependencies",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: debugging-lambda-timeouts\ndescription: Find why an AWS Lambda function times out by checking configuration, logs, metrics, networking, cold starts, and dependencies\n---\n\n# Debugging Lambda Timeouts",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/debugging-lambda-timeouts",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_debugging-lambda-timeouts", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "securing-s3-buckets",
      displayName: "Securing S3 Buckets",
      description:
        "Create and secure S3 buckets: access control, encryption, logging, and fixes for common misconfigurations",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_securing-s3-buckets",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "securing-s3-buckets",
        description:
          "Create and secure S3 buckets: access control, encryption, logging, and fixes for common misconfigurations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: securing-s3-buckets\ndescription: Create and secure S3 buckets: access control, encryption, logging, and fixes for common misconfigurations\n---\n\n# Securing S3 Buckets",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/securing-s3-buckets",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_securing-s3-buckets", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-agents-sdk",
      displayName: "Cloudflare Agents SDK",
      description:
        "Build, debug, and review applications on the Cloudflare Agents SDK: stateful agents, tools, scheduling, and chat",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-agents-sdk",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-agents-sdk",
        description:
          "Build, debug, and review applications on the Cloudflare Agents SDK: stateful agents, tools, scheduling, and chat",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-agents-sdk\ndescription: Build, debug, and review applications on the Cloudflare Agents SDK: stateful agents, tools, scheduling, and chat\n---\n\n# Cloudflare Agents SDK",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-agents-sdk",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cloudflare-agents-sdk", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-durable-objects",
      displayName: "Durable Objects",
      description:
        "Build, debug, and review Cloudflare Durable Objects for persistent state, coordination, and real-time workloads",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-durable-objects",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-durable-objects",
        description:
          "Build, debug, and review Cloudflare Durable Objects for persistent state, coordination, and real-time workloads",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-durable-objects\ndescription: Build, debug, and review Cloudflare Durable Objects for persistent state, coordination, and real-time workloads\n---\n\n# Durable Objects",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-durable-objects",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloudflare-durable-objects", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-email-service",
      displayName: "Cloudflare Email Service",
      description:
        "Implement and troubleshoot Cloudflare Email Sending and Email Routing, including delivery configuration",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-email-service",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-email-service",
        description:
          "Implement and troubleshoot Cloudflare Email Sending and Email Routing, including delivery configuration",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-email-service\ndescription: Implement and troubleshoot Cloudflare Email Sending and Email Routing, including delivery configuration\n---\n\n# Cloudflare Email Service",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-email-service",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloudflare-email-service", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-web-perf",
      displayName: "Web Performance Audit",
      description:
        "Audit and fix website loading and interaction performance, Core Web Vitals, and Lighthouse scores",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-web-perf",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-web-perf",
        description:
          "Audit and fix website loading and interaction performance, Core Web Vitals, and Lighthouse scores",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-web-perf\ndescription: Audit and fix website loading and interaction performance, Core Web Vitals, and Lighthouse scores\n---\n\n# Web Performance Audit",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-web-perf",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cloudflare-web-perf", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-workers-best-practices",
      displayName: "Workers Best Practices",
      description:
        "Write and review production Cloudflare Workers: compatibility dates, bindings, observability, streaming, and runtime patterns",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-workers-best-practices",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-workers-best-practices",
        description:
          "Write and review production Cloudflare Workers: compatibility dates, bindings, observability, streaming, and runtime patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-workers-best-practices\ndescription: Write and review production Cloudflare Workers: compatibility dates, bindings, observability, streaming, and runtime patterns\n---\n\n# Workers Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-workers-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_cloudflare-workers-best-practices",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "wrangler",
      displayName: "Wrangler",
      description:
        "Run and troubleshoot Wrangler commands and configure Worker projects for local development, previews, and deployment",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_wrangler",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "wrangler",
        description:
          "Run and troubleshoot Wrangler commands and configure Worker projects for local development, previews, and deployment",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: wrangler\ndescription: Run and troubleshoot Wrangler commands and configure Worker projects for local development, previews, and deployment\n---\n\n# Wrangler",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/wrangler",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_wrangler", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "azure-cost-optimization",
      displayName: "Azure Cost Optimization",
      description:
        "Find idle and orphaned Azure resources, rightsize workloads, and review Reservation and Savings Plan coverage",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_azure-cost-optimization",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "azure-cost-optimization",
        description:
          "Find idle and orphaned Azure resources, rightsize workloads, and review Reservation and Savings Plan coverage",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: azure-cost-optimization\ndescription: Find idle and orphaned Azure resources, rightsize workloads, and review Reservation and Savings Plan coverage\n---\n\n# Azure Cost Optimization",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/azure-cost-optimization",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_azure-cost-optimization", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "azure-diagnostics",
      displayName: "Azure Diagnostics",
      description:
        "Debug Azure production issues in App Service, Container Apps, and Functions with Azure Monitor, AppLens, and resource health",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_azure-diagnostics",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "azure-diagnostics",
        description:
          "Debug Azure production issues in App Service, Container Apps, and Functions with Azure Monitor, AppLens, and resource health",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: azure-diagnostics\ndescription: Debug Azure production issues in App Service, Container Apps, and Functions with Azure Monitor, AppLens, and resource health\n---\n\n# Azure Diagnostics",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/azure-diagnostics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_azure-diagnostics", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "deep-wiki-onboarding",
      displayName: "Codebase Onboarding Guides",
      description:
        "Generate onboarding guides for a codebase tailored to contributors, staff engineers, executives, and product managers",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_deep-wiki-onboarding",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "deep-wiki-onboarding",
        description:
          "Generate onboarding guides for a codebase tailored to contributors, staff engineers, executives, and product managers",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: deep-wiki-onboarding\ndescription: Generate onboarding guides for a codebase tailored to contributors, staff engineers, executives, and product managers\n---\n\n# Codebase Onboarding Guides",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/deep-wiki-onboarding",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_deep-wiki-onboarding", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "entra-app-registration",
      displayName: "Entra App Registration",
      description:
        "Register Microsoft Entra ID apps, configure OAuth 2.0 and API permissions, and wire up MSAL sign-in",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_entra-app-registration",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "entra-app-registration",
        description:
          "Register Microsoft Entra ID apps, configure OAuth 2.0 and API permissions, and wire up MSAL sign-in",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: entra-app-registration\ndescription: Register Microsoft Entra ID apps, configure OAuth 2.0 and API permissions, and wire up MSAL sign-in\n---\n\n# Entra App Registration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/entra-app-registration",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_entra-app-registration", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "kql",
      displayName: "Kusto Query Language",
      description:
        "Write correct, efficient KQL queries and avoid the syntax gotchas in joins, dynamic types, datetimes, regex, and result sizes",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_kql",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "kql",
        description:
          "Write correct, efficient KQL queries and avoid the syntax gotchas in joins, dynamic types, datetimes, regex, and result sizes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: kql\ndescription: Write correct, efficient KQL queries and avoid the syntax gotchas in joins, dynamic types, datetimes, regex, and result sizes\n---\n\n# Kusto Query Language",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/kql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_kql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dart-add-unit-test",
      displayName: "Dart Unit Tests",
      description:
        "Write and organize Dart unit tests for functions, methods, and classes with package:test",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_dart-add-unit-test",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dart-add-unit-test",
        description:
          "Write and organize Dart unit tests for functions, methods, and classes with package:test",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dart-add-unit-test\ndescription: Write and organize Dart unit tests for functions, methods, and classes with package:test\n---\n\n# Dart Unit Tests",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dart-add-unit-test",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dart-add-unit-test", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dart-use-pattern-matching",
      displayName: "Dart Pattern Matching",
      description:
        "Apply Dart 3 pattern matching, switch expressions, and destructuring to replace verbose type checks and casts",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_dart-use-pattern-matching",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dart-use-pattern-matching",
        description:
          "Apply Dart 3 pattern matching, switch expressions, and destructuring to replace verbose type checks and casts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dart-use-pattern-matching\ndescription: Apply Dart 3 pattern matching, switch expressions, and destructuring to replace verbose type checks and casts\n---\n\n# Dart Pattern Matching",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dart-use-pattern-matching",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dart-use-pattern-matching", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-add-widget-test",
      displayName: "Flutter Widget Tests",
      description:
        "Write component-level Flutter tests with WidgetTester to check rendering, taps, scrolling, and text entry",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_flutter-add-widget-test",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-add-widget-test",
        description:
          "Write component-level Flutter tests with WidgetTester to check rendering, taps, scrolling, and text entry",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: flutter-add-widget-test\ndescription: Write component-level Flutter tests with WidgetTester to check rendering, taps, scrolling, and text entry\n---\n\n# Flutter Widget Tests",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/flutter-add-widget-test",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_flutter-add-widget-test", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-apply-architecture-best-practices",
      displayName: "Flutter App Architecture",
      description:
        "Structure a Flutter app in UI, logic, and data layers, for a new project or a refactor toward scale",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_flutter-apply-architecture-best-practices",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-apply-architecture-best-practices",
        description:
          "Structure a Flutter app in UI, logic, and data layers, for a new project or a refactor toward scale",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: flutter-apply-architecture-best-practices\ndescription: Structure a Flutter app in UI, logic, and data layers, for a new project or a refactor toward scale\n---\n\n# Flutter App Architecture",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/flutter-apply-architecture-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_flutter-apply-architecture-best-practices",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-fix-layout-issues",
      displayName: "Flutter Layout Fixes",
      description:
        "Fix Flutter layout errors such as RenderFlex overflows and unbounded constraints by finding the cause in the widget tree",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_flutter-fix-layout-issues",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-fix-layout-issues",
        description:
          "Fix Flutter layout errors such as RenderFlex overflows and unbounded constraints by finding the cause in the widget tree",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: flutter-fix-layout-issues\ndescription: Fix Flutter layout errors such as RenderFlex overflows and unbounded constraints by finding the cause in the widget tree\n---\n\n# Flutter Layout Fixes",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/flutter-fix-layout-issues",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_flutter-fix-layout-issues", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supabase",
      displayName: "Supabase",
      description:
        "Build on Supabase with the right client setup for auth, database, storage, edge functions, and realtime",
      maker: { name: "Supabase" },
      version: "1.0.0",
      versionId: "skv_captured_supabase",
      stars: 3100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supabase",
        description:
          "Build on Supabase with the right client setup for auth, database, storage, edge functions, and realtime",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: supabase\ndescription: Build on Supabase with the right client setup for auth, database, storage, edge functions, and realtime\n---\n\n# Supabase",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/supabase",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_supabase", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supabase-postgres-best-practices",
      displayName: "Supabase Postgres Best Practices",
      description:
        "Design Postgres schemas, migrations, RLS policies, and queries that follow Supabase's maintained best practices",
      maker: { name: "Supabase" },
      version: "1.0.0",
      versionId: "skv_captured_supabase-postgres-best-practices",
      stars: 3100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supabase-postgres-best-practices",
        description:
          "Design Postgres schemas, migrations, RLS policies, and queries that follow Supabase's maintained best practices",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: supabase-postgres-best-practices\ndescription: Design Postgres schemas, migrations, RLS policies, and queries that follow Supabase's maintained best practices\n---\n\n# Supabase Postgres Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/supabase-postgres-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_supabase-postgres-best-practices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "stripe-best-practices",
      displayName: "Stripe Best Practices",
      description:
        "Choose the right Stripe APIs for payments, billing, and Connect, and avoid common integration mistakes",
      maker: { name: "Stripe" },
      version: "1.0.0",
      versionId: "skv_captured_stripe-best-practices",
      stars: 2100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "stripe-best-practices",
        description:
          "Choose the right Stripe APIs for payments, billing, and Connect, and avoid common integration mistakes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: stripe-best-practices\ndescription: Choose the right Stripe APIs for payments, billing, and Connect, and avoid common integration mistakes\n---\n\n# Stripe Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/stripe-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_stripe-best-practices", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upgrade-stripe",
      displayName: "Upgrade Stripe",
      description:
        "Upgrade Stripe API versions, server SDKs, Stripe.js, mobile SDKs, and webhook endpoints without breaking payments",
      maker: { name: "Stripe" },
      version: "1.0.0",
      versionId: "skv_captured_upgrade-stripe",
      stars: 2100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upgrade-stripe",
        description:
          "Upgrade Stripe API versions, server SDKs, Stripe.js, mobile SDKs, and webhook endpoints without breaking payments",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: upgrade-stripe\ndescription: Upgrade Stripe API versions, server SDKs, Stripe.js, mobile SDKs, and webhook endpoints without breaking payments\n---\n\n# Upgrade Stripe",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/upgrade-stripe",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upgrade-stripe", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "react-navigation",
      displayName: "React Navigation",
      description:
        "Build navigation UIs with React Navigation: stacks, tabs, drawers, headers, bottom sheets, and safe area handling",
      maker: { name: "Callstack" },
      version: "1.0.0",
      versionId: "skv_captured_react-navigation",
      stars: 1700,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "react-navigation",
        description:
          "Build navigation UIs with React Navigation: stacks, tabs, drawers, headers, bottom sheets, and safe area handling",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: react-navigation\ndescription: Build navigation UIs with React Navigation: stacks, tabs, drawers, headers, bottom sheets, and safe area handling\n---\n\n# React Navigation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/react-navigation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_react-navigation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upgrading-react-native",
      displayName: "Upgrading React Native",
      description:
        "Upgrade a React Native app across versions with template diffs, dependency bumps, native config changes, and fixes for breaking APIs",
      maker: { name: "Callstack" },
      version: "1.0.0",
      versionId: "skv_captured_upgrading-react-native",
      stars: 1700,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upgrading-react-native",
        description:
          "Upgrade a React Native app across versions with template diffs, dependency bumps, native config changes, and fixes for breaking APIs",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: upgrading-react-native\ndescription: Upgrade a React Native app across versions with template diffs, dependency bumps, native config changes, and fixes for breaking APIs\n---\n\n# Upgrading React Native",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/upgrading-react-native",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upgrading-react-native", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-iterate-pr",
      displayName: "Iterate on Pull Requests",
      description:
        "Work a pull request until its actionable CI failures pass and the high and medium review feedback is addressed",
      maker: { name: "Sentry" },
      version: "1.0.0",
      versionId: "skv_captured_sentry-iterate-pr",
      stars: 1200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-iterate-pr",
        description:
          "Work a pull request until its actionable CI failures pass and the high and medium review feedback is addressed",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sentry-iterate-pr\ndescription: Work a pull request until its actionable CI failures pass and the high and medium review feedback is addressed\n---\n\n# Iterate on Pull Requests",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sentry-iterate-pr",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-iterate-pr", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-stacks",
      displayName: "Terraform Stacks",
      description:
        "Build and validate HashiCorp Terraform Stacks, including components, deployments, and orchestration rules",
      maker: { name: "HashiCorp" },
      version: "1.0.0",
      versionId: "skv_captured_terraform-stacks",
      stars: 931,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-stacks",
        description:
          "Build and validate HashiCorp Terraform Stacks, including components, deployments, and orchestration rules",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: terraform-stacks\ndescription: Build and validate HashiCorp Terraform Stacks, including components, deployments, and orchestration rules\n---\n\n# Terraform Stacks",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/terraform-stacks",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-stacks", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-style-guide",
      displayName: "Terraform Style Guide",
      description:
        "Write Terraform HCL that follows HashiCorp's style conventions for layout, naming, variables, and resources",
      maker: { name: "HashiCorp" },
      version: "1.0.0",
      versionId: "skv_captured_terraform-style-guide",
      stars: 931,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-style-guide",
        description:
          "Write Terraform HCL that follows HashiCorp's style conventions for layout, naming, variables, and resources",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: terraform-style-guide\ndescription: Write Terraform HCL that follows HashiCorp's style conventions for layout, naming, variables, and resources\n---\n\n# Terraform Style Guide",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/terraform-style-guide",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-style-guide", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-test",
      displayName: "Terraform Test",
      description:
        "Write and run Terraform tests with .tftest.hcl files, mocks, and assertions for modules and configurations",
      maker: { name: "HashiCorp" },
      version: "1.0.0",
      versionId: "skv_captured_terraform-test",
      stars: 931,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-test",
        description:
          "Write and run Terraform tests with .tftest.hcl files, mocks, and assertions for modules and configurations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: terraform-test\ndescription: Write and run Terraform tests with .tftest.hcl files, mocks, and assertions for modules and configurations\n---\n\n# Terraform Test",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/terraform-test",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-test", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "angular-developer",
      displayName: "Angular Developer",
      description:
        "Write modern Angular: signals, forms, dependency injection, routing, SSR, accessibility, animations, and testing",
      maker: { name: "Angular" },
      version: "1.0.0",
      versionId: "skv_captured_angular-developer",
      stars: 728,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "angular-developer",
        description:
          "Write modern Angular: signals, forms, dependency injection, routing, SSR, accessibility, animations, and testing",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: angular-developer\ndescription: Write modern Angular: signals, forms, dependency injection, routing, SSR, accessibility, animations, and testing\n---\n\n# Angular Developer",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/angular-developer",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_angular-developer", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "angular-new-app",
      displayName: "Angular New App",
      description:
        "Create a new Angular app with the Angular CLI and modern defaults for structure, tooling, and styling",
      maker: { name: "Angular" },
      version: "1.0.0",
      versionId: "skv_captured_angular-new-app",
      stars: 728,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "angular-new-app",
        description:
          "Create a new Angular app with the Angular CLI and modern defaults for structure, tooling, and styling",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: angular-new-app\ndescription: Create a new Angular app with the Angular CLI and modern defaults for structure, tooling, and styling\n---\n\n# Angular New App",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/angular-new-app",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_angular-new-app", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "elasticsearch-esql",
      displayName: "Elasticsearch ES|QL",
      description:
        "Write and run ES|QL queries against Elasticsearch for exploration, aggregation, and joins",
      maker: { name: "Elastic" },
      version: "1.0.0",
      versionId: "skv_captured_elasticsearch-esql",
      stars: 608,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "elasticsearch-esql",
        description:
          "Write and run ES|QL queries against Elasticsearch for exploration, aggregation, and joins",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: elasticsearch-esql\ndescription: Write and run ES|QL queries against Elasticsearch for exploration, aggregation, and joins\n---\n\n# Elasticsearch ES|QL",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/elasticsearch-esql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_elasticsearch-esql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "elasticsearch-index-design",
      displayName: "Elasticsearch Index Design",
      description:
        "Design Elasticsearch mappings for your access patterns: field types, multi-fields, doc values, and shard settings",
      maker: { name: "Elastic" },
      version: "1.0.0",
      versionId: "skv_captured_elasticsearch-index-design",
      stars: 608,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "elasticsearch-index-design",
        description:
          "Design Elasticsearch mappings for your access patterns: field types, multi-fields, doc values, and shard settings",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: elasticsearch-index-design\ndescription: Design Elasticsearch mappings for your access patterns: field types, multi-fields, doc values, and shard settings\n---\n\n# Elasticsearch Index Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/elasticsearch-index-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_elasticsearch-index-design", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clickhouse-architecture-advisor",
      displayName: "ClickHouse Architecture Advisor",
      description:
        "Choose ingestion and data modeling patterns for ClickHouse and turn best practices into a design for your workload",
      maker: { name: "ClickHouse" },
      version: "1.0.0",
      versionId: "skv_captured_clickhouse-architecture-advisor",
      stars: 570,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clickhouse-architecture-advisor",
        description:
          "Choose ingestion and data modeling patterns for ClickHouse and turn best practices into a design for your workload",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: clickhouse-architecture-advisor\ndescription: Choose ingestion and data modeling patterns for ClickHouse and turn best practices into a design for your workload\n---\n\n# ClickHouse Architecture Advisor",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/clickhouse-architecture-advisor",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_clickhouse-architecture-advisor", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clickhouse-best-practices",
      displayName: "ClickHouse Best Practices",
      description:
        "Review ClickHouse schemas, queries, and settings against 31 rules covering keys, types, partitioning, and inserts",
      maker: { name: "ClickHouse" },
      version: "1.0.0",
      versionId: "skv_captured_clickhouse-best-practices",
      stars: 570,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clickhouse-best-practices",
        description:
          "Review ClickHouse schemas, queries, and settings against 31 rules covering keys, types, partitioning, and inserts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: clickhouse-best-practices\ndescription: Review ClickHouse schemas, queries, and settings against 31 rules covering keys, types, partitioning, and inserts\n---\n\n# ClickHouse Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/clickhouse-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_clickhouse-best-practices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-auth-basics",
      displayName: "Firebase Authentication",
      description:
        "Set up Firebase Authentication for sign-in, user management, and secure data access with auth rules",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-auth-basics",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-auth-basics",
        description:
          "Set up Firebase Authentication for sign-in, user management, and secure data access with auth rules",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-auth-basics\ndescription: Set up Firebase Authentication for sign-in, user management, and secure data access with auth rules\n---\n\n# Firebase Authentication",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-auth-basics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-auth-basics", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-basics",
      displayName: "Firebase Basics",
      description:
        "Set up the Firebase CLI, sign in, create or select a project, and download app config files",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-basics",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-basics",
        description:
          "Set up the Firebase CLI, sign in, create or select a project, and download app config files",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-basics\ndescription: Set up the Firebase CLI, sign in, create or select a project, and download app config files\n---\n\n# Firebase Basics",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-basics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-basics", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-crashlytics",
      displayName: "Firebase Crashlytics",
      description:
        "Set up Firebase Crashlytics, add the SDK to mobile apps, and read crash reports to find and fix their causes",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-crashlytics",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-crashlytics",
        description:
          "Set up Firebase Crashlytics, add the SDK to mobile apps, and read crash reports to find and fix their causes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-crashlytics\ndescription: Set up Firebase Crashlytics, add the SDK to mobile apps, and read crash reports to find and fix their causes\n---\n\n# Firebase Crashlytics",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-crashlytics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-crashlytics", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-firestore",
      displayName: "Cloud Firestore",
      description:
        "Set up and manage Cloud Firestore: data modeling, indexes, security rules, queries, and SDK integration",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-firestore",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-firestore",
        description:
          "Set up and manage Cloud Firestore: data modeling, indexes, security rules, queries, and SDK integration",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-firestore\ndescription: Set up and manage Cloud Firestore: data modeling, indexes, security rules, queries, and SDK integration\n---\n\n# Cloud Firestore",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-firestore",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-firestore", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-hosting-basics",
      displayName: "Firebase Hosting",
      description:
        "Deploy static sites and single-page apps to Firebase Hosting with redirects, rewrites, headers, and preview channels",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-hosting-basics",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-hosting-basics",
        description:
          "Deploy static sites and single-page apps to Firebase Hosting with redirects, rewrites, headers, and preview channels",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-hosting-basics\ndescription: Deploy static sites and single-page apps to Firebase Hosting with redirects, rewrites, headers, and preview channels\n---\n\n# Firebase Hosting",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-hosting-basics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_firebase-hosting-basics", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-security-rules-auditor",
      displayName: "Firebase Security Rules Auditor",
      description:
        "Audit Firestore and Cloud Storage security rules for privilege escalation, role bypasses, and unchecked writes",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-security-rules-auditor",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-security-rules-auditor",
        description:
          "Audit Firestore and Cloud Storage security rules for privilege escalation, role bypasses, and unchecked writes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-security-rules-auditor\ndescription: Audit Firestore and Cloud Storage security rules for privilege escalation, role bypasses, and unchecked writes\n---\n\n# Firebase Security Rules Auditor",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-security-rules-auditor",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_firebase-security-rules-auditor", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "tavily-best-practices",
      displayName: "Tavily Best Practices",
      description:
        "Add web search, content extraction, crawling, and research to apps and agents with production-ready Tavily integrations",
      maker: { name: "Tavily" },
      version: "1.0.0",
      versionId: "skv_captured_tavily-best-practices",
      stars: 492,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "tavily-best-practices",
        description:
          "Add web search, content extraction, crawling, and research to apps and agents with production-ready Tavily integrations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: tavily-best-practices\ndescription: Add web search, content extraction, crawling, and research to apps and agents with production-ready Tavily integrations\n---\n\n# Tavily Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/tavily-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_tavily-best-practices", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "svelte-code-writer",
      displayName: "Svelte Docs and Code Analysis",
      description:
        "Look up Svelte 5 docs and analyze Svelte components and modules from the command line while you write them",
      maker: { name: "Svelte" },
      version: "1.0.0",
      versionId: "skv_captured_svelte-code-writer",
      stars: 342,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "svelte-code-writer",
        description:
          "Look up Svelte 5 docs and analyze Svelte components and modules from the command line while you write them",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: svelte-code-writer\ndescription: Look up Svelte 5 docs and analyze Svelte components and modules from the command line while you write them\n---\n\n# Svelte Docs and Code Analysis",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/svelte-code-writer",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_svelte-code-writer", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "svelte-core-bestpractices",
      displayName: "Svelte Best Practices",
      description:
        "Write fast, robust, modern Svelte 5: runes, reactivity, events, styling, and library integration",
      maker: { name: "Svelte" },
      version: "1.0.0",
      versionId: "skv_captured_svelte-core-bestpractices",
      stars: 342,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "svelte-core-bestpractices",
        description:
          "Write fast, robust, modern Svelte 5: runes, reactivity, events, styling, and library integration",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: svelte-core-bestpractices\ndescription: Write fast, robust, modern Svelte 5: runes, reactivity, events, styling, and library integration\n---\n\n# Svelte Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/svelte-core-bestpractices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_svelte-core-bestpractices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "use-railway",
      displayName: "Railway",
      description:
        "Deploy and operate apps on Railway: projects, services, databases, environments, domains, and troubleshooting",
      maker: { name: "Railway" },
      version: "1.0.0",
      versionId: "skv_captured_use-railway",
      stars: 342,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "use-railway",
        description:
          "Deploy and operate apps on Railway: projects, services, databases, environments, domains, and troubleshooting",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: use-railway\ndescription: Deploy and operate apps on Railway: projects, services, databases, environments, domains, and troubleshooting\n---\n\n# Railway",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/use-railway",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_use-railway", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "k6",
      displayName: "k6 Load Testing",
      description:
        "Generate, validate, and review k6 load, stress, and spike test scripts, and run them against your service",
      maker: { name: "Grafana Labs" },
      version: "1.0.0",
      versionId: "skv_captured_k6",
      stars: 313,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "k6",
        description:
          "Generate, validate, and review k6 load, stress, and spike test scripts, and run them against your service",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: k6\ndescription: Generate, validate, and review k6 load, stress, and spike test scripts, and run them against your service\n---\n\n# k6 Load Testing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/k6",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_k6", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "promql",
      displayName: "PromQL",
      description:
        "Write, validate, and optimize PromQL for Prometheus and Grafana Mimir dashboards and alerts",
      maker: { name: "Grafana Labs" },
      version: "1.0.0",
      versionId: "skv_captured_promql",
      stars: 313,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "promql",
        description:
          "Write, validate, and optimize PromQL for Prometheus and Grafana Mimir dashboards and alerts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: promql\ndescription: Write, validate, and optimize PromQL for Prometheus and Grafana Mimir dashboards and alerts\n---\n\n# PromQL",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/promql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_promql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-instrument",
      displayName: "Sentry Instrument",
      description:
        "Add Sentry to an app and wire up errors, tracing, logs, metrics, replay, and AI monitoring for its platform",
      maker: { name: "Sentry" },
      version: "1.0.0",
      versionId: "skv_captured_sentry-instrument",
      stars: 278,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-instrument",
        description:
          "Add Sentry to an app and wire up errors, tracing, logs, metrics, replay, and AI monitoring for its platform",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sentry-instrument\ndescription: Add Sentry to an app and wire up errors, tracing, logs, metrics, replay, and AI monitoring for its platform\n---\n\n# Sentry Instrument",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sentry-instrument",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-instrument", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-setup-releases",
      displayName: "Sentry Releases",
      description:
        "Set up Sentry releases and deploy tracking so each issue links to the release and commit that introduced it",
      maker: { name: "Sentry" },
      version: "1.0.0",
      versionId: "skv_captured_sentry-setup-releases",
      stars: 278,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-setup-releases",
        description:
          "Set up Sentry releases and deploy tracking so each issue links to the release and commit that introduced it",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sentry-setup-releases\ndescription: Set up Sentry releases and deploy tracking so each issue links to the release and commit that introduced it\n---\n\n# Sentry Releases",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sentry-setup-releases",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-setup-releases", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "react-email",
      displayName: "React Email",
      description:
        "Build HTML email templates with React Email components and render or send them with Resend",
      maker: { name: "Resend" },
      version: "1.0.0",
      versionId: "skv_captured_react-email",
      stars: 211,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "react-email",
        description:
          "Build HTML email templates with React Email components and render or send them with Resend",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: react-email\ndescription: Build HTML email templates with React Email components and render or send them with Resend\n---\n\n# React Email",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/react-email",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_react-email", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "resend",
      displayName: "Resend",
      description:
        "Send, receive, and track email with the Resend API: templates, domains, webhooks, contacts, and broadcasts",
      maker: { name: "Resend" },
      version: "1.0.0",
      versionId: "skv_captured_resend",
      stars: 211,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "resend",
        description:
          "Send, receive, and track email with the Resend API: templates, domains, webhooks, contacts, and broadcasts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: resend\ndescription: Send, receive, and track email with the Resend API: templates, domains, webhooks, contacts, and broadcasts\n---\n\n# Resend",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/resend",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_resend", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-connection",
      displayName: "MongoDB Connection Tuning",
      description:
        "Configure MongoDB client pools, timeouts, and connection patterns for any driver and diagnose connection errors",
      maker: { name: "MongoDB" },
      version: "1.0.0",
      versionId: "skv_captured_mongodb-connection",
      stars: 200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-connection",
        description:
          "Configure MongoDB client pools, timeouts, and connection patterns for any driver and diagnose connection errors",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mongodb-connection\ndescription: Configure MongoDB client pools, timeouts, and connection patterns for any driver and diagnose connection errors\n---\n\n# MongoDB Connection Tuning",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mongodb-connection",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mongodb-connection", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-query-optimizer",
      displayName: "MongoDB Query Optimizer",
      description:
        "Find why a MongoDB query is slow and fix it with the right indexes and query shape",
      maker: { name: "MongoDB" },
      version: "1.0.0",
      versionId: "skv_captured_mongodb-query-optimizer",
      stars: 200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-query-optimizer",
        description:
          "Find why a MongoDB query is slow and fix it with the right indexes and query shape",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mongodb-query-optimizer\ndescription: Find why a MongoDB query is slow and fix it with the right indexes and query shape\n---\n\n# MongoDB Query Optimizer",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mongodb-query-optimizer",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_mongodb-query-optimizer", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-schema-design",
      displayName: "MongoDB Schema Design",
      description:
        "Design MongoDB data models and review existing ones for unbounded arrays, bad embeds, and other schema anti-patterns",
      maker: { name: "MongoDB" },
      version: "1.0.0",
      versionId: "skv_captured_mongodb-schema-design",
      stars: 200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-schema-design",
        description:
          "Design MongoDB data models and review existing ones for unbounded arrays, bad embeds, and other schema anti-patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mongodb-schema-design\ndescription: Design MongoDB data models and review existing ones for unbounded arrays, bad embeds, and other schema anti-patterns\n---\n\n# MongoDB Schema Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mongodb-schema-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mongodb-schema-design", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dt-dql-essentials",
      displayName: "Dynatrace DQL Essentials",
      description:
        "Write correct Dynatrace Query Language: core syntax, common pitfalls, and query patterns for logs, spans, and metrics",
      maker: { name: "Dynatrace" },
      version: "1.0.0",
      versionId: "skv_captured_dt-dql-essentials",
      stars: 181,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dt-dql-essentials",
        description:
          "Write correct Dynatrace Query Language: core syntax, common pitfalls, and query patterns for logs, spans, and metrics",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dt-dql-essentials\ndescription: Write correct Dynatrace Query Language: core syntax, common pitfalls, and query patterns for logs, spans, and metrics\n---\n\n# Dynatrace DQL Essentials",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dt-dql-essentials",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dt-dql-essentials", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firecrawl-build",
      displayName: "Firecrawl Build",
      description:
        "Integrate Firecrawl scraping, search, and browser actions into product code and agent workflows",
      maker: { name: "Firecrawl" },
      version: "1.0.0",
      versionId: "skv_captured_firecrawl-build",
      stars: 160,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firecrawl-build",
        description:
          "Integrate Firecrawl scraping, search, and browser actions into product code and agent workflows",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firecrawl-build\ndescription: Integrate Firecrawl scraping, search, and browser actions into product code and agent workflows\n---\n\n# Firecrawl Build",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firecrawl-build",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firecrawl-build", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-client",
      displayName: "Apollo Client",
      description:
        "Build React apps with Apollo Client 4: queries, mutations, cache policies, local state, and error handling",
      maker: { name: "Apollo GraphQL" },
      version: "1.0.0",
      versionId: "skv_captured_apollo-client",
      stars: 131,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-client",
        description:
          "Build React apps with Apollo Client 4: queries, mutations, cache policies, local state, and error handling",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: apollo-client\ndescription: Build React apps with Apollo Client 4: queries, mutations, cache policies, local state, and error handling\n---\n\n# Apollo Client",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/apollo-client",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-client", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-federation",
      displayName: "Apollo Federation",
      description:
        "Author Apollo Federation subgraph schemas with entities, keys, shared fields, and the right directives",
      maker: { name: "Apollo GraphQL" },
      version: "1.0.0",
      versionId: "skv_captured_apollo-federation",
      stars: 131,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-federation",
        description:
          "Author Apollo Federation subgraph schemas with entities, keys, shared fields, and the right directives",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: apollo-federation\ndescription: Author Apollo Federation subgraph schemas with entities, keys, shared fields, and the right directives\n---\n\n# Apollo Federation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/apollo-federation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-federation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-server",
      displayName: "Apollo Server",
      description:
        "Build GraphQL servers with Apollo Server 5: schemas, resolvers, auth, plugins, and data sources",
      maker: { name: "Apollo GraphQL" },
      version: "1.0.0",
      versionId: "skv_captured_apollo-server",
      stars: 131,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-server",
        description:
          "Build GraphQL servers with Apollo Server 5: schemas, resolvers, auth, plugins, and data sources",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: apollo-server\ndescription: Build GraphQL servers with Apollo Server 5: schemas, resolvers, auth, plugins, and data sources\n---\n\n# Apollo Server",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/apollo-server",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-server", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "neon-postgres",
      displayName: "Neon Postgres",
      description:
        "Work with Neon Postgres: pooled and direct connections, branching, migrations, autoscaling, and read replicas",
      maker: { name: "Neon" },
      version: "1.0.0",
      versionId: "skv_captured_neon-postgres",
      stars: 116,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "neon-postgres",
        description:
          "Work with Neon Postgres: pooled and direct connections, branching, migrations, autoscaling, and read replicas",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: neon-postgres\ndescription: Work with Neon Postgres: pooled and direct connections, branching, migrations, autoscaling, and read replicas\n---\n\n# Neon Postgres",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/neon-postgres",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_neon-postgres", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "neon-postgres-egress-optimizer",
      displayName: "Neon Egress Optimizer",
      description:
        "Find and fix queries that overfetch and drive up Postgres network egress and database bills",
      maker: { name: "Neon" },
      version: "1.0.0",
      versionId: "skv_captured_neon-postgres-egress-optimizer",
      stars: 116,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "neon-postgres-egress-optimizer",
        description:
          "Find and fix queries that overfetch and drive up Postgres network egress and database bills",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: neon-postgres-egress-optimizer\ndescription: Find and fix queries that overfetch and drive up Postgres network egress and database bills\n---\n\n# Neon Egress Optimizer",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/neon-postgres-egress-optimizer",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_neon-postgres-egress-optimizer", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clerk-nextjs-patterns",
      displayName: "Clerk Next.js Patterns",
      description:
        "Apply Clerk in Next.js with middleware, Server Actions, and caching patterns that keep auth correct",
      maker: { name: "Clerk" },
      version: "1.0.0",
      versionId: "skv_captured_clerk-nextjs-patterns",
      stars: 94,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clerk-nextjs-patterns",
        description:
          "Apply Clerk in Next.js with middleware, Server Actions, and caching patterns that keep auth correct",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: clerk-nextjs-patterns\ndescription: Apply Clerk in Next.js with middleware, Server Actions, and caching patterns that keep auth correct\n---\n\n# Clerk Next.js Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/clerk-nextjs-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_clerk-nextjs-patterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clerk-setup",
      displayName: "Clerk Setup",
      description:
        "Set up Clerk authentication in any project with the Clerk CLI and official framework quickstarts",
      maker: { name: "Clerk" },
      version: "1.0.0",
      versionId: "skv_captured_clerk-setup",
      stars: 94,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clerk-setup",
        description:
          "Set up Clerk authentication in any project with the Clerk CLI and official framework quickstarts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: clerk-setup\ndescription: Set up Clerk authentication in any project with the Clerk CLI and official framework quickstarts\n---\n\n# Clerk Setup",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/clerk-setup",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_clerk-setup", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "unsafe-rust-review",
      displayName: "Unsafe Rust Review",
      description:
        "Write and review unsafe Rust safety docs and comments as proof obligations grounded in the Rust Reference and project invariants",
      maker: { name: "Google" },
      version: "1.0.0",
      versionId: "skv_captured_unsafe-rust-review",
      stars: 84,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "unsafe-rust-review",
        description:
          "Write and review unsafe Rust safety docs and comments as proof obligations grounded in the Rust Reference and project invariants",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: unsafe-rust-review\ndescription: Write and review unsafe Rust safety docs and comments as proof obligations grounded in the Rust Reference and project invariants\n---\n\n# Unsafe Rust Review",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/unsafe-rust-review",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_unsafe-rust-review", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-error-tracking",
      displayName: "PostHog Error Tracking",
      description:
        "Capture exceptions in PostHog with stack traces and source maps for web, mobile, and server code",
      maker: { name: "PostHog" },
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-error-tracking",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-error-tracking",
        description:
          "Capture exceptions in PostHog with stack traces and source maps for web, mobile, and server code",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: posthog-instrument-error-tracking\ndescription: Capture exceptions in PostHog with stack traces and source maps for web, mobile, and server code\n---\n\n# PostHog Error Tracking",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/posthog-instrument-error-tracking",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_posthog-instrument-error-tracking",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-integration",
      displayName: "PostHog Integration",
      description:
        "Add the PostHog SDK to an app with the right provider, initialization, and configuration for its framework",
      maker: { name: "PostHog" },
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-integration",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-integration",
        description:
          "Add the PostHog SDK to an app with the right provider, initialization, and configuration for its framework",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: posthog-instrument-integration\ndescription: Add the PostHog SDK to an app with the right provider, initialization, and configuration for its framework\n---\n\n# PostHog Integration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/posthog-instrument-integration",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_posthog-instrument-integration", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-llm-analytics",
      displayName: "PostHog LLM Analytics",
      description:
        "Trace LLM calls in PostHog with token counts, latency, and cost for every provider the app uses",
      maker: { name: "PostHog" },
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-llm-analytics",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-llm-analytics",
        description:
          "Trace LLM calls in PostHog with token counts, latency, and cost for every provider the app uses",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: posthog-instrument-llm-analytics\ndescription: Trace LLM calls in PostHog with token counts, latency, and cost for every provider the app uses\n---\n\n# PostHog LLM Analytics",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/posthog-instrument-llm-analytics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_posthog-instrument-llm-analytics", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "prisma-client-api",
      displayName: "Prisma Client API",
      description:
        "Write Prisma Client queries correctly: model queries, filters, operators, relations, and transactions",
      maker: { name: "Prisma" },
      version: "1.0.0",
      versionId: "skv_captured_prisma-client-api",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "prisma-client-api",
        description:
          "Write Prisma Client queries correctly: model queries, filters, operators, relations, and transactions",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: prisma-client-api\ndescription: Write Prisma Client queries correctly: model queries, filters, operators, relations, and transactions\n---\n\n# Prisma Client API",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/prisma-client-api",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_prisma-client-api", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "prisma-upgrade-v7",
      displayName: "Prisma 7 Upgrade",
      description:
        "Move a project from Prisma ORM 6 to 7, covering driver adapters, the new generator, and every breaking change",
      maker: { name: "Prisma" },
      version: "1.0.0",
      versionId: "skv_captured_prisma-upgrade-v7",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "prisma-upgrade-v7",
        description:
          "Move a project from Prisma ORM 6 to 7, covering driver adapters, the new generator, and every breaking change",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: prisma-upgrade-v7\ndescription: Move a project from Prisma ORM 6 to 7, covering driver adapters, the new generator, and every breaking change\n---\n\n# Prisma 7 Upgrade",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/prisma-upgrade-v7",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_prisma-upgrade-v7", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-best-practices",
      displayName: "Pulumi Best Practices",
      description:
        "Write and review Pulumi TypeScript and Python programs that handle outputs, secrets, and resource options correctly",
      maker: { name: "Pulumi" },
      version: "1.0.0",
      versionId: "skv_captured_pulumi-best-practices",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-best-practices",
        description:
          "Write and review Pulumi TypeScript and Python programs that handle outputs, secrets, and resource options correctly",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: pulumi-best-practices\ndescription: Write and review Pulumi TypeScript and Python programs that handle outputs, secrets, and resource options correctly\n---\n\n# Pulumi Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/pulumi-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_pulumi-best-practices", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-component",
      displayName: "Pulumi Components",
      description:
        "Author reusable Pulumi ComponentResource classes with clean inputs, outputs, and multi-language packaging",
      maker: { name: "Pulumi" },
      version: "1.0.0",
      versionId: "skv_captured_pulumi-component",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-component",
        description:
          "Author reusable Pulumi ComponentResource classes with clean inputs, outputs, and multi-language packaging",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: pulumi-component\ndescription: Author reusable Pulumi ComponentResource classes with clean inputs, outputs, and multi-language packaging\n---\n\n# Pulumi Components",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/pulumi-component",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_pulumi-component", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-terraform-to-pulumi",
      displayName: "Terraform to Pulumi",
      description:
        "Migrate Terraform and OpenTofu projects to Pulumi by translating HCL and importing existing state",
      maker: { name: "Pulumi" },
      version: "1.0.0",
      versionId: "skv_captured_pulumi-terraform-to-pulumi",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-terraform-to-pulumi",
        description:
          "Migrate Terraform and OpenTofu projects to Pulumi by translating HCL and importing existing state",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: pulumi-terraform-to-pulumi\ndescription: Migrate Terraform and OpenTofu projects to Pulumi by translating HCL and importing existing state\n---\n\n# Terraform to Pulumi",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/pulumi-terraform-to-pulumi",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_pulumi-terraform-to-pulumi", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "integrate-revenuecat",
      displayName: "RevenueCat Integration",
      description:
        "Add RevenueCat subscriptions to an app: dashboard setup plus Purchases SDK installation and configuration",
      maker: { name: "RevenueCat" },
      version: "1.0.0",
      versionId: "skv_captured_integrate-revenuecat",
      stars: 79,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "integrate-revenuecat",
        description:
          "Add RevenueCat subscriptions to an app: dashboard setup plus Purchases SDK installation and configuration",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: integrate-revenuecat\ndescription: Add RevenueCat subscriptions to an app: dashboard setup plus Purchases SDK installation and configuration\n---\n\n# RevenueCat Integration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/integrate-revenuecat",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_integrate-revenuecat", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "building-livekit-agents",
      displayName: "LiveKit Agents",
      description:
        "Build voice and chat AI agents with LiveKit Agents: workflows, handoffs, turn handling, and latency fixes",
      maker: { name: "LiveKit" },
      version: "1.0.0",
      versionId: "skv_captured_building-livekit-agents",
      stars: 76,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "building-livekit-agents",
        description:
          "Build voice and chat AI agents with LiveKit Agents: workflows, handoffs, turn handling, and latency fixes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: building-livekit-agents\ndescription: Build voice and chat AI agents with LiveKit Agents: workflows, handoffs, turn handling, and latency fixes\n---\n\n# LiveKit Agents",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/building-livekit-agents",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_building-livekit-agents", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "convex",
      displayName: "Convex",
      description:
        "Build type-safe reactive backends on Convex: schema, queries, mutations, actions, auth, scheduling, and file storage",
      maker: { name: "Convex" },
      version: "1.0.0",
      versionId: "skv_captured_convex",
      stars: 69,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "convex",
        description:
          "Build type-safe reactive backends on Convex: schema, queries, mutations, actions, auth, scheduling, and file storage",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: convex\ndescription: Build type-safe reactive backends on Convex: schema, queries, mutations, actions, auth, scheduling, and file storage\n---\n\n# Convex",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/convex",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_convex", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "convex-authz",
      displayName: "Convex Authorization Audit",
      description:
        "Audit and harden Convex apps against impersonation, missing ownership checks, and queries that leak data by id",
      maker: { name: "Convex" },
      version: "1.0.0",
      versionId: "skv_captured_convex-authz",
      stars: 69,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "convex-authz",
        description:
          "Audit and harden Convex apps against impersonation, missing ownership checks, and queries that leak data by id",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: convex-authz\ndescription: Audit and harden Convex apps against impersonation, missing ownership checks, and queries that leak data by id\n---\n\n# Convex Authorization Audit",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/convex-authz",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_convex-authz", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-config",
      displayName: "Netlify Configuration",
      description:
        "Configure Netlify builds and routing with netlify.toml, redirects, headers, and per-context environment variables",
      maker: { name: "Netlify" },
      version: "1.0.0",
      versionId: "skv_captured_netlify-config",
      stars: 54,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-config",
        description:
          "Configure Netlify builds and routing with netlify.toml, redirects, headers, and per-context environment variables",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: netlify-config\ndescription: Configure Netlify builds and routing with netlify.toml, redirects, headers, and per-context environment variables\n---\n\n# Netlify Configuration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/netlify-config",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_netlify-config", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-edge-functions",
      displayName: "Netlify Edge Functions",
      description:
        "Write Netlify Edge Functions for auth middleware, geolocation, A/B tests, and request transforms",
      maker: { name: "Netlify" },
      version: "1.0.0",
      versionId: "skv_captured_netlify-edge-functions",
      stars: 54,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-edge-functions",
        description:
          "Write Netlify Edge Functions for auth middleware, geolocation, A/B tests, and request transforms",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: netlify-edge-functions\ndescription: Write Netlify Edge Functions for auth middleware, geolocation, A/B tests, and request transforms\n---\n\n# Netlify Edge Functions",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/netlify-edge-functions",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_netlify-edge-functions", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-functions",
      displayName: "Netlify Functions",
      description:
        "Write and deploy Netlify serverless functions in TypeScript, JavaScript, or Go, with streaming, cron, and background jobs",
      maker: { name: "Netlify" },
      version: "1.0.0",
      versionId: "skv_captured_netlify-functions",
      stars: 54,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-functions",
        description:
          "Write and deploy Netlify serverless functions in TypeScript, JavaScript, or Go, with streaming, cron, and background jobs",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: netlify-functions\ndescription: Write and deploy Netlify serverless functions in TypeScript, JavaScript, or Go, with streaming, cron, and background jobs\n---\n\n# Netlify Functions",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/netlify-functions",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_netlify-functions", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "workos",
      displayName: "WorkOS",
      description:
        "Add WorkOS AuthKit, SSO, Directory Sync, and RBAC to an app and debug integrations",
      maker: { name: "WorkOS" },
      version: "1.0.0",
      versionId: "skv_captured_workos",
      stars: 46,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "workos",
        description:
          "Add WorkOS AuthKit, SSO, Directory Sync, and RBAC to an app and debug integrations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: workos\ndescription: Add WorkOS AuthKit, SSO, Directory Sync, and RBAC to an app and debug integrations\n---\n\n# WorkOS",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/workos",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_workos", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "twilio-migrate-messaging-to-verify",
      displayName: "Twilio Verify Migration",
      description:
        "Replace a self-built SMS one-time-passcode flow with the Twilio Verify API for delivery, expiry, and fraud protection",
      maker: { name: "Twilio" },
      version: "1.0.0",
      versionId: "skv_captured_twilio-migrate-messaging-to-verify",
      stars: 41,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "twilio-migrate-messaging-to-verify",
        description:
          "Replace a self-built SMS one-time-passcode flow with the Twilio Verify API for delivery, expiry, and fraud protection",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: twilio-migrate-messaging-to-verify\ndescription: Replace a self-built SMS one-time-passcode flow with the Twilio Verify API for delivery, expiry, and fraud protection\n---\n\n# Twilio Verify Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/twilio-migrate-messaging-to-verify",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_twilio-migrate-messaging-to-verify",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upstash-qstash-js",
      displayName: "Upstash QStash",
      description:
        "Run background jobs, scheduled tasks, and retried HTTP messages on serverless apps with the QStash TypeScript SDK",
      maker: { name: "Upstash" },
      version: "1.0.0",
      versionId: "skv_captured_upstash-qstash-js",
      stars: 37,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upstash-qstash-js",
        description:
          "Run background jobs, scheduled tasks, and retried HTTP messages on serverless apps with the QStash TypeScript SDK",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: upstash-qstash-js\ndescription: Run background jobs, scheduled tasks, and retried HTTP messages on serverless apps with the QStash TypeScript SDK\n---\n\n# Upstash QStash",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/upstash-qstash-js",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upstash-qstash-js", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upstash-redis-js",
      displayName: "Upstash Redis",
      description:
        "Use the Upstash Redis TypeScript SDK for caching, sessions, rate limits, and counters on serverless and edge runtimes",
      maker: { name: "Upstash" },
      version: "1.0.0",
      versionId: "skv_captured_upstash-redis-js",
      stars: 37,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upstash-redis-js",
        description:
          "Use the Upstash Redis TypeScript SDK for caching, sessions, rate limits, and counters on serverless and edge runtimes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: upstash-redis-js\ndescription: Use the Upstash Redis TypeScript SDK for caching, sessions, rate limits, and counters on serverless and edge runtimes\n---\n\n# Upstash Redis",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/upstash-redis-js",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upstash-redis-js", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "appwrite-typescript",
      displayName: "Appwrite TypeScript",
      description:
        "Build with the Appwrite TypeScript SDK: auth, databases, storage, realtime, and server-side admin access",
      maker: { name: "Appwrite" },
      version: "1.0.0",
      versionId: "skv_captured_appwrite-typescript",
      stars: 29,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "appwrite-typescript",
        description:
          "Build with the Appwrite TypeScript SDK: auth, databases, storage, realtime, and server-side admin access",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: appwrite-typescript\ndescription: Build with the Appwrite TypeScript SDK: auth, databases, storage, realtime, and server-side admin access\n---\n\n# Appwrite TypeScript",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/appwrite-typescript",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_appwrite-typescript", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "inngest-durable-functions",
      displayName: "Inngest Durable Functions",
      description:
        "Build Inngest functions that survive crashes, retry on failure, run on schedules, and resume where they stopped",
      maker: { name: "Inngest" },
      version: "1.0.0",
      versionId: "skv_captured_inngest-durable-functions",
      stars: 29,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "inngest-durable-functions",
        description:
          "Build Inngest functions that survive crashes, retry on failure, run on schedules, and resume where they stopped",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: inngest-durable-functions\ndescription: Build Inngest functions that survive crashes, retry on failure, run on schedules, and resume where they stopped\n---\n\n# Inngest Durable Functions",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/inngest-durable-functions",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_inngest-durable-functions", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "inngest-setup",
      displayName: "Inngest Setup",
      description:
        "Add Inngest durable execution to a TypeScript project: SDK install, client config, and serve endpoints",
      maker: { name: "Inngest" },
      version: "1.0.0",
      versionId: "skv_captured_inngest-setup",
      stars: 29,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "inngest-setup",
        description:
          "Add Inngest durable execution to a TypeScript project: SDK install, client config, and serve endpoints",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: inngest-setup\ndescription: Add Inngest durable execution to a TypeScript project: SDK install, client config, and serve endpoints\n---\n\n# Inngest Setup",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/inngest-setup",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_inngest-setup", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "temporal-cloud-setup",
      displayName: "Temporal Cloud Setup",
      description:
        "Set up Temporal Cloud end to end and run a sample workflow on it",
      maker: { name: "Temporal" },
      version: "1.0.0",
      versionId: "skv_captured_temporal-cloud-setup",
      stars: 27,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "temporal-cloud-setup",
        description:
          "Set up Temporal Cloud end to end and run a sample workflow on it",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: temporal-cloud-setup\ndescription: Set up Temporal Cloud end to end and run a sample workflow on it\n---\n\n# Temporal Cloud Setup",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/temporal-cloud-setup",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_temporal-cloud-setup", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "buildkite-migration",
      displayName: "Buildkite Migration",
      description:
        "Convert CI pipelines from Jenkins, GitHub Actions, CircleCI, GitLab CI, and Bitbucket to Buildkite",
      maker: { name: "Buildkite" },
      version: "1.0.0",
      versionId: "skv_captured_buildkite-migration",
      stars: 19,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "buildkite-migration",
        description:
          "Convert CI pipelines from Jenkins, GitHub Actions, CircleCI, GitLab CI, and Bitbucket to Buildkite",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: buildkite-migration\ndescription: Convert CI pipelines from Jenkins, GitHub Actions, CircleCI, GitLab CI, and Bitbucket to Buildkite\n---\n\n# Buildkite Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/buildkite-migration",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_buildkite-migration", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cockroachdb-sql",
      displayName: "CockroachDB SQL",
      description:
        "Write and tune SQL for CockroachDB: schema design, primary keys, type mappings, and distributed-database patterns",
      maker: { name: "Cockroach Labs" },
      version: "1.0.0",
      versionId: "skv_captured_cockroachdb-sql",
      stars: 5,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cockroachdb-sql",
        description:
          "Write and tune SQL for CockroachDB: schema design, primary keys, type mappings, and distributed-database patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cockroachdb-sql\ndescription: Write and tune SQL for CockroachDB: schema design, primary keys, type mappings, and distributed-database patterns\n---\n\n# CockroachDB SQL",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cockroachdb-sql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cockroachdb-sql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-byoc",
      displayName: "Vercel BYOC",
      description:
        "Deploy an app with Vercel Bring Your Own Cloud so its functions run as AWS Lambda in your own account",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-byoc",
      stars: 1,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-byoc",
        description:
          "Deploy an app with Vercel Bring Your Own Cloud so its functions run as AWS Lambda in your own account",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-byoc\ndescription: Deploy an app with Vercel Bring Your Own Cloud so its functions run as AWS Lambda in your own account\n---\n\n# Vercel BYOC",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-byoc",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_vercel-byoc", "1.0.0", 9)],
  }),
];

export const findSampleListing = (kind: string, slug: string) =>
  sampleListings.find(
    (listing) => listing.card.kind === kind && listing.card.slug === slug,
  );
