import { Icon } from "@/primitives/icon";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";

export function AlertSpecimen() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {(["neutral", "accent", "danger", "warning"] as const).map((color) => (
        <Alert key={color} color={color}>
          <Icon name="circle-info" />
          <AlertTitle>Alert title</AlertTitle>
          <AlertDescription>Alert description for {color}.</AlertDescription>
        </Alert>
      ))}
      <Alert>
        <AlertTitle>With action</AlertTitle>
        <AlertDescription>Description beside an action.</AlertDescription>
        <AlertAction>Action</AlertAction>
      </Alert>
    </div>
  );
}
