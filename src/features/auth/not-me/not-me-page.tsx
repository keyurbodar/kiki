import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { Button } from "@/primitives/button";
import {
  AuthFooter,
  AuthHeader,
  AuthStep,
  FieldError,
  SupportLink,
} from "../shared";
import { reportUnrecognizedMfaAtom } from "./atoms";

export const notMeReportFailed =
  "Capy could not file this report, contact support";

export function NotMePage({ token }: { token?: string | undefined }) {
  const report = useAtomSet(reportUnrecognizedMfaAtom, { mode: "promise" });
  const [state, setState] = useState<"confirm" | "sending" | "reported">(
    "confirm",
  );
  const [error, setError] = useState<string | null>(null);

  if (token === undefined)
    return (
      <AuthStep key="missing">
        <AuthHeader
          title="This link is incomplete"
          subtitle="Open the link from the email again"
        />
        <AuthFooter>
          <SupportLink />
        </AuthFooter>
      </AuthStep>
    );

  if (state === "reported")
    return (
      <AuthStep key="reported">
        <AuthHeader
          title="Your account is locked"
          subtitle="Capy support will contact you"
        />
        <AuthFooter>
          <SupportLink />
        </AuthFooter>
      </AuthStep>
    );

  return (
    <AuthStep key="confirm">
      <AuthHeader
        title="Two-step verification added"
        subtitle="If it wasn't you, we'll lock your account"
      />
      <div className="flex flex-col gap-3">
        <Button
          intent="danger"
          size="base"
          className="w-full"
          disabled={state === "sending"}
          aria-busy={state === "sending" || undefined}
          onClick={() => {
            setState("sending");
            setError(null);
            report(token)
              .then(() => setState("reported"))
              .catch(() => {
                setState("confirm");
                setError(notMeReportFailed);
              });
          }}
        >
          {state === "sending" ? "Reporting" : "This wasn't me"}
        </Button>
        <FieldError>{error}</FieldError>
      </div>
      <AuthFooter>If you added it, you can close this page</AuthFooter>
    </AuthStep>
  );
}
