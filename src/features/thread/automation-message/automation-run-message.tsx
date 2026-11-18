import { useAtomValue } from "@effect/atom-react";
import { automationsAtom, toThreadAutomations } from "@/data/atoms/automations";
import { useOrgId } from "@/features/automations/automation-editor/use-org";
import { AutomationMessage, automationName } from "./automation-message";

export type AutomationRunMessageProps = {
  /** The automation that wrote the message. */
  automationId: string;
  text: string;
  date: Date;
  /** The organization whose automations list names the automation. */
  orgId?: string;
};

/** A message an automation wrote into the thread, shown as that automation's card. */
export function AutomationRunMessage(props: AutomationRunMessageProps) {
  const currentOrgId = useOrgId();
  const orgId = props.orgId ?? currentOrgId;
  return orgId === undefined ? (
    <AutomationMessage date={props.date} body={props.text} />
  ) : (
    <LoadedAutomationRunMessage orgId={orgId} {...props} />
  );
}

function LoadedAutomationRunMessage({
  orgId,
  automationId,
  text,
  date,
}: AutomationRunMessageProps & { orgId: string }) {
  const automations = toThreadAutomations(useAtomValue(automationsAtom(orgId)));
  return (
    <AutomationMessage
      title={automationName(automations, automationId)}
      date={date}
      body={text}
    />
  );
}
