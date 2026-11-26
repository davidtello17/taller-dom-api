// ===== Dependencias =====
const express = require('express')
const path = require('path')

const app = express()
const PORT = 3000

// Middleware para entender JSON en el body de las peticiones
app.use(express.json())

// Middleware CORS: permite que las páginas abiertas desde otro origen
// (Live Server en el puerto 5500, por ejemplo) puedan llamar a esta API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Sirve las páginas (index.html, todo-list/ y contact-list/) desde la raíz del repositorio
app.use(express.static(path.join(__dirname, '..', '..')))

// ===== "Base de datos" en memoria =====
let tareas = [
  { id: 1, titulo: 'Aprender Express', completada: true },
  { id: 2, titulo: 'Crear una API REST', completada: false },
  { id: 3, titulo: 'Conectar la API con fetch', completada: false }
]

let contactos = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Tello',
    telefono: '3001234567',
    ciudad: 'Cali',
    direccion: 'Calle 5 #10-20',
    genero: 'Male'
  }
]

const camposContacto = ['nombre', 'apellido', 'telefono', 'ciudad', 'direccion', 'genero']

// ===== Bienvenida =====
app.get('/api', (req, res) => {
  res.json({
    mensaje: 'Bienvenido a la API de tareas y contactos con Express y Node.js',
    rutas: ['/api/tareas', '/api/contactos']
  })
})

// ===================================================
// TAREAS
// ===================================================

// GET: obtener todas las tareas
app.get('/api/tareas', (req, res) => {
  res.json(tareas)
})

// GET: obtener una tarea por id
app.get('/api/tareas/:id', (req, res) => {
  const tarea = tareas.find((t) => t.id === Number(req.params.id))
  if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' })
  res.json(tarea)
})

// POST: crear una tarea
app.post('/api/tareas', (req, res) => {
  const titulo = (req.body.titulo || '').trim()
  if (!titulo) {
    return res.status(400).json({ error: 'El título es obligatorio' })
  }
  const nuevaTarea = { id: Date.now(), titulo, completada: false }
  tareas.push(nuevaTarea)
  res.status(201).json(nuevaTarea)
})

// PUT: actualizar una tarea (título y/o completada)
app.put('/api/tareas/:id', (req, res) => {
  const tarea = tareas.find((t) => t.id === Number(req.params.id))
  if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' })

  if (req.body.titulo !== undefined) {
    const titulo = String(req.body.titulo).trim()
    if (!titulo) return res.status(400).json({ error: 'El título no puede estar vacío' })
    tarea.titulo = titulo
  }
  if (req.body.completada !== undefined) {
    tarea.completada = Boolean(req.body.completada)
  }
  res.json(tarea)
})

// DELETE: eliminar una tarea
app.delete('/api/tareas/:id', (req, res) => {
  const indice = tareas.findIndex((t) => t.id === Number(req.params.id))
  if (indice === -1) return res.status(404).json({ error: 'Tarea no encontrada' })
  tareas.splice(indice, 1)
  res.status(204).send()
})

// ===================================================
// CONTACTOS
// ===================================================

function validarContacto(body) {
  const faltantes = camposContacto.filter((campo) => !String(body[campo] || '').trim())
  return faltantes
}

// GET: obtener todos los contactos
app.get('/api/contactos', (req, res) => {
  res.json(contactos)
})

// GET: obtener un contacto por id
app.get('/api/contactos/:id', (req, res) => {
  const contacto = contactos.find((c) => c.id === Number(req.params.id))
  if (!contacto) return res.status(404).json({ error: 'Contacto no encontrado' })
  res.json(contacto)
})

// POST: crear un contacto
app.post('/api/contactos', (req, res) => {
  const faltantes = validarContacto(req.body)
  if (faltantes.length > 0) {
    return res.status(400).json({ error: `Faltan campos: ${faltantes.join(', ')}` })
  }
  const nuevoContacto = { id: Date.now() }
  camposContacto.forEach((campo) => {
    nuevoContacto[campo] = String(req.body[campo]).trim()
  })
  contactos.push(nuevoContacto)
  res.status(201).json(nuevoContacto)
})

// PUT: actualizar un contacto completo
app.put('/api/contactos/:id', (req, res) => {
  const contacto = contactos.find((c) => c.id === Number(req.params.id))
  if (!contacto) return res.status(404).json({ error: 'Contacto no encontrado' })

  const faltantes = validarContacto(req.body)
  if (faltantes.length > 0) {
    return res.status(400).json({ error: `Faltan campos: ${faltantes.join(', ')}` })
  }
  camposContacto.forEach((campo) => {
    contacto[campo] = String(req.body[campo]).trim()
  })
  res.json(contacto)
})

// DELETE: eliminar un contacto
app.delete('/api/contactos/:id', (req, res) => {
  const indice = contactos.findIndex((c) => c.id === Number(req.params.id))
  if (indice === -1) return res.status(404).json({ error: 'Contacto no encontrado' })
  contactos.splice(indice, 1)
  res.status(204).send()
})

// Cualquier otra ruta /api que no exista
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// ===== Iniciar servidor =====
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  console.log(`Lista de tareas:    http://localhost:${PORT}/todo-list/`)
  console.log(`Lista de contactos: http://localhost:${PORT}/contact-list/`)
})
