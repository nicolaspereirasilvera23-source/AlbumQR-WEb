require('dotenv').config()

const fs = require('fs')
const path = require('path')
const express = require('express')

const app = express()
const staticDir = [path.join(__dirname, '../Public'), path.join(__dirname, '../public')]
  .find(dir => fs.existsSync(dir))

if (!staticDir) {
  throw new Error('No se encontrÃ³ la carpeta de archivos estÃ¡ticos.')
}

app.disable('x-powered-by')

// middleware para json
app.use(express.json({ limit: '100kb' }))

// archivos estÃ¡ticos
app.use(express.static(staticDir))

// rutas
app.use('/auth', require('./routes/auth')) // usar las rutas de auth.js para /auth
app.use('/album', require('./routes/album')) // ruta para generar QR y manejar Ã¡lbumes
app.use('/media', require('./routes/media')) // ruta para subir y listar medios

app.get('/api', (req, res) => {
  res.json({ mensaje: 'Album QR API corriendo' })
})

module.exports = app // exportar la app para usarla en index.js
