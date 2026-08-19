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

Analiza la imagen y detecta unicamente los ingredientes comestibles que se
distingan con claridad. Ignora por completo objetos, utensilios, envases,
personas, animales o cualquier otra cosa que no sea un ingrediente comestible.
Si la imagen mezcla ingredientes comestibles con cosas que no se pueden comer,
detecta igualmente los ingredientes comestibles presentes e ignora el resto.
No inventes ingredientes que no sean visibles.

Si no detectas ningun ingrediente comestible en la imagen, no generes ninguna
receta ni la seccion de ingredientes detectados. Responde unicamente con el
siguiente texto, sin nada mas:

No se detectaron ingredientes comestibles en la imagen. Sube una foto donde se
vean claramente ingredientes que se puedan comer.

Si detectas al menos un ingrediente comestible, genera exactamente 2 recetas
en espanol:

- Receta 1: usa unicamente los ingredientes detectados, sin agregar ningun
  ingrediente adicional.
- Receta 2: usa los ingredientes detectados y agrega uno o dos ingredientes
  basicos adicionales (como sal, aceite, agua, azucar o especias) para
  complementarla, listandolos claramente como ingredientes adicionales.

Responde en Markdown con esta estructura:

## Ingredientes detectados
- Ingrediente visible 1
- Ingrediente visible 2

## Receta 1: Nombre de la receta
### Ingredientes
- Ingredientes detectados usados

### Nutricion aproximada
- Calorias: aprox. X kcal por porcion
- Carbohidratos: aprox. X g
- Proteina: aprox. X g
- Grasas: aprox. X g
- Fibra: aprox. X g

### Preparacion
1. Paso a paso claro y breve

## Receta 2: Nombre de la receta
### Ingredientes
- Ingredientes detectados usados

### Ingredientes adicionales
- Ingredientes basicos adicionales

### Nutricion aproximada
- Calorias: aprox. X kcal por porcion
- Carbohidratos: aprox. X g
- Proteina: aprox. X g
- Grasas: aprox. X g
- Fibra: aprox. X g

### Preparacion
1. Paso a paso claro y breve

Las cifras de nutricion deben ser estimaciones practicas, no valores exactos.
Si algun elemento relevante aplica por los ingredientes visibles o adicionales
(por ejemplo sodio, azucares o grasas saturadas), puedes incluirlo como punto
extra dentro de "Nutricion aproximada".
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
