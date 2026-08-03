const fs = require('fs')
const path = require('path')

const uploadDir = path.join(__dirname, 'uploads')

function ensureUploadDir(dirPath = uploadDir) {
  fs.mkdirSync(dirPath, { recursive: true })
  return dirPath
}

function sanitizeFileName(fileName) {
  const baseName = path.basename(fileName || 'upload')
  const cleanName = baseName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return cleanName || `upload-${Date.now()}`
}

function buildFileName(originalName) {
  const extension = path.extname(originalName || '').toLowerCase()
  const baseName = sanitizeFileName(path.basename(originalName || 'upload', extension))
  return `${baseName}-${Date.now()}${extension}`
}

function saveUploadedFile(buffer, originalName, dirPath = uploadDir) {
  const resolvedDir = ensureUploadDir(dirPath)
  const fileName = buildFileName(originalName)
  const filePath = path.join(resolvedDir, fileName)
  fs.writeFileSync(filePath, buffer)
  return { fileName, filePath }
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase()

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

module.exports = {
  uploadDir,
  ensureUploadDir,
  saveUploadedFile,
  getContentType,
}
