import { Component, type ReactNode } from 'react'
import { isChunkError, reloadOnce } from '../lib/recover'
import { PressNote } from './PressNote'

/**
 * Si algo se rompe al pintar, en vez de la pantalla en blanco sale la fe de erratas con un botón para recargar.
 * Si lo que falló fue un trozo de código de una versión vieja, recarga sola una vez.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    if (isChunkError(error)) reloadOnce()
    else console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <PressNote
        tone="error"
        title="Fe de erratas"
        body="Algo se trabó en la imprenta."
        action={
          <button type="button" className="press-note-button" onClick={() => location.reload()}>
            Volver a cargar
          </button>
        }
      />
    )
  }
}
