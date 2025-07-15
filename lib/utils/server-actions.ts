import { mapErrorToUserMessage } from "@/lib/errors";

/**
 * A utility function to handle common server action patterns
 * Reduces boilerplate for try/catch blocks in server actions
 */
export async function handleServerAction<T>(
  action: () => Promise<T>,
  errorMessage: string,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(error, errorMessage),
    };
  }
}

/**
 * A utility function for server actions that return success/error patterns
 */
export async function handleServerActionWithResult<
  T extends Record<string, unknown>,
>(
  action: () => Promise<T>,
  errorMessage: string,
): Promise<
  { success: boolean; error?: string } & Omit<T, "success" | "error">
> {
  try {
    const result = await action();
    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      error: mapErrorToUserMessage(error, errorMessage),
    } as { success: boolean; error?: string } & Omit<T, "success" | "error">;
  }
}
