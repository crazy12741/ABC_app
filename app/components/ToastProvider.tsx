import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';

type ToastVariant = 'success' | 'error' | 'info';

type ToastState = {
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [progress]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, variant });
      progress.setValue(0);
      Animated.spring(progress, {
        toValue: 1,
        damping: 18,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(hide, 3200);
    },
    [hide, progress],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);
  const Icon = toast ? icons[toast.variant] : Info;
  const iconColor =
    toast?.variant === 'error'
      ? '#FF9D92'
      : toast?.variant === 'info'
        ? '#F5C9A7'
        : '#8FE0B8';

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {toast ? (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.host,
              {
                top: insets.top + 8,
                opacity: progress,
                transform: [
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              onPress={hide}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={styles.toast}
            >
              <Icon size={20} strokeWidth={2.2} color={iconColor} />
              <AppText
                variant="smallStrong"
                color={colors.white}
                style={styles.message}
              >
                {toast.message}
              </AppText>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  host: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.charcoalMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  message: {
    flex: 1,
    lineHeight: 19,
  },
});
