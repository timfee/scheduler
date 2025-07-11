import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityTemplate } from "@/app/admin/availability/components";

export default function AdminAvailabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Availability Settings</h2>
        <p className="text-gray-600 mt-1">
          Configure your weekly availability template and booking hours
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability Template</CardTitle>
          <CardDescription>
            Set your default availability for each day of the week. This template will be used to generate booking slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityTemplate />
        </CardContent>
      </Card>
    </div>
  );
}