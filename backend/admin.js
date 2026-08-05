document.addEventListener('DOMContentLoaded', () => {
  const backendBasePath = window.location.pathname.replace(/\/admin\/?$/i, '')
  const API_BASE_URL = `${window.location.origin}${backendBasePath}`

  function apiUrl(path) {
    if (!path) {
      return API_BASE_URL
    }

    if (/^https?:\/\//i.test(path)) {
      return path
    }

    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  }

  const form = document.getElementById('offer-form')
  const offersContainer = document.getElementById('offers')
  const menuItemsContainer = document.getElementById('menu-items')
  const instagramPostsContainer = document.getElementById('instagram-posts')
  const instagramImportForm = document.getElementById('instagram-import-form')
  const instagramImportStatus = document.getElementById('instagram-import-status')
  const addOfferButton = document.getElementById('add-offer-button')
  const addMenuItemButton = document.getElementById('add-menu-item-button')
  const addInstagramPostButton = document.getElementById('add-instagram-post-button')
  const instagramForm = document.getElementById('instagram-form')
  const adminNav = document.getElementById('admin-nav')
  const loginForm = document.getElementById('login-form')
  const loginCard = document.getElementById('login-card')
  const loginStatus = document.getElementById('login-status')
  const adminContent = document.getElementById('admin-content')
  const offersCard = document.getElementById('offers-card')
  const menuItemsCard = document.getElementById('menu-items-card')
  const instagramCard = document.getElementById('instagram-card')
  const logoutButton = document.getElementById('logout-button')
  const imageDropzone = document.getElementById('image-dropzone')
  const imageUploadInput = document.getElementById('image-upload')
  const imageInput = document.getElementById('image-input')
  const uploadPreview = document.getElementById('upload-preview')
  const removeImageButton = document.getElementById('remove-image-button')

  let editingId = null
  let authHeader = null
  let activeView = 'offers'
  let activeEntity = 'offer'

  function encodeBasicAuth(username, password) {
    return 'Basic ' + window.btoa(`${username}:${password}`)
  }

  function showError(message) {
    loginStatus.textContent = message
  }

  function showAdminArea() {
    loginCard.classList.add('hidden')
    adminContent.classList.remove('hidden')
    offersCard.classList.add('hidden')
    menuItemsCard.classList.add('hidden')
    instagramCard.classList.add('hidden')
    renderView(activeView)
  }

  function showLoginArea() {
    loginCard.classList.remove('hidden')
    adminContent.classList.add('hidden')
    offersCard.classList.add('hidden')
    menuItemsCard.classList.add('hidden')
    instagramCard.classList.add('hidden')
    loginStatus.textContent = ''
    loginForm.reset()
    authHeader = null
  }

  async function ensureAuth() {
    if (authHeader) {
      return authHeader
    }

    throw new Error('Elősször jelentkezzen be.')
  }

  async function requestJson(url, options = {}) {
    const auth = await ensureAuth()
    const headers = {
      ...(options.headers || {}),
      Authorization: auth,
    }

    const response = await fetch(apiUrl(url), { ...options, headers })
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      throw new Error(errorPayload.error || 'Request failed')
    }

    return response.json().catch(() => ({}))
  }

  function renderView(view) {
    activeView = view
    offersCard.classList.toggle('hidden', view !== 'offers')
    menuItemsCard.classList.toggle('hidden', view !== 'menu-items')
    instagramCard.classList.toggle('hidden', view !== 'instagram')
    adminContent.classList.remove('hidden')
    Array.from(adminNav.querySelectorAll('.nav-tab')).forEach((button) => {
      button.classList.toggle('is-active', button.dataset.view === view)
    })
    if (activeEntity === 'menu-item') {
      setEditorMode('menu-item')
    } else {
      setEditorMode('offer')
    }
    closeEditor()
  }

  function showEditor() {
    adminContent.classList.remove('hidden')
    form.classList.remove('hidden')
    form.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function closeEditor() {
    form.classList.add('hidden')
  }

  function showInstagramEditor() {
    instagramForm.classList.remove('hidden')
    instagramForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function closeInstagramEditor() {
    instagramForm.classList.add('hidden')
  }

  function getTitleField() {
    return form.querySelector('input[name="title"], input[name="name"]')
  }

  function getDescriptionField() {
    return form.querySelector('textarea[name="description"]')
  }

  function getPriceField() {
    return form.querySelector('input[name="price"]')
  }

  function getTagField() {
    return form.querySelector('input[name="tag"]')
  }

  function getImageField() {
    return form.querySelector('input[name="image"]')
  }

  function getSortOrderField() {
    return form.querySelector('input[name="sortOrder"]')
  }

  function getPublishedField() {
    return form.querySelector('input[name="published"]')
  }

  function clearImagePreview() {
    if (imageInput) {
      imageInput.value = ''
    }
    const imageField = getImageField()
    if (imageField) {
      imageField.value = ''
    }
    uploadPreview.innerHTML = ''
    uploadPreview.classList.add('hidden')
  }

  function formatPriceValue(value) {
    const trimmed = String(value || '').trim()
    if (!trimmed) {
      return ''
    }

    return `${trimmed} FT`
  }

  function normalizePriceValue(value) {
    return String(value || '')
      .trim()
      .replace(/\s*FT$/iu, '')
      .trim()
  }

  async function uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(apiUrl('/api/upload'), {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: formData,
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      throw new Error(errorPayload.error || 'Image upload failed')
    }

    const payload = await response.json()
    if (imageInput) {
      imageInput.value = payload.url
    }
    form.elements.image.value = payload.url
    uploadPreview.innerHTML = `<img src="${payload.url}" alt="Uploaded preview" /><span>${file.name}</span>`
    uploadPreview.classList.remove('hidden')
    return payload.url
  }

  function setEditorMode(mode) {
    activeEntity = mode
    const isMenuItem = mode === 'menu-item'
    const titleField = getTitleField()
    const descriptionField = getDescriptionField()
    const priceField = getPriceField()
    const tagField = getTagField()
    const imageField = getImageField()
    const sortOrderField = getSortOrderField()
    const publishedField = getPublishedField()

    if (titleField) {
      titleField.value = ''
    }
    if (descriptionField) {
      descriptionField.value = ''
    }
    if (priceField) {
      priceField.value = ''
    }
    if (tagField) {
      tagField.value = ''
    }
    if (imageField) {
      imageField.value = ''
    }
    clearImagePreview()
    if (sortOrderField) {
      sortOrderField.value = 1
    }
    if (publishedField) {
      publishedField.checked = true
    }
    if (isMenuItem) {
      if (tagField?.closest('label')) {
        tagField.closest('label').classList.add('hidden')
      }
      if (titleField) {
        titleField.setAttribute('name', 'name')
        titleField.placeholder = 'Name'
      }
      if (tagField) {
        tagField.setAttribute('name', 'tag')
        tagField.required = false
        tagField.disabled = true
      }
    } else {
      if (tagField?.closest('label')) {
        tagField.closest('label').classList.remove('hidden')
      }
      if (titleField) {
        titleField.setAttribute('name', 'title')
        titleField.placeholder = 'Title'
      }
      if (tagField) {
        tagField.setAttribute('name', 'tag')
        tagField.required = true
        tagField.disabled = false
      }
    }
    form.querySelector('button[type="submit"]').textContent = isMenuItem ? 'Save menu item' : 'Save offer'
  }

  function populateForm(offer) {
    editingId = offer.id
    activeEntity = 'offer'
    setEditorMode('offer')
    const titleField = getTitleField()
    const descriptionField = getDescriptionField()
    const priceField = getPriceField()
    const tagField = getTagField()
    const imageField = getImageField()
    const sortOrderField = getSortOrderField()
    const publishedField = getPublishedField()

    if (titleField) {
      titleField.value = offer.title || ''
    }
    if (descriptionField) {
      descriptionField.value = offer.description || ''
    }
    if (priceField) {
      priceField.value = offer.price || ''
    }
    if (tagField) {
      tagField.value = offer.tag || ''
    }
    if (imageField) {
      imageField.value = offer.image || ''
    }
    if (imageInput) {
      imageInput.value = offer.image || ''
    }
    if (offer.image) {
      uploadPreview.innerHTML = `<img src="${offer.image}" alt="Current preview" /><span>Aktuális kép</span>`
      uploadPreview.classList.remove('hidden')
    } else {
      clearImagePreview()
    }
    if (sortOrderField) {
      sortOrderField.value = offer.sortOrder || 1
    }
    if (publishedField) {
      publishedField.checked = offer.published !== false
    }
    form.querySelector('button[type="submit"]').textContent = 'Update offer'
    showEditor()
  }

  function resetForm() {
    editingId = null
    form.reset()
    const publishedField = getPublishedField()
    const sortOrderField = getSortOrderField()
    const tagField = getTagField()
    if (publishedField) {
      publishedField.checked = true
    }
    if (sortOrderField) {
      sortOrderField.value = 1
    }
    if (tagField?.closest('label')) {
      tagField.closest('label').classList.remove('hidden')
    }
    clearImagePreview()
    form.querySelector('button[type="submit"]').textContent = 'Save offer'
    form.classList.add('hidden')
  }

  async function loadOffers() {
    const offers = await requestJson('/api/offers/admin')
    offersContainer.innerHTML = offers.length
      ? `
        <table class="offer-table">
          <thead>
            <tr>
              <th>Név</th>
              <th>Ár</th>
              <th>Címke</th>
              <th>Állapot</th>
              <th>Sorrend</th>
            </tr>
          </thead>
          <tbody>
            ${offers.map((offer) => `
              <tr>
                <td>${offer.title}</td>
                <td>${formatPriceValue(offer.price)}</td>
                <td>${offer.tag}</td>
                <td><span class="status-pill">${offer.published === false ? 'Rejtett' : 'Látható'}</span></td>
                <td>${offer.sortOrder || 1}</td>
                <td class="actions-cell">
                  <button class="action-button secondary" data-action="edit" data-id="${offer.id}">Frissítés</button>
                  <button class="action-button" data-action="delete" data-id="${offer.id}">Törlés</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<p class="muted">Még nincs ajánlat.</p>'
  }

  async function loadMenuItems() {
    const items = await requestJson('/api/menu-items/admin')
    menuItemsContainer.innerHTML = items.length
      ? `
        <table class="offer-table">
          <thead>
            <tr>
              <th>Név</th>
              <th>Ár</th>
              <th>Állapot</th>
              <th>Sorrend</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr>
                <td>${item.name}</td>
                <td>${formatPriceValue(item.price)}</td>
                <td><span class="status-pill">${item.published === false ? 'Rejtett' : 'Látható'}</span></td>
                <td>${item.sortOrder || 1}</td>
                <td class="actions-cell">
                  <button class="action-button secondary" data-action="edit-menu" data-id="${item.id}">Frissítés</button>
                  <button class="action-button" data-action="delete-menu" data-id="${item.id}">Törlés</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<p class="muted">Még nincs menüelem.</p>'
  }

  async function loadInstagramPosts() {
    const posts = await requestJson('/api/instagram-feed/admin')
    instagramPostsContainer.innerHTML = posts.length
      ? `
        <table class="offer-table">
          <thead>
            <tr>
              <th>Caption</th>
              <th>Állapot</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            ${posts.map((post) => `
              <tr>
                <td>${post.caption}</td>
                <td><span class="status-pill">${post.published === false ? 'Rejtett' : 'Látható'}</span></td>
                <td class="actions-cell">
                  <button class="action-button secondary" data-action="toggle-instagram" data-id="${post.id}" data-published="${post.published === false ? 'false' : 'true'}">${post.published === false ? 'Megjelenítés' : 'Elrejtés'}</button>
                  <button class="action-button" data-action="delete-instagram" data-id="${post.id}">Törlés</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<p class="muted">Még nincs Instagram poszt.</p>'
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const formData = new FormData(loginForm)
    const username = String(formData.get('username') || '').trim()
    const password = String(formData.get('password') || '')

    if (!username || !password) {
      showError('Please enter both credentials')
      return
    }

    const candidateHeader = encodeBasicAuth(username, password)
    const response = await fetch(apiUrl('/api/offers/admin'), {
      headers: { Authorization: candidateHeader },
    })

    if (!response.ok) {
      authHeader = null
      showError('Invalid username or password')
      return
    }

    authHeader = candidateHeader
    loginStatus.textContent = ''
    showAdminArea()
    loginForm.reset()
    await Promise.all([loadOffers(), loadMenuItems(), loadInstagramPosts()])
  })

  logoutButton.addEventListener('click', () => {
    showLoginArea()
  })

  removeImageButton.addEventListener('click', () => {
    clearImagePreview()
  })

  imageDropzone.addEventListener('click', () => imageUploadInput.click())
  imageUploadInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      await uploadImage(file)
    } catch (error) {
      showError(error.message || 'Image upload failed')
    }
  })

  imageDropzone.addEventListener('dragover', (event) => {
    event.preventDefault()
    imageDropzone.classList.add('is-dragging')
  })

  imageDropzone.addEventListener('dragenter', (event) => {
    event.preventDefault()
    imageDropzone.classList.add('is-dragging')
  })

  imageDropzone.addEventListener('dragleave', (event) => {
    event.preventDefault()
    imageDropzone.classList.remove('is-dragging')
  })

  imageDropzone.addEventListener('drop', async (event) => {
    const file = event.dataTransfer?.files?.[0]
    if (!file) {
      return
    }

    try {
      await uploadImage(file)
    } catch (error) {
      showError(error.message || 'Image upload failed')
    }
  })

  document.addEventListener('mousedown', (event) => {
    if (form.classList.contains('hidden')) {
      return
    }

    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const clickedInsideForm = form.contains(target)
    const clickedEditorTrigger = target.closest('#add-offer-button, #add-menu-item-button, .action-button')

    if (!clickedInsideForm && !clickedEditorTrigger) {
      closeEditor()
    }
  })

  function startNewEntry(mode) {
    editingId = null
    activeEntity = mode
    resetForm()
    setEditorMode(mode)
    showEditor()
  }

  addOfferButton.addEventListener('click', () => {
    startNewEntry('offer')
  })

  addMenuItemButton.addEventListener('click', () => {
    startNewEntry('menu-item')
  })

  addInstagramPostButton.addEventListener('click', () => {
    instagramForm.reset()
    const publishedField = instagramForm.querySelector('input[name="published"]')
    if (publishedField) {
      publishedField.checked = true
    }
    showInstagramEditor()
  })

  instagramImportForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const formData = new FormData(instagramImportForm)
    const profileUrl = String(formData.get('profileUrl') || '').trim()

    if (!profileUrl) {
      instagramImportStatus.textContent = 'Írj be egy Instagram profil URL-t.'
      return
    }

    try {
      const result = await requestJson('/api/instagram-feed/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrl }),
      })
      const importedCount = Number(result.count || result.posts?.length || 0)
      instagramImportStatus.textContent = importedCount > 0
        ? `${importedCount} poszt importálva.`
        : (result.message || 'Nem találtunk valós Instagram posztot.')
      instagramImportForm.reset()
      await loadInstagramPosts()
    } catch (error) {
      instagramImportStatus.textContent = error.message || 'Az importálás nem sikerült.'
    }
  })

  adminNav.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const view = target.dataset.view
    if (!view) {
      return
    }

    renderView(view)
  })

  instagramForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const formData = new FormData(instagramForm)
    const payload = {
      caption: String(formData.get('caption') || '').trim(),
      mediaUrl: String(formData.get('mediaUrl') || '').trim(),
      permalink: String(formData.get('permalink') || '').trim(),
      timestamp: String(formData.get('timestamp') || '').trim() || new Date().toISOString(),
      published: formData.get('published') === 'on',
    }

    try {
      await requestJson('/api/instagram-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      instagramForm.reset()
      closeInstagramEditor()
      await loadInstagramPosts()
    } catch (error) {
      showError(error.message || 'Instagram poszt mentése nem sikerült.')
    }
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const titleField = getTitleField()
    const descriptionField = getDescriptionField()
    const priceField = getPriceField()
    const tagField = getTagField()
    const imageField = getImageField()
    const sortOrderField = getSortOrderField()
    const publishedField = getPublishedField()

    const titleValue = String(titleField?.value || '').trim()
    const descriptionValue = String(descriptionField?.value || '').trim()
    const priceValue = normalizePriceValue(priceField?.value || '')
    const sortOrderValue = Number(sortOrderField?.value || 1)
    const publishedValue = Boolean(publishedField?.checked)
    const imageValue = String(imageField?.value || '').trim()

    let payload = {
      title: titleValue,
      description: descriptionValue,
      price: priceValue,
      image: imageValue,
      published: publishedValue,
      sortOrder: sortOrderValue,
    }

    let url = '/api/offers'
    let method = 'POST'

    if (activeEntity === 'menu-item') {
      url = editingId ? `/api/menu-items/${editingId}` : '/api/menu-items'
      method = editingId ? 'PUT' : 'POST'
      payload = {
        name: titleValue,
        description: descriptionValue,
        price: priceValue,
        image: imageValue,
        published: publishedValue,
        sortOrder: sortOrderValue,
      }
    } else {
      payload.tag = String(tagField?.value || '').trim()
      url = editingId ? `/api/offers/${editingId}` : '/api/offers'
      method = editingId ? 'PUT' : 'POST'
    }

    try {
      await requestJson(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      resetForm()
      if (activeEntity === 'menu-item') {
        await loadMenuItems()
      } else {
        await loadOffers()
      }
    } catch (error) {
      showError(error.message || 'Elem mentése nem sikerült.')
    }
  })

  offersContainer.addEventListener('click', async (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const button = target.closest('button[data-action]')
    if (!button) {
      return
    }

    const id = button.dataset.id
    if (!id) {
      return
    }

    try {
      if (button.dataset.action === 'delete') {
        await requestJson(`/api/offers/${id}`, { method: 'DELETE' })
        await loadOffers()
        return
      }

      const offers = await requestJson('/api/offers/admin')
      const offer = offers.find((item) => item.id === id)
      if (offer) {
        activeEntity = 'offer'
        populateForm(offer)
      }
    } catch (error) {
      showError(error.message || 'Ajánlat frissítése nem sikerült.')
    }
  })

  instagramPostsContainer.addEventListener('click', async (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const button = target.closest('button[data-action]')
    if (!button) {
      return
    }

    const id = button.dataset.id
    if (!id) {
      return
    }

    try {
      if (button.dataset.action === 'delete-instagram') {
        await requestJson(`/api/instagram-feed/${id}`, { method: 'DELETE' })
        await loadInstagramPosts()
        return
      }

      if (button.dataset.action === 'toggle-instagram') {
        const current = button.dataset.published === 'true'
        await requestJson(`/api/instagram-feed/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: !current }),
        })
        await loadInstagramPosts()
      }
    } catch (error) {
      showError(error.message || 'Instagram poszt frissítése nem sikerült.')
    }
  })

  menuItemsContainer.addEventListener('click', async (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const button = target.closest('button[data-action]')
    if (!button) {
      return
    }

    const id = button.dataset.id
    if (!id) {
      return
    }

    try {
      if (button.dataset.action === 'delete-menu') {
        await requestJson(`/api/menu-items/${id}`, { method: 'DELETE' })
        await loadMenuItems()
        return
      }

      const items = await requestJson('/api/menu-items/admin')
      const item = items.find((entry) => entry.id === id)
      if (item) {
        activeEntity = 'menu-item'
        editingId = item.id
        setEditorMode('menu-item')
        const titleField = getTitleField()
        const descriptionField = getDescriptionField()
        const priceField = getPriceField()
        const tagField = getTagField()
        const imageField = getImageField()
        const sortOrderField = getSortOrderField()
        const publishedField = getPublishedField()

        if (titleField) {
          titleField.value = item.name || ''
        }
        if (descriptionField) {
          descriptionField.value = item.description || ''
        }
        if (priceField) {
          priceField.value = item.price || ''
        }
        if (tagField) {
          tagField.value = ''
        }
        if (imageInput) {
          imageInput.value = item.image || ''
        }
        if (imageField) {
          imageField.value = item.image || ''
        }
        if (sortOrderField) {
          sortOrderField.value = item.sortOrder || 1
        }
        if (publishedField) {
          publishedField.checked = item.published !== false
        }
        if (item.image) {
          uploadPreview.innerHTML = `<img src="${item.image}" alt="Current preview" /><span>Aktuális kép</span>`
          uploadPreview.classList.remove('hidden')
        } else {
          clearImagePreview()
        }
        form.querySelector('button[type="submit"]').textContent = 'Frissítés'
        showEditor()
      }
    } catch (error) {
      showError(error.message || 'Nem lehet frissíteni a menüelemet.')
    }
  })

  form.addEventListener('reset', () => {
    resetForm()
  })

  showLoginArea()
})
