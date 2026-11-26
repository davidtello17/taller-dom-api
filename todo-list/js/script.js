// ===== Configuración =====
// Dirección de la API (servidor Express corriendo en el computador)
const API_URL = 'http://localhost:3000/api/tareas'
// Respaldo: si la API no está encendida, se guarda en el navegador
const STORAGE_KEY = 'tareas'

// ===== Elementos del DOM =====
const form = document.getElementById('todo-form')
const input = document.getElementById('todo-input')
const list = document.getElementById('todo-list')
const emptyMessage = document.getElementById('todo-empty')
const pendingCount = document.getElementById('pending-count')
const completedCount = document.getElementById('completed-count')
const statusMessage = document.getElementById('api-status')

// Arreglo de tareas: cada tarea es un objeto { id, titulo, completada }
let tareas = []
// true = usamos la API | false = usamos localStorage
let usarApi = false

// ===== Peticiones a la API con fetch =====
async function peticion(metodo, url, datos) {
  const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } }
  if (datos) opciones.body = JSON.stringify(datos)

  const respuesta = await fetch(url, opciones)
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}))
    throw new Error(error.error || `Error ${respuesta.status}`)
  }
  // DELETE responde 204 (sin contenido)
  return respuesta.status === 204 ? null : respuesta.json()
}

// ===== localStorage (modo sin conexión) =====
function leerLocal() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    return []
  }
}

function guardarLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas))
}

function mostrarEstado(mensaje, tipo) {
  statusMessage.textContent = mensaje
  statusMessage.className = `todo__status todo__status--${tipo}`
}

// ===== CRUD de tareas =====
async function cargarTareas() {
  try {
    tareas = await peticion('GET', API_URL)
    usarApi = true
    mostrarEstado('Conectado a la API (Node.js + Express)', 'online')
  } catch (error) {
    tareas = leerLocal()
    usarApi = false
    mostrarEstado('API apagada: guardando en el navegador (localStorage)', 'offline')
  }
  renderTareas()
}

async function agregarTarea(titulo) {
  if (usarApi) {
    const nueva = await peticion('POST', API_URL, { titulo })
    tareas.push(nueva)
  } else {
    tareas.push({ id: Date.now(), titulo, completada: false })
    guardarLocal()
  }
  renderTareas()
}

async function actualizarTarea(id, cambios) {
  if (usarApi) {
    const actualizada = await peticion('PUT', `${API_URL}/${id}`, cambios)
    tareas = tareas.map((t) => (t.id === id ? actualizada : t))
  } else {
    tareas = tareas.map((t) => (t.id === id ? { ...t, ...cambios } : t))
    guardarLocal()
  }
  renderTareas()
}

async function eliminarTarea(id) {
  if (usarApi) {
    await peticion('DELETE', `${API_URL}/${id}`)
  }
  tareas = tareas.filter((t) => t.id !== id)
  if (!usarApi) guardarLocal()
  renderTareas()
}

// Si la API falla en medio de una acción, se avisa sin romper la página
async function ejecutar(accion) {
  try {
    await accion()
  } catch (error) {
    mostrarEstado(`No se pudo completar la acción: ${error.message}`, 'error')
  }
}

// ===== Pintar en pantalla =====
function actualizarContadores() {
  const completadas = tareas.filter((t) => t.completada).length
  pendingCount.textContent = tareas.length - completadas
  completedCount.textContent = completadas
}

function crearElementoTarea(tarea) {
  const li = document.createElement('li')
  li.classList.add('task')
  if (tarea.completada) li.classList.add('task--done')
  li.dataset.id = tarea.id

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.classList.add('task__check')
  checkbox.checked = tarea.completada
  checkbox.setAttribute('aria-label', 'Marcar como completada')

  const texto = document.createElement('span')
  texto.classList.add('task__text')
  texto.textContent = tarea.titulo

  const botonEditar = document.createElement('button')
  botonEditar.classList.add('task__button')
  botonEditar.dataset.action = 'edit'
  botonEditar.setAttribute('aria-label', 'Editar tarea')
  botonEditar.innerHTML = '<i class="fa-solid fa-pen"></i>'

  const botonEliminar = document.createElement('button')
  botonEliminar.classList.add('task__button')
  botonEliminar.dataset.action = 'delete'
  botonEliminar.setAttribute('aria-label', 'Eliminar tarea')
  botonEliminar.innerHTML = '<i class="fa-regular fa-trash-can"></i>'

  li.append(checkbox, texto, botonEditar, botonEliminar)
  return li
}

function renderTareas() {
  list.innerHTML = ''
  tareas.forEach((tarea) => list.appendChild(crearElementoTarea(tarea)))
  emptyMessage.hidden = tareas.length > 0
  actualizarContadores()
}

// ===== Editar en la misma línea =====
function empezarEdicion(li, id) {
  const tarea = tareas.find((t) => t.id === id)
  const texto = li.querySelector('.task__text')

  const campo = document.createElement('input')
  campo.type = 'text'
  campo.classList.add('task__edit-input')
  campo.value = tarea.titulo
  texto.replaceWith(campo)
  campo.focus()

  let terminado = false
  function terminar(guardar) {
    if (terminado) return
    terminado = true
    const nuevoTitulo = campo.value.trim()
    if (guardar && nuevoTitulo !== '' && nuevoTitulo !== tarea.titulo) {
      ejecutar(() => actualizarTarea(id, { titulo: nuevoTitulo }))
    } else {
      renderTareas()
    }
  }

  campo.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') terminar(true)
    if (event.key === 'Escape') terminar(false)
  })
  campo.addEventListener('blur', () => terminar(true))
}

// ===== Eventos =====
form.addEventListener('submit', (event) => {
  event.preventDefault()
  const titulo = input.value.trim()
  if (titulo === '') return
  ejecutar(() => agregarTarea(titulo))
  form.reset()
  input.focus()
})

// Delegación de eventos: un solo listener en la lista para todos los botones
list.addEventListener('click', (event) => {
  const boton = event.target.closest('button')
  if (!boton) return

  const li = boton.closest('.task')
  const id = Number(li.dataset.id)

  if (boton.dataset.action === 'delete') ejecutar(() => eliminarTarea(id))
  if (boton.dataset.action === 'edit') empezarEdicion(li, id)
})

list.addEventListener('change', (event) => {
  if (event.target.classList.contains('task__check')) {
    const id = Number(event.target.closest('.task').dataset.id)
    ejecutar(() => actualizarTarea(id, { completada: event.target.checked }))
  }
})

cargarTareas()
