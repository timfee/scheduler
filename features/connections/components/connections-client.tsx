"use client";

import { Button } from "@/components/ui/button";
import ConnectionForm from "./connection-form";
import { useState, useEffect } from "react";

import {
  createConnectionAction,
  deleteConnectionAction,
  setPrimaryConnectionAction,
  testConnectionAction,
  updateConnectionAction,
  listCalendarsAction,
  getConnectionDetailsAction,
  listCalendarsForConnectionAction,
  listConnectionsAction,
  type CalendarOption,
  type ConnectionFormData,
} from "../actions";
import { type ConnectionListItem } from "../data";
import { userMessageFromError } from "@/features/shared/errors";
import ConnectionsList from "./connections-list";
import { useConnectionStore } from "../stores/connection-store";
import {
  useConnectionForm,
  type ConnectionFormValues,
  PROVIDER_AUTH_METHODS,
} from "../hooks/use-connection-form";

interface ConnectionsClientProps {
  initialConnections: ConnectionListItem[];
}


export default function ConnectionsClient({
  initialConnections,
}: ConnectionsClientProps) {
  const {
    connections,
    setConnections,
    addConnection,
    updateConnection,
    removeConnection,
  } = useConnectionStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<ConnectionListItem | null>(null);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);

  // initialize store with data from server
  useEffect(() => {
    setConnections(initialConnections)
  }, [initialConnections, setConnections])

  type FormValues = ConnectionFormValues;
  const {
    form,
    currentProvider,
    currentAuthMethod,
    needsServerUrl,
    handleProviderChange,
  } = useConnectionForm();

  const handleTestConnection = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    setTestStatus({ testing: true });

    // Build the connection data based on auth method
    const testData: Partial<ConnectionFormData> =
      values.authMethod === "Basic"
        ? {
            provider: values.provider,
            displayName: values.displayName,
            authMethod: "Basic",
            username: values.username,
            password: values.password ?? "",
            serverUrl: values.serverUrl,
            calendarUrl: values.calendarUrl,
            capabilities: values.capabilities,
          }
        : {
            provider: values.provider,
            displayName: values.displayName,
            authMethod: "Oauth",
            username: values.username,
            refreshToken: values.refreshToken ?? "",
            clientId: values.clientId ?? "",
            clientSecret: values.clientSecret ?? "",
            tokenUrl: values.tokenUrl ?? "",
            serverUrl: values.serverUrl,
            calendarUrl: values.calendarUrl,
            capabilities: values.capabilities,
          };

    try {
      await testConnectionAction(values.provider, testData);
      const calendars = await listCalendarsAction(values.provider, testData);
      setCalendars(calendars);
      setTestStatus({ testing: false, success: true, message: "Connection successful!" });
    } catch (error) {
      setTestStatus({
        testing: false,
        success: false,
        message: userMessageFromError(error, "Connection failed"),
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      // Build the connection data based on auth method
      const connectionData: ConnectionFormData =
        values.authMethod === "Basic"
          ? {
              provider: values.provider,
              displayName: values.displayName,
              authMethod: "Basic",
              username: values.username,
              password: values.password ?? "",
              serverUrl: values.serverUrl,
              calendarUrl: values.calendarUrl,
              capabilities: values.capabilities,
              isPrimary: values.isPrimary,
            }
          : {
              provider: values.provider,
              displayName: values.displayName,
              authMethod: "Oauth",
              username: values.username,
              refreshToken: values.refreshToken ?? "",
              clientId: values.clientId ?? "",
              clientSecret: values.clientSecret ?? "",
              tokenUrl:
                values.tokenUrl ?? "https://accounts.google.com/o/oauth2/token",
              serverUrl: values.serverUrl,
              calendarUrl: values.calendarUrl,
              capabilities: values.capabilities,
              isPrimary: values.isPrimary,
            };

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
          isPrimary: connectionData.isPrimary ?? false,
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
        message: userMessageFromError(error, "An unexpected error occurred"),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    const existing = connections.find((c) => c.id === id);
    if (existing) removeConnection(id);
    try {
      await deleteConnectionAction(id);
    } catch (error) {
      if (existing) addConnection(existing);
      alert(userMessageFromError(error, "Failed to delete connection"));
    }
    const updated = await listConnectionsAction();
    setConnections(updated);
  };

  const handleSetPrimary = async (id: string) => {
    const prev = [...connections];
    setConnections(
      connections.map((c) => ({ ...c, isPrimary: c.id === id })),
    );
    try {
      await setPrimaryConnectionAction(id);
    } catch (error) {
      setConnections(prev);
      alert(userMessageFromError(error, "Failed to set primary connection"));
    }
    const updated = await listConnectionsAction();
    setConnections(updated);
  };

  const handleEdit = async (connection: ConnectionListItem) => {
    setEditingConnection(connection);
    setIsFormOpen(true);
    setTestStatus({ testing: false });

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
        isPrimary: connection.isPrimary,
        // Reset other fields to defaults
        username: "",
        password: "",
        serverUrl: "",
        calendarUrl,
        refreshToken: "",
        clientId: "",
        clientSecret: "",
        tokenUrl: "https://accounts.google.com/o/oauth2/token",
      });
    } catch (error) {
      setCalendars([]);
      form.setError("root", {
        message: userMessageFromError(error, "Failed to load connection"),
      });
    }
  };

  const resetForm = () => {
    form.reset();
    setEditingConnection(null);
    setTestStatus({ testing: false });
    setCalendars([]);
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
        onCancel={() => {
          setIsFormOpen(false);
          resetForm();
        }}
      />

      {/* Add Connection Button */}
      {!isFormOpen && (
        <Button onClick={() => setIsFormOpen(true)}>Add Connection</Button>
      )}

      {/* Connections List */}
      <ConnectionsList
        connections={connections}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetPrimary={handleSetPrimary}
      />
    </div>
  );
}
