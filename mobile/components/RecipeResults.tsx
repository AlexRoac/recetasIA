import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { shadow, useTheme } from '../theme';
import { ResultadoRecetas } from '../types';
import { parsearRecetas } from '../utils/parseRecetas';

type Props = {
  resultado: ResultadoRecetas | string;
};

type RecetaView = {
  titulo: string;
  ingredientes: string[];
  ingredientesAdicionales: string[];
  preparacion: string[];
  imagenUrl?: string | null;
  imagenError?: string | null;
};

type ResultadoView = {
  mensaje: string;
  ingredientesDetectados: string[];
  recetas: RecetaView[];
  error: boolean;
};

function useEntranceAnimation(delay: number) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 380,
      delay,
      useNativeDriver: true,
    }).start();
  }, [value, delay]);

  return {
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
      },
    ],
  };
}

function esResultadoRecetas(valor: ResultadoRecetas | string): valor is ResultadoRecetas {
  return typeof valor === 'object' && Array.isArray(valor.recetas);
}

function normalizarResultado(resultado: ResultadoRecetas | string): ResultadoView | null {
  if (esResultadoRecetas(resultado)) {
    return {
      mensaje: resultado.mensaje ?? '',
      ingredientesDetectados: resultado.ingredientes_detectados ?? [],
      recetas: (resultado.recetas ?? []).map((receta) => ({
        titulo: receta.titulo,
        ingredientes: receta.ingredientes ?? [],
        ingredientesAdicionales: receta.ingredientes_adicionales ?? [],
        preparacion: receta.preparacion ?? [],
        imagenUrl: receta.imagen_url,
        imagenError: receta.imagen_error,
      })),
      error: Boolean(resultado.error),
    };
  }

  const texto = resultado.trim();
  if (/^error/i.test(texto)) {
    return {
      mensaje: texto,
      ingredientesDetectados: [],
      recetas: [],
      error: true,
    };
  }

  const parsed = parsearRecetas(texto);
  if (!parsed) {
    return {
      mensaje: texto,
      ingredientesDetectados: [],
      recetas: [],
      error: false,
    };
  }

  return {
    mensaje: '',
    ingredientesDetectados: parsed.ingredientesDetectados,
    recetas: parsed.recetas.map((receta) => ({
      titulo: receta.titulo,
      ingredientes: receta.ingredientes,
      ingredientesAdicionales: receta.ingredientesAdicionales,
      preparacion: receta.preparacion,
    })),
    error: false,
  };
}

function Chip({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.accentSoft }]}>
      <Text style={[styles.chipText, { color: theme.accentStrong }]}>{text}</Text>
    </View>
  );
}

function ImagenReceta({ receta }: { receta: RecetaView }) {
  const theme = useTheme();

  if (receta.imagenUrl) {
    return (
      <View style={[styles.imageFrame, { backgroundColor: theme.surfaceSubtle }]}>
        <Image source={{ uri: receta.imagenUrl }} style={styles.recipeImage} resizeMode="cover" />
      </View>
    );
  }

  if (receta.imagenError) {
    return (
      <View style={[styles.imageFallback, { backgroundColor: theme.surfaceSubtle }]}>
        <Ionicons name="image-outline" size={18} color={theme.textSecondary} />
        <Text style={[styles.imageFallbackText, { color: theme.textSecondary }]}>
          Imagen no disponible
        </Text>
      </View>
    );
  }

  return null;
}

function RecetaCard({ receta, index }: { receta: RecetaView; index: number }) {
  const theme = useTheme();
  const animatedStyle = useEntranceAnimation(120 * index);

  return (
    <Animated.View
      style={[
        styles.card,
        shadow(theme, 'sm'),
        { backgroundColor: theme.surface, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      <ImagenReceta receta={receta} />

      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={styles.badgeText}>{index}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {receta.titulo}
        </Text>
      </View>

      {receta.ingredientes.length > 0 ? (
        <View style={styles.chipRow}>
          {receta.ingredientes.map((item) => (
            <Chip key={item} text={item} />
          ))}
        </View>
      ) : null}

      {receta.ingredientesAdicionales.length > 0 ? (
        <View style={styles.subsection}>
          <Text style={[styles.subsectionLabel, { color: theme.textSecondary }]}>
            Ingredientes adicionales
          </Text>
          <Text style={[styles.subsectionBody, { color: theme.textSecondary }]}>
            {receta.ingredientesAdicionales.join(', ')}
          </Text>
        </View>
      ) : null}

      {receta.preparacion.length > 0 ? (
        <View style={styles.subsection}>
          <Text style={[styles.subsectionLabel, { color: theme.textSecondary }]}>Preparacion</Text>
          {receta.preparacion.map((paso, i) => (
            <View key={i} style={styles.step}>
              <Text style={[styles.stepNumber, { color: theme.accent }]}>{i + 1}</Text>
              <Text style={[styles.stepText, { color: theme.textPrimary }]}>{paso}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function RecipeResults({ resultado }: Props) {
  const theme = useTheme();
  const parsed = normalizarResultado(resultado);
  const containerStyle = useEntranceAnimation(0);

  if (!parsed) {
    return null;
  }

  if (parsed.error) {
    return (
      <Animated.View
        style={[
          styles.errorCard,
          { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
          containerStyle,
        ]}
      >
        <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.danger }]}>{parsed.mensaje}</Text>
      </Animated.View>
    );
  }

  if (parsed.mensaje && parsed.recetas.length === 0) {
    return (
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
          containerStyle,
        ]}
      >
        <Text style={[styles.plainText, { color: theme.textPrimary }]}>{parsed.mensaje}</Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.list}>
      {parsed.ingredientesDetectados.length > 0 ? (
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
            containerStyle,
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="leaf-outline" size={18} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Ingredientes detectados
            </Text>
          </View>
          <View style={styles.chipRow}>
            {parsed.ingredientesDetectados.map((item) => (
              <Chip key={item} text={item} />
            ))}
          </View>
        </Animated.View>
      ) : null}

      {parsed.recetas.map((receta, index) => (
        <RecetaCard key={`${receta.titulo}-${index}`} receta={receta} index={index + 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  imageFrame: {
    aspectRatio: 4 / 3,
    borderRadius: 14,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    minHeight: 76,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imageFallbackText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subsection: {
    gap: 6,
  },
  subsectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subsectionBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  step: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '800',
    width: 18,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  plainText: {
    fontSize: 14,
    lineHeight: 21,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});
