import base64
import json
import os
import re
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai


load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "static" / "generated"

TEXT_MODEL_NAME = os.getenv("RECETAI_TEXT_MODEL", "gemini-3.1-flash-lite")
IMAGE_MODEL_NAME = os.getenv("RECETAI_IMAGE_MODEL", "gemini-3.1-flash-lite-image")
IMAGE_COST_USD = 0.0336


api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError(
        "No se encontro GEMINI_API_KEY. Crea un archivo .env o configura la "
        "variable de entorno GEMINI_API_KEY antes de ejecutar la aplicacion."
    )

client = genai.Client(api_key=api_key)


RECETAS_SCHEMA = {
    "type": "object",
    "properties": {
        "mensaje": {"type": "string"},
        "ingredientes_detectados": {
            "type": "array",
            "items": {"type": "string"},
        },
        "recetas": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "titulo": {"type": "string"},
                    "ingredientes": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "ingredientes_adicionales": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "preparacion": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": [
                    "titulo",
                    "ingredientes",
                    "ingredientes_adicionales",
                    "preparacion",
                ],
            },
        },
    },
    "required": ["ingredientes_detectados", "recetas"],
}


PROMPT_RECETAS = """
Eres RecetAI, un asistente que recomienda recetas a partir de una fotografia de
ingredientes.

Analiza la imagen y detecta unicamente los ingredientes comestibles que se
distingan con claridad. Ignora por completo objetos, utensilios, envases,
personas, animales o cualquier otra cosa que no sea un ingrediente comestible.
Si la imagen mezcla ingredientes comestibles con cosas que no se pueden comer,
detecta igualmente los ingredientes comestibles presentes e ignora el resto.
No inventes ingredientes que no sean visibles.

Si no detectas ningun ingrediente comestible en la imagen, devuelve:
- mensaje: "No se detectaron ingredientes comestibles en la imagen. Sube una foto donde se vean claramente ingredientes que se puedan comer."
- ingredientes_detectados: []
- recetas: []

Si detectas al menos un ingrediente comestible, genera exactamente 2 recetas en
espanol:

- Receta 1: usa unicamente los ingredientes detectados, sin agregar ningun
  ingrediente adicional.
- Receta 2: usa los ingredientes detectados y agrega uno o dos ingredientes
  basicos adicionales (como sal, aceite, agua, azucar o especias) para
  complementarla, listandolos claramente como ingredientes_adicionales.

Devuelve solamente JSON valido con esta forma:
{
  "mensaje": "",
  "ingredientes_detectados": ["Ingrediente visible 1"],
  "recetas": [
    {
      "titulo": "Nombre de la receta",
      "ingredientes": ["Ingrediente usado"],
      "ingredientes_adicionales": [],
      "preparacion": ["Paso claro y breve"]
    }
  ]
}
"""


def _env_bool(nombre: str, default: bool = False) -> bool:
    valor = os.getenv(nombre)
    if valor is None:
        return default

    return valor.strip().lower() in {"1", "true", "t", "yes", "y", "si", "s", "on"}


def _respuesta_base(mensaje: str = "", error: bool = False) -> dict[str, Any]:
    return {
        "mensaje": mensaje,
        "ingredientes_detectados": [],
        "recetas": [],
        "imagenes_habilitadas": _env_bool("RECETAI_GENERAR_IMAGENES"),
        "imagenes_generadas": False,
        "costo_imagenes_estimado_usd": 0,
        "error": error,
    }


def _imagen_a_base64(imagen) -> str:
    buffer = BytesIO()
    imagen.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _limpiar_json(texto: str) -> str:
    texto = texto.strip()
    bloque = re.match(r"^```(?:json)?\s*(.*?)\s*```$", texto, flags=re.DOTALL)
    return bloque.group(1).strip() if bloque else texto


def _lista_texto(valor: Any) -> list[str]:
    if not isinstance(valor, list):
        return []

    return [str(item).strip() for item in valor if str(item).strip()]


def _normalizar_recetas(datos: dict[str, Any]) -> dict[str, Any]:
    recetas_normalizadas: list[dict[str, Any]] = []

    for receta in datos.get("recetas", []):
        if not isinstance(receta, dict):
            continue

        titulo = str(receta.get("titulo", "")).strip()
        recetas_normalizadas.append(
            {
                "titulo": titulo or "Receta sugerida",
                "ingredientes": _lista_texto(receta.get("ingredientes")),
                "ingredientes_adicionales": _lista_texto(
                    receta.get("ingredientes_adicionales")
                ),
                "preparacion": _lista_texto(receta.get("preparacion")),
                "imagen_url": None,
                "imagen_error": None,
            }
        )

    return {
        "mensaje": str(datos.get("mensaje", "")).strip(),
        "ingredientes_detectados": _lista_texto(datos.get("ingredientes_detectados")),
        "recetas": recetas_normalizadas[:2],
        "imagenes_habilitadas": _env_bool("RECETAI_GENERAR_IMAGENES"),
        "imagenes_generadas": False,
        "costo_imagenes_estimado_usd": 0,
        "error": False,
    }


def _parsear_respuesta_recetas(texto: str) -> dict[str, Any]:
    try:
        datos = json.loads(_limpiar_json(texto))
    except json.JSONDecodeError as error:
        raise ValueError("Gemini no devolvio JSON valido.") from error

    if not isinstance(datos, dict):
        raise ValueError("Gemini devolvio un formato inesperado.")

    return _normalizar_recetas(datos)


