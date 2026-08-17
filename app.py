import gradio as gr

from recetai_core import recomendar_recetas


with gr.Blocks(title="🍳 RecetAI") as demo:
    gr.Markdown("# 🍳 RecetAI")

    imagen = gr.Image(
        label="Sube una fotografia de tus ingredientes",
        type="pil",
    )
    boton = gr.Button("Procesar imagen")
    resultado = gr.Markdown()

    boton.click(
        fn=recomendar_recetas,
        inputs=imagen,
        outputs=resultado,
    )


if __name__ == "__main__":
    demo.launch()
