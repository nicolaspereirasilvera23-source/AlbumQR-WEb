const express = require('express')
const multer = require('multer')
const supabase = require('./config/supabase')
const cloudinary = require('./config/cloudinary')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

function parseAlbumId(value) {
  if (!value) return null
  const id = String(value).trim()
  return id === '' ? null : id
}

// Obtener los datos de un álbum y sus medios
router.get('/album/:albumId', async (req, res) => {
  const albumId = parseAlbumId(req.params.albumId)

  if (!albumId) {
    return res.status(400).json({ mensaje: 'albumId inválido' })
  }

  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .maybeSingle()

  if (albumError) {
    console.error(albumError)
    return res.status(500).json({ mensaje: 'Error al obtener el álbum' })
  }

  if (!album) {
    return res.status(404).json({ mensaje: 'Álbum no encontrado' })
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

// Subir una imagen/video a un álbum usando Cloudinary
router.post('/', upload.single('file'), async (req, res) => {
  const albumId = parseAlbumId(req.body.albumId)
  const guestName = req.body.guestName ? String(req.body.guestName).trim() : 'invitado'
  const description = req.body.description ? String(req.body.description).trim() : null
  const file = req.file

  if (!albumId) {
    return res.status(400).json({ mensaje: 'albumId es requerido' })
  }

  if (!file) {
    return res.status(400).json({ mensaje: 'No se recibió ningún archivo' })
  }

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

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
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
