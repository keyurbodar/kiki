import { LoadingButton } from "@/lib/loading-button";
import {
  type AgentAccessRow,
  accessStatusLine,
  byAccessOrder,
  type MessageAccessRow,
} from "./access";
import { AccessGrid, AccessGridCell, AccessGridRow } from "./access-grid";

type ListProps<Row, Arg> = {
  rows: ReadonlyArray<Row>;
  pendingId?: string | null;
  onGrant?: (arg: Arg) => void;
  onDeny?: (arg: Arg) => void;
  onRevoke?: (arg: Arg) => void;
};

export type DeviceAccessListProps = ListProps<MessageAccessRow, string>;

export function DeviceAccessList({
  rows,
  pendingId = null,
  onGrant,
  onDeny,
  onRevoke,
}: DeviceAccessListProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground-2">
        No one has asked to message this thread yet
      </p>
    );
  }
  const busy = pendingId !== null;
  return (
    <AccessGrid columns="minmax(0,1fr) auto" className="-mx-4 w-auto">
      {rows.toSorted(byAccessOrder).map((row) => (
        <AccessGridRow key={row.id}>
          <AccessGridCell className="py-2">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {row.member}
              </span>
              <span className="text-xs text-muted-foreground-2">
                {accessStatusLine(row)}
              </span>
              {row.status === "requested" && row.heldText !== null && (
                <span className="line-clamp-2 pt-1 text-xs text-muted-foreground-1">
                  {row.heldText}
                </span>
              )}
            </span>
          </AccessGridCell>
          <AccessGridCell className="justify-end py-2 pr-0">
            <span className="flex shrink-0 items-center gap-1">
              {row.status === "requested" && (
                <LoadingButton
                  size="xs"
                  variant="ghost"
                  disabled={busy}
                  loading={pendingId === `deny:${row.id}`}
                  loadingLabel="Denying"
                  onClick={() => onDeny?.(row.id)}
                >
                  Deny
                </LoadingButton>
              )}
              {row.status === "granted" ? (
                <LoadingButton
                  size="xs"
                  variant="ghost"
                  disabled={busy}
                  loading={pendingId === `revoke:${row.id}`}
                  loadingLabel="Revoking"
                  onClick={() => onRevoke?.(row.id)}
                >
                  Revoke
                </LoadingButton>
              ) : (
                <LoadingButton
                  size="xs"
                  intent={row.status === "requested" ? "accent" : undefined}
                  variant={row.status === "requested" ? "solid" : "outline"}
                  disabled={busy}
                  loading={pendingId === `grant:${row.id}`}
                  loadingLabel="Allowing"
                  onClick={() => onGrant?.(row.id)}
                >
                  Allow
                </LoadingButton>
              )}
            </span>
          </AccessGridCell>
        </AccessGridRow>
      ))}
    </AccessGrid>
  );
}

export type DeviceAgentAccessListProps = ListProps<
  AgentAccessRow,
  AgentAccessRow
>;

export function DeviceAgentAccessList({
  rows,
  pendingId = null,
  onGrant,
  onDeny,
  onRevoke,
}: DeviceAgentAccessListProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground-2">
        Capy has not asked for extra access from this thread
      </p>
    );
  }
  const busy = pendingId !== null;
  return (
    <AccessGrid columns="minmax(0,1fr) auto" className="-mx-4 w-auto">
      {rows.toSorted(byAccessOrder).map((row) => (
        <AccessGridRow key={row.id}>
          <AccessGridCell className="py-2">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {row.title}
              </span>
              <span className="text-xs text-muted-foreground-2">
                {accessStatusLine(row)}
              </span>
              {row.call !== undefined && (
                <>
                  <span className="truncate pt-1 text-xs text-muted-foreground-1">
                    {row.call.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground-2">
                    {row.call.toolName} · {row.call.detail}
                  </span>
                </>
              )}
              {row.summary !== undefined && (
                <span className="truncate pt-1 text-xs text-muted-foreground-1">
                  {row.summary}
                </span>
              )}
            </span>
          </AccessGridCell>
          <AccessGridCell className="justify-end py-2 pr-0">
            <span className="flex shrink-0 items-center gap-1">
              {row.status === "requested" && (
                <LoadingButton
                  size="xs"
                  variant="ghost"
                  disabled={busy}
                  loading={pendingId === `deny:${row.id}`}
                  loadingLabel="Denying"
                  onClick={() => onDeny?.(row)}
                >
                  Deny
                </LoadingButton>
              )}
              {(row.status === "granted" || row.status === "denied") && (
                <LoadingButton
                  size="xs"
                  variant="ghost"
                  disabled={busy}
                  loading={pendingId === `revoke:${row.id}`}
                  loadingLabel="Revoking"
                  onClick={() => onRevoke?.(row)}
                >
                  Revoke
                </LoadingButton>
              )}
              {row.status !== "granted" && (
                <LoadingButton
                  size="xs"
                  intent={row.status === "requested" ? "accent" : undefined}
                  variant={row.status === "requested" ? "solid" : "outline"}
                  disabled={busy}
                  loading={pendingId === `grant:${row.id}`}
                  loadingLabel="Allowing"
                  onClick={() => onGrant?.(row)}
                >
                  Allow
                </LoadingButton>
              )}
            </span>
          </AccessGridCell>
        </AccessGridRow>
      ))}
    </AccessGrid>
  );
}
