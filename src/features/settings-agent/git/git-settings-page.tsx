import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsLoadingCard } from "@/components/settings-page";
import {
  agentSettingsKeys,
  configureFeedbackAtom,
  ensureGitSigningAtom,
  gitSigningAtom,
  rotateGitSigningAtom,
  updatePreferencesAtom,
} from "@/data/atoms/agent-settings";
import { reactivityKeys } from "@/data/atoms/conventions";
import {
  errorMessage,
  type FeedbackSettings,
  type GitPreferences,
  SettingsAgentPage,
  useActiveOrganization,
  useAgentPreferences,
  useFeedbackSettings,
  useIsAdmin,
} from "../threads";
import { GitSettingsSection } from "./git-section";
import { readGitSigning } from "./git-settings";
import { PullRequestSettings } from "./pull-requests-section";

const userKeys = [reactivityKeys.currentUser];

type GitPatch = { [K in keyof GitPreferences]?: GitPreferences[K] | null };

export function GitSettingsPage() {
  return (
    <SettingsAgentPage page="git">
      {(scope) => (scope === "you" ? <GitYou /> : <GitOrg />)}
    </SettingsAgentPage>
  );
}

function GitYou() {
  const preferences = useAgentPreferences();
  const feedback = useFeedbackSettings();
  const signingResult = useAtomValue(gitSigningAtom);
  const refreshSigning = useAtomRefresh(gitSigningAtom);
  const updatePreferences = useAtomSet(updatePreferencesAtom, {
    mode: "promise",
  });
  const ensureSigning = useAtomSet(ensureGitSigningAtom, { mode: "promise" });
  const rotateSigning = useAtomSet(rotateGitSigningAtom, { mode: "promise" });
  const [busy, setBusy] = useState<string | null>(null);
  if (preferences === undefined || feedback === undefined)
    return <SettingsLoadingCard />;
  const signing = AsyncResult.isSuccess(signingResult)
    ? readGitSigning(signingResult.value)
    : undefined;

  const updateGit = (patch: GitPatch) => {
    setBusy(Object.keys(patch)[0] ?? "git");
    return updatePreferences({
      payload: { git: patch },
      reactivityKeys: userKeys,
    })
      .then(() => true)
      .catch((error) => {
        toast.error(errorMessage(error, "Could not update Git settings"));
        return false;
      })
      .finally(() => setBusy(null));
  };
  const updateGithub = (key: keyof FeedbackSettings, value: unknown) => {
    setBusy(key);
    updatePreferences({
      payload: { github: { [key]: value ?? null } },
      reactivityKeys: userKeys,
    })
      .catch((error) =>
        toast.error(errorMessage(error, "Could not update your Capy behavior")),
      )
      .finally(() => setBusy(null));
  };

  return (
    <>
      <GitSettingsSection
        preferences={preferences}
        signing={signing}
        busy={busy}
        onCommitAuthorChange={(option) =>
          void updateGit({
            commitAuthor: option.author === "user" ? null : option.author,
            coAuthor: option.coAuthor,
          })
        }
        onCommitEmailChange={(commitEmail) => updateGit({ commitEmail })}
        onBranchPrefixChange={(branchPrefix) => updateGit({ branchPrefix })}
        onSigningChange={(signCommits) => {
          setBusy("signCommits");
          (signCommits ? ensureSigning({}) : Promise.resolve(undefined))
            .then(() =>
              updatePreferences({
                payload: { gitSigning: { signCommits } },
                reactivityKeys: userKeys,
              }),
            )
            .then(refreshSigning)
            .catch((error) =>
              toast.error(
                errorMessage(error, "Could not update signed commits"),
              ),
            )
            .finally(() => setBusy(null));
        }}
        onRotate={() => {
          setBusy("rotateSigning");
          rotateSigning({})
            .then(refreshSigning)
            .catch((error) =>
              toast.error(
                errorMessage(error, "Could not rotate the signing key"),
              ),
            )
            .finally(() => setBusy(null));
        }}
      />
      <PullRequestSettings
        scope="you"
        values={preferences.github}
        organization={feedback}
        busy={busy}
        onModeChange={updateGithub}
        onAgeChange={(days) => updateGithub("conflictMaxThreadAgeDays", days)}
        onBotAllowlistChange={(logins) => updateGithub("botAllowlist", logins)}
        onDraftDefaultChange={(draft) => updateGithub("prDraftDefault", draft)}
        onBadgeChange={(shown) => updateGithub("prBadge", shown)}
      />
    </>
  );
}

function GitOrg() {
  const { organization } = useActiveOrganization();
  const feedback = useFeedbackSettings();
  const configure = useAtomSet(configureFeedbackAtom, { mode: "promise" });
  const { isAdmin, adminReason } = useIsAdmin();
  const [busy, setBusy] = useState<string | null>(null);
  if (feedback === undefined || organization === undefined)
    return <SettingsLoadingCard />;
  const save = (key: keyof FeedbackSettings, value: unknown) => {
    if (value === undefined) return;
    setBusy(key);
    configure({
      params: { orgId: organization.id },
      payload: { [key]: value },
      reactivityKeys: [agentSettingsKeys.feedbackSettings(organization.id)],
    })
      .catch((error) =>
        toast.error(errorMessage(error, "Could not update Capy behavior")),
      )
      .finally(() => setBusy(null));
  };
  return (
    <PullRequestSettings
      scope="org"
      values={feedback}
      organization={feedback}
      busy={busy}
      disabled={!isAdmin}
      disabledReason={adminReason}
      onModeChange={save}
      onAgeChange={(days) => save("conflictMaxThreadAgeDays", days)}
      onBotAllowlistChange={(logins) => save("botAllowlist", logins)}
      onDraftDefaultChange={(draft) => save("prDraftDefault", draft)}
      onBadgeChange={(shown) => save("prBadge", shown)}
    />
  );
}
