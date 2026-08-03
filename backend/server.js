const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const { readOffers, readVisibleOffers, createOffer, updateOffer, deleteOffer } = require('./offersStore')
const { readMenuItems, readVisibleMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } = require('./menuItemsStore')
const { saveUploadedFile, getContentType, uploadDir } = require('./uploadStore')
const { addSseClient, broadcastOffersChanged, broadcastMenuItemsChanged, broadcastContentChanged } = require('./contentSync')
const { readInstagramPosts, createInstagramPost, updateInstagramPost, deleteInstagramPost, upsertFromWebhook } = require('./instagramFeedStore')

const port = Number(process.env.PORT || 3001)
const adminFilePath = path.join(__dirname, 'admin.html')
const adminUsername = process.env.ADMIN_USERNAME
const adminPassword = process.env.ADMIN_PASSWORD

if (!adminUsername || !adminPassword) {
  throw new Error('Missing required environment variables: ADMIN_USERNAME and ADMIN_PASSWORD')
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  })
  res.end(JSON.stringify(payload))
}

function fetchInstagramFeed() {
  return Promise.resolve(readInstagramPosts())
}

function extractInstagramUsername(profileUrl) {
  if (typeof profileUrl !== 'string' || !profileUrl.trim()) {
    const error = new Error('Az Instagram URL-t meg kell adni.')
    error.statusCode = 400
    throw error
  }

  try {
    const parsedUrl = new URL(profileUrl)
    const segments = parsedUrl.pathname.split('/').filter(Boolean)
    const firstSegment = segments[0]

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      const error = new Error('Érvénytelen URL.')
      error.statusCode = 400
      throw error
    }

    if (!firstSegment || firstSegment === 'p' || firstSegment === 'reel' || firstSegment === 'tv') {
      return null
    }

    return firstSegment
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    const fallbackError = new Error('Érvénytelen Instagram URL.')
    fallbackError.statusCode = 400
    throw fallbackError
  }
}

function fetchInstagramResource(pathname) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.instagram.com',
      path: pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
    }

    const request = https.request(options, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error('Nem sikerült lekérni az Instagram adatot.'))
          return
        }

        if (!body.trim()) {
          reject(new Error('Üres Instagram-válasz.'))
          return
        }

        try {
          resolve(JSON.parse(body))
        } catch (error) {
          const htmlMatch = body.match(/window\._sharedData\s*=\s*({.*?});/s)
          if (!htmlMatch) {
            reject(new Error('Nem sikerült értelmezni az Instagram adatot.'))
            return
          }

          try {
            resolve(JSON.parse(htmlMatch[1]))
          } catch (parseError) {
            reject(new Error('Nem sikerült értelmezni az Instagram adatot.'))
          }
        }
      })
    })

    request.on('error', reject)
    request.end()
  })
}

function fetchInstagramProfilePage(username) {
  return fetchInstagramResource(`/${encodeURIComponent(username)}/?__a=1&__d=dis`)
}

function extractInstagramPostNodes(payload) {
  const nodes = []
  const profile = payload?.graphql?.user || payload?.data?.user || payload?.entry_data?.ProfilePage?.[0]?.graphql?.user

  if (payload?.graphql?.shortcode_media) {
    nodes.push(payload.graphql.shortcode_media)
  }

  if (profile?.edge_owner_to_timeline_media?.edges) {
    profile.edge_owner_to_timeline_media.edges.forEach((entry) => {
      if (entry?.node) {
        nodes.push(entry.node)
      }
    })
  }

  if (profile?.edge_felix_video_timeline?.edges) {
    profile.edge_felix_video_timeline.edges.forEach((entry) => {
      if (entry?.node) {
        nodes.push(entry.node)
      }
    })
  }

  return nodes
}

