import { SimulatorClient } from "@/components/simulator/simulator-client";

export default async function SimulatorPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  return <SimulatorClient setId={setId} />;
}
