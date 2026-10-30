// Íconos propios: una sola familia, trazo 1.75 sobre retícula de 24, puntas redondeadas.
const paths = {
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  unlock: 'M7 11V8a5 5 0 0 1 9.6-2M6 11h12v9H6z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  flip: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  plus: 'M12 5v14M5 12h14',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  scissors: 'M8.5 8.5L20 20M8.5 15.5L20 4M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  type: 'M5 7V5h14v2M12 5v14M9 19h6',
  play: 'M7 5l12 7-12 7z',
  pause: 'M7 5h3v14H7zM14 5h3v14h-3z',
  send: 'M4 12l16-8-6 16-2.5-6.5z',
  close: 'M6 6l12 12M18 6L6 18',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  front: 'M8 8h12v12H8zM4 16V4h12',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  chevron: 'M9 6l6 6-6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
  pen: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01',
  check: 'M5 12.5l4.5 4.5L19 7',
  minus: 'M5 12h14',
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4',
  door: 'M6 21V4h12v17M3 21h18M14 12h.01',
  wheel: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 22, filled = false, label }: { name: IconName; size?: number; filled?: boolean; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}
