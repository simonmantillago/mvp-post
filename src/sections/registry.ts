import type { SectionId } from '../lib/types'

/** Cómo se compone el artículo de la sección en la portada; cada plana mezcla varias para que no se lea como una lista. */
export type StoryLayout = 'lead-left' | 'float-right' | 'banner' | 'pair'

export type SectionEntry = {
  id: Exclude<SectionId, 'portada'>
  path: string
  name: string
  page: number
  /** Bajada del artículo en la portada */
  dek: string
  /** Foto del artículo (public/portada/) y su pie */
  cover: string
  caption: string
  /** Encuadre de la foto: 'contain' para logos sobre blanco; posición para recortar donde importa */
  coverFit?: 'cover' | 'contain'
  coverPosition?: string
  /** Proporción del marco cuando la foto no es la de su composición (ancho / alto) */
  coverAspect?: string
  layout: StoryLayout
}

// Portada, notificaciones (`activity.section`) y la columna ("Sigue en pág. N") leen de aquí.
export const sections: SectionEntry[] = [
  {
    id: 'y2k',
    path: '/y2k',
    name: "2000's Collage",
    page: 2,
    dek: 'Collage de fotos de la pareja con más estilo del momento: fotos y recortes pegados a mano, como en 2003.',
    cover: '/portada/swag.webp',
    caption: '#SWAG, en primera fila.',
    layout: 'lead-left',
  },
  {
    id: 'alfombra',
    path: '/alfombra-roja',
    name: 'Los Ángeles de Victoria',
    page: 3,
    dek: 'Sección dedicada a tomarle fotos al ángel más hermoso que he conocido.',
    cover: '/portada/angeles.webp',
    caption: 'Desfile privado, una sola modelo.',
    coverFit: 'contain',
    layout: 'float-right',
  },
  {
    id: 'vinilos',
    path: '/vinilos',
    name: 'Los vinilos de Big',
    page: 4,
    dek: 'Tras mudarse a Napa, Big abre su nuevo negocio: vinilos dedicados al amor de su vida. Cada funda lleva un lacre y una dedicatoria escrita a mano.',
    cover: '/portada/big.webp',
    caption: 'Big, en la inauguración de su tienda en Napa.',
    coverPosition: '50% 30%',
    layout: 'banner',
  },
  {
    id: 'cartelera',
    path: '/cartelera',
    name: 'Cartelera',
    page: 5,
    dek: 'Qué vemos esta noche: turnos, estrellas y una lista que nunca se acaba.',
    cover: '/portada/cartelera.webp',
    caption: 'Estreno de la semana.',
    layout: 'pair',
  },
  {
    id: 'cartas',
    path: '/cartas',
    name: 'Cartas mágicas',
    page: 6,
    dek: 'Ahora los mensajes al editor llegan por lechuza, con sello de lacre.',
    cover: '/portada/escudo.webp',
    caption: 'Correspondencia certificada.',
    coverAspect: '44 / 50',
    layout: 'pair',
  },
]

export function sectionById(id: SectionId | null | undefined) {
  return sections.find((s) => s.id === id)
}
