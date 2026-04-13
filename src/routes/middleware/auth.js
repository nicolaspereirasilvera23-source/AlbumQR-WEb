const supabase = require('../config/supabase')

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      console.error(error)
      return res.status(401).json({ mensaje: 'Token inválido' })
    }

    req.user = data.user
    next()
  } catch (error) {
    console.error(error)
    res.status(401).json({ mensaje: 'Token inválido' })
  }
}
