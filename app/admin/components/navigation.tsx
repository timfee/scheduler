"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Clock, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/admin/connections",
      label: "Connections",
      icon: Calendar,
      description: "Manage calendar connections",
    },
    {
      href: "/admin/availability",
      label: "Availability",
      icon: Clock,
      description: "Set your booking availability",
    },
    {
      href: "/admin/event-types",
      label: "Event Types",
      icon: Users,
      description: "Configure meeting types",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      description: "System settings",
    },
  ];

  return (
    <nav className="border-b border-gray-200">
      <div className="flex space-x-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "default" : "ghost"}
              className="flex items-center gap-2"
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
