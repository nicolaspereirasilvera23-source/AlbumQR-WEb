const express = require('express')
const QRCode = require('qrcode')
const supabase = require('./config/supabase')
const authMiddleware = require('./middleware/auth')
const router = express.Router()

function normalizeText(value) {
  if (!value) return ''
  return String(value).trim()
}

function getAlbumUrl(albumId) {
  const hostUrl = process.env.HOST_URL || 'http://localhost:3000'
  return `${hostUrl}/guest.html?albumId=${albumId}`
}

// Crear un álbum nuevo para el anfitrión autenticado y devolver el QR
router.post('/', authMiddleware, async (req, res) => {
  const title = normalizeText(req.body.title)
  const description = normalizeText(req.body.description)
  const hostId = req.user && req.user.id

  if (!hostId) {
    return res.status(401).json({ mensaje: 'Anfitrión no autenticado' })
  }

  if (!title) {
    return res.status(400).json({ mensaje: 'El título del álbum es requerido' })
  }

  if (title.length > 255) {
    return res.status(400).json({ mensaje: 'El título no puede superar los 255 caracteres' })
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
      return res.status(500).json({ mensaje: 'Error verificando el álbum existente' })
    }

    if (existingAlbums && existingAlbums.length > 0) {
      const album = existingAlbums[0]
      const albumUrl = getAlbumUrl(album.id)
      const qrDataUrl = await QRCode.toDataURL(albumUrl)

      return res.status(200).json({
        mensaje: 'Ya existe un álbum para este anfitrión',
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
      return res.status(500).json({ mensaje: 'Error creando el álbum' })
    }

    const albumUrl = getAlbumUrl(data.id)
    const qrDataUrl = await QRCode.toDataURL(albumUrl)

    res.status(201).json({
      mensaje: 'Álbum creado',
      album: data,
      albumUrl,
      qrDataUrl
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error creando el álbum' })
  }
})

// Obtener el álbum del anfitrión autenticado
router.get('/host', authMiddleware, async (req, res) => {
  const hostId = req.user && req.user.id
  if (!hostId) {
    return res.status(401).json({ mensaje: 'Anfitrión no autenticado' })
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
      return res.status(500).json({ mensaje: 'Error obteniendo el álbum del anfitrión' })
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
    res.status(500).json({ mensaje: 'Error del servidor al obtener el álbum' })
  }
})

// Genera un QR para un álbum público a partir de su ID
router.get('/:albumId/qr', async (req, res) => {
  const albumId = normalizeText(req.params.albumId)
  if (!albumId) {
    return res.status(400).json({ mensaje: 'albumId inválido' })
  }

  try {
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('id')
      .eq('id', albumId)
      .maybeSingle()

    if (albumError) {
      console.error(albumError)
      return res.status(500).json({ mensaje: 'Error al verificar el álbum' })
    }

    if (!album) {
      return res.status(404).json({ mensaje: 'Álbum no encontrado' })
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
