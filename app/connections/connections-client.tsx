"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

import {
  createConnectionAction,
  deleteConnectionAction,
  setPrimaryConnectionAction,
  testConnectionAction,
  updateConnectionAction,
  type BasicAuthFormData,
  type ConnectionFormData,
  type ConnectionListItem,
  type OAuthFormData,
  type ProviderType,
} from "./actions";

interface ConnectionsClientProps {
  initialConnections: ConnectionListItem[];
}

type FormState = {
  provider: ProviderType;
  displayName: string;
  authMethod: "Basic" | "Oauth";
  username: string;
  password: string;
  serverUrl: string;
  calendarUrl: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  capabilities: string[];
  isPrimary: boolean;
};

const DEFAULT_FORM_STATE: FormState = {
  provider: "apple",
  displayName: "",
  authMethod: "Basic",
  username: "",
  password: "",
  serverUrl: "",
  calendarUrl: "",
  refreshToken: "",
  clientId: "",
  clientSecret: "",
  tokenUrl: "https://accounts.google.com/o/oauth2/token",
  capabilities: [],
  isPrimary: false,
};

const PROVIDER_AUTH_METHODS: Record<ProviderType, "Basic" | "Oauth"> = {
  apple: "Basic",
  google: "Oauth",
  fastmail: "Basic",
  nextcloud: "Basic",
  caldav: "Basic",
};

