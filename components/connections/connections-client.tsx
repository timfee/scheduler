"use client";

import {
  PROVIDER_AUTH_METHODS,
  useConnectionForm,
  type ConnectionFormValues,
} from "@/lib/hooks/use-connection-form";
import { useTestConnection } from "@/lib/hooks/use-test-connection";
import {
  createConnectionAction,
  deleteConnectionAction,
  getConnectionDetailsAction,
  listCalendarsForConnectionAction,
  listConnectionsAction,
  updateCalendarOrderAction,
  updateConnectionAction,
  type ConnectionFormData,
} from "@/app/connections/server/actions";
import { type ConnectionListItem } from "@/app/connections/server/data";
import {
  buildConnectionFormData,
  DEFAULT_GOOGLE_TOKEN_URL,
} from "@/app/connections/utils/form-data-builder";
import { Button } from "@/components/ui/button";
import { mapErrorToUserMessage } from "@/lib/errors";
import { useCallback, useEffect, useState, useTransition } from "react";

import ConnectionForm from "./connection-form";
import ConnectionsList from "./connections-list";

interface ConnectionsClientProps {
  initialConnections: ConnectionListItem[];
}

export default function ConnectionsClient({
  initialConnections,
}: ConnectionsClientProps) {
  const [connections, setConnections] =
    useState<ConnectionListItem[]>(initialConnections);
  const addConnection = (item: ConnectionListItem) =>
    setConnections((prev) => [...prev, item]);
  const updateConnection = (item: ConnectionListItem) =>
    setConnections((prev) => prev.map((c) => (c.id === item.id ? item : c)));
  const removeConnection = (id: string) =>
    setConnections((prev) => prev.filter((c) => c.id !== id));
  const [, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<ConnectionListItem | null>(null);

  // Extract test connection logic
  const {
    testStatus,
    calendars,
    setCalendars,
    testConnection,
    resetTestStatus,
  } = useTestConnection();

  // sync state with server-provided data
  useEffect(() => {
    setConnections(initialConnections);
  }, [initialConnections]);

  type FormValues = ConnectionFormValues;
  const {
    form,
    currentProvider,
    currentAuthMethod,
    needsServerUrl,
    handleProviderChange,
  } = useConnectionForm();

  const handleTestConnection = async () => {
    await testConnection(form);
  };

  const resetForm = useCallback(() => {
    form.reset();
    setEditingConnection(null);
    setCalendars([]);
    resetTestStatus();
  }, [form, setEditingConnection, setCalendars, resetTestStatus]);

  const handleOpenForm = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setIsFormOpen(false);
    resetForm();
  }, [resetForm]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Build the connection data using the utility function
      const connectionData: ConnectionFormData =
        buildConnectionFormData(values);

      if (editingConnection) {
        const optimistic = {
          ...editingConnection,
          ...connectionData,
          updatedAt: new Date(),
        };
        updateConnection(optimistic);
        try {
          await updateConnectionAction(editingConnection.id, connectionData);
        } catch (error) {
          updateConnection(editingConnection);
          throw error;
        }
      } else {
        const tempId = `temp-${Date.now()}`;
        const optimistic: ConnectionListItem = {
          id: tempId,
          provider: connectionData.provider,
          displayName: connectionData.displayName,
          capabilities: connectionData.capabilities,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addConnection(optimistic);
        try {
          await createConnectionAction(connectionData);
        } catch (error) {
          removeConnection(tempId);
          throw error;
        }
      }
      const updated = await listConnectionsAction();
      setConnections(updated);
    } catch (error) {
      form.setError("root", {
        message: mapErrorToUserMessage(error, "An unexpected error occurred"),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    const previous = connections;
    startTransition(() => {
      setConnections((prev) => prev.filter((c) => c.id !== id));
    });

    try {
      await deleteConnectionAction(id);
    } catch (error) {
      setConnections(previous);
      alert(mapErrorToUserMessage(error, "Failed to delete connection"));
    }

    const updated = await listConnectionsAction();
    setConnections(updated);
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    await updateCalendarOrderAction(id, direction);
    const updated = await listConnectionsAction();
    setConnections(updated);
  };

  const handleEdit = async (connection: ConnectionListItem) => {
    resetTestStatus();
    setEditingConnection(connection);
    setIsFormOpen(true);

    try {
      const [details, calendars] = await Promise.all([
        getConnectionDetailsAction(connection.id),
        listCalendarsForConnectionAction(connection.id),
      ]);
      setCalendars(calendars);
      const calendarUrl = details.calendarUrl ?? "";

      form.reset({
        provider: connection.provider,
        displayName: connection.displayName,
        authMethod: PROVIDER_AUTH_METHODS[connection.provider],
        capabilities: connection.capabilities,
        // Reset other fields to defaults
        username: "",
        password: "",
        serverUrl: "",
        calendarUrl,
        refreshToken: "",
        clientId: "",
        clientSecret: "",
        tokenUrl: DEFAULT_GOOGLE_TOKEN_URL,
      });
    } catch (error) {
      setCalendars([]);
      form.setError("root", {
        message: mapErrorToUserMessage(error, "Failed to load connection"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <ConnectionForm
        isOpen={isFormOpen}
        form={form}
        currentProvider={currentProvider}
        currentAuthMethod={currentAuthMethod}
        needsServerUrl={needsServerUrl}
        editingConnection={editingConnection}
        calendars={calendars}
        testStatus={testStatus}
        onProviderChange={handleProviderChange}
        onTestConnection={handleTestConnection}
        onSubmit={onSubmit}
        onCancel={handleCancelForm}
      />

      {/* Add Connection Button */}
      {!isFormOpen && <Button onClick={handleOpenForm}>Add Connection</Button>}

      {/* Connections List */}
      <ConnectionsList
        connections={connections}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMove={handleMove}
      />
    </div>
  );
}
