const express = require('express')
const supabase = require('./config/supabase')
require('dotenv').config()
const router = express.Router()

router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' })
  }

  if (password.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  try {
    let data, error
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      ({ data, error } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true
      }))
    } else {
      ({ data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password
      }))
    }

    if (error) {
      console.error(error)
      const msg = error.message || ''
      if (msg.includes('already exists') || msg.includes('User already registered')) {
        return res.status(409).json({ mensaje: 'El email ya está registrado' })
      }
      return res.status(500).json({ mensaje: 'Error al registrar anfitrión' })
    }

    res.status(201).json({ mensaje: 'Anfitrión registrado', user: data.user || data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error al registrar anfitrión' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })

    if (error || !data.session) {
      console.error(error)
      return res.status(401).json({ mensaje: 'Credenciales inválidas' })
    }

    res.json({ token: data.session.access_token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error al iniciar sesión' })
  }
})

module.exports = router
