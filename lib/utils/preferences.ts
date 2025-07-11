import "server-only";

import { db } from "@/infrastructure/database";
import { preferences } from "@/lib/schemas/database";
import { eq } from "drizzle-orm";

/**
 * Get a preference value by key
 */
export async function getPreference<T = unknown>(key: string): Promise<T | null> {
  try {
    const result = await db
      .select()
      .from(preferences)
      .where(eq(preferences.key, key))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const row = result[0];
    if (!row) {
      return null;
    }
    
    return JSON.parse(row.value) as T;
  } catch (error) {
    console.error(`Failed to get preference ${key}:`, error);
    return null;
  }
}

/**
 * Set a preference value by key
 */
export async function setPreference<T = unknown>(key: string, value: T): Promise<void> {
  const now = new Date();
  const jsonValue = JSON.stringify(value);
  
  try {
    await db
      .insert(preferences)
      .values({
        key,
        value: jsonValue,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: preferences.key,
        set: {
          value: jsonValue,
          updatedAt: now,
        },
      });
  } catch (error) {
    console.error(`Failed to set preference ${key}:`, error);
    throw error;
  }
}

/**
 * Delete a preference by key
 */
export async function deletePreference(key: string): Promise<void> {
  try {
    await db
      .delete(preferences)
      .where(eq(preferences.key, key));
  } catch (error) {
    console.error(`Failed to delete preference ${key}:`, error);
    throw error;
  }
}