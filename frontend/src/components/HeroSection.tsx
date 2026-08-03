import { useEffect, useMemo, useState } from 'react'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/offers?$/i, '').replace(/\/api$/i, '')
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'

type MenuItem = {
  id: string
  name: string
  description: string
  price: string
  image?: string
}

function resolveImageUrl(image?: string) {
  if (!image) {
    return ''
  }

  if (/^https?:\/\//i.test(image) || image.startsWith('data:')) {
    return image
  }

  return `${API_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`
}

function getImageSrc(image?: string) {
  const resolved = resolveImageUrl(image)
  return resolved || PLACEHOLDER_IMAGE
}

{/*function formatPrice(value?: string) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    return ''
  }

  return /ft$/i.test(trimmed) ? trimmed : `${trimmed} FT`
}*/}

export function HeroSection() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  useEffect(() => {
    let active = true

    const loadMenuItems = () => {
      fetch(`${API_BASE_URL}/api/menu-items`)
        .then((response) => response.json())
        .then((items) => {
          if (active) {
            setMenuItems(Array.isArray(items) ? items : [])
          }
        })
        .catch(() => {
          if (active) {
            setMenuItems([])
          }
        })
    }

    loadMenuItems()

    const eventSource = new EventSource(`${API_BASE_URL}/api/content-events`)
    eventSource.addEventListener('menu-items-changed', () => {
      loadMenuItems()
    })
    eventSource.addEventListener('content-changed', () => {
      loadMenuItems()
    })

    return () => {
      active = false
      eventSource.close()
    }
  }, [])

  const selectedImage = useMemo(() => {
    if (!selectedItem) {
      return ''
    }

    return getImageSrc(selectedItem.image)
  }, [selectedItem])

  return (
    <section className="hero-card" id="top">
      <div>
        <h1>Benett Papír</h1>
        <p className="eyebrow">Papír írószer és kreatív bolt</p>
        
        <p className="lead">
          Minőségi papír- és írószerek, iskolai felszerelések, valamint kreatív alkotóeszközök széles választéka mindennapi tanuláshoz, irodai munkához és az ötletek megvalósításához.
        </p>
        <div className="cta-row">
          {/*<a href="#menu" className="btn btn-dark">Browse our menu</a> */}
          <a href="#kontakt" className="btn btn-dark">Látogass el hozzánk</a>
        </div>
      </div>

      <div className="hero-panel">
        <p className="panel-title">Akció</p>
        {menuItems.slice(0, 2).map((item) => (
          <button key={item.name} type="button" className="panel-item" onClick={() => setSelectedItem(item)}>
            <img src={getImageSrc(item.image)} alt={item.name} className="panel-item-image" />
            <div className="panel-item-content">
              <strong>{item.name}</strong>
              <p>{item.description}</p>
            </div>
            {/*<span><b>{formatPrice(item.price)}</b></span>*/}
          </button>
        ))}
      </div>

      {selectedItem ? (
        <div className="detail-overlay" onClick={() => setSelectedItem(null)} role="presentation">
          <div className="detail-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="detail-close" onClick={() => setSelectedItem(null)} aria-label="Close">
              ×
            </button>
            <img src={selectedImage} alt={selectedItem.name} className="detail-image" />
            <div className="detail-body">
              <p className="detail-label">Napi kedvenc</p>
              <h3>{selectedItem.name}</h3>
              <p>{selectedItem.description}</p>
              <div className="detail-price-row">
                {/*<span className="detail-price">{formatPrice(selectedItem.price)}</span>*/}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
