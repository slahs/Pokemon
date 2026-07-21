import { SettingsForm } from "@/components/session/settings-form";

export const metadata = { title: "Einstellungen – BoosterBilanz" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Einstellungen</h1>
      <SettingsForm />
    </div>
  );
}
