import ConnectionsClient from "@/components/connections/connections-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getConnections } from "@/lib/services/connections";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

async function ConnectionsLoader() {
  try {
    const connections = await getConnections();
    return <ConnectionsClient initialConnections={connections} />;
  } catch {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{"Failed to load connections"}</AlertDescription>
      </Alert>
    );
  }
}

export default function SharedConnectionsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calendar Connections</h2>
        <p className="mt-1 text-gray-600">
          Connect your calendars for conflict checking, availability management,
          and event booking
        </p>
      </div>

      <Suspense fallback={<p>Loading connections...</p>}>
        <ConnectionsLoader />
      </Suspense>
    </div>
  );
}
