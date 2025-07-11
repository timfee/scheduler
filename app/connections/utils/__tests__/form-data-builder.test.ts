import { buildConnectionFormData } from "../form-data-builder";
import { type ConnectionFormValues } from "@/lib/schemas/connection";

describe("buildConnectionFormData", () => {
  it("should build Basic auth connection data", () => {
    const formValues: ConnectionFormValues = {
      provider: "apple",
      displayName: "Test Connection",
      authMethod: "Basic",
      username: "test@example.com",
      password: "password123",
      serverUrl: "https://caldav.example.com",
      calendarUrl: "https://caldav.example.com/calendar",
      capabilities: ["booking"],
      refreshToken: "",
      clientId: "",
      clientSecret: "",
      tokenUrl: "",
    };

    const result = buildConnectionFormData(formValues);

    expect(result).toEqual({
      provider: "apple",
      displayName: "Test Connection",
      authMethod: "Basic",
      username: "test@example.com",
      password: "password123",
      serverUrl: "https://caldav.example.com",
      calendarUrl: "https://caldav.example.com/calendar",
      capabilities: ["booking"],
    });
  });

  it("should build OAuth connection data", () => {
    const formValues: ConnectionFormValues = {
      provider: "google",
      displayName: "Test Google Connection",
      authMethod: "Oauth",
      username: "test@gmail.com",
      password: "",
      serverUrl: "",
      calendarUrl: "",
      capabilities: ["booking"],
      refreshToken: "refresh-token",
      clientId: "client-id",
      clientSecret: "client-secret",
      tokenUrl: "https://oauth2.googleapis.com/token",
    };

    const result = buildConnectionFormData(formValues);

    expect(result).toEqual({
      provider: "google",
      displayName: "Test Google Connection",
      authMethod: "Oauth",
      username: "test@gmail.com",
      serverUrl: "",
      calendarUrl: "",
      capabilities: ["booking"],
      refreshToken: "refresh-token",
      clientId: "client-id",
      clientSecret: "client-secret",
      tokenUrl: "https://oauth2.googleapis.com/token",
    });
  });

  it("should use default tokenUrl for OAuth when testing", () => {
    const formValues: ConnectionFormValues = {
      provider: "google",
      displayName: "Test Google Connection",
      authMethod: "Oauth",
      username: "test@gmail.com",
      password: "",
      serverUrl: "",
      calendarUrl: "",
      capabilities: ["booking"],
      refreshToken: "refresh-token",
      clientId: "client-id",
      clientSecret: "client-secret",
      tokenUrl: "",
    };

    const result = buildConnectionFormData(formValues, true);

    expect(result.tokenUrl).toBe("https://accounts.google.com/o/oauth2/token");
  });
});