import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { shadow, useTheme } from '../theme';
import { parsearRecetas, Receta } from '../utils/parseRecetas';

type Props = {
  resultado: string;
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

function Chip({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.accentSoft }]}>
      <Text style={[styles.chipText, { color: theme.accentStrong }]}>{text}</Text>
    </View>
  );
}

function RecetaCard({ receta, index }: { receta: Receta; index: number }) {
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
            {receta.ingredientesAdicionales.join(' · ')}
          </Text>
        </View>
      ) : null}

      {receta.preparacion.length > 0 ? (
        <View style={styles.subsection}>
          <Text style={[styles.subsectionLabel, { color: theme.textSecondary }]}>Preparación</Text>
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
  const esError = /^error/i.test(resultado.trim());
  const parsed = !esError ? parsearRecetas(resultado) : null;
  const containerStyle = useEntranceAnimation(0);

  if (esError) {
    return (
      <Animated.View
        style={[
          styles.errorCard,
          { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
          containerStyle,
        ]}
      >
        <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.danger }]}>{resultado}</Text>
      </Animated.View>
    );
  }

  if (!parsed) {
    return (
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
          containerStyle,
        ]}
      >
        <Text style={[styles.plainText, { color: theme.textPrimary }]}>{resultado}</Text>
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
