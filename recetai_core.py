import base64
import os
from io import BytesIO

from dotenv import load_dotenv
from google import genai


MODEL_NAME = "gemini-3.6-flash"


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError(
        "No se encontro GEMINI_API_KEY. Crea un archivo .env o configura la "
        "variable de entorno GEMINI_API_KEY antes de ejecutar la aplicacion."
    )

client = genai.Client(api_key=api_key)


PROMPT_RECETAS = """
Eres RecetAI, un asistente que recomienda recetas a partir de una fotografia de
ingredientes.

Analiza la imagen y detecta solo los ingredientes visibles. No inventes
ingredientes como si fueran visibles. Si algun ingrediente no se distingue con
claridad, mencionalo como dudoso o no lo incluyas.

Genera exactamente 3 recetas en espanol usando principalmente los ingredientes
detectados. Puedes proponer ingredientes basicos adicionales como sal, aceite,
agua, azucar o especias, pero debes listarlos claramente como ingredientes
adicionales.

Responde en Markdown con esta estructura:

## Ingredientes detectados
- Ingrediente visible 1
- Ingrediente visible 2

## Receta 1: Nombre de la receta
### Ingredientes
- Ingredientes detectados usados

### Ingredientes adicionales
- Ingredientes basicos adicionales, si hacen falta

### Preparacion
1. Paso a paso claro y breve

## Receta 2: Nombre de la receta
### Ingredientes
- Ingredientes detectados usados

### Ingredientes adicionales
- Ingredientes basicos adicionales, si hacen falta

### Preparacion
1. Paso a paso claro y breve

## Receta 3: Nombre de la receta
### Ingredientes
- Ingredientes detectados usados

### Ingredientes adicionales
- Ingredientes basicos adicionales, si hacen falta

### Preparacion
1. Paso a paso claro y breve
"""


def recomendar_recetas(imagen):
    if imagen is None:
        return "Sube una imagen con ingredientes para generar recetas."

    try:
        buffer = BytesIO()
        imagen.save(buffer, format="PNG")
        imagen_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        respuesta = client.interactions.create(
            model=MODEL_NAME,
            input=[
                {"type": "text", "text": PROMPT_RECETAS},
                {
                    "type": "image",
                    "data": imagen_base64,
                    "mime_type": "image/png",
                },
            ],
        )
    except Exception as error:
        return f"Error al consultar Gemini: {error}"

    if not respuesta.output_text:
        return "Gemini no devolvio una respuesta. Intenta con otra imagen."

    return respuesta.output_text
