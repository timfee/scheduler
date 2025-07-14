import { AvailabilityTemplate } from "@/components/admin/availability-template";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminAvailabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Availability Settings</h2>
        <p className="mt-1 text-gray-600">
          Configure your weekly availability template and booking hours
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability Template</CardTitle>
          <CardDescription>
            Set your default availability for each day of the week. This
            template will be used to generate booking slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityTemplate />
        </CardContent>
      </Card>
    </div>
  );
}
