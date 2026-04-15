const express = require('express')
const QRCode = require('qrcode')
const { supabase } = require('../config/supabase')
const authMiddleware = require('./middleware/auth')

const router = express.Router()
const MAX_TITLE_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 1000

function normalizeText(value) {
  if (!value) return ''
  return String(value).trim()
}

function getAlbumUrl(albumId) {
  const hostUrl = (process.env.HOST_URL || 'http://localhost:3000').replace(/\/+$/, '')
  return `${hostUrl}/guest.html?albumId=${encodeURIComponent(albumId)}`
}

// Crear un Ã¡lbum nuevo para el anfitriÃ³n autenticado y devolver el QR
router.post('/', authMiddleware, async (req, res) => {
  const title = normalizeText(req.body.title)
  const description = normalizeText(req.body.description)
  const hostId = req.user && req.user.id

  if (!hostId) {
    return res.status(401).json({ mensaje: 'AnfitriÃ³n no autenticado' })
  }

  if (!title) {
    return res.status(400).json({ mensaje: 'El tÃ­tulo del Ã¡lbum es requerido' })
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return res.status(400).json({ mensaje: `El tÃ­tulo no puede superar los ${MAX_TITLE_LENGTH} caracteres` })
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return res.status(400).json({ mensaje: `La descripciÃ³n no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres` })
  }

  try {
    const { data: existingAlbums, error: existingError } = await supabase
      .from('albums')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingError) {
      console.error(existingError)
      return res.status(500).json({ mensaje: 'Error verificando el Ã¡lbum existente' })
    }

    if (existingAlbums && existingAlbums.length > 0) {
      const album = existingAlbums[0]
      const albumUrl = getAlbumUrl(album.id)
      const qrDataUrl = await QRCode.toDataURL(albumUrl)

      return res.status(200).json({
        mensaje: 'Ya existe un Ã¡lbum para este anfitriÃ³n',
        album,
        albumUrl,
        qrDataUrl
      })
    }

    const { data, error } = await supabase
      .from('albums')
      .insert([{ title, description, host_id: hostId }])
      .select()
      .single()

    if (error) {
      console.error(error)
      return res.status(500).json({ mensaje: 'Error creando el Ã¡lbum' })
    }

    const albumUrl = getAlbumUrl(data.id)
    const qrDataUrl = await QRCode.toDataURL(albumUrl)

    res.status(201).json({
      mensaje: 'Ãlbum creado',
      album: data,
      albumUrl,
      qrDataUrl
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error creando el Ã¡lbum' })
  }
})

// Obtener el Ã¡lbum del anfitriÃ³n autenticado
router.get('/host', authMiddleware, async (req, res) => {
  const hostId = req.user && req.user.id
  if (!hostId) {
    return res.status(401).json({ mensaje: 'AnfitriÃ³n no autenticado' })
  }

  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error(error)
      return res.status(500).json({ mensaje: 'Error obteniendo el Ã¡lbum del anfitriÃ³n' })
    }

    const album = Array.isArray(data) && data.length > 0 ? data[0] : null
    if (!album) {
      return res.json({ album: null })
    }

    const albumUrl = getAlbumUrl(album.id)
    const qrDataUrl = await QRCode.toDataURL(albumUrl)

    res.json({ album, albumUrl, qrDataUrl })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error del servidor al obtener el Ã¡lbum' })
  }
})

// Genera un QR para un Ã¡lbum pÃºblico a partir de su ID
router.get('/:albumId/qr', async (req, res) => {
  const albumId = normalizeText(req.params.albumId)
  if (!albumId) {
    return res.status(400).json({ mensaje: 'albumId invÃ¡lido' })
  }

  try {
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('id', albumId)
      .maybeSingle()

    if (albumError) {
      console.error(albumError)
      return res.status(500).json({ mensaje: 'Error al verificar el Ã¡lbum' })
    }

    if (!album) {
      return res.status(404).json({ mensaje: 'Ãlbum no encontrado' })
    }

    const albumUrl = getAlbumUrl(albumId)
    const qrDataUrl = await QRCode.toDataURL(albumUrl)

    res.json({ albumId, albumUrl, qrDataUrl })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error generando el QR' })
  }
})

module.exports = router
