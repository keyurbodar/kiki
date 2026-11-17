# features/thread

Owner: B7, B8. Scope: thread view: chat timeline, messages, activity, cards and takeovers.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

Stub units with their final data-slot names: `jam-chat`, `user-message`, `agent-message`, `message-footer`, `reply-quote`, `activity-line`, `activity-pill`, `activity-row`, `cluster-row`, `work-group`, `markers`, `automation-message`, `attachment-gallery`, `clarify-takeover`, `request-takeover`, `mcp-setup-card`, `attention-card`, `drive-reference-cards`, `crew-asks`, `explore-suggestion-dock`, `summary-card`, `cost-badge`, `media-comment-layer`.
