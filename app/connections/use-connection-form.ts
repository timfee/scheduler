"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import * as z from "zod";

import { CAPABILITY, type CalendarCapability } from "@/types/constants";
import type { ProviderType } from "./actions";

const PROVIDER_AUTH_METHODS: Record<ProviderType, "Basic" | "Oauth"> = {
  apple: "Basic",
  google: "Oauth",
  fastmail: "Basic",
  nextcloud: "Basic",
  caldav: "Basic",
};

export const connectionFormSchema = z
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
    capabilities: z
      .array(
        z.enum([
          CAPABILITY.CONFLICT,
          CAPABILITY.AVAILABILITY,
          CAPABILITY.BOOKING,
        ]),
      )
      .min(1, "Select at least one capability"),
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

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

export interface UseConnectionFormReturn {
  form: UseFormReturn<ConnectionFormValues>;
  currentProvider: ProviderType;
  currentAuthMethod: "Basic" | "Oauth";
  needsServerUrl: boolean;
  handleProviderChange: (provider: ProviderType) => void;
}

export function useConnectionForm(): UseConnectionFormReturn {
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
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
      capabilities: [] as CalendarCapability[],
      isPrimary: false,
    },
  });

  const currentProvider = form.watch("provider");
  const currentAuthMethod = form.watch("authMethod");
  const needsServerUrl = ["nextcloud", "caldav"].includes(currentProvider);

  const handleProviderChange = (provider: ProviderType) => {
    const authMethod = PROVIDER_AUTH_METHODS[provider];
    form.setValue("authMethod", authMethod);

    if (authMethod === "Basic") {
      form.setValue("refreshToken", "");
      form.setValue("clientId", "");
      form.setValue("clientSecret", "");
      form.setValue("tokenUrl", "");
    } else {
      form.setValue("password", "");
      form.setValue("tokenUrl", "https://accounts.google.com/o/oauth2/token");
    }

    if (!["nextcloud", "caldav"].includes(provider)) {
      form.setValue("serverUrl", "");
    }
  };

  return {
    form,
    currentProvider,
    currentAuthMethod,
    needsServerUrl,
    handleProviderChange,
  };
}

export { PROVIDER_AUTH_METHODS };
