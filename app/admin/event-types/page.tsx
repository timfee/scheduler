import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventTypeManager } from "@/components/admin/event-types";

export default function AdminEventTypesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Event Type Configuration</h2>
        <p className="text-gray-600 mt-1">
          Configure different meeting types with durations, locations, and booking rules
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Event Types</CardTitle>
          <CardDescription>
            Define different types of meetings with specific settings for duration, location, and booking rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventTypeManager />
        </CardContent>
      </Card>
    </div>
  );
}