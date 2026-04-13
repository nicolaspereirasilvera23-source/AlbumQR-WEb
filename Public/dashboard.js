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
    throw new Error(data.mensaje || 'Error en la petición')
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
  }
}

// ==================== LOGIC ====================
async function createAlbum(e) {
  e.preventDefault()

  const title = document.getElementById('album-title').value.trim()
  const description = document.getElementById('album-description').value.trim()

  if (!title) return UI.showError('El título es obligatorio')

  try {
    const data = await apiFetch('/album', {
      method: 'POST',
      body: JSON.stringify({ title, description })
    })

    UI.setResult(data.albumUrl, data.qrDataUrl)

  } catch (err) {
    UI.showError(err.message)
  }
}

async function loadHostAlbum() {
  try {
    const data = await apiFetch('/album/host')

    if (data.album) {
      UI.setStatus(`Ya tenés un álbum creado: ${data.album.title}`)
      document.getElementById('album-form').style.display = 'none'
      UI.setResult(data.albumUrl, data.qrDataUrl)
    } else {
      UI.clearStatus()
      document.getElementById('album-form').style.display = 'block'
    }

  } catch (err) {
    UI.showError(err.message)
  }
}

// ==================== UTILS ====================
function copyLink() {
  const input = document.getElementById('link-input')

  navigator.clipboard.writeText(input.value)
    .then(() => {
      const btn = document.querySelector('.btn-copy')
      btn.textContent = '¡Copiado!'
      setTimeout(() => btn.textContent = 'Copiar', 1500)
    })
    .catch(() => UI.showError('No se pudo copiar'))
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  auth.validate()

  document
    .getElementById('album-form')
    .addEventListener('submit', createAlbum)

  loadHostAlbum()
})