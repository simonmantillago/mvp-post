import type { SectionId } from '../lib/types'

/** Cómo se compone el artículo de la sección en la portada; cada plana mezcla varias para que no se lea como una lista. */
export type StoryLayout = 'lead-left' | 'float-right' | 'banner' | 'pair'

export type SectionEntry = {
  id: Exclude<SectionId, 'portada'>
  path: string
  name: string
  /** Cortes fijos del nombre (cada línea nunca se parte), cuando el título debe leerse así */
  nameLines?: string[]
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
    dek: 'Mural de fotos de la pareja con más estilo del momento: fotos y recortes pegados a mano, al estilo Y2K.',
    cover: '/portada/collage.webp',
    caption: '#SWAG, en primera fila.',
    layout: 'lead-left',
  },
  {
    id: 'alfombra',
    path: '/alfombra-roja',
    name: 'Los Ángeles de Victoria',
    nameLines: ['Los Ángeles', 'de Victoria'],
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
    dek: 'Tras mudarse a Napa, Big abre su nuevo negocio de vinilos de las canciones de su historia de amor. La tienda tiene una sola clienta y es el amor de su vida, cada disco llega con una dedicatoria escrita a mano.',
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
    dek: 'Reabre el videoclub con las películas más esperadas del momento. Esta noche elige uno, por turno o a la suerte, y los dos mejores críticos de la ciudad están aquí.',
    cover: '/portada/cartelera.webp',
    caption: 'En taquilla esta semana.',
    layout: 'pair',
  },
  {
    id: 'cartas',
    path: '/cartas',
    name: 'Cartas mágicas',
    page: 6,
    dek: 'Nuevo hechizo para enviar mensajes, las cartas al editor ahora llegan al instante. Y las lechuzas han aprendido a decir Tin por algún motivo desconocido.',
    cover: '/portada/escudo.webp',
    caption: 'Correspondencia certificada.',
    coverAspect: '44 / 50',
    layout: 'pair',
  },
]

export function sectionById(id: SectionId | null | undefined) {
  return sections.find((s) => s.id === id)
}