export default function ConnectionsClient({
  initialConnections,
}: ConnectionsClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<ConnectionListItem | null>(null);
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  const resetForm = () => {
    setFormData(DEFAULT_FORM_STATE);
    setEditingConnection(null);
    setError(null);
    setTestStatus({ testing: false });
  };

  const handleProviderChange = (provider: ProviderType) => {
    const authMethod = PROVIDER_AUTH_METHODS[provider];
    setFormData((prev) => ({
      ...prev,
      provider,
      authMethod,
      // Reset provider-specific fields
      serverUrl: "",
      refreshToken: "",
      clientId: "",
      clientSecret: "",
      tokenUrl:
        provider === "google"
          ? "https://accounts.google.com/o/oauth2/token"
          : "",
    }));
  };

  const buildConnectionFormData = (): ConnectionFormData => {
    const baseData = {
      provider: formData.provider,
      displayName: formData.displayName,
      capabilities: formData.capabilities,
      isPrimary: formData.isPrimary,
    };

    if (formData.authMethod === "Basic") {
      return {
        ...baseData,
        authMethod: "Basic",
        username: formData.username,
        password: formData.password,
        serverUrl: formData.serverUrl || undefined,
        calendarUrl: formData.calendarUrl || undefined,
      } satisfies BasicAuthFormData;
    } else {
      return {
        ...baseData,
        authMethod: "Oauth",
        username: formData.username,
        refreshToken: formData.refreshToken,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        tokenUrl: formData.tokenUrl,
        serverUrl: formData.serverUrl || undefined,
        calendarUrl: formData.calendarUrl || undefined,
      } satisfies OAuthFormData;
    }
  };

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    const connectionData = buildConnectionFormData();
    const result = await testConnectionAction(
      formData.provider,
      connectionData,
    );
    setTestStatus({
      testing: false,
      success: result.success,
      message: result.success
        ? "Connection successful!"
        : (result.error ?? "Connection failed"),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const connectionData = buildConnectionFormData();

      if (editingConnection) {
        const result = await updateConnectionAction(
          editingConnection.id,
          connectionData,
        );
        if (result.success) {
          window.location.reload();
        } else {
          setError(result.error ?? "Failed to update connection");
        }
      } else {
        const result = await createConnectionAction(connectionData);
        if (result.success) {
          window.location.reload();
        } else {
          setError(result.error ?? "Failed to create connection");
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    const result = await deleteConnectionAction(id);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error ?? "Failed to delete connection");
    }
  };

  const handleSetPrimary = async (id: string) => {
    const result = await setPrimaryConnectionAction(id);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error ?? "Failed to set primary connection");
    }
  };

  const handleEdit = (connection: ConnectionListItem) => {
    setEditingConnection(connection);
    // Set form data with only the fields we can edit
    setFormData((prev) => ({
      ...prev,
      provider: connection.provider as ProviderType,
      displayName: connection.displayName,
      capabilities: connection.capabilities,
      isPrimary: connection.isPrimary,
      authMethod: PROVIDER_AUTH_METHODS[connection.provider as ProviderType],
    }));
    setIsFormOpen(true);
  };

  const handleCapabilityToggle = (capability: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter((c) => c !== capability)
        : [...prev.capabilities, capability],
    }));
  };

  const needsServerUrl = ["nextcloud", "caldav"].includes(formData.provider);

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingConnection ? "Edit Connection" : "Add New Connection"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) =>
                    handleProviderChange(value as ProviderType)
                  }
                  disabled={!!editingConnection}
                >
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apple">Apple iCloud</SelectItem>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="fastmail">Fastmail</SelectItem>
                    <SelectItem value="nextcloud">Nextcloud</SelectItem>
                    <SelectItem value="caldav">Generic CalDAV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="My Calendar"
                  required
                />
              </div>

              {/* Auth-specific fields */}
              {!editingConnection && (
                <>
                  {/* Basic Auth Fields */}
                  {formData.authMethod === "Basic" && (
                    <>
                      {needsServerUrl && (
                        <div className="space-y-2">
                          <Label htmlFor="serverUrl">Server URL</Label>
                          <Input
                            id="serverUrl"
                            type="url"
                            value={formData.serverUrl}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                serverUrl: e.target.value,
                              })
                            }
                            placeholder="https://caldav.example.com"
                            required
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          placeholder={
                            formData.provider === "apple"
                              ? "Your Apple ID"
                              : "Username"
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          placeholder={
                            formData.provider === "apple"
                              ? "App-specific password"
                              : "Password"
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="calendarUrl">
                          Calendar URL (Optional)
                        </Label>
                        <Input
                          id="calendarUrl"
                          type="url"
                          value={formData.calendarUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              calendarUrl: e.target.value,
                            })
                          }
                          placeholder="Leave empty to auto-discover"
                        />
                      </div>
                    </>
                  )}

                  {/* OAuth Fields */}
                  {formData.authMethod === "Oauth" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clientId">Client ID</Label>
                        <Input
                          id="clientId"
                          type="text"
                          value={formData.clientId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientId: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <Input
                          id="clientSecret"
                          type="password"
                          value={formData.clientSecret}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clientSecret: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="refreshToken">Refresh Token</Label>
                        <Input
                          id="refreshToken"
                          type="password"
                          value={formData.refreshToken}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              refreshToken: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Capabilities */}
              <div className="space-y-2">
                <Label>Capabilities</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="conflict"
                      checked={formData.capabilities.includes("conflict")}
                      onCheckedChange={() => handleCapabilityToggle("conflict")}
                    />
                    <label
                      htmlFor="conflict"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <strong>Conflict Checking</strong> - Booked time is
                      blocked
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="availability"
                      checked={formData.capabilities.includes("availability")}
                      onCheckedChange={() =>
                        handleCapabilityToggle("availability")
                      }
                    />
                    <label
                      htmlFor="availability"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <strong>Availability Checking</strong> - Booked time is
                      available unless blocked later
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="booking"
                      checked={formData.capabilities.includes("booking")}
                      onCheckedChange={() => handleCapabilityToggle("booking")}
                    />
                    <label
                      htmlFor="booking"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <strong>Booking</strong> - Can add new events to this
                      calendar
                    </label>
                  </div>
                </div>
              </div>

              {/* Primary Calendar */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="primary"
                  checked={formData.isPrimary}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPrimary: !!checked })
                  }
                />
                <label
                  htmlFor="primary"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Set as primary calendar
                </label>
              </div>

              {/* Test Connection Status */}
              {testStatus.message && (
                <Alert
                  variant={testStatus.success ? "default" : "destructive"}
                  className="mt-4"
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  <AlertDescription>{testStatus.message}</AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Form Actions */}
              <div className="flex gap-2">
                {!editingConnection && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testStatus.testing || isLoading}
                  >
                    {testStatus.testing ? "Testing..." : "Test Connection"}
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Saving..."
                    : editingConnection
                      ? "Update"
                      : "Add Connection"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Connection Button */}
      {!isFormOpen && (
        <Button onClick={() => setIsFormOpen(true)}>Add Connection</Button>
      )}

      {/* Connections List */}
      <div className="space-y-4">
        {initialConnections.length === 0 ? (
          <p className="text-muted-foreground">No calendar connections yet.</p>
        ) : (
          initialConnections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {connection.displayName}
                      {connection.isPrimary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Provider: {connection.provider}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!connection.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(connection.id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(connection)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(connection.id)}
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
          ))
        )}
      </div>
    </div>
  );
}
