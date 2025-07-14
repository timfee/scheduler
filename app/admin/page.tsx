import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Clock, Settings, Users } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const adminSections = [
    {
      title: "Calendar Connections",
      description:
        "Connect and manage your calendar providers for conflict checking and booking",
      icon: Calendar,
      href: "/admin/connections",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Availability Settings",
      description:
        "Configure your weekly availability template and booking hours",
      icon: Clock,
      href: "/admin/availability",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Event Types",
      description:
        "Set up different meeting types with durations, locations, and rules",
      icon: Users,
      href: "/admin/event-types",
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "System Settings",
      description: "Configure advanced settings and preferences",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-50 text-gray-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {adminSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card
              key={section.href}
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-3 ${section.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={section.href}>Manage {section.title}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
