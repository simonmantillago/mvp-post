import type { ReactNode } from 'react'
import './PressNote.css'

/** Estados de carga, vacío y error en el tono del periódico (o de la sección donde aparece). */
export function PressNote({ title, body, action, tone = 'info' }: { title: string; body?: ReactNode; action?: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <div className="press-note" role={tone === 'error' ? 'alert' : 'status'}>
      <p className="press-note-title">{title}</p>
      {body && <p className="press-note-body">{body}</p>}
      {action}
    </div>
  )
}
