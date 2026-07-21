import { SettingsForm } from "@/components/session/settings-form";

export const metadata = { title: "Einstellungen – BoosterBilanz" };

export default function SettingsPage() {
  return (
    <div className="screen-rise mx-auto max-w-[680px] px-4 py-12 sm:px-7">
      <h1 className="mb-7 font-display text-3xl font-bold">Einstellungen</h1>
      <SettingsForm />
    </div>
  );
}
