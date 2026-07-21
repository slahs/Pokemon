import { SessionDashboard } from "@/components/session/session-dashboard";

export const metadata = { title: "Session-Auswertung – BoosterBilanz" };

export default function SessionPage() {
  return (
    <div className="screen-rise mx-auto max-w-[1120px] px-4 py-12 sm:px-7">
      <h1 className="mb-7 font-display text-3xl font-bold">Session</h1>
      <SessionDashboard />
    </div>
  );
}
