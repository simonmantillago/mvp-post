import { useSignedUrl } from '../hooks/useData'
import './Halftone.css'

/** Foto impresa en medio tono. Sin foto, el hueco queda reservado y lo dice en el pie. */
export function Halftone({ bucket = 'photos', path, alt, caption, className = '' }: { bucket?: string; path: string | null; alt: string; caption?: string; className?: string }) {
  const url = useSignedUrl(bucket, path)
  return (
    <figure className={`halftone ${className}`}>
      <div className="halftone-plate">
        {url ? <img src={url} alt={alt} /> : <span className="halftone-empty" aria-hidden="true" />}
      </div>
      {(caption || !path) && <figcaption className="halftone-caption">{caption || 'Espacio reservado para la foto de esta edición.'}</figcaption>}
    </figure>
  )
}
