"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold">
              Scheduler
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive("/")
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-700 hover:text-white"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/connections"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive("/connections")
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-700 hover:text-white"
                }`}
              >
                Connections
              </Link>
              <Link
                href="/appointments"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive("/appointments")
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-700 hover:text-white"
                }`}
              >
                Appointments
              </Link>
              <Link
                href="/availability"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive("/availability")
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-700 hover:text-white"
                }`}
              >
                Availability
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
