const fs = require('fs')
const path = require('path')

const defaultFilePath = path.join(__dirname, 'instagram-feed.json')

function normalizePost(input, fallbackTimestamp) {
  const id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : `post-${Date.now()}`
  const caption = typeof input.caption === 'string' ? input.caption.trim() : ''
  const mediaUrl = typeof input.mediaUrl === 'string' ? input.mediaUrl.trim() : ''
  const permalink = typeof input.permalink === 'string' ? input.permalink.trim() : ''
  const timestamp = typeof input.timestamp === 'string' && input.timestamp ? input.timestamp : fallbackTimestamp

  const published = typeof input.published === 'boolean'
    ? input.published
    : input.published !== 'false'

  return {
    id,
    caption: caption || 'Instagram poszt',
    mediaUrl,
    permalink,
    timestamp,
    published,
  }
}

function readInstagramPosts(filePath = defaultFilePath) {
  if (!fs.existsSync(filePath)) {
    return []
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    const posts = Array.isArray(parsed) ? parsed : []
    return posts.map((post) => ({
      ...post,
      published: typeof post.published === 'boolean' ? post.published : post.published !== 'false',
    }))
  } catch (error) {
    return []
  }
}

function writeInstagramPosts(posts, filePath = defaultFilePath) {
  fs.writeFileSync(filePath, JSON.stringify(posts, null, 2), 'utf8')
  return posts
}

function createInstagramPost(payload, filePath = defaultFilePath) {
  const posts = readInstagramPosts(filePath)
  const nextPost = normalizePost(payload, new Date().toISOString())
  posts.unshift(nextPost)
  writeInstagramPosts(posts, filePath)
  return nextPost
}

function updateInstagramPost(id, payload, filePath = defaultFilePath) {
  const posts = readInstagramPosts(filePath)
  const index = posts.findIndex((post) => post.id === id)

  if (index === -1) {
    const error = new Error('Instagram post not found')
    error.statusCode = 404
    throw error
  }

  const updated = normalizePost({ ...posts[index], ...payload, id }, posts[index].timestamp || new Date().toISOString())
  posts[index] = updated
  writeInstagramPosts(posts, filePath)
  return updated
}

function deleteInstagramPost(id, filePath = defaultFilePath) {
  const posts = readInstagramPosts(filePath)
  const nextPosts = posts.filter((post) => post.id !== id)

  if (nextPosts.length === posts.length) {
    const error = new Error('Instagram post not found')
    error.statusCode = 404
    throw error
  }

  writeInstagramPosts(nextPosts, filePath)
  return { deleted: true, id }
}

function upsertFromWebhook(payload, filePath = defaultFilePath) {
  const posts = readInstagramPosts(filePath)
  const timestamp = typeof payload.timestamp === 'string' && payload.timestamp ? payload.timestamp : new Date().toISOString()
  const id = typeof payload.id === 'string' && payload.id.trim() ? payload.id.trim() : `post-${Date.now()}`
  const existingIndex = posts.findIndex((post) => post.id === id || post.permalink === payload.permalink)

  const nextPost = normalizePost({ ...payload, id, timestamp }, timestamp)

  if (existingIndex >= 0) {
    posts[existingIndex] = nextPost
  } else {
    posts.unshift(nextPost)
  }

  writeInstagramPosts(posts, filePath)
  return nextPost
}

module.exports = {
  defaultFilePath,
  readInstagramPosts,
  createInstagramPost,
  updateInstagramPost,
  deleteInstagramPost,
  upsertFromWebhook,
}
