"use client";

import { type ProviderType } from "@/app/connections/server/actions";
import { DEFAULT_GOOGLE_TOKEN_URL } from "@/app/connections/utils/form-data-builder";
import {
  connectionFormSchema,
  type ConnectionFormValues,
} from "@/lib/schemas/connection";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";

const PROVIDER_AUTH_METHODS: Record<ProviderType, "Basic" | "Oauth"> = {
  apple: "Basic",
  google: "Oauth",
  fastmail: "Basic",
  nextcloud: "Basic",
  caldav: "Basic",
};

export {
  connectionFormSchema,
  type ConnectionFormValues,
} from "@/lib/schemas/connection";

export interface UseConnectionFormReturn {
  form: UseFormReturn<ConnectionFormValues, unknown, ConnectionFormValues>;
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
      tokenUrl: DEFAULT_GOOGLE_TOKEN_URL,
      capabilities: [],
    },
  });

  const currentProvider = form.watch("provider");
  const currentAuthMethod = form.watch("authMethod");
  const needsServerUrl = ["nextcloud", "caldav"].includes(currentProvider);

  const handleProviderChange = (provider: ProviderType) => {
    const authMethod = PROVIDER_AUTH_METHODS[provider];
    if (authMethod) {
      form.setValue("authMethod", authMethod);
    }

    if (authMethod === "Basic") {
      form.setValue("refreshToken", "");
      form.setValue("clientId", "");
      form.setValue("clientSecret", "");
      form.setValue("tokenUrl", "");
    } else {
      form.setValue("password", "");
      form.setValue("tokenUrl", DEFAULT_GOOGLE_TOKEN_URL);
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
