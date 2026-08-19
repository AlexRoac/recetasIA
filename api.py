from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
from starlette.concurrency import run_in_threadpool

from recetai_core import recomendar_recetas


app = FastAPI(title="RecetAI API")
STATIC_DIR = Path(__file__).resolve().parent / "static"
GENERATED_DIR = STATIC_DIR / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recetas")
async def crear_recetas(
    request: Request,
    imagen: UploadFile = File(...),
    generar_imagenes: bool | None = None,
):
    contenido = await imagen.read()

    try:
        imagen_pil = Image.open(BytesIO(contenido)).convert("RGB")
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail="El archivo enviado no es una imagen valida.",
        ) from error

    resultado = await run_in_threadpool(
        recomendar_recetas,
        imagen_pil,
        generar_imagenes,
    )

    for receta in resultado.get("recetas", []):
        archivo = receta.pop("imagen_archivo", None)
        if archivo:
            receta["imagen_url"] = str(
                request.url_for("static", path=f"generated/{archivo}")
            )

    return {"resultado": resultado}
