import { formatFull } from './dates'
import './Arrival.css'

/**
 * Llegada: el periódico doblado, atado con la cinta de «Edición especial», cae y aterriza en la
 * puerta; la cabecera termina de imprimirse y la tira de papel es la barra de carga. Un toque la salta.
 */
export function Arrival({ onSkip }: { onSkip: () => void }) {
  return (
    <button type="button" className="arrival" onClick={onSkip} aria-label="Abrir el periódico">
      <span className="arrival-doorstep" aria-hidden="true" />
      <span className="arrival-paper newsprint">
        <span className="arrival-date">{formatFull(new Date())}</span>
        <span className="arrival-mast" aria-hidden="true">
          The MVP Post
        </span>
        <span className="arrival-rule" />
        <span className="arrival-cols" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="arrival-fold" aria-hidden="true" />
        <span className="arrival-ribbon">Edición especial</span>
      </span>
      <span className="arrival-strip" aria-hidden="true">
        <span className="arrival-strip-paper" />
      </span>
      <span className="arrival-sign">SMG Development®</span>
    </button>
  )
}
