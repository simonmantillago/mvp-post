// Stickers propios del collage, dibujados en SVG (sin marcas reales).
import type { ReactElement } from 'react'

const glitter = (id: string, a: string, b: string) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={a} />
      <stop offset="0.5" stopColor={b} />
      <stop offset="1" stopColor={a} />
    </linearGradient>
  </defs>
)

export const stickers: Record<string, { label: string; svg: ReactElement }> = {
  'star-chrome': {
    label: 'Estrella cromada',
    svg: (
      <svg viewBox="0 0 100 100">
        {glitter('g-star', '#f7f8fa', '#9aa3ad')}
        <path d="M50 4l13 30 32 3-24 21 7 32-28-17-28 17 7-32L5 37l32-3z" fill="url(#g-star)" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
        <path d="M38 30l6-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
  'heart-pink': {
    label: 'Corazón brillante',
    svg: (
      <svg viewBox="0 0 100 100">
        {glitter('g-heart', '#ff3ea5', '#ffb3d6')}
        <path d="M50 88S10 62 10 34a20 20 0 0 1 40-6 20 20 0 0 1 40 6c0 28-40 54-40 54z" fill="url(#g-heart)" stroke="#1a1a1a" strokeWidth="3" />
        <ellipse cx="32" cy="32" rx="7" ry="4" fill="#fff" opacity=".8" transform="rotate(-35 32 32)" />
      </svg>
    ),
  },
  sparkle: {
    label: 'Destello',
    svg: (
      <svg viewBox="0 0 100 100">
        <path d="M50 2c4 30 18 44 48 48-30 4-44 18-48 48-4-30-18-44-48-48 30-4 44-18 48-48z" fill="#3ddc97" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    ),
  },
  cherries: {
    label: 'Cerezas',
    svg: (
      <svg viewBox="0 0 100 100">
        <path d="M30 70C34 40 48 20 70 8M66 70C64 46 66 26 70 8" fill="none" stroke="#2f6b2f" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 8c10 2 18 8 20 16-10 0-18-6-20-16z" fill="#3ddc97" stroke="#1a1a1a" strokeWidth="2.5" />
        <circle cx="28" cy="74" r="17" fill="#d1123f" stroke="#1a1a1a" strokeWidth="3" />
        <circle cx="66" cy="76" r="17" fill="#d1123f" stroke="#1a1a1a" strokeWidth="3" />
        <circle cx="22" cy="68" r="4" fill="#fff" opacity=".85" />
        <circle cx="60" cy="70" r="4" fill="#fff" opacity=".85" />
      </svg>
    ),
  },
  butterfly: {
    label: 'Mariposa holográfica',
    svg: (
      <svg viewBox="0 0 100 100">
        {glitter('g-fly', '#b8f3ff', '#ffc2f0')}
        <path d="M48 50C30 18 6 16 8 34c2 14 18 18 36 18-18 2-32 10-28 26 4 14 24 6 32-24zM52 50c18-32 42-34 40-16-2 14-18 18-36 18 18 2 32 10 28 26-4 14-24 6-32-24z" fill="url(#g-fly)" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 30v44" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
  'xoxo-tag': {
    label: 'Etiqueta XOXO',
    svg: (
      <svg viewBox="0 0 120 60">
        <rect x="3" y="3" width="114" height="54" rx="27" fill="#ff3ea5" stroke="#1a1a1a" strokeWidth="3" />
        <text x="60" y="41" textAnchor="middle" fontFamily="Bagel Fat One, sans-serif" fontSize="30" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5">
          XOXO
        </text>
      </svg>
    ),
  },
}
