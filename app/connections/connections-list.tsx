"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ConnectionListItem } from "./actions";

interface ConnectionsListProps {
  connections: ConnectionListItem[];
  onEdit: (connection: ConnectionListItem) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
}

export default function ConnectionsList({
  connections,
  onEdit,
  onDelete,
  onSetPrimary,
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
                  {connection.isPrimary && <Badge variant="default">Primary</Badge>}
                </CardTitle>
                <CardDescription>Provider: {connection.provider}</CardDescription>
              </div>
              <div className="flex gap-2">
                {!connection.isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetPrimary(connection.id)}
                  >
                    Set Primary
                  </Button>
                )}
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
                {connection.capabilities.includes("conflict") && (
                  <Badge variant="secondary">Conflict Checking</Badge>
                )}
                {connection.capabilities.includes("availability") && (
                  <Badge variant="secondary">Availability Checking</Badge>
                )}
                {connection.capabilities.includes("booking") && (
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
