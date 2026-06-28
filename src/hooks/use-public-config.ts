import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

export type PublicConfig = Record<string, string>;

// Public runtime config shared by browser-side integrations such as analytics
// and Google One Tap. Deduped and cached by react-query.
export function usePublicConfig() {
  return useQuery({
    queryKey: ['public-config'],
    queryFn: () => apiGet<PublicConfig>('/api/config/public'),
    staleTime: 5 * 60_000,
  });
}
