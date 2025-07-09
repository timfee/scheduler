import { listCalendarIntegrations } from '@/infrastructure/database/integrations';
import { type CalendarCapability } from '@/types/constants';

export interface ConnectionListItem {
  id: string;
  provider: string;
  displayName: string;
  isPrimary: boolean;
  capabilities: CalendarCapability[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getConnections(): Promise<ConnectionListItem[]> {
  const integrations = await listCalendarIntegrations();
  return integrations.map((integration) => ({
    id: integration.id,
    provider: integration.provider,
    displayName: integration.displayName,
    isPrimary: integration.isPrimary,
    capabilities: integration.config.capabilities,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  }));
}
