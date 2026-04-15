const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const appModulePath = path.join(__dirname, '..', 'src', 'app.js')
const routeModulePaths = [
  path.join(__dirname, '..', 'src', 'routes', 'auth.js'),
  path.join(__dirname, '..', 'src', 'routes', 'album.js'),
  path.join(__dirname, '..', 'src', 'routes', 'media.js'),
  path.join(__dirname, '..', 'src', 'routes', 'middleware', 'auth.js')
]
const supabaseConfigPath = path.join(__dirname, '..', 'src', 'config', 'supabase.js')
const cloudinaryConfigPath = path.join(__dirname, '..', 'src', 'config', 'cloudinary.js')

function clearModuleCache() {
  for (const modulePath of [appModulePath, supabaseConfigPath, cloudinaryConfigPath, ...routeModulePaths]) {
    delete require.cache[require.resolve(modulePath)]
  }
}

function createSupabaseStub() {
  return {
    supabase: {
      auth: {
        getUser: async () => ({ data: { user: { id: 'host-1' } }, error: null }),
        signInWithPassword: async () => ({ data: { session: { access_token: 'token-1' } }, error: null }),
        signUp: async () => ({ data: { user: { id: 'user-1', email: 'host@example.com' } }, error: null })
      },
      from(table) {
        if (table === 'albums') {
          return {
            select() {
              return this
            },
            eq() {
              return this
            },
            order() {
              return this
            },
            limit() {
              return this
            },
            maybeSingle: async () => ({
              data: {
                id: 'album-1',
                title: 'Cumple',
                description: 'Fotos'
              },
              error: null
            }),
            insert(rows) {
              return {
                select() {
                  return {
                    single: async () => ({ data: rows[0], error: null })
                  }
                }
              }
            }
          }
        }

        if (table === 'media') {
          return {
            select() {
              return this
            },
            eq() {
              return this
            },
            order() {
              return this
            },
            insert(rows) {
              return {
                select() {
                  return {
                    single: async () => ({
                      data: {
                        id: 'media-1',
                        ...rows[0]
                      },
                      error: null
                    })
                  }
                }
              }
            }
          }
        }

        throw new Error(`Tabla no soportada en test: ${table}`)
      }
    },
    supabaseAdmin: null
  }
}

function createCloudinaryStub(uploadCalls) {
  return {
    uploader: {
      upload_stream(options, callback) {
        uploadCalls.push(options)

        return {
          end() {
            callback(null, {
              secure_url: 'https://cdn.example.com/file.png',
              public_id: 'album_1/file',
              resource_type: options.resource_type,
              format: options.resource_type === 'video' ? 'mp4' : 'png'
            })
          }
        }
      }
    }
  }
}

function loadApp({ env = {}, supabaseStub = createSupabaseStub(), cloudinaryStub } = {}) {
  const previousEnv = {}

  for (const [key, value] of Object.entries(env)) {
    previousEnv[key] = process.env[key]
    process.env[key] = value
  }

  clearModuleCache()
  require.cache[require.resolve(supabaseConfigPath)] = {
    exports: supabaseStub
  }
  require.cache[require.resolve(cloudinaryConfigPath)] = {
    exports: cloudinaryStub || createCloudinaryStub([])
  }

  const app = require(appModulePath)

  return {
    app,
    restoreEnv() {
      for (const [key, value] of Object.entries(env)) {
        if (previousEnv[key] === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = previousEnv[key]
        }
      }

      clearModuleCache()
    }
  }
}

async function withServer(app, callback) {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, () => resolve(instance))
  })

  const { port } = server.address()
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    await callback(baseUrl)
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

test('GET /api responde correctamente', async () => {
  const { app, restoreEnv } = loadApp()

  try {
    await withServer(app, async baseUrl => {
      const response = await fetch(`${baseUrl}/api`)
      const body = await response.json()

      assert.equal(response.status, 200)
      assert.deepEqual(body, { mensaje: 'Album QR API corriendo' })
    })
  } finally {
    restoreEnv()
  }
})

test('POST /media rechaza archivos que no sean imagen o video', async () => {
  const uploadCalls = []
  const { app, restoreEnv } = loadApp({
    cloudinaryStub: createCloudinaryStub(uploadCalls)
  })

  try {
    await withServer(app, async baseUrl => {
      const formData = new FormData()
      formData.append('albumId', 'album-1')
      formData.append('file', new Blob(['texto plano'], { type: 'text/plain' }), 'nota.txt')

      const response = await fetch(`${baseUrl}/media`, {
        method: 'POST',
        body: formData
      })
      const body = await response.json()

      assert.equal(response.status, 400)
      assert.match(body.mensaje, /Solo se permiten/i)
      assert.equal(uploadCalls.length, 0)
    })
  } finally {
    restoreEnv()
  }
})

test('POST /media rechaza archivos demasiado grandes', async () => {
  const { app, restoreEnv } = loadApp({
    env: {
      MAX_UPLOAD_SIZE_BYTES: '5'
    }
  })

  try {
    await withServer(app, async baseUrl => {
      const formData = new FormData()
      formData.append('albumId', 'album-1')
      formData.append('file', new Blob(['123456'], { type: 'image/png' }), 'foto.png')

      const response = await fetch(`${baseUrl}/media`, {
        method: 'POST',
        body: formData
      })
      const body = await response.json()

      assert.equal(response.status, 413)
      assert.match(body.mensaje, /archivo supera/i)
    })
  } finally {
    restoreEnv()
  }
})

test('POST /media sube una imagen válida con el tipo correcto a Cloudinary', async () => {
  const uploadCalls = []
  const { app, restoreEnv } = loadApp({
    cloudinaryStub: createCloudinaryStub(uploadCalls)
  })

  try {
    await withServer(app, async baseUrl => {
      const formData = new FormData()
      formData.append('albumId', 'album-1')
      formData.append('guestName', 'Ana')
      formData.append('description', 'Un recuerdo')
      formData.append('file', new Blob(['image-bytes'], { type: 'image/png' }), 'foto.png')

      const response = await fetch(`${baseUrl}/media`, {
        method: 'POST',
        body: formData
      })
      const body = await response.json()

      assert.equal(response.status, 201)
      assert.equal(body.media.album_id, 'album-1')
      assert.equal(body.media.tipo, 'image')
      assert.equal(uploadCalls.length, 1)
      assert.equal(uploadCalls[0].resource_type, 'image')
    })
  } finally {
    restoreEnv()
  }
})
