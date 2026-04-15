const express = require('express')
const multer = require('multer')
const { supabase } = require('../config/supabase')
const cloudinary = require('../config/cloudinary')

const router = express.Router()
const MAX_FILE_SIZE_BYTES = Number.parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || `${25 * 1024 * 1024}`, 10)
const MAX_GUEST_NAME_LENGTH = 80
const MAX_DESCRIPTION_LENGTH = 500
const MAX_UPLOADS_PER_WINDOW = Number.parseInt(process.env.MAX_UPLOADS_PER_WINDOW || '120', 10)
const UPLOAD_WINDOW_MS = Number.parseInt(process.env.UPLOAD_WINDOW_MS || `${10 * 60 * 1000}`, 10)
const ALLOWED_MIME_PREFIXES = ['image/', 'video/']
const uploadAttempts = new Map()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
    fields: 5,
    fieldSize: 10 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!isAllowedMimeType(file.mimetype)) {
      const error = new Error('Solo se permiten imÃ¡genes y videos.')
      error.statusCode = 400
      return cb(error)
    }

    cb(null, true)
  }
})

function parseAlbumId(value) {
  if (!value) return null
  const id = String(value).trim()

  if (id === '' || !/^[a-zA-Z0-9-]{1,80}$/.test(id)) {
    return null
  }

  return id
}

function normalizeText(value, maxLength) {
  if (!value) return ''
  return String(value).trim().slice(0, maxLength)
}

function isAllowedMimeType(mimeType) {
  return ALLOWED_MIME_PREFIXES.some(prefix => String(mimeType || '').startsWith(prefix))
}

function getCloudinaryResourceType(mimeType) {
  return String(mimeType || '').startsWith('video/') ? 'video' : 'image'
}

function getClientUploadKey(req) {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown'
}

function consumeUploadSlot(req) {
  const key = getClientUploadKey(req)
  const now = Date.now()
  const windowStart = now - UPLOAD_WINDOW_MS
  const recentAttempts = (uploadAttempts.get(key) || []).filter(timestamp => timestamp > windowStart)

  if (recentAttempts.length >= MAX_UPLOADS_PER_WINDOW) {
    uploadAttempts.set(key, recentAttempts)
    return false
  }

  recentAttempts.push(now)
  uploadAttempts.set(key, recentAttempts)
  return true
}

function runSingleUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, error => {
      if (error) {
        return reject(error)
      }

      resolve()
    })
  })
}

// Obtener los datos de un Ã¡lbum y sus medios
router.get('/album/:albumId', async (req, res) => {
  const albumId = parseAlbumId(req.params.albumId)

  if (!albumId) {
    return res.status(400).json({ mensaje: 'albumId invÃ¡lido' })
  }

  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .maybeSingle()

  if (albumError) {
    console.error(albumError)
    return res.status(500).json({ mensaje: 'Error al obtener el Ã¡lbum' })
  }

  if (!album) {
    return res.status(404).json({ mensaje: 'Ãlbum no encontrado' })
  }

  const { data: media, error: mediaError } = await supabase
    .from('media')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false })

  if (mediaError) {
    console.error(mediaError)
    return res.status(500).json({ mensaje: 'Error al obtener los medios' })
  }

  res.json({ album, media })
})

// Subir una imagen/video a un Ã¡lbum usando Cloudinary
router.post('/', async (req, res) => {
  if (!consumeUploadSlot(req)) {
    return res.status(429).json({ mensaje: 'Demasiadas subidas desde esta conexiÃ³n. ProbÃ¡ nuevamente en unos minutos.' })
  }

  try {
    await runSingleUpload(req, res)
  } catch (error) {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ mensaje: 'El archivo supera el tamaÃ±o mÃ¡ximo permitido.' })
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({ mensaje: 'No se pudo procesar el archivo enviado.' })
    }

    return res.status(error.statusCode || 400).json({ mensaje: error.message || 'No se pudo procesar el archivo enviado.' })
  }

  const albumId = parseAlbumId(req.body.albumId)
  const guestName = normalizeText(req.body.guestName, MAX_GUEST_NAME_LENGTH) || 'invitado'
  const description = normalizeText(req.body.description, MAX_DESCRIPTION_LENGTH) || null
  const file = req.file

  if (!albumId) {
    return res.status(400).json({ mensaje: 'albumId es requerido' })
  }

  if (!file) {
    return res.status(400).json({ mensaje: 'No se recibiÃ³ ningÃºn archivo' })
  }

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

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: getCloudinaryResourceType(file.mimetype),
          folder: `album_${albumId}`
        },
        (error, uploaded) => {
          if (error) return reject(error)
          resolve(uploaded)
        }
      )

      uploadStream.end(file.buffer)
    })

    const { data: insertedMedia, error: insertError } = await supabase
      .from('media')
      .insert([
        {
          album_id: albumId,
          url: result.secure_url,
          public_id: result.public_id,
          tipo: result.resource_type,
          formato: result.format,
          descripcion: description,
          subido_por: guestName
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error(insertError)
      return res.status(500).json({ mensaje: 'Error guardando el medio' })
    }

    res.status(201).json({ mensaje: 'Medio subido', media: insertedMedia })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error subiendo el archivo' })
  }
})

module.exports = router
