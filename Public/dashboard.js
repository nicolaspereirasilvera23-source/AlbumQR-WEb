const tokenKey = 'albumqr_token'

// ==================== AUTH ====================
const auth = {
  getToken: () => localStorage.getItem(tokenKey),
  logout: () => {
    localStorage.removeItem(tokenKey)
    window.location.href = 'index.html'
  },
  validate: () => {
    if (!auth.getToken()) auth.logout()
  }
}

// ==================== API ====================
async function apiFetch(url, options = {}) {
  const token = auth.getToken()

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.mensaje || 'Error en la peticiÃ³n')
  }

  return data
}

// ==================== UI ====================
const UI = {
  showError: (msg) => alert(msg),

  setStatus: (msg) => {
    const el = document.getElementById('card-status')
    el.textContent = msg
    el.style.display = 'block'
  },

  clearStatus: () => {
    const el = document.getElementById('card-status')
    el.textContent = ''
    el.style.display = 'none'
  },

  setResult: (url, qr) => {
    document.getElementById('result').classList.add('visible')
    document.getElementById('qr-image').src = qr
    document.getElementById('link-input').value = url
    document.getElementById('view-link').href = url
  },

  setMediaMessage: (msg, isError = false) => {
    const el = document.getElementById('host-media-message')
    el.textContent = msg
    el.classList.toggle('is-error', isError)
  },

  clearMediaMessage: () => {
    const el = document.getElementById('host-media-message')
    el.textContent = ''
    el.classList.remove('is-error')
  },

  syncMediaEmptyState: () => {
    const grid = document.getElementById('host-media-grid')
    const empty = document.getElementById('host-media-empty')
    empty.style.display = grid.children.length ? 'none' : 'block'
  },

  removeMediaCard: (mediaId) => {
    const safeSelector = typeof CSS !== 'undefined' && CSS.escape
      ? CSS.escape(mediaId)
      : mediaId.replace(/"/g, '\\"')
    const card = document.querySelector(`[data-media-id="${safeSelector}"]`)

    if (card) {
      card.remove()
    }

    UI.syncMediaEmptyState()
  },

  renderMedia: (items) => {
    const grid = document.getElementById('host-media-grid')

    grid.replaceChildren()

    items.forEach(item => {
      const card = document.createElement('article')
      card.className = 'media-card media-card-host'
      card.dataset.mediaId = item.id

      let media

      if (item.tipo?.startsWith('video')) {
        media = document.createElement('video')
        media.controls = true
      } else {
        media = document.createElement('img')
        media.alt = item.descripcion || 'Archivo del Ã¡lbum'
      }

      media.src = item.url
      card.appendChild(media)

      const info = document.createElement('div')
      info.className = 'media-card-body'

      const author = document.createElement('p')
      author.textContent = item.subido_por
        ? `Subido por ${item.subido_por}`
        : 'Subido por invitado'
      info.appendChild(author)

      if (item.descripcion) {
        const description = document.createElement('p')
        description.className = 'media-description'
        description.textContent = item.descripcion
        info.appendChild(description)
      }

      const deleteButton = document.createElement('button')
      deleteButton.type = 'button'
      deleteButton.className = 'media-delete-button'
      deleteButton.dataset.mediaId = item.id
      deleteButton.textContent = 'Borrar'
      info.appendChild(deleteButton)

      card.appendChild(info)
      grid.appendChild(card)
    })

    UI.syncMediaEmptyState()
  }
}

// ==================== LOGIC ====================
async function createAlbum(e) {
  e.preventDefault()

  const title = document.getElementById('album-title').value.trim()
  const description = document.getElementById('album-description').value.trim()

  if (!title) return UI.showError('El tÃ­tulo es obligatorio')

  try {
    const data = await apiFetch('/album', {
      method: 'POST',
      body: JSON.stringify({ title, description })
    })

    UI.setResult(data.albumUrl, data.qrDataUrl)

    if (data.album?.id) {
      UI.setStatus(`Ya tenÃ©s un Ã¡lbum creado: ${data.album.title}`)
      document.getElementById('album-form').style.display = 'none'
      await loadHostMedia(data.album.id)
    }
  } catch (err) {
    UI.showError(err.message)
  }
}

async function loadHostAlbum() {
  try {
    const data = await apiFetch('/album/host')

    if (data.album) {
      UI.setStatus(`Ya tenÃ©s un Ã¡lbum creado: ${data.album.title}`)
      document.getElementById('album-form').style.display = 'none'
      UI.setResult(data.albumUrl, data.qrDataUrl)
      await loadHostMedia(data.album.id)
    } else {
      UI.clearStatus()
      document.getElementById('album-form').style.display = 'block'
      UI.renderMedia([])
      UI.clearMediaMessage()
    }
  } catch (err) {
    UI.showError(err.message)
  }
}

async function loadHostMedia(albumId) {
  try {
    UI.clearMediaMessage()
    const data = await apiFetch(`/media/album/${encodeURIComponent(albumId)}`)
    UI.renderMedia(data.media || [])
  } catch (err) {
    UI.setMediaMessage(err.message, true)
  }
}

async function deleteMedia(mediaId, button) {
  if (!mediaId) return

  const confirmed = window.confirm('¿Seguro que querés borrar este archivo? Esta acción no se puede deshacer.')
  if (!confirmed) return

  const previousText = button.textContent
  button.disabled = true
  button.textContent = 'Borrando...'

  try {
    const data = await apiFetch(`/media/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE'
    })

    UI.removeMediaCard(mediaId)
    UI.setMediaMessage(data.mensaje || 'Media eliminado')
  } catch (err) {
    button.disabled = false
    button.textContent = previousText
    UI.setMediaMessage(err.message, true)
  }
}

// ==================== UTILS ====================
function copyLink() {
  const input = document.getElementById('link-input')

  navigator.clipboard.writeText(input.value)
    .then(() => {
      const btn = document.getElementById('copy-link-button')
      btn.textContent = 'Â¡Copiado!'
      setTimeout(() => {
        btn.textContent = 'Copiar'
      }, 1500)
    })
    .catch(() => UI.showError('No se pudo copiar'))
}

function handleMediaGridClick(event) {
  const button = event.target.closest('.media-delete-button')

  if (!button) {
    return
  }

  deleteMedia(button.dataset.mediaId, button)
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logout-button')
    .addEventListener('click', () => auth.logout())

  document.getElementById('copy-link-button')
    .addEventListener('click', copyLink)

  document.getElementById('host-media-grid')
    .addEventListener('click', handleMediaGridClick)

  auth.validate()

  document
    .getElementById('album-form')
    .addEventListener('submit', createAlbum)

  loadHostAlbum()
})
