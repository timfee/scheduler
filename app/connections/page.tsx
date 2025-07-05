import { listConnectionsAction } from "./actions";
import ConnectionsClient from "./connections-client";

export default async function ConnectionsPage() {
  const result = await listConnectionsAction();

  // Handle the case where the action failed
  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-3xl font-bold">Calendar Connections</h1>
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Failed to load connections: {result.error}
          </div>
        </div>
      </div>
    );
  }

  // Safe to access data since we checked success
  const connections = result.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Calendar Connections</h1>
        <ConnectionsClient initialConnections={connections} />
      </div>
    </div>
  );
}
