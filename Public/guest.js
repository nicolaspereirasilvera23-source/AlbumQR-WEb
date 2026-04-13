// ==================== UTILS ====================
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name)
}

// ==================== API ====================
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.mensaje || 'Error en la petición')
  }

  return data
}

// ==================== UI ====================
const UI = {
  showMessage: (text, isError = false) => {
    const el = document.getElementById('guest-message')
    el.textContent = text
    el.style.color = isError ? '#d73737' : 'var(--brand-violet-mid)'
  },

  setAlbumInfo: (title, description) => {
    document.getElementById('album-info').innerHTML = `
      <strong>${title}</strong>
      <p>${description || 'Subí fotos y videos para este álbum.'}</p>
    `
  },

  renderMedia: (items) => {
    const grid = document.getElementById('media-grid')
    const empty = document.getElementById('empty-state')

    grid.innerHTML = ''

    if (!items?.length) {
      empty.style.display = 'block'
      return
    }

    empty.style.display = 'none'

    items.forEach(item => {
      const card = document.createElement('div')
      card.className = 'media-card'

      let media

      if (item.tipo?.startsWith('video')) {
        media = document.createElement('video')
        media.controls = true
      } else {
        media = document.createElement('img')
        media.alt = item.descripcion || 'Archivo del álbum'
      }

      media.src = item.url
      card.appendChild(media)

      const info = document.createElement('p')
      info.textContent = item.subido_por
        ? `Subido por ${item.subido_por}`
        : 'Subido por invitado'

      card.appendChild(info)
      grid.appendChild(card)
    })
  }
}

// ==================== LOGIC ====================
async function loadAlbum() {
  const albumId = getQueryParam('albumId')

  if (!albumId) {
    return UI.showMessage('Código de álbum inválido.', true)
  }

  try {
    const data = await apiFetch(`/media/album/${albumId}`)

    UI.setAlbumInfo(data.album.title, data.album.description)
    UI.renderMedia(data.media)

  } catch (err) {
    UI.showMessage(err.message, true)
  }
}

async function uploadFile(e) {
  e.preventDefault()

  const albumId = getQueryParam('albumId')
  const fileInput = document.getElementById('guest-file')

  if (!albumId) {
    return UI.showMessage('Código inválido.', true)
  }

  if (!fileInput.files[0]) {
    return UI.showMessage('Seleccioná un archivo.', true)
  }

  const formData = new FormData()
  formData.append('albumId', albumId)
  formData.append('guestName', document.getElementById('guest-name').value.trim())
  formData.append('description', document.getElementById('guest-description').value.trim())
  formData.append('file', fileInput.files[0])

  try {
    await apiFetch('/media/', {
      method: 'POST',
      body: formData
    })

    UI.showMessage('Archivo subido con éxito.')
    fileInput.value = ''

    await loadAlbum()

  } catch (err) {
    UI.showMessage(err.message, true)
  }
}

// ==================== NAV ====================
function goHome() {
  window.location.href = 'index.html'
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('guest-form')
    .addEventListener('submit', uploadFile)

  loadAlbum()
})