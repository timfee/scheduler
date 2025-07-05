import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

import { listConnectionsAction } from "./actions";
import ConnectionsClient from "./connections-client";

export default async function ConnectionsPage() {
  const result = await listConnectionsAction();

  // Handle the case where the action failed
  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Calendar Connections</CardTitle>
              <CardDescription>
                Manage your calendar integrations and connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load connections: {result.error}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Safe to access data since we checked success
  const connections = result.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Calendar Connections</CardTitle>
            <CardDescription>
              Connect your calendars for conflict checking, availability
              management, and event booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectionsClient initialConnections={connections} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
