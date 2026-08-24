# RecetAI

RecetAI es una aplicacion sencilla en Python que recibe una imagen con
ingredientes, la envia a Gemini y genera 3 recetas en espanol basadas
principalmente en los ingredientes visibles. Tambien incluye una app movil en
React Native con Expo para usarla desde iOS y Android con Expo Go.

## Tecnologias utilizadas

- Python
- Gemini API con `google-genai`
- Gradio
- Pillow
- python-dotenv
- FastAPI
- Expo
- React Native

## Requisitos

- Python 3.10 o superior
- Una API key de Gemini

## Instalacion

Clona el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
cd recetai
```

Crea y activa un entorno virtual:

```bash
python -m venv .venv
```

En Windows:

```bash
.venv\Scripts\activate
```

En macOS o Linux:

```bash
source .venv/bin/activate
```

Instala las dependencias:

```bash
pip install -r requirements.txt
```

## Configuracion de la API key

Crea un archivo `.env` en la raiz del proyecto usando `.env.example` como
referencia:

```text
GEMINI_API_KEY=tu_api_key_aqui
```

Reemplaza `tu_api_key_aqui` por tu API key real de Gemini. No subas el archivo
`.env` a GitHub.

## Ejecucion

Inicia la aplicacion con:

```bash
python app.py
```

Gradio abrira una interfaz local donde podras subir una imagen y recibir
recomendaciones de recetas.

## App movil con Expo Go

La app movil esta en la carpeta `mobile/`. La API key de Gemini se queda en el
backend Python; no se copia a React Native.

Primero inicia el backend local:

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

Busca la IP local de tu computadora. En Windows puedes usar:

```powershell
ipconfig
```

En el celular no uses `127.0.0.1`, porque eso apunta al propio telefono. Usa la
IP local de tu computadora, por ejemplo:

```text
http://192.168.1.25:8000
```

Luego inicia Expo:

```bash
cd mobile
npm install
npm start
```

Abre Expo Go en iOS o Android, escanea el QR y escribe la URL del backend en el
campo `Backend` de la app.

Puedes crear `mobile/.env` a partir de `mobile/.env.example` para dejar una URL
por defecto:

```text
EXPO_PUBLIC_RECETAI_API_URL=http://TU_IP_LOCAL:8000
```

## Flujo de la aplicacion

```text
Imagen -> Gemini -> deteccion de ingredientes -> generacion de recetas -> Gradio
```

En movil:

```text
Imagen -> Expo Go -> FastAPI -> Gemini -> recetas -> Expo Go
```

## Despliegue de demo

Para un demo publico, publica el backend y el frontend por separado:

1. Backend FastAPI en Render

   - Sube este repositorio a GitHub.
   - En Render, crea un Web Service desde el repositorio o usa `render.yaml`.
   - Configura la variable de entorno `GEMINI_API_KEY` en Render. No subas `.env`.
   - El comando de inicio es:

   ```bash
   uvicorn api:app --host 0.0.0.0 --port $PORT
   ```

   Cuando termine el deploy, prueba:

   ```text
   https://TU_BACKEND.onrender.com/health
   ```

2. Frontend web de Expo en Vercel

   - En Vercel, importa el mismo repositorio.
   - Usa `mobile` como Root Directory.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
   - Agrega esta variable de entorno en Vercel:

   ```text
   EXPO_PUBLIC_RECETAI_API_URL=https://TU_BACKEND.onrender.com
   ```

   Vercel generara el sitio web a partir de la app Expo.

Tambien puedes publicar solo la interfaz Gradio en Hugging Face Spaces o Render,
pero para la app web/movil conviene mantener FastAPI como backend.
