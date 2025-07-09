"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";

import ProviderSelect from "./provider-select";
import CapabilitiesField from "./capabilities-field";
import { type ConnectionFormValues } from "../hooks/use-connection-form";
import { type CalendarOption, type ProviderType } from "../actions";
import { type ConnectionListItem } from "../data";

export interface ConnectionFormProps {
  isOpen: boolean;
  form: UseFormReturn<ConnectionFormValues, unknown, ConnectionFormValues>;
  currentProvider: ProviderType;
  currentAuthMethod: "Basic" | "Oauth";
  needsServerUrl: boolean;
  editingConnection: ConnectionListItem | null;
  calendars: CalendarOption[];
  testStatus: { testing: boolean; success?: boolean; message?: string };
  onProviderChange: (provider: ProviderType) => void;
  onTestConnection: () => Promise<void>;
  onSubmit: (values: ConnectionFormValues) => Promise<void>;
  onCancel: () => void;
}

export default function ConnectionForm({
  isOpen,
  form,
  currentProvider,
  currentAuthMethod,
  needsServerUrl,
  editingConnection,
  calendars,
  testStatus,
  onProviderChange,
  onTestConnection,
  onSubmit,
  onCancel,
}: ConnectionFormProps) {
  useEffect(() => {
    if (!isOpen) return;
    form.reset(form.getValues());
  }, [isOpen, form]);

  if (!isOpen) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingConnection ? "Edit Connection" : "Add New Connection"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Provider Selection */}
            <ProviderSelect
              control={form.control}
              value={currentProvider}
              onChange={onProviderChange}
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tokenUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token URL</FormLabel>
                          <FormControl>
                            <Input type="url" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </>
            )}

            {/* Calendar URL */}
            <FormField
              control={form.control}
              name="calendarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Calendar URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capabilities */}
            <CapabilitiesField control={form.control} />

            {/* Primary */}
            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Primary</FormLabel>
                    <FormDescription>
                      Use this connection for booking new appointments
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Calendars fetched after testing */}
            {testStatus.success && calendars.length > 0 && (
              <div>
                <h4>Calendars</h4>
                <ul className="ml-4 list-disc">
                  {calendars.map((c) => (
                    <li key={c.url}>{c.displayName}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Test connection feedback */}
            {testStatus.message && (
              <Alert variant={testStatus.success ? "default" : "destructive"}>
                {testStatus.success ? <CheckCircle2 /> : <XCircle />}
                <AlertDescription>{testStatus.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {!editingConnection && (
                <Button type="button" onClick={onTestConnection} disabled={testStatus.testing}>
                  {testStatus.testing ? "Testing..." : "Test"}
                </Button>
              )}
              <Button type="submit" disabled={testStatus.testing}>
                {editingConnection ? "Update" : "Add Connection"}
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

