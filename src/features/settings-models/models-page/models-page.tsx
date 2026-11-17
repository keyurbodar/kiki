import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { ModelDefaultsSection } from "../model-defaults/model-defaults-section";
import { CompactAtDialog } from "./compact-at-dialog";
import {
  MoveToOrganizationDialog,
  RenameSeatDialog,
} from "./connection-dialogs";

export type ModelsPageProps = {
  compactAtRequest?: {
    scope: "user" | "org";
    entryId: string;
    value?: number;
  };
  renameRequest?: { service: string; credentialId: string; label: string };
  moveRequest?: { name: string; credentialId: string };
  onCloseDialog?: () => void;
  onSaveCompactAt?: (compactAt: number | null) => Promise<void>;
  onRename?: (service: string, credentialId: string, name: string) => Promise<void>;
  onMove?: (credentialId: string) => Promise<void>;
};

export function ModelsPage({
  compactAtRequest,
  renameRequest,
  moveRequest,
  onCloseDialog,
  onSaveCompactAt,
  onRename,
  onMove,
}: ModelsPageProps) {
  return (
    <SettingsPage
      title="Models"
      description="For each model, a thread runs on the first subscription or key below that serves it"
    >
      <ModelDefaultsSection />
      <SettingsSection
        id="my-connections"
        title="Your connections"
        description="Threads you own run on these first, in this order"
      />
      {compactAtRequest !== undefined && onSaveCompactAt !== undefined ? (
        <CompactAtDialog
          entry={{
            id: compactAtRequest.entryId,
            name: compactAtRequest.entryId,
            provider: "capy",
            context: 200_000,
          }}
          scope={compactAtRequest.scope}
          value={compactAtRequest.value}
          onClose={onCloseDialog ?? (() => {})}
          onSave={onSaveCompactAt}
        />
      ) : null}
      {renameRequest !== undefined && onRename !== undefined ? (
        <RenameSeatDialog
          service={renameRequest.service}
          label={renameRequest.label}
          onClose={onCloseDialog ?? (() => {})}
          onRename={(name) =>
            onRename(renameRequest.service, renameRequest.credentialId, name)
          }
        />
      ) : null}
      {moveRequest !== undefined && onMove !== undefined ? (
        <MoveToOrganizationDialog
          name={moveRequest.name}
          onClose={onCloseDialog ?? (() => {})}
          onMove={() => onMove(moveRequest.credentialId)}
        />
      ) : null}
    </SettingsPage>
  );
}