async function importInstagramPostsFromProfile(profileUrl) {
  const trimmedUrl = typeof profileUrl === 'string' ? profileUrl.trim() : ''
  if (!trimmedUrl) {
    return []
  }

  const segments = trimmedUrl.split('/').filter(Boolean)
  const isDirectPostUrl = segments[0] === 'p' || segments[0] === 'reel' || segments[0] === 'tv'
  const shortcode = isDirectPostUrl ? (segments[1] || '') : ''

  try {
    const payload = shortcode
      ? await fetchInstagramResource(`/p/${encodeURIComponent(shortcode)}/?__a=1&__d=dis`)
      : await fetchInstagramProfilePage(extractInstagramUsername(trimmedUrl))

    const nodes = extractInstagramPostNodes(payload)
    const importedPosts = []

    nodes.forEach((node) => {
      if (!node || typeof node !== 'object') {
        return
      }

      const shortcodeValue = typeof node.shortcode === 'string' ? node.shortcode.trim() : ''
      if (!shortcodeValue) {
        return
      }

      const captionEdges = Array.isArray(node.edge_media_to_caption?.edges)
        ? node.edge_media_to_caption.edges
        : []
      const caption = captionEdges
        .map((item) => item?.node?.text || '')
        .filter(Boolean)
        .join('\n')
        .trim()

      const mediaUrl = typeof node.display_url === 'string' && node.display_url.trim()
        ? node.display_url.trim()
        : typeof node.thumbnail_src === 'string' && node.thumbnail_src.trim()
          ? node.thumbnail_src.trim()
          : ''

      const postPayload = {
        id: shortcodeValue,
        caption: caption || node.accessibility_caption || '',
        mediaUrl,
        permalink: `https://www.instagram.com/p/${shortcodeValue}/`,
        timestamp: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : new Date().toISOString(),
        published: true,
      }

      if (postPayload.caption || postPayload.mediaUrl || postPayload.permalink) {
        importedPosts.push(upsertFromWebhook(postPayload))
      }
    })

    return importedPosts
  } catch (error) {
    return []
  }
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(html)
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''

    req.on('data', (chunk) => {
      data += chunk
    })

    req.on('end', () => {
      if (!data) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(data))
      } catch (error) {
        reject(new Error('Invalid JSON body'))
      }
    })

    req.on('error', reject)
  })
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on('data', (chunk) => {
      chunks.push(chunk)
    })

    req.on('end', () => {
      const contentType = req.headers['content-type'] || ''
      const boundaryMatch = contentType.match(/boundary=(.+)$/i)

      if (!boundaryMatch) {
        reject(new Error('Invalid multipart upload'))
        return
      }

      const boundary = boundaryMatch[1].trim()
      const delimiter = `--${boundary}`
      const raw = Buffer.concat(chunks)
      const body = raw.toString('binary')
      const parts = body.split(delimiter)

      for (const part of parts) {
        if (!part.includes('name="file"')) {
          continue
        }

        const sections = part.split('\r\n\r\n')
        if (sections.length < 2) {
          reject(new Error('No file uploaded'))
          return
        }

        const headerSection = sections[0]
        const bodySection = sections.slice(1).join('\r\n\r\n')
        const filenameMatch = headerSection.match(/filename="([^"]*)"/i)
        const fileName = filenameMatch ? filenameMatch[1] : 'upload'
        const trimmedBody = bodySection.replace(/\r\n--$/u, '').replace(/\r\n$/u, '')
        resolve({ fileName, buffer: Buffer.from(trimmedBody, 'binary') })
        return
      }

      reject(new Error('No file uploaded'))
    })

    req.on('error', reject)
  })
}

