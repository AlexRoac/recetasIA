import gradio as gr

from recetai_core import GENERATED_DIR, recomendar_recetas, resultado_a_markdown


def recomendar_en_gradio(imagen):
    resultado = recomendar_recetas(imagen)
    imagenes = [
        str(GENERATED_DIR / receta["imagen_archivo"])
        for receta in resultado.get("recetas", [])
        if receta.get("imagen_archivo")
    ]
    return resultado_a_markdown(resultado), imagenes


with gr.Blocks(title="RecetAI") as demo:
    gr.Markdown("# RecetAI")

    imagen = gr.Image(
        label="Sube una fotografia de tus ingredientes",
        type="pil",
    )
    boton = gr.Button("Procesar imagen")
    resultado = gr.Markdown()
    imagenes = gr.Gallery(label="Imagenes generadas", columns=2, height="auto")

    boton.click(
        fn=recomendar_en_gradio,
        inputs=imagen,
        outputs=[resultado, imagenes],
    )


if __name__ == "__main__":
    demo.launch()
