import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { shadow, useTheme } from '../theme';
import { ImagenSeleccionada } from '../types';

const PLACEHOLDER_ASPECT_RATIO = 1.8;
const PLACEHOLDER_MAX_HEIGHT = 190;
const IMAGE_MAX_HEIGHT = 260;
const MIN_IMAGE_ASPECT_RATIO = 0.6;
const MAX_IMAGE_ASPECT_RATIO = 2.4;

type Props = {
  imagen: ImagenSeleccionada | null;
  onPress: () => void;
  onRemove: () => void;
};

function calcularAspectRatio(imagen: ImagenSeleccionada) {
  if (!imagen.width || !imagen.height) {
    return PLACEHOLDER_ASPECT_RATIO;
  }
  const ratio = imagen.width / imagen.height;
  return Math.min(MAX_IMAGE_ASPECT_RATIO, Math.max(MIN_IMAGE_ASPECT_RATIO, ratio));
}

export default function ImageDropzone({ imagen, onPress, onRemove }: Props) {
  const theme = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const aspectRatio = imagen ? calcularAspectRatio(imagen) : PLACEHOLDER_ASPECT_RATIO;

  useEffect(() => {
    if (!imagen) {
      return;
    }
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [imagen?.uri, fade]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && !imagen && { opacity: 0.85 }]}>
      <View
        style={[
          styles.container,
          imagen
            ? { aspectRatio, maxHeight: IMAGE_MAX_HEIGHT }
            : { aspectRatio: PLACEHOLDER_ASPECT_RATIO, maxHeight: PLACEHOLDER_MAX_HEIGHT },
          {
            backgroundColor: theme.surfaceSubtle,
            borderColor: imagen ? 'transparent' : theme.borderStrong,
          },
          !imagen && styles.dashed,
        ]}
      >
        {imagen ? (
          <Animated.View style={[styles.imageWrap, { opacity: fade }]}>
            <Image source={{ uri: imagen.uri }} style={styles.image} resizeMode="contain" />
            <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
              <Ionicons name="refresh-outline" size={14} color="#FFFFFF" />
              <Text style={styles.overlayText}>Cambiar imagen</Text>
            </View>
            <Pressable
              onPress={onRemove}
              hitSlop={10}
              style={[styles.removeButton, shadow(theme, 'sm'), { backgroundColor: theme.surface }]}
            >
              <Ionicons name="close" size={16} color={theme.textPrimary} />
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.placeholder}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="restaurant-outline" size={20} color={theme.accent} />
            </View>
            <Text style={[styles.placeholderTitle, { color: theme.textPrimary }]}>
              Sube una foto de tus ingredientes
            </Text>
            <Text style={[styles.placeholderSubtitle, { color: theme.textSecondary }]}>
              Toca para elegir una imagen desde la galería o la cámara
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashed: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  placeholder: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  placeholderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  imageWrap: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
