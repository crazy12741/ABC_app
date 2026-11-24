import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '@/constants/theme';
import { photo } from '@/constants/images';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet } from '@/lib/api';
import { formatDate, relativeTime } from '@/lib/format';
import type { MysteryData } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { BurgerImage } from '@/components/BurgerImage';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';

export default function MysteryScreen() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const query = useQuery({
    queryKey: ['mystery'],
    queryFn: ({ signal }) => apiGet<MysteryData>('/api/mystery', signal),
    enabled: signedIn,
  });

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorState
          title="The clues are hidden"
          message="We could not open the mystery right now. Check your connection and try again."
          onRetry={() => query.refetch()}
        />
      </Screen>
    );
  }

  const { settings, clues } = query.data;
  const latest = clues[0] ?? null;
  const heroImage = settings?.mysteryImageUrl ?? latest?.imageUrl ?? photo.stacked;
  const title = settings?.mysteryTitle ?? 'Something is coming';
  const tagline =
    settings?.mysteryTagline ??
    'A new taste is taking shape behind the scenes. Follow the clues before the reveal.';

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heading}>
        <AppText variant="caption" color={colors.orangeDark}>
          The club mystery
        </AppText>
        <AppText variant="h1">Follow the clues</AppText>
        <AppText variant="body" color={colors.muted}>
          Clues are published by the club only. Each one points a little closer
          to the reveal.
        </AppText>
      </View>

      <Card padded={false} style={styles.heroCard}>
        <View style={styles.heroWrap}>
          <BurgerImage
            uri={heroImage}
            height={200}
            borderRadius={0}
            accessibilityLabel="Mystery hero"
          />
          <LinearGradient
            colors={['rgba(25,25,25,0.05)', 'rgba(25,25,25,0.9)']}
            locations={[0.2, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroCopy}>
            <Badge
              label={latest ? `Clue #${latest.clueNumber} is live` : 'Mystery sealed'}
              tone="orange"
            />
            <AppText variant="displaySmall" color={colors.white}>
              {title}
            </AppText>
            <AppText variant="small" color="#E2D4C1">
              {tagline}
            </AppText>
          </View>
        </View>
      </Card>

      <View>
        <SectionHeader
          title="Clue history"
          actionLabel="Latest first"
        />
        {clues.length === 0 ? (
          <Card>
            <EmptyState
              icon={Sparkles}
              title="No clues published yet"
              body="The first clue is still under wraps. Turn on notifications so you do not miss the drop."
              actionLabel="Notification settings"
              onAction={() => router.push('/(tabs)/profile')}
            />
          </Card>
        ) : (
          <View style={styles.timeline}>
            {clues.map((clue, index) => {
              const last = index === clues.length - 1;
              return (
                <View key={clue.id} style={styles.timelineRow}>
                  <View style={styles.rail}>
                    <View style={styles.dot}>
                      <AppText style={styles.dotText}>{clue.clueNumber}</AppText>
                    </View>
                    {!last ? <View style={styles.line} /> : null}
                  </View>

                  <Card style={styles.clueCard}>
                    <View style={styles.clueTop}>
                      <Badge
                        label={index === 0 ? 'Latest' : `Clue #${clue.clueNumber}`}
                        tone={index === 0 ? 'orange' : 'muted'}
                      />
                      <AppText variant="small" color={colors.muted}>
                        {relativeTime(clue.publishedAt)}
                      </AppText>
                    </View>
                    <AppText variant="h3">{clue.title}</AppText>
                    {clue.imageUrl ? (
                      <BurgerImage
                        uri={clue.imageUrl}
                        height={150}
                        accessibilityLabel={`Clue ${clue.clueNumber} image`}
                      />
                    ) : null}
                    <AppText variant="body" color={colors.body}>
                      {clue.body}
                    </AppText>
                    <AppText variant="small" color={colors.muted}>
                      Published {formatDate(clue.publishedAt)}
                    </AppText>
                  </Card>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Card tone="cream" style={styles.notifyCard}>
        <View style={styles.notifyIcon}>
          <Bell size={19} strokeWidth={2.1} color={colors.orangeDark} />
        </View>
        <View style={styles.flex}>
          <AppText variant="smallStrong">Never miss a clue</AppText>
          <AppText variant="small" color={colors.muted}>
            Turn on push notifications and we will alert you the moment a new
            clue is published.
          </AppText>
        </View>
      </Card>

      <View style={styles.footerAction}>
        <Button
          label="Manage notifications"
          variant="secondary"
          onPress={() => router.push('/(tabs)/profile')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  heading: {
    gap: spacing.xs,
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  heroWrap: {
    height: 200,
    width: '100%',
    justifyContent: 'flex-end',
  },
  heroCopy: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  rail: {
    width: 30,
    alignItems: 'center',
    paddingTop: 6,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 14,
    color: colors.white,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.line,
    marginVertical: 6,
  },
  clueCard: {
    flex: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  clueTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  notifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  notifyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  footerAction: {
    paddingTop: spacing.xs,
  },
});
