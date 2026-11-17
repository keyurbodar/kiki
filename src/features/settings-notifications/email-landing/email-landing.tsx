import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { CapyMark } from "@/components/capy-logo";
import { NotFoundPage } from "@/components/not-found-page";
import { currentUserAtom } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Toaster } from "@/primitives/toaster";
import {
  emailPreferencesAtom,
  emailPreferencesKey,
  setEmailProgramAtom,
} from "../email-page/atoms";
import {
  type EmailProgram,
  emailProgramInfo,
  isEmailProgram,
} from "../email-page/email-catalog";
import {
  programSubscribed,
  readEmailPreferences,
} from "../email-page/email-preferences";

function EmailLandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-dvh w-full bg-background pt-(--safe-top)">
      <div className="flex min-h-full min-w-0 flex-1 flex-col items-center overflow-y-auto px-6">
        <div className="flex w-full max-w-84 flex-1 flex-col justify-center py-16">
          {children}
        </div>
      </div>
      <aside className="hidden min-w-0 flex-1 p-2 pl-0 lg:flex">
        <Card variant="panel" className="relative isolate min-w-0 flex-1" />
      </aside>
    </div>
  );
}

function LandingStep({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-6">{children}</div>;
}

function LandingHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CapyMark className="h-9" />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-foreground">{title}</h1>
        <p className="text-sm font-normal text-muted-foreground-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

type EmailLandingStepProps = {
  program: EmailProgram;
  userId: string;
  email: string | undefined;
};

function EmailLandingStep({ program, userId, email }: EmailLandingStepProps) {
  const result = useAtomValue(emailPreferencesAtom(userId));
  const setProgram = useAtomSet(setEmailProgramAtom, { mode: "promise" });
  const [override, setOverride] = useState<boolean | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const info = emailProgramInfo[program];
  const raw = Option.getOrUndefined(AsyncResult.value(result));
  const state = raw === undefined ? undefined : readEmailPreferences(raw);
  const subscribed =
    override ??
    (state === undefined ? true : programSubscribed(state, program, true));
  const inbox = email ?? "your inbox";

  const save = (next: boolean) => {
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

  const manage = (
    <div className="flex items-center justify-center gap-1 text-xs font-normal text-muted-foreground-2">
      <Link
        className="text-foreground hover:underline underline-offset-2"
        to="/settings/notifications/email"
        search={subscribed ? {} : { from: program }}
      >
        Manage all email
      </Link>
    </div>
  );

  if (state === undefined && AsyncResult.isFailure(result))
    return (
      <LandingStep key="unavailable">
        <LandingHeader
          title="Email preferences are unavailable"
          subtitle="Try again in a minute"
        />
        {manage}
      </LandingStep>
    );

  if (!subscribed)
    return (
      <LandingStep key="stopped">
        <LandingHeader
          title={`${info.label} stopped`}
          subtitle={`No more of these to ${inbox}`}
        />
        <Button
          size="base"
          className="w-full"
          aria-busy={saving}
          disabled={saving}
          onClick={() => save(true)}
        >
          Undo
        </Button>
        {manage}
      </LandingStep>
    );

  return (
    <LandingStep key="ask">
      <LandingHeader
        title={info.question}
        subtitle={`Sent to ${inbox} ${info.cadence}`}
      />
      <Button
        intent="accent"
        size="base"
        className="w-full"
        aria-busy={saving}
        disabled={state === undefined || saving}
        onClick={() => save(false)}
      >
        {info.stop}
      </Button>
      {manage}
    </LandingStep>
  );
}

export type EmailLandingPageProps = { program: string };

export function EmailLandingPage({ program }: EmailLandingPageProps) {
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  if (!isEmailProgram(program)) return <NotFoundPage />;
  return (
    <>
      <EmailLandingLayout>
        {user === undefined ? null : (
          <EmailLandingStep
            program={program}
            userId={user.id}
            email={user.email ?? undefined}
          />
        )}
      </EmailLandingLayout>
      <Toaster position="bottom-right" />
    </>
  );
}
