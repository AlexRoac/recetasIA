from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from starlette.concurrency import run_in_threadpool

from recetai_core import recomendar_recetas


app = FastAPI(title="RecetAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recetas")
async def crear_recetas(imagen: UploadFile = File(...)):
    contenido = await imagen.read()

    try:
        imagen_pil = Image.open(BytesIO(contenido)).convert("RGB")
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail="El archivo enviado no es una imagen valida.",
        ) from error

    resultado = await run_in_threadpool(recomendar_recetas, imagen_pil)
    return {"resultado": resultado}
