import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { ProjectSelect } from "@/components/project-select";
import type {
  ExploreListing,
  ListingSetup as Setup,
} from "@/data/api/schemas/explore";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import { addSkillAtom, volumeReactivityKey } from "@/data/atoms/explore";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";
import { toast } from "@/primitives/toaster";
import { errorMessage } from "../dialogs";
import { useRecordAdded } from "../listing-add-action";
import { useOrgProjects } from "../skill-scope-dialog/project-picker";
import { useOrgId, useSignedIn } from "./explore-session";
import { installDescription, installFailure } from "./format";
import { ArrowRightGlyph, ArrowUpRightGlyph } from "./glyphs";
import { SignInLink } from "./sign-in-link";
import { useStartThread } from "./start-thread";

export type Installed = { project: string; installationId: string | null };

function SetupSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="relative isolate flex flex-col gap-2.5 overflow-hidden rounded-(--radius-panel) border-hairline border-border-1 bg-panel px-8 py-7 shadow-card max-md:px-4 max-md:py-5">
      <p className="relative text-sm text-muted-foreground-1">{title}</p>
      {children}
    </section>
  );
}

function StepButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center gap-3 rounded-(--radius-card) border-hairline border-border-1 bg-card py-2.5 pr-2.5 pl-3.5 text-left text-sm text-foreground outline-none transition-colors duration-100 hover:bg-card-hover focus-visible:outline-ring-inset"
    >
      <span className="min-w-0 flex-1">{children}</span>
      <span className="flex size-(--h-control-xs) shrink-0 items-center justify-center rounded bg-secondary">
        <ArrowRightGlyph size="sm" />
      </span>
    </button>
  );
}

export const starterSteps = (listing: ExploreListing, setup: Setup) =>
  setup.starters ??
  (listing.content.kind === "skill"
    ? listing.content.skill.starters.slice(0, 2)
    : []);

export type ListingSetupProps = {
  listing: ExploreListing;
  setup: Setup;
  installed: Installed | null;
  onInstalled: (installed: Installed) => void;
};

export function ListingSetupPanel({
  listing,
  setup,
  installed,
  onInstalled,
}: ListingSetupProps) {
  const card = listing.card;
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  const orgId = useOrgId();
  const projects = useOrgProjects(orgId);
  const addSkill = useAtomSet(addSkillAtom, { mode: "promise" });
  const recordAdded = useRecordAdded(orgId);
  const startThread = useStartThread();
  const [picked, setPicked] = useState<Project>();
  const [busy, setBusy] = useState<"install" | "thread" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const project = signedIn ? (picked ?? projects[0]) : undefined;
  const oauth =
    listing.content.kind === "plugin" &&
    listing.content.plugin.servers.some((server) => server.auth === "oauth");

  const start = (text: string) => {
    if (project === undefined || busy !== null) return;
    setBusy("thread");
    startThread(project.id, text)
      .then((threadId) =>
        navigate({ to: "/thread/$threadId", params: { threadId } }),
      )
      .catch((error: unknown) => {
        setBusy(null);
        toast.error(errorMessage(error, "Could not start the thread"));
      });
  };

  if (installed !== null)
    return (
      <SetupSection title="Try it in a thread">
        {starterSteps(listing, setup).map((step) => (
          <StepButton key={step} onClick={() => start(step)}>
            {step}
          </StepButton>
        ))}
      </SetupSection>
    );

  const install = () => {
    if (orgId === undefined || project === undefined || busy !== null) return;
    setBusy("install");
    setFailure(null);
    const request =
      card.kind === "skill"
        ? addSkill({
            params: { orgId },
            payload: { slug: card.slug, scope: { projectId: project.id } },
            reactivityKeys: [volumeReactivityKey(orgId)],
          })
        : Promise.reject(new Error(`Could not install ${card.displayName}`));
    request
      .then(() => {
        recordAdded([
          { kind: card.kind, slug: card.slug, versionId: card.versionId },
        ]);
        setBusy(null);
        onInstalled({ project: project.name, installationId: null });
      })
      .catch((error: unknown) => {
        setBusy(null);
        setFailure(
          errorMessage(error, `Could not install ${card.displayName}`),
        );
      });
  };

  return (
    <SetupSection title={`Set up ${card.displayName}`}>
      <Card rows className="relative">
        <SettingsRow
          label="Install in"
          description={
            failure === null
              ? installDescription(listing)
              : installFailure(failure, undefined)
          }
          className="max-sm:flex-wrap"
        >
          {signedIn ? (
            <>
              {projects.length === 0 ? (
                <span className="text-sm text-muted-foreground-2">
                  Create a project first
                </span>
              ) : (
                <ProjectSelect
                  orgId={orgId as OrgId}
                  value={project}
                  onValueChange={setPicked}
                  onManage={() => navigate({ to: "/settings/projects" })}
                />
              )}
              <Button
                intent="accent"
                size="sm"
                disabled={project === undefined || busy !== null}
                aria-busy={busy === "install" || undefined}
                onClick={install}
              >
                {busy === "install"
                  ? "Installing"
                  : oauth
                    ? "Install and connect"
                    : "Install"}
                {oauth && busy !== "install" && <ArrowUpRightGlyph size="sm" />}
              </Button>
            </>
          ) : (
            <SignInLink>Sign in to install</SignInLink>
          )}
        </SettingsRow>
      </Card>
    </SetupSection>
  );
}
