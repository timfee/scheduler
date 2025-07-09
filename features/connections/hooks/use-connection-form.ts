"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn, type Resolver } from "react-hook-form";
import { type ProviderType } from "../actions";
import {
  connectionFormSchema,
  type ConnectionFormValues,
} from "../schemas/connection";

const PROVIDER_AUTH_METHODS: Record<ProviderType, "Basic" | "Oauth"> = {
  apple: "Basic",
  google: "Oauth",
  fastmail: "Basic",
  nextcloud: "Basic",
  caldav: "Basic",
};

export { connectionFormSchema, type ConnectionFormValues } from "../schemas/connection";

export interface UseConnectionFormReturn {
  form: UseFormReturn<ConnectionFormValues, unknown, ConnectionFormValues>;
  currentProvider: ProviderType;
  currentAuthMethod: "Basic" | "Oauth";
  needsServerUrl: boolean;
  handleProviderChange: (provider: ProviderType) => void;
}

export function useConnectionForm(): UseConnectionFormReturn {
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema) as Resolver<ConnectionFormValues>,
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
