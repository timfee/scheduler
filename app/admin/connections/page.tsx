import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { getConnections } from "@/app/connections/data";
import { ConnectionsClient } from "@/components/admin/connections";
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

export default function AdminConnectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calendar Connections</h2>
        <p className="text-gray-600 mt-1">
          Connect your calendars for conflict checking, availability management, and event booking
        </p>
      </div>
      
      <Suspense fallback={<p>Loading connections...</p>}>
        <ConnectionsLoader />
      </Suspense>
    </div>
  );
}
