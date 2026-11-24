import { authClient } from '@/lib/auth-client';

export function useSignedIn(): boolean {
  const { data } = authClient.useSession();
  return Boolean(data?.user?.id);
}
