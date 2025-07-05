"use client";

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
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">
            {editingConnection ? "Edit Connection" : "Add New Connection"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Provider Selection */}
            <div>
              <label className="mb-1 block text-sm font-medium">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as ProviderType)
                }
                disabled={!!editingConnection}
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="apple">Apple iCloud</option>
                <option value="google">Google Calendar</option>
                <option value="fastmail">Fastmail</option>
                <option value="nextcloud">Nextcloud</option>
                <option value="caldav">Generic CalDAV</option>
              </select>
            </div>

            {/* Display Name */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="My Calendar"
                required
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Auth-specific fields */}
            {!editingConnection && (
              <>
                {/* Basic Auth Fields */}
                {formData.authMethod === "Basic" && (
                  <>
                    {needsServerUrl && (
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Server URL
                        </label>
                        <input
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
                          className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Username
                      </label>
                      <input
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
                        className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Password
                      </label>
                      <input
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
                        className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Calendar URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={formData.calendarUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            calendarUrl: e.target.value,
                          })
                        }
                        placeholder="Leave empty to auto-discover"
                        className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* OAuth Fields */}
                {formData.authMethod === "Oauth" && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value,
                          })
                        }
                        required
                        className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Client ID
                      </label>
                      <input
                        type="text"
                        value={formData.clientId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientId: e.target.value,
                          })
                        }
                        required
                        className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={formData.clientSecret}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientSecret: e.target.value,
                          })
                        }
                        required
                        className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Refresh Token
                      </label>
                      <input
                        type="password"
                        value={formData.refreshToken}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            refreshToken: e.target.value,
                          })
                        }
                        required
                        className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Capabilities */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Capabilities
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes("conflict")}
                    onChange={() => handleCapabilityToggle("conflict")}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    <strong>Conflict Checking</strong> - Booked time is blocked
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes("availability")}
                    onChange={() => handleCapabilityToggle("availability")}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    <strong>Availability Checking</strong> - Booked time is
                    available unless blocked later
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.capabilities.includes("booking")}
                    onChange={() => handleCapabilityToggle("booking")}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    <strong>Booking</strong> - Can add new events to this
                    calendar
                  </span>
                </label>
              </div>
            </div>

            {/* Primary Calendar */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) =>
                  setFormData({ ...formData, isPrimary: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Set as primary calendar</span>
            </label>

            {/* Test Connection Status */}
            {testStatus.message && (
              <div
                className={`rounded-md p-3 ${
                  testStatus.success
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {testStatus.message}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-100 p-3 text-red-700">
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-2">
              {!editingConnection && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus.testing || isLoading}
                  className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  {testStatus.testing ? "Testing..." : "Test Connection"}
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading
                  ? "Saving..."
                  : editingConnection
                    ? "Update"
                    : "Add Connection"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Connection Button */}
      {!isFormOpen && (
        <button
          onClick={() => setIsFormOpen(true)}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Add Connection
        </button>
      )}

      {/* Connections List */}
      <div className="space-y-4">
        {initialConnections.length === 0 ? (
          <p className="text-gray-500">No calendar connections yet.</p>
        ) : (
          initialConnections.map((connection) => (
            <div
              key={connection.id}
              className="rounded-lg bg-white p-4 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">
                    {connection.displayName}
                    {connection.isPrimary && (
                      <span className="ml-2 rounded bg-blue-100 px-2 py-1 text-sm text-blue-700">
                        Primary
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Provider: {connection.provider}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm font-medium">Capabilities:</p>
                    <ul className="text-sm text-gray-600">
                      {connection.capabilities.includes("conflict") && (
                        <li>• Conflict Checking</li>
                      )}
                      {connection.capabilities.includes("availability") && (
                        <li>• Availability Checking</li>
                      )}
                      {connection.capabilities.includes("booking") && (
                        <li>• Booking</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!connection.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(connection.id)}
                      className="rounded border border-blue-500 px-3 py-1 text-sm text-blue-500 hover:bg-blue-50"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(connection)}
                    className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(connection.id)}
                    className="rounded border border-red-500 px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
