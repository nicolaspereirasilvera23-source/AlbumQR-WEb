function switchTab(tab, el) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'))
  document.querySelectorAll('.form-section').forEach((section) => section.classList.remove('active'))
  document.getElementById(tab).classList.add('active')
  if (el) el.classList.add('active')
  else document.querySelector(`.tab[onclick*="${tab}"]`)?.classList.add('active')

  const helpText = document.getElementById('help-text')
  helpText.innerHTML =
    tab === 'login'
      ? '¿No tenés cuenta? <span onclick="switchTab(\'register\', null)">Registrate gratis</span>'
      : '¿Ya tenés cuenta? <span onclick="switchTab(\'login\', null)">Ingresá acá</span>'
  clearMessage()
}

function clearMessage() {
  const message = document.getElementById('auth-message')
  message.textContent = ''
}

function showMessage(text, isError = false) {
  const message = document.getElementById('auth-message')
  message.textContent = text
  message.style.color = isError ? '#d73737' : 'var(--brand-violet-mid)'
}

async function handleLogin(event) {
  event.preventDefault()
  clearMessage()

  const email = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value

  if (!email || !password) {
    return showMessage('Completá email y contraseña', true)
  }

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const payload = await response.json()
    if (!response.ok) {
      return showMessage(payload.mensaje || 'Error al iniciar sesión', true)
    }

    localStorage.setItem('albumqr_token', payload.token)
    window.location.href = 'dashboard.html'
  } catch (error) {
    showMessage('No se pudo conectar con el servidor', true)
  }
}

async function handleRegister(event) {
  event.preventDefault()
  clearMessage()

  const email = document.getElementById('register-email').value.trim()
  const password = document.getElementById('register-password').value

  if (!email || !password) {
    return showMessage('Completá email y contraseña', true)
  }

  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const payload = await response.json()
    if (!response.ok) {
      return showMessage(payload.mensaje || 'Error al registrar', true)
    }

    showMessage('Cuenta creada. Iniciá sesión ahora.')
    switchTab('login', document.querySelector('.tab'))
  } catch (error) {
    showMessage('No se pudo conectar con el servidor', true)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', handleLogin)
  document.getElementById('register-form').addEventListener('submit', handleRegister)
})
