import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/primitives/alert";
import { Badge } from "@/primitives/badge";
import { Button, type ButtonProps } from "@/primitives/button";
import { Card, cardVariants } from "@/primitives/card";
import { Checkbox } from "@/primitives/checkbox";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import {
  automationStep,
  automationsNote,
  automationsOnLabel,
  errorMessage,
  filledInputs,
  type InstallFailure,
  installFailureLine,
  installSummary,
  type ListingSetup,
  needsSignIn,
  readInputRejection,
  type SetupAutomation,
  type SetupCard,
  type SetupContent,
  type SetupInput,
  type SetupInstalled,
  setupPrompt,
  shortVersion,
  trimPeriod,
  urlHost,
} from "./setup";
import { SetupPanelArt } from "./setup-panel-art";

const owner = "features/explore/setup-panel.tsx";

export type SetupPanelProject = { id: string; name: string };

export type SetupPanelActions = {
  install: (request: {
    projectId: string;
    inputs?: Record<string, string>;
  }) => Promise<{ installationId: string | null } | undefined>;
  createAutomation: (request: {
    projectId: string;
    automation: SetupAutomation;
    enabled: boolean;
  }) => Promise<unknown>;
  startThread: (request: { projectId: string; text: string }) => Promise<void>;
};

export type SetupPanelProps = {
  card: SetupCard;
  content: SetupContent;
  setup: ListingSetup;
  installed: SetupInstalled | null;
  onInstalled: (installed: SetupInstalled) => void;
  signedIn: boolean;
  projects: readonly SetupPanelProject[];
  actions: SetupPanelActions;
};

function ExternalIcon() {
  return <Icon name="arrow-corner-up-right" size="sm" />;
}

function HelpLink({
  help,
  className,
  trackOwner,
}: {
  help: { label: string; url: string };
  className: string;
  trackOwner: string;
}) {
  return (
    <Button
      data-track-owner={`${owner}#${trackOwner}:Button.1`}
      variant="link"
      size="xs"
      className={className}
      render={
        <a
          data-track-owner={`${owner}#${trackOwner}:a.1`}
          href={help.url}
          target="_blank"
          rel="noreferrer"
        />
      }
    >
      {help.label}
      <ExternalIcon />
    </Button>
  );
}

function LoadingButton({
  loading,
  loadingLabel,
  disabled,
  children,
  ...props
}: ButtonProps & { loading: boolean; loadingLabel: string }) {
  return (
    <Button
      {...props}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      disabled={disabled || loading}
    >
      {loading ? loadingLabel : children}
    </Button>
  );
}

function SignInLink({
  trackOwner,
  children,
}: {
  trackOwner: string;
  children: ReactNode;
}) {
  const href = useLocation({ select: (location) => location.href });
  return (
    <Button
      data-track-owner={`${owner}#SetupPanel:SignInLink[${trackOwner}]`}
      size="sm"
      render={<Link to="/sign-in" search={{ continue: href }} />}
    >
      {children}
    </Button>
  );
}

export type StepButtonProps = { children: ReactNode; onClick: () => void };

