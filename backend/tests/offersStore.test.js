const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { createOffer, defaultOffers } = require('../offersStore')

test('createOffer stores a new offer in the data file', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'offers-'))
  const tempFile = path.join(tempDir, 'offers.json')

  const offer = createOffer(
    {
      title: 'Test offer',
      description: 'A test offer',
      price: '999 Ft',
      tag: 'Test',
      image: 'https://example.com/image.jpg',
    },
    tempFile,
  )

  const saved = JSON.parse(fs.readFileSync(tempFile, 'utf8'))

  assert.equal(saved[0].title, 'Test offer')
  assert.equal(saved[0].id, offer.id)
  assert.equal(saved.length, defaultOffers.length + 1)
})
