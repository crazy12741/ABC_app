import { Image } from 'expo-image';
import {
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { UtensilsCrossed } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';

type Props = {
  uri?: string | null;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

export function BurgerImage({
  uri,
  height,
  borderRadius = radius.lg,
  style,
  accessibilityLabel = 'Burger photography',
}: Props) {
  if (!uri) {
    return (
      <View
        accessibilityLabel="Image coming soon"
        style={[
          styles.fallback,
          { height, borderRadius },
          style as StyleProp<ViewStyle>,
        ]}
      >
        <UtensilsCrossed size={26} color={colors.muted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[{ height, borderRadius, width: '100%' }, style]}
      contentFit="cover"
      transition={320}
      accessibilityLabel={accessibilityLabel}
      cachePolicy="memory-disk"
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.creamDeep,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
