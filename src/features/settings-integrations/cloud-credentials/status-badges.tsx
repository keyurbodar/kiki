import type {
  CloudAccessCheck,
  CloudAccessTarget,
  CloudProvider,
} from "@/data/api/schemas/cloud-access";
import { Badge } from "@/primitives/badge";
import { checkStatus, providerStatus } from "./status";

export function ProviderStatusBadge({
  targets,
}: {
  targets: ReadonlyArray<CloudAccessTarget>;
}) {
  switch (providerStatus(targets)) {
    case "not_connected":
      return <Badge color="neutral">Not connected</Badge>;
    case "check_failed":
      return <Badge color="warning">Check failed</Badge>;
    case "connected":
      return <Badge color="success">Connected</Badge>;
  }
}

export function CheckBadge({
  provider,
  check,
}: {
  provider: CloudProvider;
  check: CloudAccessCheck | null;
}) {
  switch (checkStatus(provider, check)) {
    case "machine":
      return <Badge color="neutral">Checked from a machine</Badge>;
    case "not_checked":
      return <Badge color="neutral">Not checked</Badge>;
    case "passed":
      return <Badge color="success">Passed</Badge>;
    case "failed":
      return <Badge color="danger">Failed</Badge>;
  }
}
