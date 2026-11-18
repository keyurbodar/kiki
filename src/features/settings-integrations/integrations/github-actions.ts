import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  integrationKeys,
  startGitHubInstallationAtom,
} from "@/data/atoms/integrations";
import { ApiClient } from "@/data/client/ApiClient";
import { authorizeUrlOf } from "./oauth";

const startGitHubUserOAuth = ApiClient.mutation(
  "integrations",
  "startGitHubUserOAuth",
);

const disconnectGitHubUser = ApiClient.mutation(
  "integrations",
  "disconnectGitHubUser",
);

const disconnectGitHubInstallation = ApiClient.mutation(
  "integrations",
  "disconnectGitHubInstallation",
);

const unlinkGitHubInstallation = ApiClient.mutation(
  "integrations",
  "unlinkGitHubInstallation",
);

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message !== "" ? error.message : fallback;

export const githubManageUrl = (manageUrl: string | null) =>
  manageUrl ?? "https://github.com/settings/installations";

/** Starts the GitHub App installation and hands the browser to GitHub. */
export function useGitHubInstallInstallation(orgId: string) {
  const start = useAtomSet(startGitHubInstallationAtom, { mode: "promise" });
  const [installing, setInstalling] = useState(false);
  const install = async () => {
    setInstalling(true);
    try {
      const url = authorizeUrlOf(await start({ params: { orgId }, query: {} }));
      if (url === undefined) {
        toast.error("GitHub did not return an install link");
        return;
      }
      window.location.assign(url);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Could not start the GitHub install"));
    } finally {
      setInstalling(false);
    }
  };
  return { installing, install };
}

/** Starts the GitHub account OAuth flow and hands the browser to GitHub. */
export function useGitHubConnectAccount(orgId: string) {
  const start = useAtomSet(startGitHubUserOAuth, { mode: "promise" });
  const [connecting, setConnecting] = useState(false);
  const connect = async () => {
    setConnecting(true);
    try {
      const url = authorizeUrlOf(await start({ params: { orgId }, query: {} }));
      if (url === undefined) {
        toast.error("GitHub did not return an authorization link");
        return;
      }
      window.location.assign(url);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Could not connect your GitHub account"));
    } finally {
      setConnecting(false);
    }
  };
  return { connecting, connect };
}

/** The org-level disconnect: the whole Capy GitHub app leaves this workspace. */
export function useDisconnectGitHubApp(orgId: string) {
  const disconnect = useAtomSet(disconnectGitHubInstallation, {
    mode: "promise",
  });
  return () =>
    disconnect({
      params: { orgId },
      reactivityKeys: integrationKeys.githubInstallation(orgId),
    })
      .then(() => toast.success("GitHub app disconnected"))
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not disconnect the GitHub app")),
      );
}

/** Unlinking one GitHub account's installation, leaving the app in place. */
export function useUnlinkGitHubInstallation(orgId: string) {
  const unlink = useAtomSet(unlinkGitHubInstallation, { mode: "promise" });
  return (installationId: number) =>
    unlink({
      params: { orgId, installationId: String(installationId) },
      reactivityKeys: integrationKeys.githubInstallation(orgId),
    })
      .then(() => toast.success("Installation unlinked"))
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not unlink the installation")),
      );
}

/** Disconnecting the viewer's own GitHub account token. */
export function useDisconnectGitHubAccount() {
  const disconnect = useAtomSet(disconnectGitHubUser, { mode: "promise" });
  return () =>
    disconnect({ reactivityKeys: integrationKeys.githubUser })
      .then(() => toast.success("GitHub account disconnected"))
      .catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not disconnect the account")),
      );
}
