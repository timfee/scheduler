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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

const PROVIDER_AUTH_METHODS: Record<ProviderType, "Basic" | "Oauth"> = {
  apple: "Basic",
  google: "Oauth",
  fastmail: "Basic",
  nextcloud: "Basic",
  caldav: "Basic",
};

// Define the form schema with conditional validation
const formSchema = z
  .object({
    provider: z.enum(["apple", "google", "fastmail", "nextcloud", "caldav"]),
    displayName: z.string().min(1, "Display name is required"),
    authMethod: z.enum(["Basic", "Oauth"]),
    username: z.string().min(1, "Username is required"),
    password: z.string().optional(),
    serverUrl: z.string().optional(),
    calendarUrl: z.string().optional(),
    refreshToken: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    tokenUrl: z.string().optional(),
    capabilities: z.array(z.string()).min(1, "Select at least one capability"),
    isPrimary: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.authMethod === "Basic") {
        return !!data.password;
      }
      return true;
    },
    {
      message: "Password is required for Basic authentication",
      path: ["password"],
    },
  )
  .refine(
    (data) => {
      if (["nextcloud", "caldav"].includes(data.provider)) {
        return !!data.serverUrl;
      }
      return true;
    },
    {
      message: "Server URL is required for this provider",
      path: ["serverUrl"],
    },
  )
  .refine(
    (data) => {
      if (data.authMethod === "Oauth") {
        return (
          !!data.refreshToken &&
          !!data.clientId &&
          !!data.clientSecret &&
          !!data.tokenUrl
        );
      }
      return true;
    },
    {
      message: "All OAuth fields are required",
      path: ["refreshToken"],
    },
  );

export default function ConnectionsClient({
  initialConnections,
}: ConnectionsClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<ConnectionListItem | null>(null);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  // Fix TypeScript issue with form types
  type FormSchema = typeof formSchema;
  type FormValues = z.infer<FormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
    },
  });

  const currentProvider = form.watch("provider");
  const currentAuthMethod = form.watch("authMethod");
  const needsServerUrl = ["nextcloud", "caldav"].includes(currentProvider);

  // Update auth method when provider changes
  const handleProviderChange = (provider: ProviderType) => {
    const authMethod = PROVIDER_AUTH_METHODS[provider];
    form.setValue("authMethod", authMethod);

    // Reset OAuth fields if switching to Basic
    if (authMethod === "Basic") {
      form.setValue("refreshToken", "");
      form.setValue("clientId", "");
      form.setValue("clientSecret", "");
      form.setValue("tokenUrl", "");
    } else {
      // Reset Basic fields if switching to OAuth
      form.setValue("password", "");
      form.setValue("tokenUrl", "https://accounts.google.com/o/oauth2/token");
    }

    // Reset server URL unless needed
    if (!["nextcloud", "caldav"].includes(provider)) {
      form.setValue("serverUrl", "");
    }
  };

  const handleTestConnection = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    setTestStatus({ testing: true });

    // Build the connection data based on auth method
    let testData: Partial<ConnectionFormData>;
    if (values.authMethod === "Basic") {
      testData = {
        provider: values.provider,
        displayName: values.displayName,
        authMethod: "Basic",
        username: values.username,
        password: values.password ?? "",
        serverUrl: values.serverUrl,
        calendarUrl: values.calendarUrl,
        capabilities: values.capabilities,
      } satisfies Partial<BasicAuthFormData>;
    } else {
      testData = {
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
      } satisfies Partial<OAuthFormData>;
    }

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
      let connectionData: ConnectionFormData;
      if (values.authMethod === "Basic") {
        connectionData = {
          provider: values.provider,
          displayName: values.displayName,
          authMethod: "Basic",
          username: values.username,
          password: values.password ?? "",
          serverUrl: values.serverUrl,
          calendarUrl: values.calendarUrl,
          capabilities: values.capabilities,
          isPrimary: values.isPrimary,
        } satisfies BasicAuthFormData;
      } else {
        connectionData = {
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
        } satisfies OAuthFormData;
      }

      if (editingConnection) {
        const result = await updateConnectionAction(
          editingConnection.id,
          connectionData,
        );
        if (result.success) {
          window.location.reload();
        } else {
          form.setError("root", {
            message: result.error ?? "Failed to update connection",
          });
        }
      } else {
        const result = await createConnectionAction(connectionData);
        if (result.success) {
          window.location.reload();
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
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value: ProviderType) => {
                          field.onChange(value);
                          handleProviderChange(value);
                        }}
                        disabled={!!editingConnection}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apple">Apple iCloud</SelectItem>
                          <SelectItem value="google">
                            Google Calendar
                          </SelectItem>
                          <SelectItem value="fastmail">Fastmail</SelectItem>
                          <SelectItem value="nextcloud">Nextcloud</SelectItem>
                          <SelectItem value="caldav">Generic CalDAV</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
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
                <FormField
                  control={form.control}
                  name="capabilities"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">
                          Capabilities
                        </FormLabel>
                        <FormDescription>
                          Select what this calendar connection can be used for
                        </FormDescription>
                      </div>
                      <FormField
                        control={form.control}
                        name="capabilities"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("conflict")}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...field.value, "conflict"]
                                    : field.value?.filter(
                                        (value: string) => value !== "conflict",
                                      );
                                  field.onChange(updated);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Conflict Checking</FormLabel>
                              <FormDescription>
                                Booked time is blocked
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="capabilities"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("availability")}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...field.value, "availability"]
                                    : field.value?.filter(
                                        (value: string) =>
                                          value !== "availability",
                                      );
                                  field.onChange(updated);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Availability Checking</FormLabel>
                              <FormDescription>
                                Booked time is available unless blocked later
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="capabilities"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("booking")}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...field.value, "booking"]
                                    : field.value?.filter(
                                        (value: string) => value !== "booking",
                                      );
                                  field.onChange(updated);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Booking</FormLabel>
                              <FormDescription>
                                Can add new events to this calendar
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
