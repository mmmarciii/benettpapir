import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Heart, MessageCircle, Send } from 'lucide-react'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/offers?$/i, '').replace(/\/api$/i, '')
const INSTAGRAM_PROFILE_URL = import.meta.env.VITE_INSTAGRAM_PROFILE_URL || 'https://www.instagram.com/papirbenett/'

type InstagramPost = {
  id: string
  caption: string
  mediaUrl: string
  permalink: string
  timestamp: string
}

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

export function InstagramSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef<number | null>(null)
  const scrollStartLeft = useRef<number>(0)

  useEffect(() => {
    let active = true

    fetch(`${API_BASE_URL}/api/instagram-feed`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return
        const payload = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : []
        setPosts(payload)
      })
      .catch(() => {
        if (!active) return
        setPosts([])
      })

    return () => {
      active = false
    }
  }, [])

  const scrollByAmount = 340

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollByAmount : scrollByAmount,
      behavior: 'smooth',
    })
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    dragStartX.current = event.clientX
    scrollStartLeft.current = scrollRef.current.scrollLeft
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartX.current === null || !scrollRef.current) return
    const deltaX = event.clientX - dragStartX.current
    scrollRef.current.scrollLeft = scrollStartLeft.current - deltaX
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    dragStartX.current = null
  }

  return (
    <section id="instagram" className="content-card">
      <div className="section-heading">
        <div>
          <p className="section-label">Social</p>
          <h2>Pillanatok a mindennapokból</h2>
        </div>
        <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer" className="pill">
          Kövess minket
        </a>
      </div>

      <div className="instagram-carousel-shell">
        <button type="button" className="instagram-nav-button" onClick={() => scroll('left')} aria-label="Scroll left">
          <ArrowLeft size={18} />
        </button>

        <div
          className={`instagram-carousel ${isDragging ? 'dragging' : ''}`}
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {posts.length === 0 ? (
            <article className="info-card instagram-post-card">
              <div className="instagram-post-header">
                <div className="instagram-avatar">BP</div>
                <div>
                  <strong>Benett Papír</strong>
                  <p>Instagram feed</p>
                </div>
              </div>
              <p style={{ padding: '0 14px 14px' }}>A bejegyzések még nem érhetők el. Add meg az Instagram API hozzáférési tokent a szerver környezetében.</p>
            </article>
          ) : (
            posts.map((post) => {
              const title = post.caption.split('\n')[0].trim() || 'Instagram poszt'
              const caption = post.caption.trim() || 'Új bejegyzés'

              return (
                <article key={post.id} className="info-card instagram-post-card">
                  <div className="instagram-post-header">
                    <div className="instagram-avatar">BP</div>
                    <div>
                      <strong>Benett Papír</strong>
                      <p>Instagram</p>
                    </div>
                  </div>
                  {post.mediaUrl ? (
                    <img src={resolveImageUrl(post.mediaUrl)} alt={title} className="instagram-post-image" loading="lazy" />
                  ) : null}
                  <div className="instagram-post-actions">
                    <Heart size={18} strokeWidth={2} />
                    <MessageCircle size={18} strokeWidth={2} />
                    <Send size={18} strokeWidth={2} />
                  </div>
                  <h3>{title}</h3>
                  <p>{caption}</p>
                </article>
              )
            })
          )}
        </div>

        <button type="button" className="instagram-nav-button" onClick={() => scroll('right')} aria-label="Scroll right">
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
