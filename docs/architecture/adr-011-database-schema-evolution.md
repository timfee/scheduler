# ADR-011: Database Schema Evolution and Migration Patterns

## Status

Accepted

## Context

The application needs a strategy for managing database schema changes over time. This includes handling migrations, schema versioning, and maintaining backward compatibility during deployment.

## Decision

Establish patterns for schema evolution that ensure safe deployments and maintain data integrity while allowing for iterative development.

## Consequences

### Positive

- **Safe deployments**: Schema changes can be deployed without downtime
- **Data integrity**: Migrations preserve existing data
- **Rollback capability**: Changes can be reversed if needed
- **Team coordination**: Clear process for schema changes

### Negative

- **Complexity**: Multi-step migrations require careful planning
- **Storage overhead**: Temporary columns during migrations
- **Development overhead**: Additional tooling and process steps

## Schema Evolution Patterns

### 1. Additive Changes (Safe)

These changes can be applied immediately without breaking existing code:

```typescript
// Adding new optional columns
export const appointmentTypes = sqliteTable("appointment_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),

  // New optional fields - safe to add
  color: text("color"), // New field
  bufferMinutes: integer("buffer_minutes").default(0), // New field with default

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

### 2. Breaking Changes (Requires Migration)

These changes require a multi-step migration process:

#### Step 1: Add new column alongside old one

```typescript
export const appointmentTypes = sqliteTable("appointment_types", {
  // ... existing columns
  duration: integer("duration").notNull(), // Old column
  durationMinutes: integer("duration_minutes"), // New column
  // ... other columns
});
```

#### Step 2: Migrate data

```typescript
// Migration script
export async function migrateDurationColumn() {
  await db
    .update(appointmentTypes)
    .set({ durationMinutes: duration })
    .where(isNull(appointmentTypes.durationMinutes));
}
```

#### Step 3: Update application code to use new column

```typescript
// Update all references to use durationMinutes instead of duration
```

#### Step 4: Remove old column (in next release)

```typescript
export const appointmentTypes = sqliteTable("appointment_types", {
  // ... existing columns
  // duration: integer("duration").notNull(), // Removed
  durationMinutes: integer("duration_minutes").notNull(), // Now required
  // ... other columns
});
```

### 3. Renaming Columns

```typescript
// 1. Add new column
ALTER TABLE appointment_types ADD COLUMN display_name TEXT;

// 2. Copy data
UPDATE appointment_types SET display_name = name;

// 3. Update application code to use display_name

// 4. Remove old column (in next release)
ALTER TABLE appointment_types DROP COLUMN name;
```

## Migration Tooling

### 1. Migration Script Template

```typescript
// scripts/migrate-schema.ts
import { db } from "@/lib/database";