export function StepButton({ children, onClick }: StepButtonProps) {
  return (
    <button
      data-track-owner={`${owner}#StepButton:button[onClick=onClick]`}
      type="button"
      onClick={onClick}
      className={cardVariants({
        variant: "interactive",
        className:
          "relative flex-row items-center gap-3 py-2.5 pr-2.5 pl-3.5 text-left text-sm text-foreground outline-none",
      })}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <span className="flex size-(--h-control-xs) shrink-0 items-center justify-center rounded bg-secondary">
        <Icon name="send" className="size-(--icon-sm)" />
      </span>
    </button>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return <p className="text-xs font-normal text-destructive">{children}</p>;
}

type TextInput = Extract<SetupInput, { kind: "url" | "secret" }>;

export type SetupFieldProps = {
  input: TextInput;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

export function SetupField({
  input,
  value,
  error,
  disabled,
  onChange,
}: SetupFieldProps) {
  const host = input.kind === "url" ? urlHost(value) : undefined;
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the Input primitive renders the control inside the label
    <label className="flex flex-col gap-1.5 p-4">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {input.label}
        {input.kind === "secret" && input.optional === true && (
          <Badge size="sm">Optional</Badge>
        )}
      </span>
      {input.description !== undefined && (
        <span className="text-sm font-normal text-muted-foreground-2">
          {input.description}
        </span>
      )}
      <Input
        type={input.kind === "url" ? "url" : "text"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        data-form-type="other"
        className={
          input.kind === "secret" ? "mt-1 [-webkit-text-security:disc]" : "mt-1"
        }
        placeholder={input.kind === "url" ? input.default : undefined}
        aria-invalid={error !== undefined}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error !== undefined ? (
        <FieldError>{error}</FieldError>
      ) : input.kind === "url" ? (
        <span className="text-xs font-normal text-muted-foreground-2">
          {host === undefined
            ? "Enter an https address"
            : `Connects to ${host}`}
        </span>
      ) : (
        input.help !== undefined && (
          <HelpLink
            help={input.help}
            className="-ml-0.5 w-fit"
            trackOwner="Field"
          />
        )
      )}
    </label>
  );
}

function automationIcon(automation: SetupAutomation) {
  if (automation.trigger.type === "github") return <Icon name="github" />;
  if (automation.trigger.type === "sentry")
    return <Icon name="exclamation-triangle" />;
  return <Icon name="calendar-repeat" />;
}

export function SetupPanel({
  card,
  content,
  setup,
  installed,
  onInstalled,
  signedIn,
  projects,
  actions,
}: SetupPanelProps) {
  const navigate = useNavigate();
  const href = useLocation({ select: (location) => location.href });
  const [projectId, setProjectId] = useState<string>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [enabled, setEnabled] = useState(() =>
    setup.automations.map((_, index) => index === 0),
  );
  const [busy, setBusy] = useState<"thread" | "install" | null>(null);
  const [failure, setFailure] = useState<InstallFailure | null>(null);

  const project = signedIn
    ? (projects.find((candidate) => candidate.id === projectId) ?? projects[0])
    : undefined;
  const inputs = card.kind === "plugin" ? (setup.inputs ?? []) : [];
  const threadStep = inputs.find(
    (input): input is Extract<SetupInput, { kind: "thread" }> =>
      input.kind === "thread",
  );
  const vendorSteps = inputs.filter(
    (input): input is Extract<SetupInput, { kind: "vendor-step" }> =>
      input.kind === "vendor-step",
  );
  const connects = needsSignIn(content);
  const starters =
    setup.starters ??
    (content.kind === "skill" ? content.skill.starters.slice(0, 2) : []);
  const noun = card.kind === "plugin" ? "plugin" : "skill";

  const signIn = () =>
    void navigate({ to: "/sign-in", search: { continue: href } });

  const startThread = (text: string) => {
    if (project === undefined || busy !== null) return;
    setBusy("thread");
    actions.startThread({ projectId: project.id, text }).catch((error) => {
      setBusy(null);
      toast.error(errorMessage(error, "Could not start the thread"));
    });
  };

  const startSetupThread = () =>
    startThread(
      setupPrompt({
        kind: card.kind,
        slug: card.slug,
        displayName: card.displayName,
        version: card.version === null ? null : shortVersion(card.version),
        setup,
        first: threadStep?.step,
      }),
    );

  const createAutomations = (targetProjectId: string) =>
    setup.automations
      .reduce<Promise<Array<{ ok: boolean; reason?: unknown }>>>(
        (previous, automation, index) =>
          previous.then((results) =>
            actions
              .createAutomation({
                projectId: targetProjectId,
                automation,
                enabled: enabled[index] === true,
              })
              .then(
                () => [...results, { ok: true }],
                (reason: unknown) => [...results, { ok: false, reason }],
              ),
          ),
        Promise.resolve([]),
      )
      .then((results) => {
        results.forEach((result, index) => {
          if (result.ok) return;
          const name = setup.automations[index]?.name ?? "";
          toast.error(errorMessage(result.reason, `Could not create ${name}`));
        });
        return results.filter(
          (result, index) => result.ok && enabled[index] === true,
        ).length;
      });

  const install = () => {
    if (project === undefined || busy !== null) return;
    setBusy("install");
    setFailure(null);
    const filled = filledInputs(values);
    actions
      .install({
        projectId: project.id,
        inputs: Object.keys(filled).length === 0 ? undefined : filled,
      })
      .then((result) =>
        createAutomations(project.id).then((on) => {
          setBusy(null);
          onInstalled({
            project: project.name,
            installationId: result?.installationId ?? null,
            on,
            total: setup.automations.length,
          });
        }),
      )
      .catch((error: unknown) => {
        setBusy(null);
        setFailure(
          readInputRejection(error) ?? {
            input: null,
            message: errorMessage(
              error,
              `Could not install ${card.displayName}`,
            ),
          },
        );
      });
  };

  const fieldError = (id: string) =>
    failure?.input === id ? failure.message : undefined;

  const panel = (title: string, body: ReactNode) => (
    <section className="relative isolate flex flex-col gap-2.5 overflow-hidden rounded-(--radius-panel) border-hairline border-(--card-hairline) bg-panel px-8 py-7 shadow-card max-md:px-4 max-md:py-5">
      <SetupPanelArt accent={card.accent} />
      <p className="relative text-sm text-muted-foreground-1">{title}</p>
      {body}
    </section>
  );

  if (installed !== null) {
    return panel(
      "Try it in a thread",
      <>
        {starters.map((starter) => (
          <StepButton key={starter} onClick={() => startThread(starter)}>
            {starter}
          </StepButton>
        ))}
        {installed.total > 0 && (
          <Card rows className="relative">
            <SettingsRow
              icon={<Icon name="calendar-repeat" />}
              label={automationsOnLabel(installed.on, installed.total)}
            >
              <Button
                data-track-owner={`${owner}#SetupPanel:Button[Automations]`}
                variant="ghost"
                size="xs"
                render={
                  <Link
                    data-track-owner={`${owner}#SetupPanel:Link.1`}
                    to="/automations"
                  />
                }
              >
                Automations
                <ExternalIcon />
              </Button>
            </SettingsRow>
          </Card>
        )}
      </>,
    );
  }

  if (threadStep !== undefined) {
    return panel(
      `Set up ${card.displayName}`,
      <>
        <Card rows className="relative">
          <SettingsRow
            icon={<Icon name="bubble-text" />}
            label={threadStep.label}
            description={threadStep.description}
          >
            {signedIn ? (
              <LoadingButton
                data-track-owner={`${owner}#SetupPanel:Button[Set it up in a thread]`}
                intent="accent"
                size="sm"
                loading={busy === "thread"}
                loadingLabel="Starting"
                disabled={project === undefined}
                onClick={startSetupThread}
              >
                Set it up in a thread
              </LoadingButton>
            ) : (
              <SignInLink trackOwner="Sign in to set it up">
                Sign in to set it up
              </SignInLink>
            )}
          </SettingsRow>
        </Card>
        <p className="relative pt-1 text-sm text-muted-foreground-1">
          The thread will
        </p>
        {[
          threadStep.step,
          `Install the ${card.displayName} ${noun} in ${project?.name ?? "a project"}`,
          ...setup.automations.map(automationStep),
        ].map((step) => (
          <StepButton key={step} onClick={signedIn ? startSetupThread : signIn}>
            {step}
          </StepButton>
        ))}
      </>,
    );
  }

  const blocked = vendorSteps.some((step) => confirmed[step.id] !== true);

  return panel(
    `Set up ${card.displayName}`,
    <>
      {vendorSteps.map((step) => (
        <Alert key={step.id} className="relative">
          <Icon name="circle-info" />
          <AlertTitle>{step.label}</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-1.5">
            {step.description}
            {step.help !== undefined && (
              <HelpLink
                help={step.help}
                className="-ml-0.5"
                trackOwner="SetupPanel"
              />
            )}
          </AlertDescription>
        </Alert>
      ))}
      <Card rows className="relative">
        {inputs.map((input) => {
          if (input.kind === "select")
            return (
              <SettingsRow
                key={input.id}
                label={input.label}
                description={fieldError(input.id) ?? input.description}
              >
                <MenuSelect
                  data-track-owner={`${owner}#SetupPanel:MenuSelect.1`}
                  disabled={!signedIn}
                  items={Object.fromEntries(
                    input.options.map((option) => [option.value, option.label]),
                  )}
                  value={values[input.id] ?? input.default}
                  onValueChange={(value) =>
                    setValues((current) => ({
                      ...current,
                      [input.id]: String(value),
                    }))
                  }
                >
                  <MenuSelectTrigger
                    data-track-owner={`${owner}#SetupPanel:MenuSelectTrigger.1`}
                    data-size="sm"
                    aria-label={input.label}
                  >
                    <MenuSelectValue />
                  </MenuSelectTrigger>
                  <MenuSelectContent>
                    {input.options.map((option) => (
                      <MenuSelectItem
                        key={option.value}
                        data-track-owner={`${owner}#SetupPanel:MenuSelectItem.1`}
                        value={option.value}
                      >
                        {option.label}
                      </MenuSelectItem>
                    ))}
                  </MenuSelectContent>
                </MenuSelect>
              </SettingsRow>
            );
          if (input.kind === "url" || input.kind === "secret")
            return (
              <SetupField
                key={input.id}
                input={input}
                value={
                  values[input.id] ??
                  (input.kind === "url" ? input.default : "")
                }
                error={fieldError(input.id)}
                disabled={!signedIn}
                onChange={(value) => {
                  setValues((current) => ({ ...current, [input.id]: value }));
                  if (failure?.input === input.id) setFailure(null);
                }}
              />
            );
          if (input.kind === "vendor-step")
            return (
              // biome-ignore lint/a11y/noLabelWithoutControl: the Checkbox primitive renders the control inside the label
              <label
                key={input.id}
                className="flex items-center gap-3 p-4 text-sm font-medium text-foreground"
              >
                <Checkbox
                  data-track-owner={`${owner}#SetupPanel:Checkbox.1`}
                  disabled={!signedIn}
                  checked={confirmed[input.id] === true}
                  onCheckedChange={(checked) =>
                    setConfirmed((current) => ({
                      ...current,
                      [input.id]: checked === true,
                    }))
                  }
                />
                {input.confirm}
              </label>
            );
          return null;
        })}
        <SettingsRow
          label="Install in"
          description={
            failure === null
              ? installSummary(card, content, inputs)
              : installFailureLine(failure, inputs)
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
                <MenuSelect
                  data-track-owner={`${owner}#SetupPanel:ProjectSelect.1`}
                  items={Object.fromEntries(
                    projects.map((candidate) => [candidate.id, candidate.name]),
                  )}
                  value={project?.id ?? null}
                  onValueChange={(value) =>
                    setProjectId(value === null ? undefined : String(value))
                  }
                >
                  <MenuSelectTrigger data-size="sm" aria-label="Project">
                    <MenuSelectValue />
                  </MenuSelectTrigger>
                  <MenuSelectContent>
                    {projects.map((candidate) => (
                      <MenuSelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </MenuSelectItem>
                    ))}
                  </MenuSelectContent>
                </MenuSelect>
              )}
              <LoadingButton
                data-track-owner={`${owner}#SetupPanel:Button[onClick=run]`}
                intent="accent"
                size="sm"
                loading={busy === "install"}
                loadingLabel="Installing"
                disabled={project === undefined || blocked}
                onClick={install}
              >
                {connects ? "Install and connect" : "Install"}
                {connects && <ExternalIcon />}
              </LoadingButton>
            </>
          ) : (
            <SignInLink trackOwner="Sign in to install">
              Sign in to install
            </SignInLink>
          )}
        </SettingsRow>
      </Card>
      {setup.automations.length > 0 && (
        <>
          <Card rows className="relative">
            {setup.automations.map((automation, index) => (
              <SettingsRow
                key={automation.name}
                icon={automationIcon(automation)}
                label={automation.name}
                description={trimPeriod(automation.purpose)}
              >
                <Switch
                  data-track-owner={`${owner}#SetupPanel:Switch.1`}
                  disabled={!signedIn}
                  aria-label={`Switch on ${automation.name}`}
                  checked={enabled[index] === true}
                  onCheckedChange={(checked) =>
                    setEnabled((current) =>
                      current.map((value, position) =>
                        position === index ? checked : value,
                      ),
                    )
                  }
                />
              </SettingsRow>
            ))}
          </Card>
          <p className="relative pt-1 text-sm text-muted-foreground-1">
            {automationsNote(setup.automations.length)}
          </p>
        </>
      )}
    </>,
  );
}
