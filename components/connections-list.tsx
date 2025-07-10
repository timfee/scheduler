"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import { CALENDAR_CAPABILITY } from "@/lib/types/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ConnectionListItem } from "@/app/connections/data";

interface ConnectionsListProps {
  connections: ConnectionListItem[];
  onEdit: (connection: ConnectionListItem) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

export default function ConnectionsList({
  connections,
  onEdit,
  onDelete,
  onMove,
}: ConnectionsListProps) {
  if (connections.length === 0) {
    return <p className="text-muted-foreground">No calendar connections yet.</p>;
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <Card key={connection.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {connection.displayName}
                </CardTitle>
                <CardDescription>Provider: {connection.provider}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMove(connection.id, "up")}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMove(connection.id, "down")}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(connection)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(connection.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <p className="mb-2 text-sm font-medium">Capabilities:</p>
              <div className="flex flex-wrap gap-2">
                {connection.capabilities.includes(CALENDAR_CAPABILITY.BLOCKING_BUSY) && (
                  <Badge variant="secondary">Conflict Checking</Badge>
                )}
                {connection.capabilities.includes(CALENDAR_CAPABILITY.BLOCKING_AVAILABLE) && (
                  <Badge variant="secondary">Availability Checking</Badge>
                )}
                {connection.capabilities.includes(CALENDAR_CAPABILITY.BOOKING) && (
                  <Badge variant="secondary">Booking</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
