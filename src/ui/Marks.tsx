// Marcas impresas del periódico: sello de lacre (quién escribió/dedicó) y sello de goma (estados).
import './Marks.css'

const FLAME = 'M32 15c1.5 5.5 9.5 9.5 9.5 19.5a9.5 9.5 0 0 1-19 0c0-4.5 2.2-7.6 4.6-9.6-.1 3.4 1 5.6 3 6.8-.9-6.4.4-11.7 1.9-16.7z'
const FLAME_CORE = 'M32.4 30c2.1 2.3 3.6 4.4 3.6 7a4 4 0 0 1-8 0c0-2.6 2-4.6 4.4-7z'

/** Lacre aplastado con borde irregular y la inicial hundida. Rosa = ella, dorado viejo = él. */
export function WaxSeal({ initial, her, wine = false, flame = false, size = 34, label }: { initial: string; her: boolean; wine?: boolean; flame?: boolean; size?: number; label?: string }) {
  // Lacre: rosa para ella, dorado para él; vino para el Tin de Cartas mágicas
  const [base, deep, hi] = wine ? ['#a3262a', '#4f0c0e', '#e0706a'] : her ? ['#c2255c', '#7d1238', '#f07aa4'] : ['#a8842f', '#5e4512', '#e6c877']
  const id = wine ? 'wax-wine' : her ? 'wax-her' : 'wax-him'
  return (
    <svg className="wax-seal" width={size} height={size} viewBox="0 0 64 64" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <radialGradient id={`${id}-g`} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.45" stopColor={base} />
          <stop offset="1" stopColor={deep} />
        </radialGradient>
      </defs>
      {/* charco de lacre: contorno irregular */}
      <path
        d="M33 3c6 0 9 4 14 5 6 2 11 6 12 12 1 5 4 8 3 14-1 5-5 8-6 13-2 6-7 9-13 11-5 2-9 4-15 3-6-1-9-5-14-8-5-4-9-8-10-14-1-6 1-10 2-15 2-6 4-11 9-14 5-4 11-7 18-7z"
        fill={`url(#${id}-g)`}
      />
      {/* anillo del sello presionado */}
      <circle cx="32" cy="33" r="19" fill="none" stroke={deep} strokeWidth="2.5" opacity="0.7" />
      <circle cx="32.6" cy="33.6" r="19" fill="none" stroke={hi} strokeWidth="1" opacity="0.45" />
      {/* llama en relieve (Tin): luz abajo a la derecha, hundido oscuro encima */}
      {flame && (
        <g>
          <path d={FLAME} fill={hi} opacity="0.55" transform="translate(0.9 0.9)" />
          <path d={FLAME} fill={deep} />
          <path d={FLAME_CORE} fill={base} opacity="0.9" />
        </g>
      )}
      {/* inicial hundida: sombra oscura arriba, luz abajo */}
      <text x="32" y="42" textAnchor="middle" fontFamily="Bodoni Moda, serif" fontStyle="italic" fontSize="26" fill={hi} opacity="0.55" transform="translate(0.8 0.8)">
        {initial}
      </text>
      <text x="32" y="42" textAnchor="middle" fontFamily="Bodoni Moda, serif" fontStyle="italic" fontSize="26" fill={deep}>
        {initial}
      </text>
    </svg>
  )
}

/** Sello de goma en tinta: marca de estado (Fijado, Visto…). */
export function RubberStamp({ children }: { children: string }) {
  return <span className="rubber-stamp">{children}</span>
}