function requiresAdminAuth(req, res) {
  const authHeader = req.headers.authorization || ''
  const expected = 'Basic ' + Buffer.from(`${adminUsername}:${adminPassword}`).toString('base64')

  if (authHeader === expected) {
    return true
  }

  res.writeHead(401, {
    'Content-Type': 'application/json; charset=utf-8',
    'WWW-Authenticate': 'Basic realm="Offer Admin"',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify({ error: 'Unauthorized' }))
  return false
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    })
    res.end()
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' })
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/offers') {
    sendJson(res, 200, readVisibleOffers())
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/offers/admin') {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    sendJson(res, 200, readOffers())
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/menu-items') {
    sendJson(res, 200, readVisibleMenuItems())
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/menu-items/admin') {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    sendJson(res, 200, readMenuItems())
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/offers') {
    if (!requiresAdminAuth(req, res)) {
      return
    }
    try {
      const payload = await readJsonBody(req)
      const offer = createOffer(payload)
      broadcastOffersChanged()
      broadcastContentChanged()
      sendJson(res, 201, offer)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to create offer' })
    }
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/menu-items') {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const payload = await readJsonBody(req)
      const item = createMenuItem(payload)
      broadcastMenuItemsChanged()
      broadcastContentChanged()
      sendJson(res, 201, item)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to create menu item' })
    }
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/upload') {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const { fileName, buffer } = await parseMultipart(req)
      const { fileName: savedFileName } = saveUploadedFile(buffer, fileName)
      sendJson(res, 201, { fileName: savedFileName, url: `/uploads/${savedFileName}` })
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Unable to upload image' })
    }
    return
  }

  if (req.method === 'PUT' && requestUrl.pathname.startsWith('/api/offers/')) {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const id = requestUrl.pathname.split('/').pop()
      const payload = await readJsonBody(req)
      const offer = updateOffer(id, payload)
      broadcastOffersChanged()
      broadcastContentChanged()
      sendJson(res, 200, offer)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to update offer' })
    }
    return
  }

  if (req.method === 'PUT' && requestUrl.pathname.startsWith('/api/menu-items/')) {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const id = requestUrl.pathname.split('/').pop()
      const payload = await readJsonBody(req)
      const item = updateMenuItem(id, payload)
      broadcastMenuItemsChanged()
      broadcastContentChanged()
      sendJson(res, 200, item)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to update menu item' })
    }
    return
  }

  if (req.method === 'DELETE' && requestUrl.pathname.startsWith('/api/offers/')) {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const id = requestUrl.pathname.split('/').pop()
      const result = deleteOffer(id)
      broadcastOffersChanged()
      broadcastContentChanged()
      sendJson(res, 200, result)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to delete offer' })
    }
    return
  }

  if (req.method === 'DELETE' && requestUrl.pathname.startsWith('/api/menu-items/')) {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const id = requestUrl.pathname.split('/').pop()
      const result = deleteMenuItem(id)
      broadcastMenuItemsChanged()
      broadcastContentChanged()
      sendJson(res, 200, result)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to delete menu item' })
    }
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/admin') {
    const html = fs.readFileSync(adminFilePath, 'utf8')
    sendHtml(res, 200, html)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/admin.css') {
    const cssPath = path.join(__dirname, 'admin.css')
    if (!fs.existsSync(cssPath)) {
      sendJson(res, 404, { error: 'Not found' })
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/css; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(fs.readFileSync(cssPath, 'utf8'))
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/admin.js') {
    const jsPath = path.join(__dirname, 'admin.js')
    if (!fs.existsSync(jsPath)) {
      sendJson(res, 404, { error: 'Not found' })
      return
    }

    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(fs.readFileSync(jsPath, 'utf8'))
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/instagram-feed') {
    fetchInstagramFeed()
      .then((posts) => {
        const visiblePosts = posts.filter((post) => post.published !== false)
        return sendJson(res, 200, { posts: visiblePosts })
      })
      .catch((error) => sendJson(res, 502, { error: error.message || 'Unable to fetch Instagram feed', posts: [] }))
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/instagram-feed/admin') {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    sendJson(res, 200, readInstagramPosts())
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/instagram-feed') {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const payload = await readJsonBody(req)
      const post = createInstagramPost(payload)
      sendJson(res, 201, post)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to create Instagram post' })
    }
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/instagram-feed/import') {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const payload = await readJsonBody(req)
      const profileUrl = typeof payload.profileUrl === 'string' ? payload.profileUrl.trim() : ''
      const importedPosts = await importInstagramPostsFromProfile(profileUrl)
      sendJson(res, 200, {
        count: importedPosts.length,
        posts: importedPosts,
        message: importedPosts.length > 0
          ? 'Posztok importálva.'
          : 'Nem találtunk valós Instagram posztot.',
      })
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to import Instagram posts' })
    }
    return
  }

  if (req.method === 'PUT' && requestUrl.pathname.startsWith('/api/instagram-feed/')) {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const id = requestUrl.pathname.split('/').pop()
      const payload = await readJsonBody(req)
      const post = updateInstagramPost(id, payload)
      sendJson(res, 200, post)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to update Instagram post' })
    }
    return
  }

  if (req.method === 'DELETE' && requestUrl.pathname.startsWith('/api/instagram-feed/')) {
    if (!requiresAdminAuth(req, res)) {
      return
    }

    try {
      const id = requestUrl.pathname.split('/').pop()
      const result = deleteInstagramPost(id)
      sendJson(res, 200, result)
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to delete Instagram post' })
    }
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/instagram-webhook') {
    try {
      const payload = await readJsonBody(req)
      const post = upsertFromWebhook(payload)
      sendJson(res, 200, post)
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Unable to sync Instagram webhook payload' })
    }
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/content-events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    const cleanup = addSseClient(res)
    req.on('close', cleanup)
    req.on('end', cleanup)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname.startsWith('/uploads/')) {
    const fileName = path.basename(requestUrl.pathname)
    const filePath = path.join(uploadDir, fileName)
    if (!fs.existsSync(filePath)) {
      sendJson(res, 404, { error: 'File not found' })
      return
    }

    const contentType = getContentType(filePath)
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    })
    fs.createReadStream(filePath).pipe(res)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/') {
    res.writeHead(302, { Location: '/admin' })
    res.end()
    return
  }

  sendJson(res, 404, { error: 'Not found' })
})

server.listen(port, () => {
  console.log(`Offer CMS listening on http://localhost:${port}`)
})
