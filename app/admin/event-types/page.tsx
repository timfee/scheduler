import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentTypeManager } from "@/app/admin/event-types/components/appointment-type-manager";

export default function AdminEventTypesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Appointment Type Configuration</h2>
        <p className="text-gray-600 mt-1">
          Configure different appointment types with durations and descriptions
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Appointment Types</CardTitle>
          <CardDescription>
            Define different types of appointments with specific durations and descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentTypeManager />
        </CardContent>
      </Card>
    </div>
  );
}