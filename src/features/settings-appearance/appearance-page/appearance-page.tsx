import { SettingsPage } from "@/components/settings-page";
import { BackgroundSection } from "../background-section";
import { CodeSection } from "../code-section";
import { ModeCard } from "../mode-card";
import { ThemeSection } from "../theme-section";

export function AppearancePage() {
  return (
    <SettingsPage title="Appearance">
      <ModeCard />
      <ThemeSection />
      <BackgroundSection />
      <CodeSection />
    </SettingsPage>
  );
}
