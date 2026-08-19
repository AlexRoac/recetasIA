import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import AnimatedPressable from './AnimatedPressable';

type Props = {
  onGaleria: () => void;
  onCamara: () => void;
  disabled?: boolean;
};

export default function ActionButtons({ onGaleria, onCamara, disabled }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <AnimatedPressable onPress={onGaleria} disabled={disabled} style={styles.flex}>
        <View style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="images-outline" size={18} color={theme.textPrimary} />
          <Text style={[styles.label, { color: theme.textPrimary }]}>Galería</Text>
        </View>
      </AnimatedPressable>
      <AnimatedPressable onPress={onCamara} disabled={disabled} style={styles.flex}>
        <View style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="camera-outline" size={18} color={theme.textPrimary} />
          <Text style={[styles.label, { color: theme.textPrimary }]}>Cámara</Text>
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
