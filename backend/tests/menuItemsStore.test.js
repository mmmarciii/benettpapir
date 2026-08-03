const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { createMenuItem } = require('../menuItemsStore')

test('createMenuItem stores a new menu item in the data file', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-items-'))
  const tempFile = path.join(tempDir, 'menu-items.json')

  const item = createMenuItem(
    {
      name: 'Test item',
      description: 'A test item',
      price: '€9',
      image: 'https://example.com/item.jpg',
    },
    tempFile,
  )

  const saved = JSON.parse(fs.readFileSync(tempFile, 'utf8'))

  assert.equal(saved[0].name, 'Test item')
  assert.equal(saved[0].id, item.id)
  assert.equal(saved.length, 1)
})
