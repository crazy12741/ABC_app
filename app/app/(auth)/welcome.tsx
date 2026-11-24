import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Flame, Gift, Sparkles, UtensilsCrossed, Vote } from 'lucide-react-native';
import { colors, layout, radius, spacing } from '@/constants/theme';
import { photo } from '@/constants/images';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { BrandLockup } from '@/components/Logo';

const highlights = [
  {
    icon: Sparkles,
    title: 'The mystery',
    body: 'Clues drop before anyone else hears about them.',
  },
  {
    icon: Vote,
    title: 'Real votes',
    body: 'Shape the menu with one verified vote per poll.',
  },
  {
    icon: Gift,
    title: 'Referral rewards',
    body: 'Bring your crew and unlock club-only rewards.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image source={{ uri: photo.hero }} style={styles.background} contentFit="cover" />
      <LinearGradient
        colors={['rgba(25,25,25,0.35)', 'rgba(25,25,25,0.9)', '#191919']}
        locations={[0, 0.55, 0.86]}
        style={styles.background}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <BrandLockup color={colors.white} accent={colors.orange} />
          </View>

          <View style={styles.body}>
            <Badge label="Kochi • Opening soon" tone="orange" />

            <AppText variant="display" color={colors.white} style={styles.title}>
              FIVE TASTES.{'\n'}ONE EXPERIENCE.
            </AppText>

            <AppText variant="body" color="#E7D9C7" style={styles.subtitle}>
              American Burger Club is bringing a new burger line-up to Kerala.
              Verify your number to unlock the countdown, mystery clues,
              member polls and referral rewards.
            </AppText>

            <View style={styles.features}>
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <View key={item.title} style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Icon size={18} strokeWidth={2.1} color={colors.orange} />
                    </View>
                    <View style={styles.featureCopy}>
                      <AppText variant="smallStrong" color={colors.white}>
                        {item.title}
                      </AppText>
                      <AppText variant="small" color="#BFAF9C">
                        {item.body}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.actions}>
              <Button
                label="Verify my number"
                icon={Flame}
                onPress={() => router.push('/(auth)/phone')}
                accessibilityHint="Opens mobile number verification"
              />
              <Button
                label="Browse the menu"
                icon={UtensilsCrossed}
                variant="light"
                onPress={() => router.push('/order')}
                accessibilityHint="Opens the food menu. Ordering needs verification."
                style={styles.secondaryButton}
              />
              <Button
                label="I already have an account"
                variant="ghost"
                onPress={() => router.push('/(auth)/phone')}
                style={styles.ghostButton}
              />
            </View>

            <AppText variant="small" color="#9C8F80" style={styles.terms}>
              One-time SMS verification. Your number is never shown to other
              members.
            </AppText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
    gap: spacing.xxxl,
  },
  top: {
    paddingVertical: spacing.sm,
  },
  body: {
    gap: spacing.lg,
  },
  title: {
    fontSize: 46,
    lineHeight: 50,
  },
  subtitle: {
    maxWidth: 480,
    fontSize: 16,
    lineHeight: 25,
  },
  features: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(244,123,32,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244,123,32,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: {
    flex: 1,
    gap: 1,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ghostButton: {
    borderColor: 'rgba(255,255,255,0.18)',
  },
  terms: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
