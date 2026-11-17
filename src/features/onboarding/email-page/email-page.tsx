import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { AsyncResult, Atom } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { CapyMark } from "@/components/capy-logo";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { currentUserAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { Button } from "@/primitives/button";
import { EmailLayout } from "./email-layout";
import {
  type EmailProgram,
  emailPrograms,
  programSubscription,
} from "./email-programs";

export const emailPreferencesKey = (userId: string) =>
  `email-preferences:${userId}`;

export const emailPreferencesAtom = Atom.family((userId: string) =>
  ApiClient.query("emailPreferences", "get", {
    reactivityKeys: [emailPreferencesKey(userId)],
    timeToLive: queryTimeToLive,
  }),
);

export const setEmailProgramAtom = ApiClient.mutation(
  "emailPreferences",
  "setProgram",
);

const linkClass = "text-foreground hover:underline underline-offset-2";

function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CapyMark className="h-9" />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-foreground">{title}</h1>
        {subtitle ? (
          <p className="text-sm font-normal text-muted-foreground-1">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Step({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-6 transition-[opacity,translate] duration-base ease-out-quint starting:opacity-0 motion-safe:starting:translate-y-1">
      {children}
    </div>
  );
}

export function EmailPage({ program }: { program: EmailProgram }) {
  const user = AsyncResult.getOrElse(
    useAtomValue(currentUserAtom),
    () => undefined,
  );
  return (
    <EmailLayout>
      {user === undefined ? null : (
        <EmailLandingStep
          program={program}
          userId={user.id}
          email={user.email}
        />
      )}
    </EmailLayout>
  );
}

export function EmailLandingStep({
  program,
  userId,
  email,
}: {
  program: EmailProgram;
  userId: string;
  email: string | null;
}) {
  const preferences = useAtomValue(emailPreferencesAtom(userId));
  const setProgram = useAtomSet(setEmailProgramAtom, { mode: "promise" });
  const [override, setOverride] = useState<boolean>();
  const [saving, setSaving] = useState(false);
  const meta = emailPrograms[program];
  const loaded = AsyncResult.getOrElse(preferences, () => undefined);
  const subscribed =
    override ??
    (loaded === undefined ? undefined : programSubscription(loaded, program)) ??
    true;
  const inbox = email ?? "your inbox";

  const update = (next: boolean) => {
    setOverride(next);
    setSaving(true);
    setProgram({
      params: { program },
      payload: { subscribed: next },
      reactivityKeys: [emailPreferencesKey(userId)],
    }).then(
      () => setSaving(false),
      () => {
        setSaving(false);
        setOverride(undefined);
        toast.error("Could not update email preferences");
      },
    );
  };

  const footer = (
    <div className="flex items-center justify-center gap-1 text-xs font-normal text-muted-foreground-2">
      <Link
        data-track-owner="features/settings/email-landing.tsx#EmailLandingStep:Link[Manage all email]"
        className={linkClass}
        to="/settings/notifications/email"
        search={subscribed ? {} : { from: program }}
      >
        Manage all email
      </Link>
    </div>
  );

  if (loaded === undefined && AsyncResult.isFailure(preferences)) {
    return (
      <Step key="unavailable">
        <StepHeading
          title="Email preferences are unavailable"
          subtitle="Try again in a minute"
        />
        {footer}
      </Step>
    );
  }

  if (!subscribed) {
    return (
      <Step key="stopped">
        <StepHeading
          title={`${meta.label} stopped`}
          subtitle={`No more of these to ${inbox}`}
        />
        <Button
          data-track-owner="features/settings/email-landing.tsx#EmailLandingStep:Button[Undo]"
          size="base"
          className="w-full"
          disabled={saving}
          aria-busy={saving}
          onClick={() => update(true)}
        >
          Undo
        </Button>
        {footer}
      </Step>
    );
  }

  return (
    <Step key="ask">
      <StepHeading
        title={meta.question}
        subtitle={`Sent to ${inbox} ${meta.cadence}`}
      />
      <Button
        data-track-owner="features/settings/email-landing.tsx#EmailLandingStep:Button.1"
        intent="accent"
        size="base"
        className="w-full"
        disabled={loaded === undefined || saving}
        aria-busy={saving}
        onClick={() => update(false)}
      >
        {meta.stop}
      </Button>
      {footer}
    </Step>
  );
}
