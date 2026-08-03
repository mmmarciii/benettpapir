const fs = require('fs')
const path = require('path')

const defaultOffers = [
  {
    id: 'offer-1',
    title: 'A5-es jegyzetfüzet',
    description: 'Finom, sima lapok és tartós fedél – a mindennapi jegyzeteléshez.',
    price: '1490 Ft',
    tag: 'Új',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    published: true,
    sortOrder: 1,
  },
  {
    id: 'offer-2',
    title: 'Fénymásolópapír A4',
    description: 'Kiváló minőségű, tiszta nyomatokhoz ideális papír.',
    price: '690 Ft',
    tag: 'Akció',
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80',
    published: true,
    sortOrder: 2,
  },
  {
    id: 'offer-3',
    title: 'Gél toll',
    description: 'Sima írás és kellemes tapadás – irodai és otthoni használatra egyaránt.',
    price: '890 Ft',
    tag: 'Népszerű',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    published: true,
    sortOrder: 3,
  },
  {
    id: 'offer-4',
    title: 'Kézi feliratozó filc',
    description: 'Erős színek és gyors munkavégzés – címkézéshez és dekorációhoz.',
    price: '520 Ft',
    tag: 'Szezonális',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80',
    published: true,
    sortOrder: 4,
  },
  {
    id: 'offer-5',
    title: 'Papírboríték készlet',
    description: 'Egységes, elegáns borítékok levelezéshez és ajándékokhoz.',
    price: '1290 Ft',
    tag: 'Kiváló',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    published: true,
    sortOrder: 5,
  },
  {
    id: 'offer-6',
    title: 'Szivacsos jegyzettömb',
    description: 'Könnyen használható, praktikus jegyzettömb a gyors feljegyzésekhez.',
    price: '980 Ft',
    tag: 'Ajánlat',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    published: true,
    sortOrder: 6,
  },
]

const dataFilePath = path.join(__dirname, 'data', 'offers.json')

function ensureDataFile(filePath = dataFilePath) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(defaultOffers, null, 2), 'utf8')
  }

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        fs.writeFileSync(filePath, JSON.stringify(defaultOffers, null, 2), 'utf8')
      }
    } catch (error) {
      fs.writeFileSync(filePath, JSON.stringify(defaultOffers, null, 2), 'utf8')
    }
  }

  return filePath
}

function readOffers(filePath = dataFilePath) {
  const resolvedPath = ensureDataFile(filePath)

  try {
    const raw = fs.readFileSync(resolvedPath, 'utf8')
    const parsed = JSON.parse(raw)
    const offers = Array.isArray(parsed) ? parsed : defaultOffers

    if (!offers.length) {
      return defaultOffers
        .map((offer) => ({
          ...offer,
          published: offer.published !== false,
          sortOrder: Number.isFinite(Number(offer.sortOrder)) ? Number(offer.sortOrder) : 999,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }

    return offers
      .map((offer) => ({
        ...offer,
        published: offer.published !== false,
        sortOrder: Number.isFinite(Number(offer.sortOrder)) ? Number(offer.sortOrder) : 999,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (error) {
    return defaultOffers
      .map((offer) => ({
        ...offer,
        published: offer.published !== false,
        sortOrder: Number.isFinite(Number(offer.sortOrder)) ? Number(offer.sortOrder) : 999,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }
}

function readVisibleOffers(filePath = dataFilePath) {
  return readOffers(filePath).filter((offer) => offer.published)
}

function createOffer(input, filePath = dataFilePath) {
  const offers = readOffers(filePath)
  const title = input.title?.trim()
  const description = input.description?.trim()
  const price = input.price?.trim()
  const tag = input.tag?.trim()
  const image = input.image?.trim()

  if (!title || !description || !price || !tag) {
    const error = new Error('Név, leírás, ár és címke megadása kötelező.')
    error.statusCode = 400
    throw error
  }

  const offer = {
    id: input.id || `offer-${Date.now()}`,
    title,
    description,
    price,
    tag,
    image: image || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    published: input.published !== undefined ? input.published === true || input.published === 'true' : true,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : offers.length + 1,
  }

  offers.unshift(offer)
  fs.writeFileSync(ensureDataFile(filePath), JSON.stringify(offers, null, 2), 'utf8')

  return offer
}

function updateOffer(id, input, filePath = dataFilePath) {
  const offers = readOffers(filePath)
  const target = offers.find((offer) => offer.id === id)

  if (!target) {
    const error = new Error('Az ajánlat nem található')
    error.statusCode = 404
    throw error
  }

  const title = input.title?.trim()
  const description = input.description?.trim()
  const price = input.price?.trim()
  const tag = input.tag?.trim()
  const image = input.image?.trim()

  if (!title || !description || !price || !tag) {
    const error = new Error('Név, leírás, ár és címke megadása kötelező.')
    error.statusCode = 400
    throw error
  }

  Object.assign(target, {
    title,
    description,
    price,
    tag,
    image: image || target.image,
    published: input.published !== undefined ? input.published === true || input.published === 'true' : target.published !== false,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : target.sortOrder || 999,
  })

  fs.writeFileSync(ensureDataFile(filePath), JSON.stringify(offers, null, 2), 'utf8')
  return target
}

function deleteOffer(id, filePath = dataFilePath) {
  const offers = readOffers(filePath)
  const nextOffers = offers.filter((offer) => offer.id !== id)

  if (nextOffers.length === offers.length) {
    const error = new Error('Az ajánlat nem található')
    error.statusCode = 404
    throw error
  }

  fs.writeFileSync(ensureDataFile(filePath), JSON.stringify(nextOffers, null, 2), 'utf8')
  return { success: true }
}

module.exports = {
  dataFilePath,
  defaultOffers,
  readOffers,
  readVisibleOffers,
  createOffer,
  updateOffer,
  deleteOffer,
}
