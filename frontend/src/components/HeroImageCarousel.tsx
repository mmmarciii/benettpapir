import { useEffect, useState } from 'react'

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api\/offers?$/i, '').replace(/\/api$/i, '')

type CarouselImage = {
  id?: string
  image: string
  alt?: string
  published?: boolean
  sortOrder?: number
}

const fallbackCarouselImages: CarouselImage[] = [
  {
    image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1600&q=80',
    alt: 'Szines jegyzetfuzetek es iroszerek egy asztalon',
  },
  {
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80',
    alt: 'Iskolai tollak es filcek rendezetten',
  },
  {
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1600&q=80',
    alt: 'Kreativ papirtermekek meleg fenyekkel',
  },
  {
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80',
    alt: 'Fuzet es ceruzak minimal stilusban',
  },
  {
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=80',
    alt: 'Papir iroszer bolt hangulata',
  },
]

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

export function HeroImageCarousel() {
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>(fallbackCarouselImages)

  useEffect(() => {
    let active = true

    const loadCarousel = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/carousel-images`)
        const payload = await response.json()
        if (!active) {
          return
        }

        if (Array.isArray(payload) && payload.length > 0) {
          setCarouselImages(payload)
        } else {
          setCarouselImages(fallbackCarouselImages)
        }
      } catch {
        if (active) {
          setCarouselImages(fallbackCarouselImages)
        }
      }
    }

    loadCarousel()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!api) {
      return
    }

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap())
    }

    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api) {
      return
    }

    const id = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext()
      } else {
        api.scrollTo(0)
      }
    }, 4500)

    return () => {
      window.clearInterval(id)
    }
  }, [api])

  return (
    <section className="hero-carousel-section" aria-label="Bolt kepek">
      <Carousel setApi={setApi} opts={{ align: 'start', loop: true }} className="hero-carousel">
        <CarouselContent>
          {carouselImages.map((image, index) => (
            <CarouselItem key={image.id || `${image.image}-${index}`}>
              <figure className="hero-slide" aria-hidden={activeIndex !== index}>
                <img
                  src={resolveImageUrl(image.image)}
                  alt={image.alt || `Carousel kep ${index + 1}`}
                  className="hero-slide-image"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="hero-carousel-arrow hero-carousel-arrow-prev" />
        <CarouselNext className="hero-carousel-arrow hero-carousel-arrow-next" />

        <div className="hero-carousel-dots" aria-hidden="true">
          {carouselImages.map((image, index) => (
            <span key={image.id || `${image.image}-dot-${index}`} className={index === activeIndex ? 'is-active' : ''} />
          ))}
        </div>
      </Carousel>
    </section>
  )
}
