const tokenKey = 'albumqr_token'

function getToken() {
  return localStorage.getItem(tokenKey)
}

function setResult(albumUrl, qrDataUrl) {
  document.getElementById('result').classList.add('visible')
  document.getElementById('qr-image').src = qrDataUrl
  document.getElementById('link-input').value = albumUrl
  const viewLink = document.getElementById('view-link')
  viewLink.href = albumUrl
}

function showError(message) {
  alert(message)
}

async function createAlbum(event) {
  event.preventDefault()
  const title = document.getElementById('album-title').value.trim()
  const description = document.getElementById('album-description').value.trim()
  const token = getToken()

  if (!title) {
    return showError('El título del álbum es requerido.')
  }

  if (!token) {
    return redirectToLogin()
  }

  try {
    const response = await fetch('/album', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    })

    const payload = await response.json()
    if (!response.ok) {
      if (payload.mensaje) showError(payload.mensaje)
      else showError('Error al crear el álbum')
      return
    }

    setResult(payload.albumUrl, payload.qrDataUrl)
  } catch (error) {
    showError('No se pudo conectar con el servidor')
  }
}

function copyLink() {
  const value = document.getElementById('link-input').value
  navigator.clipboard.writeText(value).then(() => {
    const btn = document.querySelector('.btn-copy')
    btn.textContent = '¡Copiado!'
    setTimeout(() => { btn.textContent = 'Copiar' }, 1500)
  }).catch(() => {
    showError('No se pudo copiar el enlace')
  })
}

function redirectToLogin() {
  localStorage.removeItem(tokenKey)
  window.location.href = 'index.html'
}

function logout() {
  redirectToLogin()
}

function validateSession() {
  if (!getToken()) {
    redirectToLogin()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  validateSession()
  document.getElementById('album-form').addEventListener('submit', createAlbum)
})
