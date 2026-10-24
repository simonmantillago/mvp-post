// Las dos credenciales de prensa del login. Antes de iniciar sesión no se puede leer
// `profiles`, así que nombres y fotos viven aquí. Las fotos van en public/readers/
// (si falta el archivo, la credencial muestra las iniciales en medio tono).
export type Reader = {
  key: 'ella' | 'el'
  name: string
  role: string
  email: string
  photo: string
  columnist: boolean
}

export const readers: Reader[] = [
  {
    key: 'ella',
    name: 'María Victoria',
    role: 'Lectora de honor',
    email: import.meta.env.VITE_EMAIL_HER ?? '',
    photo: '/readers/maria-victoria.jpg',
    columnist: false,
  },
  {
    key: 'el',
    name: 'Simón',
    role: 'El columnista',
    email: import.meta.env.VITE_EMAIL_HIM ?? '',
    photo: '/readers/simon.jpg',
    columnist: true,
  },
]

export function readerByEmail(email: string | undefined) {
  return readers.find((r) => r.email && r.email.toLowerCase() === email?.toLowerCase())
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