def _slug(texto: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", texto.strip().lower()).strip("-")
    return slug[:40] or "receta"


def _prompt_imagen_receta(
    receta: dict[str, Any], ingredientes_detectados: list[str]
) -> str:
    ingredientes = receta.get("ingredientes", [])
    adicionales = receta.get("ingredientes_adicionales", [])
    preparacion = receta.get("preparacion", [])

    return f"""
Crea una fotografia realista y apetitosa del platillo terminado.

Platillo: {receta.get("titulo", "receta casera")}
Ingredientes detectados disponibles: {", ".join(ingredientes_detectados)}
Ingredientes usados: {", ".join(ingredientes)}
Ingredientes adicionales permitidos: {", ".join(adicionales) if adicionales else "ninguno"}
Preparacion resumida: {" ".join(preparacion)}

Estilo visual:
- comida casera realista servida en un plato limpio
- luz natural suave
- encuadre 4:3 desde arriba en angulo ligero
- sin texto, sin logos, sin marcas, sin manos y sin personas
- no muestres ingredientes que no aparecen en las listas anteriores
"""


def generar_imagen_receta(
    receta: dict[str, Any], ingredientes_detectados: list[str]
) -> str:
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    interaction = client.interactions.create(
        model=IMAGE_MODEL_NAME,
        input=_prompt_imagen_receta(receta, ingredientes_detectados),
        response_format={
            "type": "image",
            "mime_type": "image/png",
            "aspect_ratio": "4:3",
            "image_size": "1K",
        },
    )

    output_image = getattr(interaction, "output_image", None)
    if output_image is None or not getattr(output_image, "data", None):
        raise RuntimeError("Gemini no devolvio una imagen para esta receta.")

    archivo = f"{uuid.uuid4().hex}-{_slug(receta.get('titulo', 'receta'))}.png"
    ruta = GENERATED_DIR / archivo
    ruta.write_bytes(base64.b64decode(output_image.data))
    return archivo


def recomendar_recetas(imagen, generar_imagenes: bool | None = None) -> dict[str, Any]:
    if imagen is None:
        return _respuesta_base("Sube una imagen con ingredientes para generar recetas.")

    try:
        imagen_base64 = _imagen_a_base64(imagen)

        respuesta = client.interactions.create(
            model=TEXT_MODEL_NAME,
            input=[
                {"type": "text", "text": PROMPT_RECETAS},
                {
                    "type": "image",
                    "data": imagen_base64,
                    "mime_type": "image/png",
                },
            ],
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": RECETAS_SCHEMA,
            },
        )
    except Exception as error:
        return _respuesta_base(f"Error al consultar Gemini: {error}", error=True)

    if not respuesta.output_text:
        return _respuesta_base(
            "Gemini no devolvio una respuesta. Intenta con otra imagen.",
            error=True,
        )

    try:
        resultado = _parsear_respuesta_recetas(respuesta.output_text)
    except ValueError as error:
        return _respuesta_base(str(error), error=True)

    imagenes_activadas_en_env = _env_bool("RECETAI_GENERAR_IMAGENES")
    habilitar_imagenes = (
        imagenes_activadas_en_env
        if generar_imagenes is None
        else imagenes_activadas_en_env and generar_imagenes
    )
    resultado["imagenes_habilitadas"] = habilitar_imagenes

    if not habilitar_imagenes or not resultado["recetas"]:
        return resultado

    imagenes_generadas = 0
    for receta in resultado["recetas"]:
        try:
            archivo = generar_imagen_receta(receta, resultado["ingredientes_detectados"])
        except Exception as error:
            receta["imagen_error"] = f"No se pudo generar imagen: {error}"
            continue

        receta["imagen_archivo"] = archivo
        imagenes_generadas += 1

    resultado["imagenes_generadas"] = imagenes_generadas > 0
    resultado["costo_imagenes_estimado_usd"] = round(
        imagenes_generadas * IMAGE_COST_USD, 4
    )
    return resultado


def resultado_a_markdown(resultado: dict[str, Any]) -> str:
    if resultado.get("mensaje") and not resultado.get("recetas"):
        return str(resultado["mensaje"])

    lineas: list[str] = []

    if resultado.get("ingredientes_detectados"):
        lineas.append("## Ingredientes detectados")
        lineas.extend(f"- {item}" for item in resultado["ingredientes_detectados"])
        lineas.append("")

    for indice, receta in enumerate(resultado.get("recetas", []), start=1):
        lineas.append(f"## Receta {indice}: {receta['titulo']}")

        if receta.get("imagen_archivo"):
            lineas.append(f"Imagen generada: static/generated/{receta['imagen_archivo']}")
            lineas.append("")

        lineas.append("### Ingredientes")
        lineas.extend(f"- {item}" for item in receta.get("ingredientes", []))
        lineas.append("")

        if receta.get("ingredientes_adicionales"):
            lineas.append("### Ingredientes adicionales")
            lineas.extend(
                f"- {item}" for item in receta.get("ingredientes_adicionales", [])
            )
            lineas.append("")

        lineas.append("### Preparacion")
        lineas.extend(
            f"{paso_indice}. {paso}"
            for paso_indice, paso in enumerate(receta.get("preparacion", []), start=1)
        )
        lineas.append("")

        if receta.get("imagen_error"):
            lineas.append(f"> {receta['imagen_error']}")
            lineas.append("")

    return "\n".join(lineas).strip()


def recomendar_recetas_markdown(imagen) -> str:
    return resultado_a_markdown(recomendar_recetas(imagen))
