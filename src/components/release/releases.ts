export const RELEASE_ICONS = [
  "bell",
  "chain-link",
  "globe",
  "import",
  "laptop",
  "moon",
  "plug",
  "pull-request",
  "rotate",
  "tabs",
  "transfer",
  "window",
] as const;

export type ReleaseIcon = (typeof RELEASE_ICONS)[number];

export type ReleaseVisual = {
  kind: "image" | "video";
  file: string;
  width: number;
  height: number;
};

export type ReleaseHighlight = {
  icon: ReleaseIcon;
  lead: string;
  body: string;
};

export type Release = {
  version: string;
  date: string;
  title: string;
  visual?: ReleaseVisual;
  card: { summary: string; highlights: ReadonlyArray<ReleaseHighlight> };
};

const image = (file: string, width = 1792, height = 1008): ReleaseVisual => ({
  kind: "image",
  file,
  width,
  height,
});

export const RELEASES: ReadonlyArray<Release> = [
  {
    version: "0.9.0",
    date: "2026-11-15",
    title: "A Captains-first sidebar and a model picker with favorites",
    visual: image("0.9.0-sidebar.webp", 2688, 1512),
    card: {
      summary:
        "A sidebar that opens on your Captains, a model picker with favorites, threads that move between your computers, and SAML single sign-on",
      highlights: [
        {
          icon: "window",
          lead: "A Captains-first sidebar",
          body: "The sidebar opens on your Captains and what each one needs from you, and **Threads** is one click away with **Working** and **Settled**",
        },
        {
          icon: "rotate",
          lead: "Favorite models",
          body: "Pick a favorite model with ⌥1 to ⌥9, and set its reasoning and where it runs in a panel beside the list",
        },
        {
          icon: "laptop",
          lead: "Move to a device",
          body: "Move a thread between the cloud and your computers, and start one on a computer that doesn't have the project yet",
        },
        {
          icon: "chain-link",
          lead: "Single sign-on and passkeys",
          body: "Admins connect Okta, Microsoft Entra ID, or any SAML provider themselves, and you can require a passkey to sign in",
        },
      ],
    },
  },
  {
    version: "0.8.0",
    date: "2026-11-10",
    title: "Split panes, SSO and passkeys, and comments on images and videos",
    visual: image("0.8.0-panes.webp"),
    card: {
      summary:
        "Split panes, single sign-on and passkeys for organizations, and comments on images and videos",
      highlights: [
        {
          icon: "tabs",
          lead: "Split panes",
          body: "Drag a tab or the chat to the edge of a pane to put a file, an issue, or a pull request beside it",
        },
        {
          icon: "laptop",
          lead: "Single sign-on and passkeys",
          body: "Admins connect Google Workspace on a verified domain and require two-step verification, and anyone can sign in with a passkey",
        },
        {
          icon: "window",
          lead: "Comments on images and videos",
          body: "Pin a spot or box an area on an image or a video frame, and send every note to Capy in one message",
        },
      ],
    },
  },
  {
    version: "0.7.2",
    date: "2026-11-01",
    title: "Dock CLI on macOS, Linux, and Windows",
    card: {
      summary: "The Dock CLI now installs on macOS, Linux, and Windows",
      highlights: [
        {
          icon: "laptop",
          lead: "Dock CLI on Windows",
          body: "Install capy dock on a Windows machine with one PowerShell command, as well as on macOS and Linux",
        },
        {
          icon: "import",
          lead: "One-line install",
          body: "Each system has a one-line installer that checks the download before it installs",
        },
      ],
    },
  },
  {
    version: "0.7.0",
    date: "2026-10-31",
    title: "Captains and Issues are GA",
    visual: image("0.7.0-issues.webp"),
    card: {
      summary:
        "Captains and Issues for everyone, the Dock CLI for running threads on your own servers, a context breakdown, and better requests",
      highlights: [
        {
          icon: "tabs",
          lead: "Captains and Issues are GA",
          body: "Every organization gets Captains, which run a crew of threads, and **Issues**, with filters, full-text search, labels, and due dates",
        },
        {
          icon: "laptop",
          lead: "Dock CLI",
          body: "Run Capy headless on a Linux, macOS, or Windows machine with the capy dock command, and start threads on it from anywhere, with no desktop app",
        },
        {
          icon: "window",
          lead: "Context breakdown",
          body: "See what a new thread loads and how much of the context window it uses, and edit it on the **Instructions** and **Skills** pages",
        },
        {
          icon: "bell",
          lead: "Better requests",
          body: "When Capy needs something from you, it says exactly what, and the request stays open until you answer or dismiss it",
        },
      ],
    },
  },
  {
    version: "0.6.0",
    date: "2026-10-27",
    title: "Explore, Themes, and Drive files",
    visual: image("0.6.0-explore.webp"),
    card: {
      summary:
        "Explore for plugins, skills, and themes, themes that carry the whole look, and Drive files with versions and compare",
      highlights: [
        {
          icon: "globe",
          lead: "Explore",
          body: "Find plugins, skills, and themes on the **Explore** page, set one up in a project, and publish a theme of your own",
        },
        {
          icon: "moon",
          lead: "Themes",
          body: "A theme carries its colors, dashboard background, and effect, and your appearance follows you to every device",
        },
        {
          icon: "tabs",
          lead: "Files and Drive",
          body: "Files open beside the conversation, with every earlier version a click away and **Compare** to see what changed",
        },
        {
          icon: "transfer",
          lead: "Faster Drive",
          body: "With Drive's new engine, files appear on a new machine in under a second and older versions open right away",
        },
      ],
    },
  },
  {
    version: "0.5.0",
    date: "2026-10-22",
    title: "Claude plan usage and OIDC cloud access",
    visual: image("0.5.0-model-picker.webp"),
    card: {
      summary:
        "Claude plan usage, OIDC cloud access, automations in private threads, and your own MCP accounts",
      highlights: [
        {
          icon: "chain-link",
          lead: "Claude plan usage",
          body: "Pick a Claude Code model to run Claude on your own Claude Pro or Max subscription, through the Claude Agent SDK",
        },
        {
          icon: "globe",
          lead: "OIDC cloud access",
          body: "Capy is an OIDC issuer: a project's machines get short-lived, federated credentials for Google Cloud, AWS, Azure, Vault, or any OIDC relying party",
        },
        {
          icon: "rotate",
          lead: "Automations in private threads",
          body: "Run an automation inside a private thread, edit its description and trigger pattern, and keep its Slack posts quiet",
        },
        {
          icon: "plug",
          lead: "Your own MCP accounts",
          body: "On an organization MCP server, each member can connect their own account instead of sharing one login",
        },
      ],
    },
  },
  {
    version: "0.4.7",
    date: "2026-10-16",
    title: "Spreadsheets, 3D files, and projects from any machine",
    visual: image("0.4.7-spreadsheets.webp"),
    card: {
      summary:
        "Spreadsheets and 3D files in the file viewer, folder projects on any paired machine, a Shared view in Drive, and labels on pull requests",
      highlights: [
        {
          icon: "window",
          lead: "Spreadsheets and 3D files",
          body: "CSV files and workbooks open as tables, and CAD files, 3D models, and G-code open in the 3D viewer",
        },
        {
          icon: "laptop",
          lead: "Projects from any machine",
          body: "Create a project from a folder on any of your paired machines, in the web app or the desktop app",
        },
        {
          icon: "chain-link",
          lead: "Shared links in Drive",
          body: "The **Shared** view in Capy Drive lists every file with a share link and who can open it",
        },
        {
          icon: "pull-request",
          lead: "Labels and previews",
          body: "Add and remove labels from the pull view, and open every preview deployment a pull request has",
        },
      ],
    },
  },
  {
    version: "0.4.6",
    date: "2026-10-09",
    title: "Private threads and projects",
    visual: image("0.4.6-share.webp"),
    card: {
      summary:
        "Private threads and projects, Compact at for each thread, faster long sessions on GPT models, and a new thread chat",
      highlights: [
        {
          icon: "chain-link",
          lead: "Private threads and projects",
          body: "Keep a thread or a project to the people you choose, and a teammate who opens it can ask for access",
        },
        {
          icon: "rotate",
          lead: "Compact at, per thread",
          body: "Choose when a thread compacts from its context meter, up to the model's full window",
        },
        {
          icon: "transfer",
          lead: "Faster GPT sessions",
          body: "Long threads on GPT-6 models run faster and keep going more reliably after compaction",
        },
        {
          icon: "window",
          lead: "A new thread chat",
          body: "Replies split into sections you can reply to, and a message you send while Capy works steers it",
        },
      ],
    },
  },
  {
    version: "0.4.5",
    date: "2026-10-09",
    title: "Paper",
    visual: image("0.4.5-paper.webp"),
    card: {
      summary:
        "Capy reads and edits your Paper files, with the canvas open beside the thread",
      highlights: [
        {
          icon: "plug",
          lead: "Paper",
          body: "Connect your Paper account, and Capy reads and edits your design files in any thread",
        },
        {
          icon: "tabs",
          lead: "The canvas beside the thread",
          body: "Each file Capy works on opens as a tab beside the conversation, where you can edit it yourself",
        },
      ],
    },
  },
  {
    version: "0.4.4",
    date: "2026-10-06",
    title: "Plugins and guided review",
    visual: image("0.4.4-plugins.webp"),
    card: {
      summary:
        "Plugins from the Capy marketplace, a guide on every reviewed pull request, and your own models on a provider key",
      highlights: [
        {
          icon: "plug",
          lead: "Plugins",
          body: "Add a plugin from the **Marketplace**, and its MCP servers and skills are ready in every thread",
        },
        {
          icon: "pull-request",
          lead: "Guided review",
          body: "Every reviewed pull request gets a guide that opens on an overview with before and after views",
        },
        {
          icon: "chain-link",
          lead: "Custom models",
          body: "Run a model Capy's catalog doesn't list yet on your own Anthropic, OpenAI, Google, or xAI key",
        },
        {
          icon: "laptop",
          lead: "Threads without a project",
          body: "On the desktop app, start a thread on This Mac with no project, for general work on your computer",
        },
      ],
    },
  },
  {
    version: "0.4.3",
    date: "2026-10-03",
    title: "Subagents and the full GPT-6 context on Codex",
    visual: image("0.4.3-memory.webp"),
    card: {
      summary:
        "Tasks are now subagents, the GPT-6 models get their full context on Codex, the desktop app starts faster, and Billing shows machine memory",
      highlights: [
        {
          icon: "tabs",
          lead: "Subagents",
          body: "A thread's child agents are now called subagents in the app, the CLI, Slack, and the docs",
        },
        {
          icon: "chain-link",
          lead: "Full GPT-6 context on Codex",
          body: "GPT-6 Astra, Sol, Luna, and GPT-6.1 Sol use their full 1.05M-token context on a Codex subscription",
        },
        {
          icon: "laptop",
          lead: "Faster startup",
          body: "The desktop app opens its window before its background services finish loading",
        },
        {
          icon: "window",
          lead: "Machine memory on Billing",
          body: "The **Billing** page shows the memory your running cloud machines use against your plan's budget",
        },
      ],
    },
  },
  {
    version: "0.4.2",
    date: "2026-10-01",
    title: "Push notifications, free models on This Mac, and fixes",
    card: {
      summary:
        "Push notifications in your browser, free models on This Mac without a plan, threads that move back from the cloud, and fixes",
      highlights: [
        {
          icon: "bell",
          lead: "Push notifications",
          body: "Your browser or Home Screen app gets a notification when a thread mentions you or fails, even with Capy closed",
        },
        {
          icon: "laptop",
          lead: "Free models on This Mac",
          body: "A free model such as MiMo-V2.6 Pro runs on This Mac for an organization with no plan, without opening the paywall",
        },
        {
          icon: "transfer",
          lead: "Return to your Mac",
          body: "A thread that moved to the cloud can move back with **Return to** your device in the machine menu",
        },
        {
          icon: "plug",
          lead: "Linear automation triggers",
          body: "Automations start when a Linear issue is created, changes status, or a cycle ends, filtered by team and label",
        },
      ],
    },
  },
  {
    version: "0.4.1",
    date: "2026-09-30",
    title: "Fixes and shortcuts",
    card: {
      summary:
        "Fixes for organization switching, phones, and the pull request tab, plus sidebar pull request status and thread menu shortcuts",
      highlights: [
        {
          icon: "rotate",
          lead: "Organization switch stays put",
          body: "Switching organizations while a thread is open now keeps the organization you picked instead of switching back",
        },
        {
          icon: "pull-request",
          lead: "Pull request status in the sidebar",
          body: "Thread rows say when a pull request's checks are pending or failing, or when it's ready",
        },
        {
          icon: "tabs",
          lead: "Thread menu shortcuts",
          body: "Press `u`, `a`, or `d` with a thread menu open to mark it unread, archive it, or delete it, and `⇧⌘M` to comment on a selected message",
        },
        {
          icon: "window",
          lead: "Phone layout fixes",
          body: "Tables scroll sideways with the first column pinned, and list rows open their detail page on a phone",
        },
      ],
    },
  },
  {
    version: "0.4.0",
    date: "2026-09-30",
    title: "Model connections and pull request reviews",
    visual: image("0.4.0-models.webp"),
    card: {
      summary:
        "Ordered model connections, reviews from the pull view, and filters in the command menu",
      highlights: [
        {
          icon: "chain-link",
          lead: "Model connections",
          body: "The **Models** page lists your subscriptions and keys and your organization's in order, and a thread asks before it falls back to Capy credits",
        },
        {
          icon: "pull-request",
          lead: "Review pull requests in Capy",
          body: "A **Review** button in the pull view comments, requests changes, or approves as you, and each file carries a **Reviewed** checkbox",
        },
        {
          icon: "window",
          lead: "Command menu filters",
          body: "Category pills and `author:`, `repo:`, `status:`, `label:`, and `since:` tokens in the command menu and on the Threads and Pulls pages",
        },
        {
          icon: "rotate",
          lead: "Edit a sent message",
          body: "Your own sent messages open for editing, with a switcher between their versions",
        },
      ],
    },
  },
  {
    version: "0.3.0",
    date: "2026-09-24",
    title: "MCP servers",
    visual: image("0.3.0-mcp-servers.webp"),
    card: {
      summary:
        "MCP server pages, background file transfers, and keep awake on Mac",
      highlights: [
        {
          icon: "plug",
          lead: "MCP server pages",
          body: "The **MCP** page adds a server by URL or command and shows its tools, health, and owner",
        },
        {
          icon: "transfer",
          lead: "Background file transfers",
          body: "Copies between any two machines run beside the thread instead of blocking it",
        },
        {
          icon: "moon",
          lead: "Keep awake on Mac",
          body: "An opt-in switch on the **This Mac** device page that keeps a Mac on power awake, lid closed included, while a thread runs",
        },
      ],
    },
  },
  {
    version: "0.2.2",
    date: "2026-09-15",
    title: "Desktop notifications",
    card: {
      summary:
        "Desktop notifications for threads that finish or need you, and review actions on local pull requests",
      highlights: [
        {
          icon: "bell",
          lead: "Desktop notifications",
          body: "A notification when a thread finishes or needs you, with sounds and filters on the **Notifications** page",
        },
        {
          icon: "pull-request",
          lead: "Local pull request review",
          body: "A **Diff** tab and ready, draft, close, reopen, and merge actions on local pull requests",
        },
      ],
    },
  },
  {
    version: "0.2.1",
    date: "2026-09-12",
    title: "Linux fixes",
    card: {
      summary: "Linux window, sign-in, and update fixes",
      highlights: [
        {
          icon: "window",
          lead: "Linux window fixes",
          body: "The Capy icon and name in the dock, and the window on Wayland",
        },
        {
          icon: "rotate",
          lead: "Linux sign-in and updates",
          body: "Sign-in without a keyring, and a relaunch after an update",
        },
      ],
    },
  },
  {
    version: "0.2.0",
    date: "2026-09-10",
    title: "Capy for Desktop",
    visual: image("0.2.0.webp"),
    card: {
      summary:
        "The desktop app for macOS, Windows, and Linux, with threads that run in folders on your own machine",
      highlights: [
        {
          icon: "laptop",
          lead: "Threads in local folders",
          body: "A thread runs in a linked folder on your Mac or Windows PC, with your own git credentials",
        },
        {
          icon: "window",
          lead: "macOS, Windows, and Linux builds",
          body: "Signed builds for macOS and Windows, and an AppImage and .deb for Linux on x64 and arm64",
        },
      ],
    },
  },
  {
    version: "beta",
    date: "2026-08-11",
    title: "Threads on cloud machines",
    card: {
      summary:
        "A coding agent that takes a task from the web app, Slack, Linear, or the API and opens the pull request",
      highlights: [
        {
          icon: "pull-request",
          lead: "One cloud machine per thread",
          body: "Each thread works on its own cloud machine with your repositories cloned and opens the pull request",
        },
        {
          icon: "chain-link",
          lead: "Web, Slack, Linear, and API",
          body: "Threads start from the web app, a Slack mention, a Linear issue, or the public API",
        },
        {
          icon: "rotate",
          lead: "CI and review follow-up",
          body: "A thread wakes on CI results, review comments, and merges on its pull requests",
        },
      ],
    },
  },
];

export const releaseKey = (version: string) => `release-${version}`;

export const releaseDate = (release: Pick<Release, "date">) =>
  new Date(`${release.date}T00:00:00Z`);

export const isReleased = (release: Pick<Release, "date">, now: Date) =>
  release.date <= now.toISOString().slice(0, 10);

export const formatReleaseVersion = (version: string) =>
  version === "beta" ? "Beta" : version;

export const releaseHistory = (version: string, now: Date = new Date()) =>
  RELEASES.filter(
    (release) => release.version === version || isReleased(release, now),
  );
