import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_RECETAI_API_URL ?? 'http://127.0.0.1:8000';

type ImagenSeleccionada = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export default function App() {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [imagen, setImagen] = useState<ImagenSeleccionada | null>(null);
  const [resultado, setResultado] = useState('');
  const [cargando, setCargando] = useState(false);

  const apiBaseUrl = useMemo(() => apiUrl.trim().replace(/\/$/, ''), [apiUrl]);

  async function elegirImagen() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'RecetAI necesita acceder a tus fotos.');
      return;
    }

    const seleccion = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!seleccion.canceled) {
      setImagen(seleccion.assets[0]);
      setResultado('');
    }
  }

  async function tomarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'RecetAI necesita acceder a la camara.');
      return;
    }

    const captura = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!captura.canceled) {
      setImagen(captura.assets[0]);
      setResultado('');
    }
  }

  async function procesarImagen() {
    if (!imagen) {
      Alert.alert('Falta una imagen', 'Selecciona o toma una foto primero.');
      return;
    }

    if (!apiBaseUrl) {
      Alert.alert('Falta la URL', 'Escribe la URL del backend de RecetAI.');
      return;
    }

    const formData = new FormData();
    formData.append('imagen', {
      uri: imagen.uri,
      name: imagen.fileName ?? 'ingredientes.jpg',
      type: imagen.mimeType ?? 'image/jpeg',
    } as unknown as Blob);

    try {
      setCargando(true);
      setResultado('');

      const respuesta = await fetch(`${apiBaseUrl}/recetas`, {
        method: 'POST',
        body: formData,
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.detail ?? 'No se pudo procesar la imagen.');
      }

      setResultado(datos.resultado ?? 'No se recibio una respuesta.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      setResultado(`Error al consultar RecetAI: ${mensaje}`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>RecetAI</Text>
            <Text style={styles.subtitle}>
              Sube una foto de ingredientes y recibe 3 recetas de Gemini.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Backend</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={setApiUrl}
              placeholder="http://TU_IP_LOCAL:8000"
              style={styles.input}
              value={apiUrl}
            />
          </View>

          <View style={styles.preview}>
            {imagen ? (
              <Image source={{ uri: imagen.uri }} style={styles.previewImage} />
            ) : (
              <Text style={styles.previewText}>Selecciona una imagen</Text>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              disabled={cargando}
              onPress={elegirImagen}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Galeria</Text>
            </Pressable>
            <Pressable
              disabled={cargando}
              onPress={tomarFoto}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Camara</Text>
            </Pressable>
          </View>

          <Pressable
            disabled={cargando}
            onPress={procesarImagen}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              cargando && styles.disabledButton,
            ]}
          >
            {cargando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Procesar imagen</Text>
            )}
          </Pressable>

          {resultado ? (
            <View style={styles.result}>
              <Text style={styles.resultText}>{resultado}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8faf6',
  },
  keyboard: {
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    gap: 6,
  },
  title: {
    color: '#152014',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#52604f',
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    gap: 8,
  },
  label: {
    color: '#263425',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d4dccf',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1e281d',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  preview: {
    alignItems: 'center',
    aspectRatio: 1.15,
    backgroundColor: '#eef3eb',
    borderColor: '#d4dccf',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
  previewText: {
    color: '#667261',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#236b3b',
    borderRadius: 8,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#236b3b',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#236b3b',
    fontSize: 15,
    fontWeight: '800',
  },
  result: {
    backgroundColor: '#ffffff',
    borderColor: '#d4dccf',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  resultText: {
    color: '#1f2a1d',
    fontSize: 15,
    lineHeight: 22,
  },
});
