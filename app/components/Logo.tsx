import { StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { AppText } from './AppText';

type Props = {
  size?: number;
  tone?: 'orange' | 'charcoal' | 'white';
};

export function LogoMark({ size = 46, tone = 'orange' }: Props) {
  const background =
    tone === 'orange' ? colors.orange : tone === 'charcoal' ? colors.charcoal : colors.white;
  const foreground =
    tone === 'orange' ? colors.charcoal : tone === 'charcoal' ? colors.orange : colors.charcoal;

  return (
    <View
      accessibilityLabel="American Burger Club"
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          borderColor: tone === 'white' ? colors.lineStrong : 'transparent',
        },
      ]}
    >
      <AppText
        style={{
          fontFamily: fonts.display,
          fontSize: size * 0.34,
          lineHeight: size * 0.4,
          letterSpacing: 0.4,
          color: foreground,
        }}
      >
        ABC
      </AppText>
    </View>
  );
}

export function Wordmark({
  color = colors.charcoal,
  accent = colors.orange,
  compact = false,
}: {
  color?: string;
  accent?: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.wordmark}>
      <AppText
        style={[
          styles.american,
          { color: accent, fontSize: compact ? 9 : 10, letterSpacing: compact ? 2 : 2.6 },
        ]}
      >
        AMERICAN
      </AppText>
      <AppText
        style={[
          styles.club,
          { color, fontSize: compact ? 20 : 26, lineHeight: compact ? 22 : 28 },
        ]}
      >
        BURGER CLUB
      </AppText>
    </View>
  );
}

export function BrandLockup({
  color = colors.charcoal,
  accent = colors.orange,
  size = 44,
}: {
  color?: string;
  accent?: string;
  size?: number;
}) {
  return (
    <View style={styles.lockup}>
      <LogoMark size={size} />
      <Wordmark color={color} accent={accent} compact={size < 42} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  wordmark: {
    gap: 1,
  },
  american: {
    fontFamily: fonts.semibold,
  },
  club: {
    fontFamily: fonts.display,
    letterSpacing: 0.4,
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
