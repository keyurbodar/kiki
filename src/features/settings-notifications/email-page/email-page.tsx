import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useRef, useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { currentUserAtom } from "@/data/atoms/session";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/primitives/alert";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import { SettingsSkeletonCard } from "../notification-filter-rows/settings-skeleton";
import { activeOrganizationAtom } from "../notifications-page/atoms";
import {
  emailPreferencesAtom,
  emailPreferencesKey,
  setEmailMarketingAtom,
  setEmailNoticeAtom,
  setEmailProgramAtom,
} from "./atoms";
import {
  type EmailNotice,
  type EmailPreferenceTarget,
  type EmailProgram,
  emailNotices,
  emailPreferenceKey,
  emailPreferenceLabel,
  emailProgramInfo,
  emailPrograms,
  isEmailProgram,
  noticeInfo,
} from "./email-catalog";
import {
  noticeSubscribed,
  programSubscribed,
  readEmailPreferences,
} from "./email-preferences";

export type SettingsEmailPageProps = { from?: unknown };

export function SettingsEmailPage({ from }: SettingsEmailPageProps) {
  const user = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(currentUserAtom)),
  );
  return (
    <SettingsPage
      title="Email"
      description={
        user?.email
          ? `What Capy sends to ${user.email}`
          : "What Capy sends to your inbox"
      }
    >
      {user === undefined ? (
        <SettingsSection title="Marketing">
          <SettingsSkeletonCard rows={5} label="Loading email preferences" />
        </SettingsSection>
      ) : (
        <EmailPreferencesSections
          userId={user.id}
          from={isEmailProgram(from) ? from : undefined}
        />
      )}
    </SettingsPage>
  );
}

type EmailPreferencesSectionsProps = {
  userId: string;
  from: EmailProgram | undefined;
};

