// ==================== API ====================
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.mensaje || 'Error en la petición')
  }

  return data
}

// ==================== UI ====================
const UI = {
  clearMessage: () => {
    document.getElementById('auth-message').textContent = ''
  },

  showMessage: (text, isError = false) => {
    const el = document.getElementById('auth-message')
    el.textContent = text
    el.style.color = isError ? '#d73737' : 'var(--brand-violet-mid)'
  }
}

// ==================== TABS ====================
function switchTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'))

  document.getElementById(tab).classList.add('active')

  if (el) el.classList.add('active')
  else document.querySelector(`.tab[onclick*="${tab}"]`)?.classList.add('active')

  const helpText = document.getElementById('help-text')
  helpText.innerHTML =
    tab === 'login'
      ? '¿No tenés cuenta? <span onclick="switchTab(\'register\', null)">Registrate gratis</span>'
      : '¿Ya tenés cuenta? <span onclick="switchTab(\'login\', null)">Ingresá acá</span>'

  UI.clearMessage()
}

// ==================== AUTH ====================
const auth = {
  saveToken: (token) => localStorage.setItem('albumqr_token', token),
  redirect: () => window.location.href = 'dashboard.html'
}

// ==================== LOGIC ====================
async function handleLogin(e) {
  e.preventDefault()
  UI.clearMessage()

  const email = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value

  if (!email || !password) {
    return UI.showMessage('Completá email y contraseña', true)
  }

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    auth.saveToken(data.token)
    auth.redirect()

  } catch (err) {
    UI.showMessage(err.message, true)
  }
}

async function handleRegister(e) {
  e.preventDefault()
  UI.clearMessage()

  const email = document.getElementById('register-email').value.trim()
  const password = document.getElementById('register-password').value

  if (!email || !password) {
    return UI.showMessage('Completá email y contraseña', true)
  }

  try {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    UI.showMessage('Cuenta creada. Iniciá sesión ahora.')
    switchTab('login', document.querySelector('.tab'))

  } catch (err) {
    UI.showMessage(err.message, true)
  }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form')
    .addEventListener('submit', handleLogin)

  document.getElementById('register-form')
    .addEventListener('submit', handleRegister)
})