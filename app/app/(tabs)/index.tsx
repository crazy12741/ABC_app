import { Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
  Bell,
  Bike,
  ChevronRight,
  Copy,
  Gift,
  MapPin,
  Megaphone,
  Share2,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { photo } from '@/constants/images';
import { useSignedIn } from '@/hooks/useSignedIn';
import { apiGet } from '@/lib/api';
import { firstName, formatMoney, relativeTime } from '@/lib/format';
import type { HomeData, MenuData } from '@/lib/types';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { BrandLockup } from '@/components/Logo';
import { BurgerImage } from '@/components/BurgerImage';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Countdown } from '@/components/Countdown';
import { CartButton } from '@/components/OrderChrome';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { PollCard } from '@/components/PollCard';
import { Screen } from '@/components/Screen';
import { ScreenSkeleton } from '@/components/Skeleton';
import { SectionHeader } from '@/components/SectionHeader';
import { useToast } from '@/components/ToastProvider';
import { useVotePoll } from '@/hooks/useVotePoll';

export default function HomeScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { vote, votingId, errorFor } = useVotePoll();
  const signedIn = useSignedIn();
  const query = useQuery({
    queryKey: ['home'],
    queryFn: ({ signal }) => apiGet<HomeData>('/api/home', signal),
    enabled: signedIn,
  });

  const menuQuery = useQuery({
    queryKey: ['menu'],
    queryFn: ({ signal }) => apiGet<MenuData>('/api/menu', signal),
    enabled: signedIn,
  });

  const data = query.data;
  const ordering = menuQuery.data?.ordering;
  const featured = menuQuery.data?.featured ?? [];

  const copyCode = async () => {
    if (!data?.referral.code) return;
    await Clipboard.setStringAsync(data.referral.code);
    showToast('Referral code copied.', 'success');
  };

  const shareCode = async () => {
    if (!data?.referral.code) return;
    const message = `I'm joining American Burger Club in Kochi. Use my referral code ${data.referral.code} when you verify your number. Five tastes. One experience.`;
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(message);
      showToast('Invite copied. Share it with your crew.', 'success');
      return;
    }
    try {
      await Share.share({ message });
    } catch {
      // The sheet was dismissed or sharing is unavailable.
    }
  };

  if (query.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (query.isError || !data) {
    return (
      <Screen>
        <ErrorState
          title="The club is quiet"
          message={
            query.error instanceof Error
              ? query.error.message
              : 'We could not load your home feed. Pull to refresh or try again.'
          }
          onRetry={() => query.refetch()}
        />
      </Screen>
    );
  }

  const { profile, settings, announcements, polls, latestClue, referral } = data;
  const openingLine = [settings?.venue, settings?.city].filter(Boolean).join(', ');
  const mysteryImage =
    latestClue?.imageUrl ?? settings?.mysteryImageUrl ?? photo.stacked;

  return (
    <Screen
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topBar}>
        <BrandLockup size={38} />
        <View style={styles.topActions}>
          {profile.role === 'admin' ? (
            <Pressable
              onPress={() => router.push('/admin')}
              accessibilityRole="button"
              accessibilityLabel="Open admin dashboard"
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <ShieldCheck size={19} strokeWidth={2.2} color={colors.charcoal} />
            </Pressable>
          ) : null}
          <CartButton />
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${
              data.unreadNotifications > 0
                ? `, ${data.unreadNotifications} unread`
                : ''
            }`}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Bell size={19} strokeWidth={2.2} color={colors.charcoal} />
            {data.unreadNotifications > 0 ? (
              <View style={styles.bellDot}>
                <AppText style={styles.bellDotText}>
                  {data.unreadNotifications > 9 ? '9+' : data.unreadNotifications}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.greeting}>
        <AppText variant="caption" color={colors.orangeDark}>
          Welcome to the club
        </AppText>
        <AppText variant="h1">Hey, {firstName(profile.name)}.</AppText>
        <AppText variant="body" color={colors.muted}>
          Your number is verified. Here is what the club has for you today.
        </AppText>
      </View>

      <Card padded={false} style={styles.heroCard}>
        <View style={styles.heroImageWrap}>
          <BurgerImage uri={photo.hero} height={218} borderRadius={0} />
          <LinearGradient
            colors={['rgba(25,25,25,0.05)', 'rgba(25,25,25,0.86)']}
            locations={[0.25, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroCopy}>
            <Badge label="Kochi • Opening soon" tone="orange" />
            <AppText variant="display" color={colors.white} style={styles.heroTitle}>
              FIVE TASTES.{'\n'}ONE EXPERIENCE.
            </AppText>
            <AppText variant="small" color="#E7D9C7">
              Real burgers, bold flavours and a club built around you.
            </AppText>
          </View>
        </View>
      </Card>

      <Card tone="charcoal" style={styles.countdownCard}>
        <View style={styles.cardTopRow}>
          <AppText variant="caption" color="#C9BBA9">
            Counting down
          </AppText>
          <Badge label="Opening" tone="orange" />
        </View>
        <AppText variant="h2" color={colors.white}>
          Doors open
        </AppText>
        <Countdown target={settings?.openingAt ?? null} variant="dark" />
        <View style={styles.locationRow}>
          <MapPin size={16} strokeWidth={2.2} color={colors.orange} />
          <AppText variant="small" color="#C9BBA9" style={styles.flex}>
            {openingLine || 'Opening location will be shared here first.'}
          </AppText>
        </View>
      </Card>

      <View>
        <SectionHeader
          title="Order now"
          actionLabel={ordering?.enabled ? 'Full menu' : 'Preview menu'}
          onAction={() => router.push('/order')}
        />
        <Card padded={false} style={styles.orderCard}>
          <View style={styles.orderBody}>
            <View style={styles.orderTop}>
              <View style={styles.flex}>
                <Badge
                  label={ordering?.enabled ? 'Kitchen open' : 'Ordering paused'}
                  tone={ordering?.enabled ? 'green' : 'muted'}
                />
                <AppText variant="h2" style={styles.orderTitle}>
                  Pickup or delivery
                </AppText>
                <AppText variant="small" color={colors.muted}>
                  {ordering?.note ??
                    'Order your favourites from the club menu and follow every step in the app.'}
                </AppText>
              </View>
              <View style={styles.orderIcon}>
                <UtensilsCrossed size={22} strokeWidth={2.1} color={colors.orangeDark} />
              </View>
            </View>

            {ordering ? (
              <View style={styles.orderMeta}>
                <View style={styles.orderMetaItem}>
                  <Bike size={15} strokeWidth={2.2} color={colors.orangeDark} />
                  <AppText variant="small" color={colors.muted}>
                    Delivery {formatMoney(ordering.deliveryFeePaise)}
                  </AppText>
                </View>
                <View style={styles.orderMetaItem}>
                  <UtensilsCrossed size={15} strokeWidth={2.2} color={colors.orangeDark} />
                  <AppText variant="small" color={colors.muted}>
                    Min order {formatMoney(ordering.minOrderPaise)}
                  </AppText>
                </View>
              </View>
            ) : null}

            {featured.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredRow}
              >
                {featured.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push('/order')}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name}, ${formatMoney(item.pricePaise)}. Open the menu.`}
                    style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}
                  >
                    <BurgerImage
                      uri={item.imageUrl}
                      height={88}
                      borderRadius={0}
                      accessibilityLabel={item.name}
                    />
                    <View style={styles.featuredCopy}>
                      <AppText variant="smallStrong" numberOfLines={1}>
                        {item.name}
                      </AppText>
                      <AppText variant="small" color={colors.muted}>
                        {formatMoney(item.pricePaise)}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <Button
              label={ordering?.enabled ? 'Browse the menu' : 'Preview the menu'}
              icon={UtensilsCrossed}
              onPress={() => router.push('/order')}
            />
          </View>
        </Card>
      </View>

      <View>
        <SectionHeader title="Club announcements" />
        {announcements.length === 0 ? (
          <Card>
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              body="Opening updates and menu news will appear here. Pull down to check again."
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {announcements.map((item) => (
              <Card key={item.id} style={styles.announcementCard}>
                <View style={styles.cardTopRow}>
                  <Badge
                    label={item.pinned ? 'Pinned' : 'Update'}
                    tone={item.pinned ? 'orange' : 'muted'}
                  />
                  <AppText variant="small" color={colors.muted}>
                    {relativeTime(item.publishedAt)}
                  </AppText>
                </View>
                <AppText variant="h3">{item.title}</AppText>
                <AppText variant="small" color={colors.body}>
                  {item.body}
                </AppText>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader
          title="The mystery"
          actionLabel="All clues"
          onAction={() => router.push('/(tabs)/mystery')}
        />
        {latestClue ? (
          <Pressable
            onPress={() => router.push('/(tabs)/mystery')}
            accessibilityRole="button"
            accessibilityLabel={`Open mystery clue ${latestClue.clueNumber}`}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Card padded={false} style={styles.teaserCard}>
              <BurgerImage
                uri={mysteryImage}
                height={152}
                borderRadius={0}
                accessibilityLabel="Mystery teaser"
              />
              <View style={styles.teaserCopy}>
                <View style={styles.cardTopRow}>
                  <Badge label={`Clue #${latestClue.clueNumber}`} tone="orange" />
                  <Sparkles size={16} strokeWidth={2.2} color={colors.orangeDark} />
                </View>
                <AppText variant="h3">{latestClue.title}</AppText>
                <AppText variant="small" color={colors.muted} numberOfLines={2}>
                  {latestClue.body}
                </AppText>
                <View style={styles.linkRow}>
                  <AppText variant="smallStrong" color={colors.orangeDark}>
                    Read the clue
                  </AppText>
                  <ChevronRight size={15} strokeWidth={2.4} color={colors.orangeDark} />
                </View>
              </View>
            </Card>
          </Pressable>
        ) : (
          <Card>
            <EmptyState
              icon={Sparkles}
              title="The mystery is sealed"
              body="The first clue drops soon. Turn on notifications so you hear it first."
              actionLabel="Open mystery"
              onAction={() => router.push('/(tabs)/mystery')}
            />
          </Card>
        )}
      </View>

      <View>
        <SectionHeader
          title="Have your say"
          actionLabel="Vote now"
          onAction={() => router.push('/(tabs)/vote')}
        />
        {polls.length === 0 ? (
          <Card>
            <EmptyState
              icon={Megaphone}
              title="No open polls"
              body="The club will publish a member poll soon. Check back after the next announcement."
              actionLabel="Open voting"
              onAction={() => router.push('/(tabs)/vote')}
            />
          </Card>
        ) : (
          <View style={styles.stack}>
            {polls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onVote={(pollId, optionId) => vote({ pollId, optionId })}
                voting={votingId === poll.id}
                error={errorFor(poll.id)}
              />
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader
          title="Bring your crew"
          actionLabel="Referrals"
          onAction={() => router.push('/(tabs)/referrals')}
        />
        <Card tone="orange" style={styles.referralCard}>
          <View style={styles.referralTop}>
            <View style={styles.flex}>
              <AppText variant="caption" color={colors.charcoalSoft}>
                Referral rewards
              </AppText>
              <AppText variant="h2">Share the club</AppText>
              <AppText variant="small" color={colors.charcoalSoft}>
                {referral.reward ??
                  'Share your code and earn club rewards with every verified friend.'}
              </AppText>
            </View>
            <View style={styles.giftBadge}>
              <Gift size={22} strokeWidth={2.1} color={colors.orangeDark} />
            </View>
          </View>

          <View style={styles.codeRow}>
            <AppText variant="mono" style={styles.flex}>
              {referral.code ?? 'Code pending'}
            </AppText>
            <Pressable
              onPress={copyCode}
              accessibilityRole="button"
              accessibilityLabel="Copy referral code"
              style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
            >
              <Copy size={17} strokeWidth={2.2} color={colors.charcoal} />
            </Pressable>
          </View>

          <View style={styles.referralStats}>
            <View style={styles.stat}>
              <AppText variant="displaySmall" style={styles.statValue}>
                {referral.verifiedCount}
              </AppText>
              <AppText variant="caption" color={colors.charcoalSoft}>
                Verified friends
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <AppText variant="displaySmall" style={styles.statValue}>
                {referral.pendingRewardCount}
              </AppText>
              <AppText variant="caption" color={colors.charcoalSoft}>
                Rewards pending
              </AppText>
            </View>
          </View>

          <Button
            label="Share my code"
            icon={Share2}
            variant="secondary"
            onPress={shareCode}
            disabled={!referral.code}
          />
        </Card>
      </View>

      <Card style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <MapPin size={19} strokeWidth={2.1} color={colors.orangeDark} />
        </View>
        <View style={styles.flex}>
          <AppText variant="smallStrong">Opening location</AppText>
          <AppText variant="small" color={colors.muted}>
            {openingLine || 'To be announced by the club.'}
          </AppText>
        </View>
      </Card>

      <AppText variant="caption" color={colors.lineStrong} style={styles.footer}>
        Five tastes. One experience.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  bellDotText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.72,
  },
  greeting: {
    gap: spacing.xs,
  },
  heroCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  heroImageWrap: {
    height: 218,
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
  heroTitle: {
    fontSize: 34,
    lineHeight: 37,
  },
  countdownCard: {
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  flex: {
    flex: 1,
  },
  stack: {
    gap: spacing.md,
  },
  announcementCard: {
    gap: spacing.sm,
  },
  orderCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  orderBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  orderTitle: {
    marginTop: 6,
    marginBottom: 2,
  },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  orderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  featuredCard: {
    width: 142,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  featuredCopy: {
    padding: 10,
    gap: 2,
  },
  teaserCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  teaserCopy: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  referralCard: {
    gap: spacing.md,
  },
  referralTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  giftBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(25,25,25,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  copyButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 32,
    color: colors.charcoal,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(25,25,25,0.15)',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    textAlign: 'center',
    letterSpacing: 1.4,
    marginTop: spacing.sm,
  },
});
