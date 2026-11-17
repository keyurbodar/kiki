import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createOrganizationAtom,
  inviteMembersAtom,
  joinableOrganizationsAtom,
  myInvitationsAtom,
  renameOrganizationAtom,
  setSharingAtom,
  skipOnboardingStepAtom,
  startLinearOAuthAtom,
  startSlackOAuthAtom,
  updateAccountNameAtom,
} from "@/data/atoms/onboarding";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import { Toaster } from "@/primitives/toaster";
import {
  displayName,
  firstStep,
  nextStep,
  type OnboardingPath,
  type OnboardingSearch,
  type OnboardingStep,
  onboardingStart,
  previousStep,
  type SubscriptionService,
  splitEmails,
  splitName,
  stepperFor,
  subscriptionLabels,
} from "./flow";
import { OnboardingShell, Stepper, StepSkeleton } from "./shell";
import {
  ConnectStep,
  GitHubStep,
  PlanStep,
  ProfileStep,
  RecommendedStep,
} from "./steps";
import {
  type Invitation,
  WorkspaceStep,
  type WorkspaceView,
} from "./workspace-step";

const asList = <A,>(result: AsyncResult.AsyncResult<unknown, unknown>) =>
  AsyncResult.isSuccess(result) && Array.isArray(result.value)
    ? (result.value as ReadonlyArray<A>)
    : [];

const orgIdOf = (value: unknown) =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string"
    ? value.id
    : undefined;