export async function migrate() {
  console.log("Starting schema migration...");

  try {
    // Add new columns
    await db.execute(`
      ALTER TABLE appointment_types 
      ADD COLUMN color TEXT DEFAULT NULL
    `);

    await db.execute(`
      ALTER TABLE appointment_types 
      ADD COLUMN buffer_minutes INTEGER DEFAULT 0
    `);

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrate().catch(console.error);
}
```

### 2. Schema Version Tracking

```typescript
// lib/database/schema-version.ts
export const schemaVersion = sqliteTable("schema_version", {
  version: integer("version").primaryKey(),
  appliedAt: integer("applied_at", { mode: "timestamp" }).notNull(),
  description: text("description").notNull(),
});

export async function getCurrentSchemaVersion(): Promise<number> {
  const latest = await db
    .select({ version: schemaVersion.version })
    .from(schemaVersion)
    .orderBy(desc(schemaVersion.version))
    .limit(1);

  return latest[0]?.version ?? 0;
}

export async function recordMigration(version: number, description: string) {
  await db.insert(schemaVersion).values({
    version,
    appliedAt: new Date(),
    description,
  });
}
```

## Safe Deployment Strategies

### 1. Blue-Green Deployment Pattern

```typescript
// During deployment:
// 1. Deploy new version with schema changes (additive only)
// 2. Run data migration if needed
// 3. Switch traffic to new version
// 4. Clean up old columns in next release
```

### 2. Feature Flags for Schema Changes

```typescript
// Use feature flags to gradually roll out schema changes
const USE_NEW_COLUMN = process.env.FEATURE_NEW_COLUMN === "true";

export function getAppointmentDuration(appointment: AppointmentType): number {
  if (USE_NEW_COLUMN && appointment.durationMinutes) {
    return appointment.durationMinutes;
  }
  return appointment.duration; // fallback to old column
}
```

### 3. Rollback Strategies

```typescript
// Always keep rollback scripts ready
export async function rollbackDurationMigration() {
  console.log("Rolling back duration migration...");

  // Restore old column if needed
  await db.execute(`
    ALTER TABLE appointment_types 
    ADD COLUMN duration INTEGER
  `);

  // Copy data back
  await db
    .update(appointmentTypes)
    .set({ duration: durationMinutes })
    .where(isNull(appointmentTypes.duration));
}
```

## Data Migration Patterns

### 1. Bulk Data Migration

```typescript
export async function migrateAppointmentData() {
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const batch = await db
      .select()
      .from(appointmentTypes)
      .limit(batchSize)
      .offset(offset);

    if (batch.length === 0) break;

    // Process batch
    for (const appointment of batch) {
      await db
        .update(appointmentTypes)
        .set({
          durationMinutes: appointment.duration,
          color: getDefaultColor(appointment.name),
        })
        .where(eq(appointmentTypes.id, appointment.id));
    }

    offset += batchSize;
    console.log(`Processed ${offset} appointments`);
  }
}
```

### 2. Lazy Migration

```typescript
// Migrate data as it's accessed
export async function getAppointmentType(id: string): Promise<AppointmentType> {
  const appointment = await db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.id, id))
    .limit(1);

  if (!appointment[0]) {
    throw new Error("Appointment type not found");
  }

  const apt = appointment[0];

  // Lazy migration: update old records as they're accessed
  if (!apt.durationMinutes && apt.duration) {
    await db
      .update(appointmentTypes)
      .set({ durationMinutes: apt.duration })
      .where(eq(appointmentTypes.id, id));

    apt.durationMinutes = apt.duration;
  }

  return apt;
}
```

## Testing Migration Scripts

### 1. Migration Test Framework

```typescript
// test/migrations/migration-test.ts
export async function testMigration() {
  // 1. Set up test database with old schema
  await setupOldSchema();

  // 2. Insert test data
  await insertTestData();

  // 3. Run migration
  await runMigration();

  // 4. Verify data integrity
  await verifyDataIntegrity();

  // 5. Test rollback
  await testRollback();
}
```

### 2. Data Integrity Checks

```typescript
export async function verifyDataIntegrity() {
  // Check that all records were migrated
  const unmigrated = await db
    .select()
    .from(appointmentTypes)
    .where(isNull(appointmentTypes.durationMinutes));

  if (unmigrated.length > 0) {
    throw new Error(`${unmigrated.length} records not migrated`);
  }

  // Check that data is consistent
  const inconsistent = await db
    .select()
    .from(appointmentTypes)
    .where(ne(appointmentTypes.duration, appointmentTypes.durationMinutes));

  if (inconsistent.length > 0) {
    throw new Error(`${inconsistent.length} records have inconsistent data`);
  }
}
```

## Schema Documentation

### 1. Schema Change Log

```markdown
# Schema Changes

## Version 2.1.0 (2024-01-15)

- Added `color` column to `appointment_types` table
- Added `buffer_minutes` column to `appointment_types` table
- Migration: `scripts/migrate-v2.1.0.ts`

## Version 2.0.0 (2024-01-01)

- Renamed `duration` to `duration_minutes` in `appointment_types`
- Migration: `scripts/migrate-v2.0.0.ts`
- Breaking change: requires application update
```

### 2. Schema Documentation Generation

```typescript
// scripts/generate-schema-docs.ts
export function generateSchemaDocumentation() {
  const tables = [appointmentTypes, calendarIntegrations /* ... */];

  for (const table of tables) {
    console.log(`## ${table._.name}`);
    console.log(
      table._.columns
        .map(
          (col) =>
            `- ${col.name}: ${col.dataType} ${col.notNull ? "NOT NULL" : "NULL"}`,
        )
        .join("\n"),
    );
  }
}
```

## Best Practices

### 1. Always Make Additive Changes First

- Add new columns as optional
- Migrate data gradually
- Remove old columns in later releases

### 2. Test Migrations Thoroughly

- Test on production-like data
- Verify rollback procedures
- Monitor performance impact

### 3. Coordinate with Team

- Announce schema changes in advance
- Document migration procedures
- Plan deployment windows

### 4. Monitor Migration Progress

- Log migration progress
- Set up alerts for failures
- Have rollback plan ready

## Related Decisions

- [ADR-005: In-memory Solutions Over External Services](./adr-005-in-memory-solutions.md)
- [ADR-010: Error Handling and User Feedback Patterns](./adr-010-error-handling-patterns.md)
