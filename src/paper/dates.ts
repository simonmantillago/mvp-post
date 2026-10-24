const day = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' })
const full = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const short = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })
const time = new Intl.DateTimeFormat('es', { hour: 'numeric', minute: '2-digit' })

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const formatDay = (d: Date) => cap(day.format(d))
export const formatFull = (d: Date) => cap(full.format(d))
export const formatShort = (d: string | Date) => short.format(new Date(d)).replace('.', '')
export const formatTime = (d: string | Date) => time.format(new Date(d))
