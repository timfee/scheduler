"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
import ProviderSelect from "./provider-select";
import CapabilitiesField from "./capabilities-field";
import ConnectionsList from "./connections-list";
import {
  useConnectionForm,
  type ConnectionFormValues,
  PROVIDER_AUTH_METHODS,
} from "./use-connection-form";

interface ConnectionsClientProps {
  initialConnections: ConnectionListItem[];
}


export default function ConnectionsClient({
  initialConnections,
}: ConnectionsClientProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<ConnectionListItem | null>(null);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

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

    const result = await testConnectionAction(values.provider, testData);
    setTestStatus({
      testing: false,
      success: result.success,
      message: result.success
        ? "Connection successful!"
        : (result.error ?? "Connection failed"),
    });
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
        const result = await updateConnectionAction(
          editingConnection.id,
          connectionData,
        );
        if (result.success) {
          router.refresh();
        } else {
          form.setError("root", {
            message: result.error ?? "Failed to update connection",
          });
        }
      } else {
        const result = await createConnectionAction(connectionData);
        if (result.success) {
          router.refresh();
        } else {
          form.setError("root", {
            message: result.error ?? "Failed to create connection",
          });
        }
      }
    } catch {
      form.setError("root", {
        message: "An unexpected error occurred",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    const result = await deleteConnectionAction(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to delete connection");
    }
  };

  const handleSetPrimary = async (id: string) => {
    const result = await setPrimaryConnectionAction(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error ?? "Failed to set primary connection");
    }
  };

  const handleEdit = (connection: ConnectionListItem) => {
    setEditingConnection(connection);
    form.reset({
      provider: connection.provider as ProviderType,
      displayName: connection.displayName,
      authMethod: PROVIDER_AUTH_METHODS[connection.provider as ProviderType],
      capabilities: connection.capabilities,
      isPrimary: connection.isPrimary,
      // Reset other fields to defaults
      username: "",
      password: "",
      serverUrl: "",
      calendarUrl: "",
      refreshToken: "",
      clientId: "",
      clientSecret: "",
      tokenUrl: "https://accounts.google.com/o/oauth2/token",
    });
    setIsFormOpen(true);
    setTestStatus({ testing: false });
  };

  const resetForm = () => {
    form.reset();
    setEditingConnection(null);
    setTestStatus({ testing: false });
  };

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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Provider Selection */}
                <ProviderSelect
                  control={form.control}
                  value={currentProvider}
                  onChange={handleProviderChange}
                  disabled={!!editingConnection}
                />

                {/* Display Name */}
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Calendar" {...field} />
                      </FormControl>
                      <FormDescription>
                        A friendly name for this calendar connection
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Auth-specific fields */}
                {!editingConnection && (
                  <>
                    {/* Basic Auth Fields */}
                    {currentAuthMethod === "Basic" && (
                      <>
                        {needsServerUrl && (
                          <FormField
                            control={form.control}
                            name="serverUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Server URL</FormLabel>
                                <FormControl>
                                  <Input
                                    type="url"
                                    placeholder="https://caldav.example.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    currentProvider === "apple"
                                      ? "Your Apple ID"
                                      : "Username"
                                  }
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder={
                                    currentProvider === "apple"
                                      ? "App-specific password"
                                      : "Password"
                                  }
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="calendarUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Calendar URL (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="Leave empty to auto-discover"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Specify a specific calendar URL if needed
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* OAuth Fields */}
                    {currentAuthMethod === "Oauth" && (
                      <>
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client ID</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clientSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Secret</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="refreshToken"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Refresh Token</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </>
                )}

                {/* Capabilities */}
                <CapabilitiesField control={form.control} />

                {/* Primary Calendar */}
                <FormField
                  control={form.control}
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as primary calendar</FormLabel>
                        <FormDescription>
                          New events will be created in the primary calendar by
                          default
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Test Connection Status */}
                {testStatus.message && (
                  <Alert
                    variant={testStatus.success ? "default" : "destructive"}
                  >
                    {testStatus.success ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                    <AlertDescription>{testStatus.message}</AlertDescription>
                  </Alert>
                )}

                {/* Root Error Message */}
                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <XCircle className="size-4" />
                    <AlertDescription>
                      {form.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Form Actions */}
                <div className="flex gap-2">
                  {!editingConnection && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={
                        testStatus.testing || form.formState.isSubmitting
                      }
                    >
                      {testStatus.testing ? "Testing..." : "Test Connection"}
                    </Button>
                  )}
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
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
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Add Connection Button */}
      {!isFormOpen && (
        <Button onClick={() => setIsFormOpen(true)}>Add Connection</Button>
      )}

      {/* Connections List */}
      <ConnectionsList
        connections={initialConnections}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetPrimary={handleSetPrimary}
      />
    </div>
  );
}
