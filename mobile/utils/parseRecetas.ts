export type Receta = {
  titulo: string;
  ingredientes: string[];
  ingredientesAdicionales: string[];
  preparacion: string[];
};

export type RecetasParseadas = {
  ingredientesDetectados: string[];
  recetas: Receta[];
};

function extraerLista(bloque: string): string[] {
  return bloque
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => /^[-*]\s+/.test(linea) || /^\d+\.\s+/.test(linea))
    .map((linea) => linea.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
}

export function parsearRecetas(markdown: string): RecetasParseadas | null {
  if (!markdown || !markdown.includes('##')) {
    return null;
  }

  const secciones = markdown.split(/\n(?=##\s)/g).map((seccion) => seccion.trim());
  let ingredientesDetectados: string[] = [];
  const recetas: Receta[] = [];

  for (const seccion of secciones) {
    const tituloMatch = seccion.match(/^##\s+(.+)/);
    if (!tituloMatch) continue;
    const titulo = tituloMatch[1].trim();

    if (/ingredientes detectados/i.test(titulo)) {
      ingredientesDetectados = extraerLista(seccion);
      continue;
    }

    const recetaMatch = titulo.match(/receta\s*\d*\s*:?\s*(.*)/i);
    if (!recetaMatch) continue;

    const subsecciones = seccion.split(/\n(?=###\s)/g);
    const receta: Receta = {
      titulo: recetaMatch[1].trim() || titulo,
      ingredientes: [],
      ingredientesAdicionales: [],
      preparacion: [],
    };

    for (const sub of subsecciones) {
      const subTituloMatch = sub.match(/^###\s+(.+)/);
      if (!subTituloMatch) continue;
      const subTitulo = subTituloMatch[1].toLowerCase();

      if (subTitulo.includes('adicional')) {
        receta.ingredientesAdicionales = extraerLista(sub);
      } else if (subTitulo.includes('ingrediente')) {
        receta.ingredientes = extraerLista(sub);
      } else if (subTitulo.includes('preparaci')) {
        receta.preparacion = extraerLista(sub);
      }
    }

    recetas.push(receta);
  }

  if (recetas.length === 0 && ingredientesDetectados.length === 0) {
    return null;
  }

  return { ingredientesDetectados, recetas };
}
