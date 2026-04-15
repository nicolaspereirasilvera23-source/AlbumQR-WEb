const express = require('express')
const { supabase, supabaseAdmin } = require('../config/supabase')
require('dotenv').config()

const router = express.Router()
const MIN_PASSWORD_LENGTH = 8

router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' })
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ mensaje: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  try {
    let data, error
    if (supabaseAdmin) {
      ({ data, error } = await supabaseAdmin.auth.admin.createUser({
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
        return res.status(409).json({ mensaje: 'El email ya esta registrado' })
      }
      return res.status(500).json({ mensaje: 'Error al registrar anfitrión' })
    }

    const createdUser = data && (data.user || data)

    res.status(201).json({
      mensaje: 'Anfitrión registrado',
      user: createdUser
        ? {
            id: createdUser.id,
            email: createdUser.email
          }
        : null
    })
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
      return res.status(401).json({ mensaje: 'Credenciales invalidas' })
    }

    res.json({ token: data.session.access_token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error al iniciar sesión' })
  }
})

module.exports = router
