import {
  listCalendarIntegrations,
  isProviderType,
  type ProviderType,
} from '@/infrastructure/database/integrations';
import { type CalendarCapability } from '@/types/constants';

export interface ConnectionListItem {
  id: string;
  provider: ProviderType;
  displayName: string;
  capabilities: CalendarCapability[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getConnections(): Promise<ConnectionListItem[]> {
  const integrations = await listCalendarIntegrations();
  return integrations.map((integration) => ({
    id: integration.id,
    provider: isProviderType(integration.provider)
      ? integration.provider
      : 'caldav',
    displayName: integration.displayName,
    capabilities: integration.config.capabilities,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  }));
}
