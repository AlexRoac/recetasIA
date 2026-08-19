export type ImagenSeleccionada = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  width: number;
  height: number;
};

export type RecetaGenerada = {
  titulo: string;
  ingredientes: string[];
  ingredientes_adicionales: string[];
  preparacion: string[];
  imagen_url?: string | null;
  imagen_error?: string | null;
};

export type ResultadoRecetas = {
  mensaje: string;
  ingredientes_detectados: string[];
  recetas: RecetaGenerada[];
  imagenes_habilitadas: boolean;
  imagenes_generadas: boolean;
  costo_imagenes_estimado_usd: number;
  error?: boolean;
};
