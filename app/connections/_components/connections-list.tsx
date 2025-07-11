"use client";

import { useCallback } from "react";
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
import { type ConnectionListItem } from "@/app/connections/_server/data";

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
  const handleMoveUp = useCallback((id: string) => {
    onMove(id, "up");
  }, [onMove]);

  const handleMoveDown = useCallback((id: string) => {
    onMove(id, "down");
  }, [onMove]);

  const handleEdit = useCallback((connection: ConnectionListItem) => {
    onEdit(connection);
  }, [onEdit]);

  const handleDelete = useCallback((id: string) => {
    onDelete(id);
  }, [onDelete]);

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const connectionId = button.dataset.connectionId;
    
    if (!action || !connectionId) return;
    
    switch (action) {
      case 'move-up':
        handleMoveUp(connectionId);
        break;
      case 'move-down':
        handleMoveDown(connectionId);
        break;
      case 'edit':
        const connection = connections.find(c => c.id === connectionId);
        if (connection) {
          handleEdit(connection);
        }
        break;
      case 'delete':
        handleDelete(connectionId);
        break;
    }
  }, [connections, handleMoveUp, handleMoveDown, handleEdit, handleDelete]);

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
                  onClick={handleButtonClick}
                  data-action="move-up"
                  data-connection-id={connection.id}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleButtonClick}
                  data-action="move-down"
                  data-connection-id={connection.id}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleButtonClick}
                  data-action="edit"
                  data-connection-id={connection.id}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleButtonClick}
                  data-action="delete"
                  data-connection-id={connection.id}
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
