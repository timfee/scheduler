import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

import {
  ConnectionData,
  ConnectionsClient,
} from "@/features/connections";

export default async function ConnectionsPage() {
  let connections = [];
  try {
    connections = await ConnectionData.getConnections();
  } catch {
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
                  {"Failed to load connections"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