function EmailPreferencesSections({
  userId,
  from,
}: EmailPreferencesSectionsProps) {
  const result = useAtomValue(emailPreferencesAtom(userId));
  const setProgram = useAtomSet(setEmailProgramAtom, { mode: "promise" });
  const setNotice = useAtomSet(setEmailNoticeAtom, { mode: "promise" });
  const setMarketing = useAtomSet(setEmailMarketingAtom, { mode: "promise" });
  const navigate = useNavigate();
  const organization = useAtomValue(activeOrganizationAtom);
  const isAdmin =
    organization?.accessLevel === "admin" ||
    organization?.accessLevel === "owner";
  const [riskNotice, setRiskNotice] = useState<EmailNotice>("device_enrolled");
  const [riskOpen, setRiskOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef(0);
  const raw = Option.getOrUndefined(AsyncResult.value(result));
  const state = raw === undefined ? undefined : readEmailPreferences(raw);

  useEffect(() => {
    if (raw !== undefined && pending.current === 0) setOverrides({});
  }, [raw]);

  const write = (target: EmailPreferenceTarget, subscribed: boolean) => {
    const key = emailPreferenceKey(target);
    setOverrides((current) => ({ ...current, [key]: subscribed }));
    const reactivityKeys = [emailPreferencesKey(userId)];
    const payload = { subscribed };
    pending.current += 1;
    queue.current = queue.current
      .then(() =>
        target.kind === "marketing"
          ? setMarketing({ payload, reactivityKeys })
          : target.kind === "program"
            ? setProgram({
                params: { program: target.program },
                payload,
                reactivityKeys,
              })
            : setNotice({
                params: { template: target.notice },
                payload,
                reactivityKeys,
              }),
      )
      .then(
        () => {
          pending.current -= 1;
        },
        () => {
          pending.current -= 1;
          setOverrides({});
          toast.error("Could not update email preferences");
        },
      );
  };

  const change = (target: EmailPreferenceTarget, subscribed: boolean) => {
    write(target, subscribed);
    toast.success(
      `${emailPreferenceLabel(target)} ${subscribed ? "on" : "off"}`,
      { action: { label: "Undo", onClick: () => write(target, !subscribed) } },
    );
  };

  if (state === undefined && AsyncResult.isFailure(result))
    return (
      <SettingsSection>
        <Alert>
          <Icon name="mailbox" />
          <AlertTitle>Email preferences are unavailable</AlertTitle>
          <AlertDescription>Try again in a minute</AlertDescription>
        </Alert>
      </SettingsSection>
    );

  if (state === undefined)
    return (
      <SettingsSection title="Marketing" description="News, recaps, and tips">
        <SettingsSkeletonCard rows={5} label="Loading email preferences" />
      </SettingsSection>
    );

  const marketing = overrides.marketing ?? state.marketing;
  const programOn = (program: EmailProgram) =>
    overrides[`program:${program}`] ?? programSubscribed(state, program, false);
  const noticeOn = (notice: EmailNotice) =>
    overrides[`notice:${notice}`] ?? noticeSubscribed(state, notice);
  const stopped = from !== undefined && (!marketing || !programOn(from));
  const risk = noticeInfo(riskNotice).risk;

  const noticeRow = (notice: EmailNotice) => {
    const info = noticeInfo(notice);
    return (
      <SettingsRow
        key={notice}
        id={info.rowId}
        label={info.label}
        description={info.description}
      >
        <Switch
          aria-label={info.label}
          checked={
            !state.blocked && (!state.noticesEditable || noticeOn(notice))
          }
          disabled={state.blocked || !state.noticesEditable}
          onCheckedChange={(next) => {
            if (next || info.risk === undefined)
              return change({ kind: "notice", notice }, next);
            setRiskNotice(notice);
            setRiskOpen(true);
          }}
        />
      </SettingsRow>
    );
  };

  return (
    <>
      {stopped && (
        <SettingsSection>
          <Alert>
            <Icon name="mailbox" />
            <AlertTitle>{emailProgramInfo[from].label} stopped</AlertTitle>
            <AlertDescription>
              Everything else is as you left it
            </AlertDescription>
            <AlertAction>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  void navigate({
                    to: "/settings/notifications/email",
                    search: {},
                    replace: true,
                  })
                }
              >
                Dismiss
              </Button>
            </AlertAction>
          </Alert>
        </SettingsSection>
      )}
      {state.blocked && (
        <SettingsSection>
          <Alert>
            <Icon name="mailbox" />
            <AlertTitle>Email to your address is stopped</AlertTitle>
            <AlertDescription>
              Contact support to turn it back on
            </AlertDescription>
          </Alert>
        </SettingsSection>
      )}
      <SettingsSection title="Marketing" description="News, recaps, and tips">
        <Card rows>
          <SettingsRow
            id="email-marketing"
            label="All marketing email"
            description={
              marketing ? "Choose which ones below" : "None of these are sent"
            }
          >
            <Switch
              aria-label="All marketing email"
              checked={!state.blocked && marketing}
              disabled={state.blocked}
              onCheckedChange={(next) => change({ kind: "marketing" }, next)}
            />
          </SettingsRow>
          {emailPrograms.map((program) => {
            const info = emailProgramInfo[program];
            return (
              <SettingsRow
                key={program}
                id={info.rowId}
                label={info.label}
                description={info.description}
                highlighted={from === program}
              >
                <Switch
                  aria-label={info.label}
                  checked={!state.blocked && marketing && programOn(program)}
                  disabled={state.blocked || !marketing}
                  onCheckedChange={(next) =>
                    change({ kind: "program", program }, next)
                  }
                />
              </SettingsRow>
            );
          })}
        </Card>
      </SettingsSection>
      <SettingsSection
        title="Product & account"
        description={
          state.noticesEditable
            ? "Security and account notices"
            : "Always sent for now"
        }
      >
        <Card rows>
          {emailNotices
            .filter((notice) => noticeInfo(notice).group === "account")
            .map(noticeRow)}
        </Card>
      </SettingsSection>
      {isAdmin && (
        <SettingsSection
          title="Team & billing"
          description={
            state.noticesEditable
              ? organization?.name
                ? `Sent to admins of ${organization.name}`
                : "Sent to admins"
              : "Always sent to admins for now"
          }
        >
          <Card rows>
            {emailNotices
              .filter((notice) => noticeInfo(notice).group === "team")
              .map(noticeRow)}
          </Card>
        </SettingsSection>
      )}
      <Dialog open={riskOpen} onOpenChange={setRiskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{risk?.title}</DialogTitle>
            <DialogDescription>{risk?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRiskOpen(false)}>
              Cancel
            </Button>
            <Button
              intent="danger"
              onClick={() => {
                setRiskOpen(false);
                change({ kind: "notice", notice: riskNotice }, false);
              }}
            >
              Turn off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