export function OnboardingPage({ search }: { search: OnboardingSearch }) {
  const navigate = useNavigate();
  const start = onboardingStart(search);
  const user = useAtomValue(currentUserAtom);
  const organizations = useAtomValue(organizationsAtom);
  const invitationsResult = useAtomValue(myInvitationsAtom);
  const joinableResult = useAtomValue(joinableOrganizationsAtom);
  const createOrganization = useAtomSet(createOrganizationAtom, {
    mode: "promise",
  });
  const setSharing = useAtomSet(setSharingAtom, { mode: "promise" });
  const skipStep = useAtomSet(skipOnboardingStepAtom, { mode: "promise" });
  const renameAccount = useAtomSet(updateAccountNameAtom, { mode: "promise" });
  const renameOrganization = useAtomSet(renameOrganizationAtom, {
    mode: "promise",
  });
  const inviteMembers = useAtomSet(inviteMembersAtom, { mode: "promise" });
  const startSlack = useAtomSet(startSlackOAuthAtom, { mode: "promise" });
  const startLinear = useAtomSet(startLinearOAuthAtom, { mode: "promise" });

  const [orgId, setOrgId] = useState<string>();
  const [orgName, setOrgName] = useState<string>();
  const [path, setPath] = useState<OnboardingPath>(start.path);
  const [step, setStep] = useState<OnboardingStep | undefined>(
    start.view === undefined ||
      start.view === "workspace" ||
      start.view === "invites"
      ? undefined
      : start.view,
  );
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>();
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [connected, setConnected] = useState<ReadonlySet<SubscriptionService>>(
    new Set(),
  );
  const [invitesSent, setInvitesSent] = useState(0);
  const [inviting, setInviting] = useState(false);

  const signedOut =
    AsyncResult.isFailure(user) &&
    String(AsyncResult.toExit(user)).includes("Unauthorized");
  const profile = AsyncResult.isSuccess(user) ? user.value : undefined;
  const orgList = AsyncResult.isSuccess(organizations)
    ? organizations.value
    : undefined;
  const onboarded =
    start.view === undefined &&
    profile !== undefined &&
    profile.onboardedAt !== null &&
    orgList !== undefined &&
    orgList.length > 0;

  useEffect(() => {
    if (signedOut) navigate({ to: "/sign-in", replace: true });
    else if (onboarded) navigate({ to: "/new", replace: true });
  }, [signedOut, onboarded, navigate]);

  const leave = () => navigate({ to: "/new", replace: true });
  const logOut = () => navigate({ to: "/sign-in", replace: true });

  if (signedOut || onboarded) return null;

  if (profile === undefined || orgList === undefined) {
    return (
      <OnboardingShell onLogOut={logOut}>
        <StepSkeleton />
      </OnboardingShell>
    );
  }

  const existing = orgList[0];
  const activeOrgId = orgId ?? existing?.id;
  const activeOrgName = orgName ?? existing?.name ?? "";
  const personalName = displayName(profile) || "Personal";
  const team = path === "team";
  const invitee = path === "invitee";
  const currentStep =
    step ??
    (activeOrgId !== undefined &&
    start.view !== "workspace" &&
    start.view !== "invites"
      ? firstStep(path)
      : undefined);

  const steps = stepperFor(path, {
    withPlan: currentStep === "plan",
    coveredInvitee: start.coveredInvitee,
  });
  const go = (target: OnboardingStep | undefined) => {
    if (target !== undefined) setStep(target);
  };
  const advance = (from: OnboardingStep) => () => go(nextStep(path, from));
  const back = (from: OnboardingStep) => {
    const target = previousStep(path, from, start.coveredInvitee);
    return target === undefined ? undefined : () => go(target);
  };

  if (currentStep === undefined) {
    const stepper =
      workspaceView === undefined ? null : workspaceView === "invites" ? (
        <Stepper
          steps={stepperFor("invitee", {
            withPlan: false,
            coveredInvitee: false,
          })}
          current="join"
        />
      ) : (
        <Stepper steps={steps} current="workspace" />
      );
    return (
      <OnboardingShell onLogOut={logOut} stepper={stepper}>
        <WorkspaceStep
          invitations={asList<Invitation>(invitationsResult)}
          joinableOrganizations={asList(joinableResult)}
          personalName={personalName}
          busy={busy}
          initialView={start.view === "invites" ? "invites" : undefined}
          viewerEmail={profile.email ?? undefined}
          onViewChange={setWorkspaceView}
          onAcceptInvitation={() =>
            toast.error("This invitation is no longer available")
          }
          onJoinByDomain={() =>
            toast.error("This organization is no longer available to join")
          }
          onChoose={(name, chosen, sharing) => {
            setBusy(true);
            createOrganization({ payload: { name } })
              .then((created) => {
                const id = orgIdOf(created);
                if (id === undefined)
                  throw new Error("missing organization id");
                setOrgId(id);
                setOrgName(name);
                setPath(chosen);
                setStep("profile");
                if (chosen === "personal") {
                  skipStep({
                    params: { orgId: id, step: "invite-teammate" },
                  }).catch(() => undefined);
                }
                if (
                  sharing !== undefined &&
                  !(sharing.defaultVisibility === "org" && sharing.privateWork)
                ) {
                  setSharing({ params: { orgId: id }, payload: sharing }).catch(
                    () =>
                      toast.error(
                        "Could not save sharing, change it in Settings → Organization",
                      ),
                  );
                }
              })
              .catch(() => toast.error("Could not create the organization"))
              .finally(() => setBusy(false));
          }}
        />
        <Toaster position="bottom-right" />
      </OnboardingShell>
    );
  }

  const orgParams = { orgId: activeOrgId ?? "" };
  const stepper = <Stepper steps={steps} current={currentStep} />;

  const content =
    currentStep === "profile" ? (
      <ProfileStep
        team={team}
        name={displayName(profile)}
        orgName={activeOrgName}
        loading={false}
        onRename={(name) =>
          renameAccount({ payload: splitName(name) }).catch(() =>
            toast.error("Could not update your name"),
          )
        }
        onRenameOrg={(name) =>
          renameOrganization({ params: orgParams, payload: { name } })
            .then(() => setOrgName(name))
            .catch(() => toast.error("Could not rename the organization"))
        }
        onContinue={advance("profile")}
        onBack={invitee ? undefined : () => setStep(undefined)}
      />
    ) : currentStep === "subscription" ? (
      <ConnectStep
        connected={connected}
        onConnect={(service) => {
          setConnected((current) => new Set([...current, service]));
          toast.success(`${subscriptionLabels[service]} connected`);
        }}
        onContinue={advance("subscription")}
        onBack={back("subscription")}
      />
    ) : currentStep === "github" ? (
      <GitHubStep
        connected={start.githubConnected}
        installing={false}
        onInstall={() => toast.error("Could not link the GitHub installation")}
        onContinue={advance("github")}
        onBack={() => go("subscription")}
      />
    ) : currentStep === "plan" ? (
      <PlanStep
        wide
        stepper={stepper}
        leaving={finishing}
        onBack={() => go("recommended")}
        onDone={() => leave()}
      />
    ) : (
      <RecommendedStep
        team={team || invitee}
        showReview={!invitee}
        githubConnected={start.githubConnected}
        slackConnected={false}
        linearConnected={false}
        finishLabel="Finish"
        finishBusy={finishing}
        themeLabel="System"
        invite={{
          sent: invitesSent,
          busy: inviting,
          send: (value) => {
            const emails = splitEmails(value);
            if (emails.length === 0) return Promise.resolve(false);
            setInviting(true);
            return inviteMembers({ params: orgParams, payload: { emails } })
              .then(() => {
                setInvitesSent((sent) => sent + emails.length);
                return true;
              })
              .catch(() => {
                toast.error("Could not send invitations");
                return false;
              })
              .finally(() => setInviting(false));
          },
        }}
        onConnectSlack={() =>
          startSlack({ params: orgParams, payload: {} }).catch(() =>
            toast.error("Could not start the Slack connection"),
          )
        }
        onConnectLinear={() =>
          startLinear({ params: orgParams }).catch(() =>
            toast.error("Could not start the Linear connection"),
          )
        }
        onConnectGitHub={() => go("github")}
        onFinish={() => {
          setFinishing(true);
          leave();
        }}
        onBack={back("recommended")}
      />
    );

  return (
    <OnboardingShell
      onLogOut={logOut}
      wide={currentStep === "plan"}
      stepper={stepper}
    >
      {content}
      <Toaster position="bottom-right" />
    </OnboardingShell>
  );
}
