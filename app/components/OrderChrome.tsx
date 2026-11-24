import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import { useCart } from '@/lib/cart';
import { AppText } from './AppText';

export function FlowHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <ArrowLeft size={19} strokeWidth={2.3} color={colors.charcoal} />
      </Pressable>
      <View style={styles.copy}>
        <AppText variant="h1" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" color={colors.muted} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? null}
    </View>
  );
}

export function CartButton() {
  const router = useRouter();
  const { itemCount } = useCart();

  return (
    <Pressable
      onPress={() => router.push('/order/cart')}
      accessibilityRole="button"
      accessibilityLabel={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
      style={({ pressed }) => [styles.cart, pressed && styles.pressed]}
    >
      <ShoppingBag size={19} strokeWidth={2.2} color={colors.charcoal} />
      {itemCount > 0 ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>
            {itemCount > 9 ? '9+' : itemCount}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  cart: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
