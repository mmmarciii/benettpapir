const fs = require('fs')
const path = require('path')

const defaultMenuItems = [
  {
    id: 'menu-item-1',
    name: 'Signature Notebooks',
    description: 'Soft-touch covers and linen paper',
    price: '€14',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
    published: true,
    sortOrder: 1,
  },
  {
    id: 'menu-item-2',
    name: 'Letterpress Cards',
    description: 'Hand-finished cards for every occasion',
    price: '€6',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
    published: true,
    sortOrder: 2,
  },
]

const dataFilePath = path.join(__dirname, 'data', 'menu-items.json')

function ensureDataFile(filePath = dataFilePath) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    const initialData = filePath === dataFilePath ? defaultMenuItems : []
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8')
  }

  return filePath
}

function readMenuItems(filePath = dataFilePath) {
  const resolvedPath = ensureDataFile(filePath)
  const raw = fs.readFileSync(resolvedPath, 'utf8')
  const parsed = JSON.parse(raw)
  const items = Array.isArray(parsed) ? parsed : defaultMenuItems

  return items
    .map((item) => ({
      ...item,
      published: item.published !== false,
      sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : 999,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function readVisibleMenuItems(filePath = dataFilePath) {
  return readMenuItems(filePath).filter((item) => item.published)
}

function createMenuItem(input, filePath = dataFilePath) {
  const items = readMenuItems(filePath)
  const name = input.name?.trim()
  const description = input.description?.trim()
  const price = input.price?.trim()
  const image = input.image?.trim()

  if (!name || !description || !price) {
    const error = new Error('Név, leírás és ár megadása kötelező.')
    error.statusCode = 400
    throw error
  }

  const item = {
    id: input.id || `menu-item-${Date.now()}`,
    name,
    description,
    price,
    image: image || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    published: input.published !== undefined ? input.published === true || input.published === 'true' : true,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : items.length + 1,
  }

  items.unshift(item)
  fs.writeFileSync(ensureDataFile(filePath), JSON.stringify(items, null, 2), 'utf8')
  return item
}

function updateMenuItem(id, input, filePath = dataFilePath) {
  const items = readMenuItems(filePath)
  const target = items.find((item) => item.id === id)

  if (!target) {
    const error = new Error('A menüelem nem található')
    error.statusCode = 404
    throw error
  }

  const name = input.name?.trim()
  const description = input.description?.trim()
  const price = input.price?.trim()
  const image = input.image?.trim()

  if (!name || !description || !price) {
    const error = new Error('Név, leírás és ár megadása kötelező.')
    error.statusCode = 400
    throw error
  }

  Object.assign(target, {
    name,
    description,
    price,
    image: image || target.image,
    published: input.published !== undefined ? input.published === true || input.published === 'true' : target.published !== false,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : target.sortOrder || 999,
  })

  fs.writeFileSync(ensureDataFile(filePath), JSON.stringify(items, null, 2), 'utf8')
  return target
}

function deleteMenuItem(id, filePath = dataFilePath) {
  const items = readMenuItems(filePath)
  const nextItems = items.filter((item) => item.id !== id)

  if (nextItems.length === items.length) {
    const error = new Error('A menüelem nem található')
    error.statusCode = 404
    throw error
} 

  fs.writeFileSync(ensureDataFile(filePath), JSON.stringify(nextItems, null, 2), 'utf8')
  return { success: true }
}

module.exports = {
  dataFilePath,
  defaultMenuItems,
  readMenuItems,
  readVisibleMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
}
