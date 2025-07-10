import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

import { getConnections } from "./data";
import ConnectionsClient from "@/components/connections-client";
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

export default function ConnectionsPage() {
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
            <Suspense fallback={<p>Loading connections...</p>}>
              <ConnectionsLoader />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
