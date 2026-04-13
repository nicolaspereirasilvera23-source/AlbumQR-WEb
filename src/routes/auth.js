// importar express, supabase, jsonwebtoken, crypto y dotenv
const express = require('express')
const supabase = require('./config/supabase')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
require('dotenv').config()
const router = express.Router()

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || typeof storedPassword !== 'string') return false
  const [salt, key] = storedPassword.split(':')
  if (!salt || !key) return false

  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'))
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' })
  }

  if (password.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const { data: existingHost, error: existingError } = await supabase
    .from('anfitriones')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingError) {
    console.error(existingError)
    return res.status(500).json({ mensaje: 'Error al verificar el anfitrión existente' })
  }

  if (existingHost) {
    return res.status(409).json({ mensaje: 'El email ya está registrado' })
  }

  const hashedPassword = hashPassword(password)

  const { error } = await supabase
    .from('anfitriones')
    .insert([{ email: normalizedEmail, password: hashedPassword }])

  if (error) {
    console.error(error)
    return res.status(500).json({ mensaje: 'Error al registrar anfitrión' })
  }

  res.status(201).json({ mensaje: 'Anfitrión registrado' })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()

  const { data, error } = await supabase
    .from('anfitriones')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (error || !data) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' })
  }

  const passwordIsValid = verifyPassword(password, data.password)
  if (!passwordIsValid) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' })
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('JWT_SECRET no está configurado')
    return res.status(500).json({ mensaje: 'Error del servidor' })
  }

  const token = jwt.sign({ id: data.id, email: data.email }, jwtSecret, { expiresIn: '1h' })
  res.json({ token })
})

module.exports = router
