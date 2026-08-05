import { useEffect, useMemo, useState } from 'react'

type Offer = {
  id: string
  title: string
  description: string
  price: string
  tag: string
  image: string
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/offers?$/i, '').replace(/\/api$/i, '')
const API_URL = `${API_BASE_URL}/api/offers`
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'

function resolveImageUrl(image?: string) {
  if (!image) {
    return ''
  }

  if (/^https?:\/\//i.test(image) || image.startsWith('data:')) {
    return image
  }

  if (image.startsWith('/')) {
    const apiUrl = new URL(API_BASE_URL, window.location.origin)
    const apiPath = apiUrl.pathname.replace(/\/$/, '')

    if (apiPath && image.startsWith(`${apiPath}/`)) {
      return `${apiUrl.origin}${image}`
    }
  }

  return `${API_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`
}

function getImageSrc(image?: string) {
  const resolved = resolveImageUrl(image)
  return resolved || PLACEHOLDER_IMAGE
}

function formatPrice(value?: string) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    return ''
  }

  return /ft$/i.test(trimmed) ? trimmed : `${trimmed} FT`
}

export function SpecialOfferSection() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)

  useEffect(() => {
    let active = true

    async function loadOffers() {
      try {
        const response = await fetch(API_URL)
        if (!response.ok) {
          throw new Error('Failed to load offers')
        }

        const payload = (await response.json()) as Offer[]

        if (active) {
          setOffers(payload)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load offers')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadOffers()

    const eventSource = new EventSource(`${API_BASE_URL}/api/content-events`)
    eventSource.addEventListener('offers-changed', () => {
      void loadOffers()
    })
    eventSource.addEventListener('content-changed', () => {
      void loadOffers()
    })

    return () => {
      active = false
      eventSource.close()
    }
  }, [])

  const selectedImage = useMemo(() => {
    if (!selectedOffer) {
      return ''
    }

    return getImageSrc(selectedOffer.image)
  }, [selectedOffer])

  return (
    <section id="menu" className="content-card">
      <div className="section-heading">
        <div>
          <p className="section-label">Különleges Ajánlataink</p>
          <h2>A Ti kedvenceitek tőlünk</h2>
        </div>
        <span className="pill">Frissen kiválasztott</span>
      </div>

      {loading ? (
        <p>Ajánlatok betöltése...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="cards-grid">
          {offers.map((item) => (
            <button key={item.id} type="button" className="info-card menu-card" onClick={() => setSelectedOffer(item)}>
              <img src={getImageSrc(item.image)} alt={item.title} className="offer-image" loading="lazy" />
              <div className="menu-card-top">
                <span className="menu-pill">{item.tag}</span>
                <span className="menu-price">{formatPrice(item.price)}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </button>
          ))}
        </div>
      )}

      {selectedOffer ? (
        <div className="detail-overlay" onClick={() => setSelectedOffer(null)} role="presentation">
          <div className="detail-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="detail-close" onClick={() => setSelectedOffer(null)} aria-label="Close">
              ×
            </button>
            <img src={selectedImage} alt={selectedOffer.title} className="detail-image" />
            <div className="detail-body">
              <p className="detail-label">Különleges ajánlat</p>
              <h3>{selectedOffer.title}</h3>
              <p>{selectedOffer.description}</p>
              <div className="detail-price-row">
                <span className="detail-price">{formatPrice(selectedOffer.price)}</span>
                <span className="detail-tag">{selectedOffer.tag}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
