import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { shadow, useTheme } from '../theme';
import AnimatedPressable from './AnimatedPressable';

type Props = {
  label: string;
  loadingLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function PrimaryButton({
  label,
  loadingLabel,
  onPress,
  disabled,
  loading,
  icon = 'sparkles',
}: Props) {
  const theme = useTheme();
  const isDisabled = Boolean(disabled || loading);

  return (
    <AnimatedPressable onPress={onPress} disabled={isDisabled} scaleTo={0.97}>
      <View
        style={[
          styles.button,
          shadow(theme, 'md'),
          {
            backgroundColor: theme.accent,
            opacity: isDisabled ? 0.6 : 1,
          },
        ]}
      >
        {loading ? (
          <>
            <ActivityIndicator color={theme.onAccent} />
            <Text style={[styles.label, { color: theme.onAccent }]}>
              {loadingLabel ?? 'Procesando...'}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name={icon} size={18} color={theme.onAccent} />
            <Text style={[styles.label, { color: theme.onAccent }]}>{label}</Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
