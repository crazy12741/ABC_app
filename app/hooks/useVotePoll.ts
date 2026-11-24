import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import type { PollView } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

export function useVotePoll() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [votingId, setVotingId] = useState<number | null>(null);
  const [error, setError] = useState<{ pollId: number; message: string } | null>(null);

  const mutation = useMutation({
    mutationFn: (input: { pollId: number; optionId: number }) =>
      apiPost<{ poll: PollView | null }>(`/api/polls/${input.pollId}/vote`, {
        optionId: input.optionId,
      }),
    onMutate: (input) => {
      setVotingId(input.pollId);
      setError(null);
    },
    onSuccess: () => {
      showToast('Vote recorded. Thanks for weighing in!', 'success');
    },
    onError: (err, input) => {
      const message =
        err instanceof Error ? err.message : 'Your vote could not be recorded.';
      setError({ pollId: input.pollId, message });
      showToast(message, 'error');
    },
    onSettled: () => {
      setVotingId(null);
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    vote: mutation.mutate,
    votingId,
    errorFor: (pollId: number) =>
      error && error.pollId === pollId ? error.message : null,
    clearError: () => setError(null),
  };
}
