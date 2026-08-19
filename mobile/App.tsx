import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet } from 'react-native';

import ActionButtons from './components/ActionButtons';
import Header from './components/Header';
import ImageDropzone from './components/ImageDropzone';
import PrimaryButton from './components/PrimaryButton';
import RecipeResults from './components/RecipeResults';
import ResultSkeleton from './components/ResultSkeleton';
import { useTheme } from './theme';
import { ImagenSeleccionada } from './types';

const API_BASE_URL = (process.env.EXPO_PUBLIC_RECETAI_API_URL ?? 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/$/, '');

export default function App() {
  const theme = useTheme();
  const [imagen, setImagen] = useState<ImagenSeleccionada | null>(null);
  const [resultado, setResultado] = useState('');
  const [cargando, setCargando] = useState(false);

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
      Alert.alert('Permiso requerido', 'RecetAI necesita acceder a la cámara.');
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

  function quitarImagen() {
    setImagen(null);
    setResultado('');
  }

  async function procesarImagen() {
    if (!imagen) {
      Alert.alert('Falta una imagen', 'Selecciona o toma una foto primero.');
      return;
    }

    const nombreArchivo = imagen.fileName ?? 'ingredientes.jpg';
    const tipoArchivo = imagen.mimeType ?? 'image/jpeg';

    const formData = new FormData();

    if (Platform.OS === 'web') {
      const blob = await (await fetch(imagen.uri)).blob();
      formData.append('imagen', blob, nombreArchivo);
    } else {
      formData.append('imagen', {
        uri: imagen.uri,
        name: nombreArchivo,
        type: tipoArchivo,
      } as unknown as Blob);
    }

    try {
      setCargando(true);
      setResultado('');

      const respuesta = await fetch(`${API_BASE_URL}/recetas`, {
        method: 'POST',
        body: formData,
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.detail ?? 'No se pudo procesar la imagen.');
      }

      setResultado(datos.resultado ?? 'No se recibió una respuesta.');
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      setResultado(`Error al consultar RecetAI: ${mensaje}`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header />

          <ImageDropzone imagen={imagen} onPress={elegirImagen} onRemove={quitarImagen} />

          <ActionButtons onGaleria={elegirImagen} onCamara={tomarFoto} disabled={cargando} />

          <PrimaryButton
            label="Generar recetas"
            loadingLabel="Analizando ingredientes..."
            icon="sparkles"
            onPress={procesarImagen}
            disabled={!imagen}
            loading={cargando}
          />

          {cargando ? <ResultSkeleton /> : null}
          {!cargando && resultado ? <RecipeResults resultado={resultado} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    gap: 20,
    padding: 20,
    paddingBottom: 48,
  },
});
