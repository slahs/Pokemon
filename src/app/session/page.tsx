import { SessionDashboard } from "@/components/session/session-dashboard";

export const metadata = { title: "Session-Auswertung – BoosterBilanz" };

export default function SessionPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Session-Auswertung</h1>
      <SessionDashboard />
    </div>
  );
}
