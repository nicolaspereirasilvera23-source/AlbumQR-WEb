require('dotenv').config()

const path = require('path')
const express = require('express')
const app = express()

// middleware para json
app.use(express.json())

// archivos estáticos
app.use(express.static(path.join(__dirname, '../public')))

// rutas
app.use('/auth', require('./routes/auth')) // usar las rutas de auth.js para /auth
app.use('/album', require('./routes/album')) // ruta para generar QR y manejar álbumes
app.use('/media', require('./routes/media')) // ruta para subir y listar medios

app.get('/api', (req, res) => {
  res.json({ mensaje: 'Album QR API corriendo' })
})

module.exports = app // exportar la app para usarla en index.js
