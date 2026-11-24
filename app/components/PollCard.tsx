import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, CheckCircle2, Lock } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import type { PollView } from '@/lib/types';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { InlineMessage } from './InlineMessage';

type Props = {
  poll: PollView;
  onVote: (pollId: number, optionId: number) => void;
  voting?: boolean;
  error?: string | null;
};

export function PollCard({ poll, onVote, voting = false, error }: Props) {
  const [selected, setSelected] = useState<number | null>(poll.selectedOptionId);

  useEffect(() => {
    setSelected(poll.selectedOptionId);
  }, [poll.id, poll.selectedOptionId]);

  const canVote = poll.isOpen && !poll.hasVoted;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Badge
          label={poll.isOpen ? 'Open' : 'Closed'}
          tone={poll.isOpen ? 'orange' : 'muted'}
        />
        <AppText variant="small" color={colors.muted}>
          {poll.resultsVisible && poll.totalVotes !== undefined
            ? `${poll.totalVotes} ${poll.totalVotes === 1 ? 'vote' : 'votes'}`
            : 'One vote per customer'}
        </AppText>
      </View>

      <AppText variant="h3">{poll.question}</AppText>
      {poll.description ? (
        <AppText variant="small" color={colors.muted}>
          {poll.description}
        </AppText>
      ) : null}

      <View style={styles.options}>
        {poll.options.map((option) => {
          const isSelected = selected === option.id;
          const percent = option.percent ?? 0;
          const showResults = poll.resultsVisible;
          const row = (
            <>
              <View style={styles.optionTop}>
                <View
                  style={[
                    styles.radio,
                    isSelected ? styles.radioSelected : null,
                    !canVote && !isSelected ? styles.radioMuted : null,
                  ]}
                >
                  {isSelected ? (
                    canVote ? (
                      <View style={styles.radioDot} />
                    ) : (
                      <Check size={13} strokeWidth={3} color={colors.white} />
                    )
                  ) : null}
                </View>
                <AppText
                  variant={isSelected ? 'bodyStrong' : 'body'}
                  style={styles.optionLabel}
                >
                  {option.label}
                </AppText>
                {showResults ? (
                  <AppText variant="smallStrong" color={colors.charcoal}>
                    {percent}%
                  </AppText>
                ) : null}
              </View>
              {showResults ? (
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(percent, option.votes ? 3 : 0)}%`,
                        backgroundColor: isSelected ? colors.charcoal : colors.orange,
                      },
                    ]}
                  />
                </View>
              ) : null}
            </>
          );

          if (!canVote) {
            return (
              <View
                key={option.id}
                style={[styles.option, isSelected ? styles.optionSelected : null]}
              >
                {row}
              </View>
            );
          }

          return (
            <Pressable
              key={option.id}
              onPress={() => setSelected(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={option.label}
              style={({ pressed }) => [
                styles.option,
                isSelected ? styles.optionSelected : null,
                pressed ? styles.optionPressed : null,
              ]}
            >
              {row}
            </Pressable>
          );
        })}
      </View>

      {error ? <InlineMessage message={error} tone="error" /> : null}

      {canVote ? (
        <>
          <Button
            label="Cast vote"
            loadingLabel="Recording…"
            onPress={() => {
              if (selected !== null) onVote(poll.id, selected);
            }}
            disabled={selected === null}
            loading={voting}
          />
          <AppText variant="small" color={colors.muted} style={styles.footnote}>
            Your vote is final. One vote per verified customer.
          </AppText>
        </>
      ) : poll.hasVoted ? (
        <View style={styles.recorded}>
          <CheckCircle2 size={18} strokeWidth={2.3} color={colors.success} />
          <AppText variant="smallStrong" color={colors.success} style={styles.flex}>
            Vote recorded
          </AppText>
          {!poll.resultsVisible ? (
            <AppText variant="small" color={colors.muted}>
              Results hidden for now
            </AppText>
          ) : null}
        </View>
      ) : (
        <View style={styles.recorded}>
          <Lock size={16} strokeWidth={2.3} color={colors.muted} />
          <AppText variant="small" color={colors.muted} style={styles.flex}>
            {poll.resultsVisible
              ? 'This poll is closed. Final results are above.'
              : 'This poll is closed. Results are hidden by the club.'}
          </AppText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  options: {
    gap: 8,
    marginTop: 2,
  },
  option: {
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  optionSelected: {
    borderColor: colors.orange,
    backgroundColor: '#FFF8F1',
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  radioMuted: {
    borderColor: colors.lineStrong,
    backgroundColor: colors.creamDeep,
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  optionLabel: {
    flex: 1,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.creamDeep,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  footnote: {
    textAlign: 'center',
    marginTop: -2,
  },
  recorded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cream,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  flex: {
    flex: 1,
  },
});
